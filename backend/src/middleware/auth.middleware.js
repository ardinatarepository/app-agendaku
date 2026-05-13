// JWT Authentication Middleware

const jwt  = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(' [Auth] Missing or invalid Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log(' [Auth] JWT Verify failed:', err.message);
      throw err; // Re-throw to be caught by the outer catch
    }

    console.log(' [Auth] Token valid for userId:', decoded.userId);

    // Verifikasi user masih ada di database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) {
      console.log(' [Auth] User not found in DB for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login ulang.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa. Silakan login ulang.' });
    }
    next(error);
  }
};

module.exports = { authenticate };
