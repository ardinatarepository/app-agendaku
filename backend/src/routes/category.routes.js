// Category Routes

const router = require('express').Router();
const { body } = require('express-validator');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', getAllCategories);

router.post('/', [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Nama kategori wajib diisi (maks 50 karakter)'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Format warna tidak valid (contoh: #6366f1)'),
  validate,
], createCategory);

router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Nama tidak boleh kosong'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Format warna tidak valid'),
  validate,
], updateCategory);

router.delete('/:id', deleteCategory);

module.exports = router;
