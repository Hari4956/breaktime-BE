const mongoose = require('mongoose');

/**
 * Product Schema for Restaurant Menu Items.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isVeg: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    preparationTime: {
      type: Number,
      default: 0,
      min: [0, 'Preparation time cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100']
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save middleware to guarantee finalPrice calculation before saving.
 */
productSchema.pre('save', function () {
  if (this.price !== undefined && this.discount !== undefined) {
    const calculated = this.price - (this.price * (this.discount / 100));
    this.finalPrice = Math.round(calculated * 100) / 100;
  }
});

module.exports = mongoose.model('Product', productSchema);
