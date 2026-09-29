const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, updateOrderStatus } = require('../controller/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, placeOrder);
router.get('/', protect, authorize('admin', 'restaurant'), getAllOrders);
router.put('/:id/status', protect, authorize('admin', 'restaurant'), updateOrderStatus);

module.exports = router;
