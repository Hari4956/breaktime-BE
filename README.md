# Break Time - Backend (API)

Welcome to the backend repository for **Break Time**, a food ordering and restaurant management platform. This project provides a robust RESTful API built with Node.js, Express, and MongoDB to power the frontend applications.

## 🚀 Features

- **User Authentication & Authorization**: Secure sign-up and login with JWT (JSON Web Tokens). Supports multiple roles (Admin, Restaurant, Customer, Driver).
- **Product Management**: Restaurants can manage their food menus (create, update, delete products), configure prices (in INR), set preparation times, and apply discounts.
- **Category Management**: Organize products into various categories (e.g., Burgers, Pizza, Desserts).
- **Cart & Order System**: Endpoints to manage user carts and process food orders (based on available models).
- **Image Uploads**: Integration with **Cloudinary** and **Multer** for handling image uploads (like restaurant logos and product images).
- **Data Seeding**: Built-in seeding scripts to quickly populate your database with dummy data for testing.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) & [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- **File Uploads**: [Multer](https://www.npmjs.com/package/multer) & [Cloudinary](https://cloudinary.com/)

## 📂 Project Structure

```text
breaktime-BE/
├── config/           # Database and environment configurations
├── controller/       # Request handlers and business logic
├── middleware/       # Express middlewares (auth, file uploads, etc.)
├── model/            # Mongoose database schemas (User, Product, Category, Cart, etc.)
├── router/           # Express API route definitions
├── .env              # Environment variables
├── seeder.js         # Script to seed initial data into MongoDB
├── server.js         # Entry point of the application
└── package.json      # Project dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Installation

1. **Clone the repository** (if not already done) and navigate into the project directory:
   ```bash
   cd breaktime-BE
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following keys (fill in your actual values):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

### Running the Server

- **Development Mode** (with auto-reload via `nodemon`):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
  *The server will start on `http://localhost:5000` (or the port specified in your `.env`).*

## 🌱 Database Seeding

You can quickly populate your database with sample Indian-rupee priced data (users, categories, products) for testing.

- **To seed data**:
  ```bash
  npm run seed
  ```
- **To destroy/clear existing data**:
  ```bash
  npm run seed:destroy
  ```

## 📖 API Documentation

Detailed API documentation and tests are available within the repository:
- `API_DOCUMENTATION.txt`
- `PRODUCT_API_DOCUMENTATION.md`
- `test-api.js` / `test-product-api.js`

## 🛡️ License
ISC
