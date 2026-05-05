// Auth Controller - Register & Login

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const fs     = require('fs');
const path   = require('path');

// Helper: buat JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Validasi panjang password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password harus memiliki minimal 6 karakter.',
      });
    }

    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Gunakan email lain atau langsung login.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, avatar: true },
    });

    // Buat kategori default untuk user baru
    await prisma.category.createMany({
      data: [
        { name: 'Kuliah',    color: '#6366f1', userId: user.id },
        { name: 'Pribadi',   color: '#10b981', userId: user.id },
        { name: 'Organisasi', color: '#f59e0b', userId: user.id },
      ],
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di AgendaKu.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

// PUT /api/auth/profile (protected)
const updateProfile = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request update profile (Base64) masuk untuk user ID: ${req.user.id}`);
  try {
    const { name, email, avatar: base64Image } = req.body;
    const userId = req.user.id;
    let avatar = req.user.avatar;

    // Jika ada data gambar Base64
    if (base64Image && base64Image.startsWith('data:image')) {
      const oldAvatar = req.user.avatar;
      
      // Generate filename unik
      const extension = base64Image.split(';')[0].split('/')[1];
      const filename = `avatar-${userId}-${Date.now()}.${extension}`;
      const uploadPath = path.join(process.cwd(), 'uploads/avatars', filename);

      // Simpan file dari base64
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(uploadPath, base64Data, 'base64');
      
      avatar = filename;

      // Hapus foto lama jika ada
      if (oldAvatar) {
        const oldPath = path.join(process.cwd(), 'uploads/avatars', oldAvatar);
        fs.access(oldPath, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.unlink(oldPath, (err) => {
              if (err) console.error('Gagal menghapus foto lama:', err);
            });
          }
        });
      }
    }

    // Jika email diubah, cek apakah sudah dipakai orang lain
    if (email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar oleh pengguna lain.',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { name, email, avatar },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/avatar (protected)
const deleteAvatar = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.avatar) {
      return res.status(400).json({ success: false, message: 'Tidak ada foto profil untuk dihapus.' });
    }

    // 1. Hapus file fisik
    const filePath = path.join(process.cwd(), 'uploads/avatars', user.avatar);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Gagal menghapus avatar:', err);
        });
      }
    });

    // 2. Update database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: { id: true, name: true, email: true, avatar: true },
    });

    res.json({
      success: true,
      message: 'Foto profil berhasil dihapus.',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/me
const deleteMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Hapus file avatar fisik jika ada
    if (user.avatar) {
      const filePath = path.join(process.cwd(), 'uploads/avatars', user.avatar);
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Gagal menghapus avatar saat hapus akun:', err);
          });
        }
      });
    }

    // Prisma otomatis menghapus relasi (tasks, subtasks, categories) jika onDelete: Cascade diatur di schema
    // Kita hapus user berdasarkan ID
    await prisma.user.delete({
      where: { id: user.id },
    });

    res.json({
      success: true,
      message: 'Akun dan seluruh data Anda berhasil dihapus secara permanen.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, deleteAvatar, deleteMe };
