// Auth Routes

const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, deleteAvatar, deleteMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/error.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  validate,
], register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().withMessage('Password tidak boleh kosong'),
  validate,
], login);

// POST /api/auth/profile (protected)
router.post('/profile', [
  authenticate,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  validate,
], updateProfile);

// GET /api/auth/me (protected)
router.get('/me', authenticate, getMe);

// DELETE /api/auth/me (protected)
router.delete('/me', authenticate, deleteMe);

// DELETE /api/auth/avatar (protected)
router.delete('/avatar', authenticate, deleteAvatar);

module.exports = router;
