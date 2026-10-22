const express = require('express');
const router = express.Router();
const {
  createCombo,
  getCombos,
  getComboById,
  updateCombo,
  deleteCombo,
  uploadComboImage
} = require('../controller/comboController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public endpoints to browse combos
router.get('/', getCombos);
router.get('/get-all', getCombos);
router.get('/:id', getComboById);

// Protected image upload
router.post(
  '/upload-image',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  uploadComboImage
);

// Protected create combo
router.post(
  '/',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createCombo
);

router.post(
  '/create',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createCombo
);

// Protected update combo
router.put(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  updateCombo
);

// Protected delete combo
router.delete(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  deleteCombo
);

module.exports = router;
