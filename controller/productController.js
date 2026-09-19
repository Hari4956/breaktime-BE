const mongoose = require('mongoose');
const Product = require('../model/Product');
const Category = require('../model/Category');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Helper to resolve Category ObjectId from either ObjectId string or Category Name string.
 */
const resolveCategoryId = async (categoryInput) => {
  if (!categoryInput) return null;

  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    const cat = await Category.findById(categoryInput);
    if (cat) return cat._id;
  }

  // Search by category name (case-insensitive)
  const catByName = await Category.findOne({
    name: { $regex: new RegExp(`^${categoryInput.trim()}$`, 'i') }
  });

  if (catByName) {
    return catByName._id;
  }

  return null;
};

/**
 * @desc    Upload product image standalone to Cloudinary
 * @route   POST /api/products/upload-image
 * @access  Private (Admin / Restaurant)
 */
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload'
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_products');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new product (supports JSON image URL or multipart file upload)
 * @route   POST /api/products
 * @access  Private (Admin / Restaurant)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      isAvailable,
      isVeg,
      isFeatured,
      preparationTime,
      discount,
      status
    } = req.body;

    // 1. Validation: Product name is required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    // 2. Validation: Price must be greater than 0
    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // 3. Validation: Discount bounds check
    const numDiscount = discount !== undefined ? Number(discount) : 0;
    if (numDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount cannot be negative'
      });
    }
    if (numDiscount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount cannot exceed 100'
      });
    }

    // 4. Validation: Preparation time bounds check
    const numPrepTime = preparationTime !== undefined ? Number(preparationTime) : 0;
    if (numPrepTime < 0) {
      return res.status(400).json({
        success: false,
        message: 'Preparation time cannot be negative'
      });
    }

    // 5. Validation & Category Resolution
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or non-existing category'
      });
    }

    // 6. Handle Image (Multer file upload to Cloudinary vs direct URL string)
    let imageUrl = image || '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_products');
      imageUrl = uploadResult.secure_url;
    }

    // 7. Compute finalPrice (backend calculation)
    const numPrice = Number(price);
    const calculatedFinalPrice = Math.round((numPrice - (numPrice * (numDiscount / 100))) * 100) / 100;

    // 8. Create Product
    const product = await Product.create({
      name: name.trim(),
      description: description || '',
      price: numPrice,
      category: categoryId,
      image: imageUrl,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isVeg: isVeg !== undefined ? Boolean(isVeg) : false,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      preparationTime: numPrepTime,
      discount: numDiscount,
      finalPrice: calculatedFinalPrice,
      status: status || 'active',
      createdBy: req.user._id
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', '_id name image')
      .populate('createdBy', '_id name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating product',
      error: error.message
    });
  }
};

/**
 * @desc    Get all products with filtering, search, sorting & pagination
 * @route   GET /api/products
 * @access  Public / Authenticated
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      isVeg,
      isAvailable,
      isFeatured,
      status,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // 1. Status Filter (default to active)
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'active';
    }

    // 2. Category Filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        const matchedCategories = await Category.find({
          name: { $regex: category.trim(), $options: 'i' }
        }).select('_id');
        const categoryIds = matchedCategories.map(c => c._id);
        query.category = { $in: categoryIds };
      }
    }

    // 3. Boolean Filters
    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true' || isVeg === true;
    }
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true' || isAvailable === true;
    }
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    // 4. Price Range Filter (Filters on finalPrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.finalPrice = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.finalPrice.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.finalPrice.$lte = Number(maxPrice);
      }
    }

    // 5. Search Filter (name or description)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // 6. Sorting Setup
    const allowedSortFields = ['price', 'name', 'createdAt', 'preparationTime', 'finalPrice'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // 7. Pagination Setup
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // 8. Execute Database Query
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('category', '_id name image')
      .populate('createdBy', '_id name email');

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching products',
      error: error.message
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public / Authenticated
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id)
      .populate('category', '_id name image')
      .populate('createdBy', '_id name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching product',
      error: error.message
    });
  }
};

/**
 * @desc    Update product details & recalculate finalPrice
 * @route   PUT /api/products/:id
 * @access  Private (Admin / Restaurant)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      description,
      price,
      category,
      image,
      isAvailable,
      isVeg,
      isFeatured,
      preparationTime,
      discount,
      status
    } = req.body;

    // Validate fields if provided in update payload
    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    if (discount !== undefined) {
      const d = Number(discount);
      if (d < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount cannot be negative'
        });
      }
      if (d > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount cannot exceed 100'
        });
      }
    }

    if (preparationTime !== undefined && Number(preparationTime) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Preparation time cannot be negative'
      });
    }

    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or non-existing category'
        });
      }
      product.category = categoryId;
    }

    // Handle Image Upload if file is present
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_products');
      product.image = uploadResult.secure_url;
    } else if (image !== undefined) {
      product.image = image;
    }

    // Apply partial updates
    if (name !== undefined && name.trim()) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
    if (isVeg !== undefined) product.isVeg = Boolean(isVeg);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (preparationTime !== undefined) product.preparationTime = Number(preparationTime);
    if (status !== undefined) product.status = status;

    // Price & Discount Update & Recalculation
    if (price !== undefined) product.price = Number(price);
    if (discount !== undefined) product.discount = Number(discount);

    // Always recalculate finalPrice if price or discount changed/provided
    const calculatedFinalPrice = Math.round((product.price - (product.price * (product.discount / 100))) * 100) / 100;
    product.finalPrice = calculatedFinalPrice;

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate('category', '_id name image')
      .populate('createdBy', '_id name email');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating product',
      error: error.message
    });
  }
};

/**
 * @desc    Soft delete product (sets status to 'inactive')
 * @route   DELETE /api/products/:id
 * @access  Private (Admin / Restaurant)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete: status = 'inactive'
    product.status = 'inactive';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting product',
      error: error.message
    });
  }
};

module.exports = {
  uploadProductImage,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
