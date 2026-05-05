// Task Controller - CRUD + Filter + Dashboard

const prisma = require('../utils/prisma');

// GET /api/tasks  (dengan filter: status, categoryId, priority, search)
const ALLOWED_SORT_FIELDS = ['createdAt', 'deadline', 'title', 'priority', 'updatedAt'];
const PRIORITY_ORDER = { TINGGI: 1, NORMAL: 2, RENDAH: 3 };

const getAllTasks = async (req, res, next) => {
  try {
    const { status, categoryId, priority, search, sort = 'createdAt', order = 'desc', all } = req.query;

    const now = new Date();

    // Auto-update tugas terlewat
    await prisma.task.updateMany({
      where: {
        userId: req.user.id,
        status: { notIn: ['SELESAI', 'TERLEWAT'] },
        deadline: { lt: now }
      },
      data: { status: 'TERLEWAT' }
    });

    const where = { userId: req.user.id };

    if (status) {
      if (status === 'TERLEWAT') {
        where.status = { not: 'SELESAI' };
        where.deadline = { lt: new Date() };
      } else {
        where.status = status;
      }
    } else if (all !== 'true') {
      // Default: Sembunyikan yang sudah selesai di tab "Semua"
      where.status = { not: 'SELESAI' };
    }
    if (priority)   where.priority   = priority;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) {
      where.OR = [
        { title:       { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Validasi field sort
    const safeSort = ALLOWED_SORT_FIELDS.includes(sort) ? sort : 'createdAt';
    const safeOrder = order === 'asc' ? 'asc' : 'desc';

    let tasks = await prisma.task.findMany({
      where,
      include: { 
        category: { select: { id: true, name: true, color: true } },
        subtasks: true,
      },
      orderBy: safeSort === 'priority' ? { createdAt: safeOrder } : { [safeSort]: safeOrder },
    });

    // Custom sorting untuk prioritas (enum tidak ter-sort secara natural)
    if (safeSort === 'priority') {
      tasks.sort((a, b) => {
        const diff = (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99);
        return safeOrder === 'asc' ? -diff : diff;
      });
    }

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/dashboard  (ringkasan untuk halaman utama)
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();

    // Auto-update tugas terlewat
    await prisma.task.updateMany({
      where: {
        userId,
        status: { notIn: ['SELESAI', 'TERLEWAT'] },
        deadline: { lt: now }
      },
      data: { status: 'TERLEWAT' }
    });

    const in3days = new Date(now);
    in3days.setDate(in3days.getDate() + 3);

    const [total, sedangDikerjakan, selesai, terlewat, mendekatiDeadline, tugas, tugasTerlewatQuery] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'SEDANG_DIKERJAKAN' } }),
      prisma.task.count({ where: { userId, status: 'SELESAI' } }),
      prisma.task.count({ where: { userId, status: 'TERLEWAT' } }),
      prisma.task.count({
        where: {
          userId,
          status: { not: 'SELESAI' },
          deadline: { gte: now, lte: in3days },
        },
      }),
      // Tugas hari ini + mendekati deadline (untuk tampilan dashboard)
      prisma.task.findMany({
        where: {
          userId,
          status: { not: 'SELESAI' },
          deadline: { gte: now, lte: in3days },
        },
        include: { category: { select: { id: true, name: true, color: true } } },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
      // Tugas Terlewat (peringatan di dashboard)
      prisma.task.findMany({
        where: { userId, status: 'TERLEWAT' },
        include: { category: { select: { id: true, name: true, color: true } } },
        orderBy: { deadline: 'desc' },
        take: 3,
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: { total, sedangDikerjakan, selesai, terlewat, mendekatiDeadline },
        tugasMendekatiDeadline: tugas,
        tugasTerlewat: tugasTerlewatQuery || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: { category: true, subtasks: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, deadline, categoryId, subtasks = [], isRecurring, recurrence, reminderHours } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status:      status   || 'BELUM_MULAI',
        priority:    priority || 'NORMAL',
        deadline:    deadline ? new Date(deadline) : null,
        userId:      req.user.id,
        categoryId:  categoryId ? parseInt(categoryId) : null,
        isRecurring: isRecurring || false,
        recurrence:  recurrence || null,
        reminderHours: reminderHours ? parseInt(reminderHours) : 0,
        subtasks: {
          create: subtasks.map(st => ({
            title: st.title,
            isDone: st.isDone || false
          }))
        }
      },
      include: { 
        category: { select: { id: true, name: true, color: true } },
        subtasks: true 
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tugas berhasil ditambahkan!',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, deadline, categoryId, subtasks, isRecurring, recurrence, reminderHours } = req.body;
    const taskId = parseInt(req.params.id);

    // Pastikan tugas milik user ini
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId: req.user.id },
      include: { subtasks: true }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status      !== undefined && { status }),
        ...(priority    !== undefined && { priority }),
        ...(deadline    !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(categoryId  !== undefined && { categoryId: categoryId ? parseInt(categoryId) : null }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrence  !== undefined && { recurrence }),
        ...(reminderHours !== undefined && { reminderHours: parseInt(reminderHours) }),
        // Sinkronisasi sub-tugas
        ...(Array.isArray(subtasks) && {
          subtasks: {
            deleteMany: {},
            create: subtasks.map(st => ({
              title: st.title,
              isDone: st.isDone || false
            }))
          }
        })
      },
      include: { 
        category: { select: { id: true, name: true, color: true } },
        subtasks: true 
      },
    });

    // LOGIKA TUGAS BERULANG (RECURRING)
    // Jika status diubah menjadi SELESAI dan ini adalah tugas berulang
    if (status === 'SELESAI' && task.isRecurring && task.recurrence && task.deadline) {
      const nextDeadline = new Date(task.deadline);
      
      switch (task.recurrence.toUpperCase()) {
        case 'HARIAN':
          nextDeadline.setDate(nextDeadline.getDate() + 1);
          break;
        case 'MINGGUAN':
          nextDeadline.setDate(nextDeadline.getDate() + 7);
          break;
        case 'BULANAN':
          nextDeadline.setMonth(nextDeadline.getMonth() + 1);
          break;
      }

      // Buat tugas duplikat untuk jadwal berikutnya
      await prisma.task.create({
        data: {
          title:       task.title,
          description: task.description,
          status:      'BELUM_MULAI',
          priority:    task.priority,
          deadline:    nextDeadline,
          isRecurring: true,
          recurrence:  task.recurrence,
          userId:      task.userId,
          categoryId:  task.categoryId,
          subtasks: {
            create: task.subtasks.map(st => ({
              title: st.title,
              isDone: false // Sub-tugas baru selalu belum selesai
            }))
          }
        }
      });
    }

    res.json({ success: true, message: 'Tugas berhasil diperbarui!', data: task });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
    }

    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });

    res.json({ success: true, message: 'Tugas berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:taskId/subtasks/:id/toggle
const toggleSubtask = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;

    // Verifikasi tugas milik user
    const task = await prisma.task.findFirst({ where: { id: parseInt(taskId), userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });

    const subtask = await prisma.subTask.findFirst({ where: { id: parseInt(id), taskId: parseInt(taskId) } });
    if (!subtask) return res.status(404).json({ success: false, message: 'Sub-tugas tidak ditemukan.' });

    const updated = await prisma.subTask.update({
      where: { id: parseInt(id) },
      data: { isDone: !subtask.isDone },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:taskId/subtasks
const createSubtask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await prisma.task.findFirst({ where: { id: parseInt(taskId), userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });

    const subtask = await prisma.subTask.create({
      data: { title, taskId: parseInt(taskId) },
    });

    res.status(201).json({ success: true, data: subtask });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:taskId/subtasks/:id
const deleteSubtask = async (req, res, next) => {
  try {
    const { taskId, id } = req.params;

    const task = await prisma.task.findFirst({ where: { id: parseInt(taskId), userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });

    await prisma.subTask.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Sub-tugas berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTasks, getDashboard, getTaskById, createTask, updateTask, deleteTask, toggleSubtask, createSubtask, deleteSubtask };
