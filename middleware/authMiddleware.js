const jwt = require('jsonwebtoken');
const User = require('../model/User');

/**
 * Middleware: Express middleware functions are functions that have access to the request object (req),
 * the response object (res), and the next middleware function in the application’s request-response cycle.
 * 
 * This middleware protects routes by ensuring the client has sent a valid JSON Web Token (JWT).
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the request headers contain an 'Authorization' header
  // and check if it starts with the word 'Bearer' (standard convention for JWTs)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // The header looks like: "Bearer abcdef12345..."
      // We split the string by space and get the second element (the token itself)
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret key.
      // If the token is expired or altered, this will throw an error and jump to the catch block.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Once verified, the token payload contains the user's id (e.g. { id: '...' }).
      // We fetch this user from the database and exclude the password field.
      // We attach the user data to the request object ('req.user') so any controller
      // that runs after this middleware has access to the logged-in user's info.
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // next() tells Express to move on to the next middleware or controller function.
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  }

  // If there was no token found in the headers
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * Middleware to restrict access based on user roles.
 * Usage: authorize('admin', 'restaurant')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to perform this action`
      });
    }
    next();
  };
};

// Export the middleware functions so we can use them in our route files
module.exports = { protect, authorize };

