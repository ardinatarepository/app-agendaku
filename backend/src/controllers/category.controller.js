// Category Controller

const prisma = require('../utils/prisma');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;

    const category = await prisma.category.create({
      data: { name, color: color || '#6366f1', userId: req.user.id },
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan!',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    }

    const { name, color } = req.body;
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { ...(name && { name }), ...(color && { color }) },
    });

    res.json({ success: true, message: 'Kategori berhasil diperbarui!', data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    }

    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });

    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
