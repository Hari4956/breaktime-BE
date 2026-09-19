const express = require('express');
// Express Router is a mini-app that can handle requests and be mounted in server.js
const router = express.Router();

// Import our controller functions
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controller/authController');

// Import our authentication middleware
const { protect } = require('../middleware/authMiddleware');

/**
 * Route: Register a new user
 * Method: POST
 * URL: /api/auth/register
 * This route is Public, anyone can call it.
 */
router.post('/register', registerUser);

/**
 * Route: User login
 * Method: POST
 * URL: /api/auth/login
 * This route is Public, anyone can call it.
 */
router.post('/login', loginUser);

/**
 * Route: Get current user profile
 * Method: GET
 * URL: /api/auth/profile
 * This route is Private. We pass the 'protect' middleware function as the second argument.
 * Express will run 'protect' first. If it succeeds, it calls 'getUserProfile'.
 */
router.get('/profile', protect, getUserProfile);

/**
 * Route: Update user profile
 * Method: PUT
 * URL: /api/auth/profile
 * This route is Private, protected by JWT middleware.
 */
router.put('/profile', protect, updateUserProfile);

// Export the router so it can be mounted in server.js
module.exports = router;
