const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controller/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All cart routes should be protected and only accessible by customers
router.use(protect);
router.use(authorize('customer'));

router.route('/')
  .get(getCart);

router.route('/add')
  .post(addToCart);

router.route('/update')
  .put(updateCartItem);

router.route('/remove/:productId')
  .delete(removeFromCart);

router.route('/clear')
  .delete(clearCart);

module.exports = router;
