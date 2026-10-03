const Cart = require('../model/Cart');
const Product = require('../model/Product');

const mongoose = require('mongoose');

/**
 * Helper function to calculate the total price of a cart without populate.
 */
const calculateTotal = async (cartItems) => {
  if (!cartItems || cartItems.length === 0) return 0;
  
  const productIds = cartItems.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  
  let total = 0;
  cartItems.forEach(item => {
    const prod = products.find(p => p._id.toString() === item.product.toString());
    if (prod) {
      const priceToUse = prod.finalPrice || prod.price;
      total += priceToUse * item.quantity;
    }
  });
  return Math.round(total * 100) / 100;
};

const getAggregatedCart = async (userId) => {
  const carts = await Cart.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'items.product'
      }
    },
    { $unwind: { path: '$items.product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$_id',
        user: { $first: '$user' },
        totalPrice: { $first: '$totalPrice' },
        items: {
          $push: {
            $cond: {
              if: { $ne: [{ $type: '$items.product' }, 'missing'] },
              then: '$items',
              else: '$$REMOVE'
            }
          }
        }
      }
    }
  ]);
  return carts[0];
};

/**
 * @desc    Get current user cart
 * @route   GET /api/cart
 * @access  Private (Customer)
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalPrice: 0
      });
    }

    const aggregatedCart = await getAggregatedCart(req.user.id) || cart;

    res.status(200).json({
      success: true,
      data: aggregatedCart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Add product to cart or increment quantity
 * @route   POST /api/cart/add
 * @access  Private (Customer)
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide productId' });
    }

    const qty = quantity ? parseInt(quantity, 10) : 1;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if product already in cart
    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      cart.items[itemIndex].quantity += qty;
    } else {
      // Product doesn't exist in cart, add new item
      cart.items.push({ product: productId, quantity: qty });
    }

    cart.totalPrice = await calculateTotal(cart.items);
    await cart.save();

    const aggregatedCart = await getAggregatedCart(req.user.id);

    res.status(200).json({
      success: true,
      data: aggregatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update
 * @access  Private (Customer)
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide productId and quantity' });
    }

    const qty = parseInt(quantity, 10);
    
    if (qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
      cart.totalPrice = await calculateTotal(cart.items);
      await cart.save();

      const aggregatedCart = await getAggregatedCart(req.user.id);

      res.status(200).json({
        success: true,
        data: aggregatedCart
      });
    } else {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private (Customer)
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    cart.totalPrice = await calculateTotal(cart.items);
    await cart.save();

    const aggregatedCart = await getAggregatedCart(req.user.id);

    res.status(200).json({
      success: true,
      data: aggregatedCart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private (Customer)
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart || { items: [], totalPrice: 0 }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
