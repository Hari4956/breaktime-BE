const mongoose = require('mongoose');
const Category = require('../model/Category');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Upload category image standalone to Cloudinary
 * @route   POST /api/categories/upload-image
 * @access  Private (Admin / Restaurant)
 */
const uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file to upload'
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_categories');

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully to Cloudinary',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });
  } catch (error) {
    console.error('Cloudinary category image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Category image upload failed',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new category (Supports JSON or multipart file upload)
 * @route   POST /api/categories or POST /api/categories/create
 * @access  Private (Admin / Restaurant)
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    let imageUrl = image || '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_categories');
      imageUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      image: imageUrl,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category',
      error: error.message
    });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories or GET /api/categories/get-all
 * @access  Public / Authenticated
 */
const getCategories = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'active';
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories',
      error: error.message
    });
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public / Authenticated
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category',
      error: error.message
    });
  }
};

/**
 * @desc    Update category (Supports JSON or multipart file upload)
 * @route   PUT /api/categories/:id
 * @access  Private (Admin / Restaurant)
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, image, status } = req.body;

    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      category.name = name.trim();
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'restaurant_categories');
      category.image = uploadResult.secure_url;
    } else if (image !== undefined) {
      category.image = image;
    }

    if (description !== undefined) category.description = description;
    if (status !== undefined) category.status = status;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating category',
      error: error.message
    });
  }
};

/**
 * @desc    Delete category (Soft Delete)
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin / Restaurant)
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.status = 'inactive';
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting category',
      error: error.message
    });
  }
};

module.exports = {
  uploadCategoryImage,
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
