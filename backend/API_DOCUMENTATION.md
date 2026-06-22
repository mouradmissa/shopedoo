# Shop-Edoo API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### 1. Sign Up
- **POST** `/auth/signup`
- **Public**
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response:**
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    }
  }
  ```

### 2. Sign In
- **POST** `/auth/signin`
- **Public**
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Same as Sign Up

### 3. Get Current User
- **GET** `/auth/me`
- **Protected**
- **Response:**
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "phone": "optional_phone",
    "address": "optional_address"
  }
  ```

---

## Product Endpoints

### 1. Get All Products
- **GET** `/products`
- **Public**
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `search` (optional): Search by name or description
- **Response:**
  ```json
  [
    {
      "id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "category": "electronics",
      "stock": 50,
      "image": "image_url",
      "qrCode": "SHOPEDOO-uuid"
    }
  ]
  ```

### 2. Get Single Product
- **GET** `/products/:id`
- **Public**
- **Response:** Single product object

### 3. Get Product by QR Code
- **GET** `/products/qr/:qrCode`
- **Public**
- **Response:** Single product object (also increments scan count)

### 4. Create Product (Admin Only)
- **POST** `/products`
- **Protected (Admin)**
- **Request Body:**
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "category": "electronics",
    "stock": 50,
    "image": "image_url"
  }
  ```
- **Response:** Created product object with generated QR code

### 5. Update Product (Admin Only)
- **PUT** `/products/:id`
- **Protected (Admin)**
- **Request Body:** Same as Create Product (all fields optional)
- **Response:** Updated product object

### 6. Delete Product (Admin Only)
- **DELETE** `/products/:id`
- **Protected (Admin)**
- **Response:**
  ```json
  {
    "message": "Product deleted successfully"
  }
  ```

---

## Cart Endpoints

### 1. Get Cart
- **GET** `/cart`
- **Protected**
- **Response:**
  ```json
  {
    "id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": {
          "id": "product_id",
          "name": "Product Name",
          "price": 29.99
        },
        "quantity": 2
      }
    ]
  }
  ```

### 2. Add to Cart
- **POST** `/cart/add`
- **Protected**
- **Request Body:**
  ```json
  {
    "productId": "product_id",
    "quantity": 2
  }
  ```
- **Response:** Updated cart object

### 3. Remove from Cart
- **POST** `/cart/remove/:productId`
- **Protected**
- **Response:** Updated cart object

### 4. Update Item Quantity
- **PUT** `/cart/update/:productId`
- **Protected**
- **Request Body:**
  ```json
  {
    "quantity": 3
  }
  ```
- **Response:** Updated cart object

### 5. Clear Cart
- **DELETE** `/cart/clear`
- **Protected**
- **Response:** Empty cart object

---

## Order Endpoints

### 1. Get User's Orders
- **GET** `/orders`
- **Protected**
- **Response:** Array of order objects

### 2. Get Single Order
- **GET** `/orders/:id`
- **Protected**
- **Response:**
  ```json
  {
    "id": "order_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalAmount": 59.98,
    "status": "pending",
    "paymentMethod": "stripe",
    "shippingAddress": "123 Main St, City, State",
    "createdAt": "2024-01-01T00:00:00Z"
  }
  ```

### 3. Create Order (Checkout)
- **POST** `/orders/checkout`
- **Protected**
- **Request Body:**
  ```json
  {
    "shippingAddress": "123 Main St, City, State",
    "paymentMethod": "stripe"
  }
  ```
- **Response:** Created order object

### 4. Get All Orders (Admin Only)
- **GET** `/orders/admin/all`
- **Protected (Admin)**
- **Query Parameters:**
  - `status` (optional): Filter by status (pending, paid, shipped, delivered, cancelled)
- **Response:** Array of all orders with user details

### 5. Update Order Status (Admin Only)
- **PUT** `/orders/:id/status`
- **Protected (Admin)**
- **Request Body:**
  ```json
  {
    "status": "shipped"
  }
  ```
- **Response:** Updated order object

---

## Payment Endpoints

### 1. Create Payment Intent
- **POST** `/payment/create-payment-intent`
- **Protected**
- **Request Body:**
  ```json
  {
    "orderId": "order_id"
  }
  ```
- **Response:**
  ```json
  {
    "clientSecret": "pi_client_secret",
    "paymentIntentId": "pi_xxx"
  }
  ```

### 2. Confirm Payment
- **POST** `/payment/confirm-payment`
- **Protected**
- **Request Body:**
  ```json
  {
    "orderId": "order_id",
    "paymentIntentId": "pi_xxx"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Payment successful",
    "order": { ... }
  }
  ```

### 3. Stripe Webhook
- **POST** `/payment/webhook`
- **Public (Signature Verification)**
- Handled events:
  - `payment_intent.succeeded`: Updates order status to "paid"
  - `payment_intent.payment_failed`: Logs payment failure

---

## Error Handling

All endpoints return error responses in this format:
```json
{
  "error": "Error message",
  "details": "Additional details (if available)"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Example Usage with cURL

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Get Products
```bash
curl http://localhost:5000/api/products?category=electronics
```

### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product_id",
    "quantity": 2
  }'
```

---

## Rate Limiting
Currently not implemented. Recommended for production.

## CORS
Configured for frontend at `FRONTEND_URL` environment variable.

## Security Notes
- Always use HTTPS in production
- Store JWT tokens securely (httpOnly cookies recommended)
- Validate all user inputs
- Use strong JWT_SECRET
- Keep Stripe keys secure
