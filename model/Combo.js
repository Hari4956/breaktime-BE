const mongoose = require('mongoose');

/**
 * Combo Schema for Restaurant Meal Combos and Deals.
 */
const comboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Combo name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          default: ''
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, 'Quantity must be at least 1']
        }
      }
    ],
    originalPrice: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Combo price is required'],
      min: [0.01, 'Price must be greater than 0']
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
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
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
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
 * Pre-save middleware to compute finalPrice before saving.
 */
comboSchema.pre('save', function () {
  if (this.price !== undefined) {
    if (this.discount && this.discount > 0) {
      const calculated = this.price - (this.price * (this.discount / 100));
      this.finalPrice = Math.round(calculated * 100) / 100;
    } else {
      this.finalPrice = this.price;
    }
  }
});

module.exports = mongoose.model('Combo', comboSchema);
