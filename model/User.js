const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// An Address Schema is a sub-document that lives inside the User document.
// Users can have multiple addresses for food delivery.
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

/**
 * The User Schema defines the structure of the 'users' collection in MongoDB.
 * We enforce rules like unique emails, required fields, and specific roles.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true // Removes accidental leading/trailing spaces
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true, // Prevents duplicate email signups
      trim: true,
      lowercase: true, // Converts email to lowercase before saving
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // When querying users, by default do NOT return the password field (for security)

    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      // Roles: 
      // - customer: orders food
      // - restaurant: creates food menus and fulfills orders
      // - driver: delivers food
      // - admin: manages the platform
      enum: ['customer', 'restaurant', 'driver', 'admin'],
      default: 'customer'
    },
    // We embed the addressSchema array inside the user
    addresses: [addressSchema]
  },
  {
    // Automatically creates 'createdAt' and 'updatedAt' timestamp fields in the database
    timestamps: true
  }
);

/**
 * Pre-Save Middleware (Hook):
 * Before Mongoose saves a User document to the database, this function runs.
 * We use it to hash the user's password using bcryptjs.
 */
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (created or changed).
  if (!this.isModified('password')) {
    return;
  }

  // Generate a salt (random string) with 10 rounds of complexity
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Custom Instance Method:
 * We attach this method to the User schema so any user document can easily check
 * if an entered password matches the hashed password stored in the database.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare decodes the hash and compares it with the plain text password
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compile and export the model
// Mongoose will create a collection in MongoDB called 'users' (lowercase plural of 'User')
module.exports = mongoose.model('User', userSchema);
