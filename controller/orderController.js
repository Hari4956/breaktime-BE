const Order = require('../model/Order');
const Cart = require('../model/Cart');
const User = require('../model/User');
const Product = require('../model/Product');
const Category = require('../model/Category');
const mongoose = require('mongoose');

const placeOrder = async (req, res) => {
  try {
    const carts = await Cart.aggregate([
      { $match: { user: req.user._id } },
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
    const cart = carts[0];
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const { shippingAddress, location } = req.body;

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.finalPrice || item.product.price
    }));

    let finalAddress = shippingAddress || (req.user.addresses && req.user.addresses[0]) || {};
    if (location) {
      finalAddress = { ...finalAddress.toObject ? finalAddress.toObject() : finalAddress, location };
    } else if (shippingAddress && shippingAddress.location) {
      // already inside shippingAddress, no action needed
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalPrice,
      shippingAddress: finalAddress
    });

    // Clear cart after order
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [], totalPrice: 0 } });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper to build the MongoDB aggregation pipeline for orders,
 * enriching orders with user details and item product information.
 */
const buildOrderAggregationPipeline = (matchStage = null) => {
  const pipeline = [];

  if (matchStage) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $addFields: {
        items: {
          $map: {
            input: '$items',
            as: 'item',
            in: {
              $mergeObjects: [
                '$$item',
                {
                  product: {
                    $let: {
                      vars: {
                        matchedProduct: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$productDetails',
                                as: 'p',
                                cond: { $eq: ['$$p._id', '$$item.product'] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: {
                        $ifNull: ['$$matchedProduct', '$$item.product']
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        productDetails: 0,
        'user.password': 0,
        'user.role': 0,
        'user.__v': 0
      }
    },
    { $sort: { createdAt: -1 } }
  );

  return pipeline;
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.aggregate(buildOrderAggregationPipeline());
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const [aggregatedOrder] = await Order.aggregate(
      buildOrderAggregationPipeline({ _id: order._id })
    );

    res.status(200).json({ success: true, data: aggregatedOrder || order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.aggregate(buildOrderAggregationPipeline({ user: req.user._id }));
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.aggregate(buildOrderAggregationPipeline());
    const totalOrders = orders.length;
    const totalRevenue = Math.round(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) * 100) / 100;

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrdersList = orders.filter(o => o.createdAt && new Date(o.createdAt) >= today);
    const todayOrdersCount = todayOrdersList.length;
    const todayRevenue = Math.round(todayOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0) * 100) / 100;

    const totalCustomers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Status counts
    const statusCounts = {
      Completed: orders.filter(o => o.status === 'Completed').length,
      Preparing: orders.filter(o => o.status === 'Preparing').length,
      Ready: orders.filter(o => o.status === 'Ready').length,
      Pending: orders.filter(o => o.status === 'Pending').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };

    // Day of week revenue & orders (Mon to Sun)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayData = days.map(d => ({ name: d, revenue: 0, orders: 0 }));
    orders.forEach(o => {
      if (o.createdAt) {
        const d = new Date(o.createdAt).getDay();
        const idx = d === 0 ? 6 : d - 1; // Sun -> index 6, Mon -> index 0
        dayData[idx].revenue += Math.round(o.totalAmount || 0);
        dayData[idx].orders += 1;
      }
    });

    // Top selling items
    const itemMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        const name = it.name || it.product?.name || 'Item';
        const img = it.product?.image || '';
        if (!itemMap[name]) itemMap[name] = { name, orders: 0, revenue: 0, image: img };
        itemMap[name].orders += (it.quantity || 1);
        itemMap[name].revenue += Math.round(((it.price || 0) * (it.quantity || 1)) * 100) / 100;
        if (!itemMap[name].image && img) itemMap[name].image = img;
      });
    });
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map((item, index) => ({ id: index + 1, ...item }));

    // Recent orders (latest 5)
    const recentOrders = orders.slice(0, 5);

    // Recent customers (latest 5)
    const recentCustomers = await User.find({ role: { $ne: 'admin' } })
      .select('name email phone createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          todayOrders: todayOrdersCount,
          todayRevenue,
          pendingOrders: statusCounts.Pending,
          preparingOrders: statusCounts.Preparing,
          readyOrders: statusCounts.Ready,
          completedOrders: statusCounts.Completed,
          cancelledOrders: statusCounts.Cancelled,
          totalCustomers,
          totalProducts,
          totalCategories
        },
        chartData: dayData,
        statusCounts,
        recentOrders,
        topItems,
        recentCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, getAllOrders, updateOrderStatus, getMyOrders, getDashboardStats };
