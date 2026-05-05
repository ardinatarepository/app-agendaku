// Task Routes

const router = require('express').Router();
const { body } = require('express-validator');
const {
  getAllTasks, getDashboard, getTaskById,
  createTask, updateTask, deleteTask,
  toggleSubtask, createSubtask, deleteSubtask,
} = require('../controllers/task.controller');
const { authenticate }  = require('../middleware/auth.middleware');
const { validate }       = require('../middleware/error.middleware');

// Semua route task butuh autentikasi
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/',          getAllTasks);
router.get('/:id',       getTaskById);

router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Judul tugas wajib diisi (maks 200 karakter)'),
  body('status').optional().isIn(['BELUM_MULAI', 'SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT']).withMessage('Status tidak valid'),
  body('priority').optional().isIn(['RENDAH', 'NORMAL', 'TINGGI']).withMessage('Prioritas tidak valid'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Format tanggal deadline tidak valid'),
  validate,
], createTask);

router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Judul tidak boleh kosong'),
  body('status').optional().isIn(['BELUM_MULAI', 'SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT']).withMessage('Status tidak valid'),
  body('priority').optional().isIn(['RENDAH', 'NORMAL', 'TINGGI']).withMessage('Prioritas tidak valid'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Format tanggal deadline tidak valid'),
  validate,
], updateTask);

router.delete('/:id', deleteTask);

// ─── Sub-Tugas ──────────────────────────────────────────
router.post('/:taskId/subtasks', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Judul sub-tugas wajib diisi'),
  validate,
], createSubtask);
router.patch('/:taskId/subtasks/:id/toggle', toggleSubtask);
router.delete('/:taskId/subtasks/:id', deleteSubtask);

module.exports = router;
