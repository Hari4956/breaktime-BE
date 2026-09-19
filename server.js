// dotenv loads settings from the '.env' file into 'process.env'
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./router/authRoutes');
const categoryRoutes = require('./router/categoryRoutes');
const productRoutes = require('./router/productRoutes');
const cartRoutes = require('./router/cartRoutes');

// 1. Connect to our MongoDB database
connectDB();

// 2. Initialize the Express Application
const app = express();

/**
 * Built-in Middleware: express.json()
 * This middleware parses incoming HTTP requests with JSON payloads (e.g. from Postman or mobile apps)
 * and makes the parsed data available under 'req.body'.
 * Without this, req.body will be undefined!
 */
app.use(express.json());

/**
 * Root Route:
 * Just a simple route to check if our backend server is alive and running.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Food Order and Delivery API backend!'
  });
});

/**
 * Mount API Routes:
 * - /api/auth
 * - /api/categories
 * - /api/products
 * - /api/cart
 */
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);


// 3. Define the port to listen on.
// We read it from the env file, or fallback to port 5000 if not defined.
const PORT = process.env.PORT || 5000;

// 4. Start the server and listen for incoming HTTP requests
app.listen(PORT, () => {
  console.log(`Server is running in development mode on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/ to test the server.`);
});
