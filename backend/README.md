# Shop-Edoo Backend

Node.js + Express backend for the Shop-Edoo e-commerce platform.

## Setup

### 1. Environment Variables

Create a `.env` file in the `backend` directory based on `.env.example`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopedoo
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
PORT=5000
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

### 2. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in `.env`
4. Make sure to whitelist your IP address in MongoDB Atlas network settings

### 3. Running the Server

```bash
# Install dependencies (from root directory)
pnpm install

# Run backend only
pnpm run dev:backend

# Run frontend and backend together
pnpm run dev:all

# Build backend
pnpm run build:backend
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user (requires auth token)

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

## Database Schemas

- **User**: Email, password, name, role, phone, address
- **Product**: Name, description, price, category, stock, image, QR code
- **Order**: User, items, total amount, status, payment method, shipping address
- **QRCode**: Product ID, code, scan count, last scanned time
- **Cart**: User, items with quantities

## Architecture

- Express.js for HTTP server
- MongoDB + Mongoose for data persistence
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled for frontend communication

## Next Steps

1. Implement Product Management APIs
2. Implement QR Code generation and scanning
3. Implement Cart and Order management
4. Integrate Stripe payment processing
5. Add Admin dashboard APIs
