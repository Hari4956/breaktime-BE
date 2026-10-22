const mongoose = require('mongoose');
const Combo = require('../model/Combo');
const Product = require('../model/Product');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Helper to build the MongoDB aggregation pipeline for combos,
 * enriching combo items with full product details, category, and creator user.
 */
const buildComboAggregationPipeline = (matchStage = null, sortStage = null, skip = null, limit = null) => {
  const pipeline = [];

  if (matchStage) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push(
    // 1. Lookup Category
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

    // 2. Lookup Creator User
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy'
      }
    },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },

    // 3. Lookup Products for items
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },

    // 4. Map and merge product info into items.product
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

    // 5. Clean up sensitive/temporary fields
    {
      $project: {
        productDetails: 0,
        'category.description': 0,
        'category.createdAt': 0,
        'category.updatedAt': 0,
        'category.__v': 0,
        'createdBy.password': 0,
        'createdBy.role': 0,
        'createdBy.addresses': 0,
        'createdBy.__v': 0
      }
    }
  );

  if (sortStage) {
    pipeline.push({ $sort: sortStage });
  }

  if (skip !== null && skip !== undefined) {
    pipeline.push({ $skip: skip });
  }

  if (limit !== null && limit !== undefined) {
    pipeline.push({ $limit: limit });
  }

  return pipeline;
};

/**
 * @desc    Upload combo image standalone to Cloudinary
 * @route   POST /api/combos/upload-image
 * @access  Private (Admin, Restaurant)
 */
const uploadComboImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload'
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, 'combos');

    res.status(200).json({
      success: true,
      message: 'Combo image uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
};

/**
 * @desc    Create a new meal combo
 * @route   POST /api/combos
 * @access  Private (Admin, Restaurant)
 */
const createCombo = async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      discount,
      items,
      originalPrice,
      category,
      image,
      isVeg,
      isAvailable,
      isFeatured,
      status
    } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Combo name and price are required'
      });
    }

    // Parse items if string
    let parsedItems = [];
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (err) {
        parsedItems = [];
      }
    } else if (Array.isArray(items)) {
      parsedItems = items;
    }

    // Upload image if file provided
    let imageUrl = image || '';
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'combos');
        imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: `Image upload failed: ${uploadErr.message}`
        });
      }
    }

    const numericPrice = parseFloat(price);
    const numericDiscount = discount ? parseFloat(discount) : 0;
    let finalPrice = numericPrice;
    if (numericDiscount > 0) {
      finalPrice = Math.round((numericPrice - (numericPrice * (numericDiscount / 100))) * 100) / 100;
    }

    // Auto-calculate original price from items if not supplied
    let calcOriginalPrice = originalPrice ? parseFloat(originalPrice) : 0;
    if (!calcOriginalPrice && parsedItems.length > 0) {
      const productIds = parsedItems.map(it => it.product || it._id).filter(Boolean);
      const prods = await Product.find({ _id: { $in: productIds } }).lean();
      const prodMap = {};
      prods.forEach(p => { prodMap[p._id.toString()] = p.price || 0; });
      calcOriginalPrice = parsedItems.reduce((sum, it) => {
        const pId = (it.product || it._id || '').toString();
        const itemPrice = prodMap[pId] || it.price || 0;
        return sum + (itemPrice * (it.quantity || 1));
      }, 0);
    }

    const newCombo = await Combo.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numericPrice,
      discount: numericDiscount,
      finalPrice,
      originalPrice: calcOriginalPrice,
      items: parsedItems.map(it => ({
        product: new mongoose.Types.ObjectId(it.product || it._id),
        name: it.name || '',
        quantity: it.quantity ? parseInt(it.quantity) : 1
      })),
      category: category && mongoose.Types.ObjectId.isValid(category) ? new mongoose.Types.ObjectId(category) : null,
      image: imageUrl,
      isVeg: isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : true,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : false,
      status: status || 'active',
      createdBy: req.user._id
    });

    const [aggregated] = await Combo.aggregate(
      buildComboAggregationPipeline({ _id: newCombo._id })
    );

    res.status(201).json({
      success: true,
      message: 'Combo created successfully',
      data: aggregated || newCombo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create combo'
    });
  }
};

/**
 * @desc    Get all meal combos with filtering, search & pagination using MongoDB aggregation
 * @route   GET /api/combos
 * @access  Public
 */
const getCombos = async (req, res) => {
  try {
    const {
      search,
      category,
      isVeg,
      isAvailable,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // Search by combo name, description or included item names
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { 'items.name': { $regex: term, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    // Veg / Non-veg filter
    if (isVeg !== undefined && isVeg !== '') {
      filter.isVeg = isVeg === 'true' || isVeg === true;
    }

    // Availability filter
    if (isAvailable !== undefined && isAvailable !== '') {
      filter.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDirection };

    const total = await Combo.countDocuments(filter);
    const combos = await Combo.aggregate(
      buildComboAggregationPipeline(
        Object.keys(filter).length > 0 ? filter : null,
        sortOptions,
        skip,
        limitNum
      )
    );

    res.status(200).json({
      success: true,
      count: combos.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: combos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combos'
    });
  }
};

/**
 * @desc    Get single combo by ID using aggregation
 * @route   GET /api/combos/:id
 * @access  Public
 */
const getComboById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID format'
      });
    }

    const [combo] = await Combo.aggregate(
      buildComboAggregationPipeline({ _id: new mongoose.Types.ObjectId(req.params.id) })
    );

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: combo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combo'
    });
  }
};

/**
 * @desc    Update combo using aggregation
 * @route   PUT /api/combos/:id
 * @access  Private (Admin, Restaurant)
 */
const updateCombo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID format'
      });
    }

    const existingCombo = await Combo.findById(req.params.id);
    if (!existingCombo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    const updates = { ...req.body };

    // Parse items if string
    if (updates.items) {
      if (typeof updates.items === 'string') {
        try {
          updates.items = JSON.parse(updates.items);
        } catch (e) {
          // ignore
        }
      }
      if (Array.isArray(updates.items)) {
        updates.items = updates.items.map(it => ({
          product: new mongoose.Types.ObjectId(it.product || it._id),
          name: it.name || '',
          quantity: it.quantity ? parseInt(it.quantity) : 1
        }));
      }
    }

    // Handle image file upload
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'combos');
        updates.image = uploadResult.secure_url;
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: `Image upload failed: ${uploadErr.message}`
        });
      }
    }

    // Category
    if (updates.category) {
      updates.category = mongoose.Types.ObjectId.isValid(updates.category)
        ? new mongoose.Types.ObjectId(updates.category)
        : null;
    }

    // Recompute final price
    const price = updates.price !== undefined ? parseFloat(updates.price) : existingCombo.price;
    const discount = updates.discount !== undefined ? parseFloat(updates.discount) : existingCombo.discount;
    if (price !== undefined) {
      updates.price = price;
      updates.discount = discount;
      if (discount > 0) {
        updates.finalPrice = Math.round((price - (price * (discount / 100))) * 100) / 100;
      } else {
        updates.finalPrice = price;
      }
    }

    if (updates.isVeg !== undefined) {
      updates.isVeg = updates.isVeg === 'true' || updates.isVeg === true;
    }
    if (updates.isAvailable !== undefined) {
      updates.isAvailable = updates.isAvailable === 'true' || updates.isAvailable === true;
    }
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === 'true' || updates.isFeatured === true;
    }

    const updatedCombo = await Combo.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const [aggregated] = await Combo.aggregate(
      buildComboAggregationPipeline({ _id: updatedCombo._id })
    );

    res.status(200).json({
      success: true,
      message: 'Combo updated successfully',
      data: aggregated || updatedCombo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update combo'
    });
  }
};

/**
 * @desc    Delete combo
 * @route   DELETE /api/combos/:id
 * @access  Private (Admin, Restaurant)
 */
const deleteCombo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid combo ID format'
      });
    }

    const combo = await Combo.findByIdAndDelete(req.params.id);
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Combo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete combo'
    });
  }
};

module.exports = {
  createCombo,
  getCombos,
  getComboById,
  updateCombo,
  deleteCombo,
  uploadComboImage
};
