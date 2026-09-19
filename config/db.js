// mongoose is the library we use to talk to our MongoDB database
const mongoose = require('mongoose');

/**
 * Establishes a connection to the MongoDB database.
 * We use an 'async' function because database connections take time (asynchronous).
 * Inside, we use a try-catch block to handle any errors if the connection fails.
 */
const connectDB = async () => {
  try {
    // process.env.MONGO_URI reads the connection string from our .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Log a success message with the host name we connected to
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    // If something goes wrong, log the error message
    console.error(`Database connection error: ${error.message}`);
    // Exit the application with code 1 (indicates failure)
    process.exit(1);
  }
};

// Export the connectDB function so it can be imported and run in server.js
module.exports = connectDB;
