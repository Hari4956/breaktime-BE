const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, updateOrderStatus, getMyOrders } = require('../controller/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/place-order', protect, placeOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/all-orders', protect, authorize('admin', 'restaurant'), getAllOrders);
router.put('/:id/status', protect, authorize('admin', 'restaurant'), updateOrderStatus);

module.exports = router;
