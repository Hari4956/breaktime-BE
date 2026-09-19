# Product & Category Management Module API Documentation

Base URL: `http://localhost:5050` (or `PORT` defined in `.env`)

---

## 1. Authentication & Roles

* **Public Endpoints**: Category listings, Product listings, Product detail.
* **Protected Endpoints**: Category Creation/Update/Delete, Product Creation/Update/Delete, Image Uploads.
* **Authentication**: Requires HTTP Header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Authorized Roles**: Users with `role: "admin"` or `role: "restaurant"`.

---

## 2. Cloudinary Environment Variables Setup

Ensure the following credentials exist in your `.env` file for Cloudinary image uploading:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 3. Image Upload APIs

### Upload Product Image to Cloudinary (Standalone)
* **Method**: `POST`
* **Path**: `/api/products/upload-image`
* **Auth**: Required (`admin`, `restaurant`)
* **Content-Type**: `multipart/form-data`
* **Form Data Key**: `image` (File: JPG, PNG, WEBP, max 5MB)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Image uploaded successfully to Cloudinary",
    "data": {
      "url": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/restaurant_products/sample.jpg",
      "public_id": "restaurant_products/sample"
    }
  }
  ```

### Upload Category Image to Cloudinary (Standalone)
* **Method**: `POST`
* **Path**: `/api/categories/upload-image`
* **Auth**: Required (`admin`, `restaurant`)
* **Content-Type**: `multipart/form-data`
* **Form Data Key**: `image` (File: JPG, PNG, WEBP, max 5MB)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category image uploaded successfully to Cloudinary",
    "data": {
      "url": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/restaurant_categories/sample.jpg",
      "public_id": "restaurant_categories/sample"
    }
  }
  ```

---

## 4. Category APIs

### Create Category
* **Method**: `POST`
* **Paths**: `/api/categories` or `/api/categories/create`
* **Auth**: Required (`admin`, `restaurant`)
* **Content-Type Options**:
  1. `application/json` (Pass `image` as Cloudinary URL string)
  2. `multipart/form-data` (Attach image file under key `image` alongside form fields)

* **JSON Request Body**:
  ```json
  {
    "name": "Burger",
    "description": "Delicious flame-grilled burgers",
    "image": "https://res.cloudinary.com/demo/image/upload/v1/burger.jpg",
    "status": "active"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": {
      "_id": "68abc1234567890abcdef123",
      "name": "Burger",
      "description": "Delicious flame-grilled burgers",
      "image": "https://res.cloudinary.com/demo/image/upload/v1/burger.jpg",
      "status": "active"
    }
  }
  ```

### Get All Categories
* **Method**: `GET`
* **Paths**: `/api/categories` or `/api/categories/get-all`
* **Query Params**:
  * `status`: `active` (default), `inactive`, or `all`

### Get Category by ID
* **Method**: `GET`
* **Path**: `/api/categories/:id`

### Update Category
* **Method**: `PUT`
* **Path**: `/api/categories/:id`
* **Content-Type**: `application/json` or `multipart/form-data`

### Delete Category (Soft Delete)
* **Method**: `DELETE`
* **Path**: `/api/categories/:id`

---

## 5. Product APIs

### Create Product
* **Method**: `POST`
* **Paths**: `/api/products` or `/api/products/create`
* **Auth**: Required (`admin`, `restaurant`)
* **Content-Type Options**: `application/json` or `multipart/form-data` (Key: `image`)

### Get All Products (Pagination, Search, Filter, Sort)
* **Method**: `GET`
* **Paths**: `/api/products` or `/api/products/get-all`
* **Query Parameters**: `page`, `limit`, `search`, `category`, `isVeg`, `isAvailable`, `isFeatured`, `status`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`

### Get Product by ID
* **Method**: `GET`
* **Path**: `/api/products/:id`

### Update Product
* **Method**: `PUT`
* **Path**: `/api/products/:id`

### Delete Product (Soft Delete)
* **Method**: `DELETE`
* **Path**: `/api/products/:id`
