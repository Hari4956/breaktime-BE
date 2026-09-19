const express = require('express');
const router = express.Router();
const {
  uploadCategoryImage,
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controller/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public / Authenticated routes to get categories (Supports GET / and GET /get-all)
router.get('/', getCategories);
router.get('/get-all', getCategories);
router.get('/:id', getCategoryById);

// Standalone Category Image Upload to Cloudinary
router.post(
  '/upload-image',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  uploadCategoryImage
);

// Protected Category Creation (Supports POST / and POST /create, with JSON or file upload)
router.post(
  '/create',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createCategory
);

router.post(
  '/create',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createCategory
);

// Protected Category Update
router.put(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  updateCategory
);

// Protected Category Delete
router.delete(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  deleteCategory
);

module.exports = router;
