const express = require('express');
const router = express.Router();
const {
  uploadProductImage,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controller/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public / Authenticated routes to view products (Supports GET / and GET /get-all)
router.get('/', getProducts);
router.get('/get-all', getProducts);
router.get('/:id', getProductById);

// Protected image upload route (Upload standalone image to Cloudinary)
router.post(
  '/upload-image',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  uploadProductImage
);

// Protected product creation routes (Supports POST / and POST /create, with JSON or file upload)
router.post(
  '/',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createProduct
);

router.post(
  '/create',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  createProduct
);

// Protected product update
router.put(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  upload.single('image'),
  updateProduct
);

// Protected product delete
router.delete(
  '/:id',
  protect,
  authorize('admin', 'restaurant'),
  deleteProduct
);

module.exports = router;
