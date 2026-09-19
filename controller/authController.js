const jwt = require('jsonwebtoken');
const User = require('../model/User');

/**
 * Helper function to generate a JSON Web Token (JWT).
 * This token is sent to the client when they register or log in.
 * They will use it to access protected routes.
 */
const generateToken = (id) => {
  // jwt.sign creates a new token containing the user's database ID as payload.
  // We sign it using our secret key so nobody can forge it.
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    // Destructure the required fields from the request body (sent by user)
    const { name, email, password, phone, role } = req.body;

    // 1. Validation: Make sure all required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // 2. Check if the user already exists in the database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // 3. Create a new user record. 
    // The password will automatically be hashed by the User Schema's pre('save') hook.
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role // Default is 'customer' if not provided
    });

    // 4. If creation is successful, respond with 201 (Created) and the token
    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id) // Send JWT to client
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Ensure both fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 2. Find user by email.
    // By default, User.password has 'select: false' in the Schema.
    // We must use '.select('+password')' here to explicitly load the password for comparison.
    const user = await User.findOne({ email }).select('+password');

    // 3. Verify user exists and check if password matches
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
          token: generateToken(user._id)
        }
      });
    } else {
      // Return 401 (Unauthorized) if email or password is wrong
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private (Requires JWT token)
 */
const getUserProfile = async (req, res) => {
  try {
    // The protect middleware has already verified the token and loaded the user into req.user
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile (Name, phone, and delivery addresses)
 * @route   PUT /api/auth/profile
 * @access  Private (Requires JWT token)
 */
const updateUserProfile = async (req, res) => {
  try {
    // 1. Fetch user from DB. req.user is populated by protect middleware.
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Update basic fields if they are sent in the request body
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    // Optional: If user wants to update their password
    if (req.body.password) {
      user.password = req.body.password; // Mongoose pre-save hook will hash it
    }

    // Optional: Update delivery addresses
    // If the body contains a list of addresses, replace them.
    if (req.body.addresses) {
      user.addresses = req.body.addresses;
    }

    // 3. Save the updated user back to MongoDB
    const updatedUser = await user.save();

    // 4. Send back the updated information
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        addresses: updatedUser.addresses
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

// Export all the functions so our router can map them to URLs
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
