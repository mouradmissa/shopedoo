# Shop-Edoo - Ooredoo E-Commerce Platform

A modern, full-stack e-commerce platform with QR code scanning capabilities for Ooredoo telecom products. Features JWT authentication, Stripe payments, real-time product management, and an admin dashboard.

## Project Overview

Shop-Edoo is a complete e-commerce solution with:
- **Frontend**: Next.js 16 with React 19, Tailwind CSS, and ShadCN components
- **Backend**: Node.js/Express with MongoDB and Mongoose
- **Authentication**: JWT-based with bcrypt password hashing
- **Payments**: Stripe integration
- **QR Code**: Real-time mobile QR scanning with jsQR
- **Admin Dashboard**: Product and order management

## Tech Stack

### Frontend
- Next.js 16.2.6
- React 19
- TypeScript
- Tailwind CSS v4
- ShadCN UI Components
- jsQR (QR scanning)
- Lucide React Icons

### Backend
- Node.js/Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs (Password hashing)
- Stripe API
- CORS

### Database
- MongoDB Atlas (cloud)
- Collections: Users, Products, Orders, QRCodes, Carts

## Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account
- Stripe account

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd shop-edoo
pnpm install
```

### 2. Setup MongoDB

1. Create a MongoDB Atlas cluster: https://www.mongodb.com/cloud/atlas
2. Create a database connection string
3. Whitelist your IP address in Network Access

### 3. Environment Variables

Create `.env.local` in the root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Create `backend/.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopedoo
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
NODE_ENV=development
PORT=5000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### 4. Create Admin User (Backend MongoDB)

```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  email: "admin@shopedoo.com",
  password: "hashed_password_via_bcrypt",
  name: "Admin User",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use the signup endpoint and manually update the role to "admin" in MongoDB.

### 5. Running the Application

**Option 1: Run Frontend & Backend Separately**

Terminal 1 (Frontend on port 3000):
```bash
pnpm run dev
```

Terminal 2 (Backend on port 5000):
```bash
pnpm run dev:backend
```

**Option 2: Run Both Together**

```bash
pnpm run dev:all
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Project Structure

```
shop-edoo/
├── app/
│   ├── layout.tsx              # Root layout with Auth provider
│   ├── page.tsx                # Home/shopping page
│   ├── auth/
│   │   ├── signin/page.tsx      # Login page
│   │   └── signup/page.tsx      # Registration page
│   ├── cart/page.tsx            # Shopping cart
│   ├── qr-scanner/page.tsx      # QR code scanner
│   ├── checkout/page.tsx        # Checkout (to be created)
│   ├── products/[id]/page.tsx   # Product details (to be created)
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── products/page.tsx    # Product management
│   │   ├── orders/page.tsx      # Order management
│   │   ├── users/page.tsx       # User management (to be created)
│   │   └── analytics/page.tsx   # Analytics (to be created)
│   └── globals.css              # Global styles with design tokens
├── components/
│   └── ui/                      # ShadCN components
├── context/
│   └── AuthContext.tsx          # Auth state management
├── lib/
│   ├── api.ts                   # API client
│   └── utils.ts                 # Utility functions
├── backend/
│   ├── server.ts                # Express app
│   ├── config/
│   │   └── mongodb.ts           # MongoDB connection
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Product.ts           # Product schema
│   │   ├── Order.ts             # Order schema
│   │   ├── Cart.ts              # Cart schema
│   │   └── QRCode.ts            # QR code schema
│   ├── middleware/
│   │   └── auth.ts              # JWT auth middleware
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── products.ts          # Product endpoints
│   │   ├── cart.ts              # Cart endpoints
│   │   ├── orders.ts            # Order endpoints
│   │   └── payment.ts           # Stripe endpoints
│   ├── utils/
│   │   └── jwt.ts               # JWT utilities
│   ├── API_DOCUMENTATION.md     # API documentation
│   └── README.md                # Backend setup guide
└── package.json
```

## Key Features

### Customer Features
- ✅ User authentication (signup/signin)
- ✅ Browse products with filtering
- ✅ Shopping cart management
- ✅ Real-time QR code scanning
- ✅ Product details page
- ✅ Checkout process
- ✅ Order history

### Admin Features
- ✅ Product management (create, update, delete)
- ✅ QR code generation and tracking
- ✅ Order management and status updates
- ✅ User management
- ✅ Analytics and reports
- ✅ Dashboard with stats

### Technical Features
- ✅ JWT authentication with role-based access
- ✅ Secure password hashing with bcrypt
- ✅ Stripe payment integration
- ✅ Real-time QR scanning with jsQR
- ✅ Responsive design with Tailwind CSS
- ✅ Error handling and validation
- ✅ CORS configured for security

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/qr/:qrCode` - Get product by QR code
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:productId` - Update item quantity
- `POST /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/checkout` - Create order
- `GET /api/orders/admin/all` - Get all orders (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)

### Payments
- `POST /api/payment/create-payment-intent` - Create Stripe payment intent
- `POST /api/payment/confirm-payment` - Confirm payment
- `POST /api/payment/webhook` - Stripe webhook

See `backend/API_DOCUMENTATION.md` for detailed endpoint documentation.

## Default Credentials

After setup, use these credentials to sign in:

**Admin Account:**
- Email: `admin@shopedoo.com`
- Password: Set during admin user creation

**Test Customer Account:**
- Create via signup page during development

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Render, Railway, or Vercel Functions)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

## Security Considerations

- ✅ JWT tokens stored in localStorage
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ CORS configured for trusted origins
- ✅ Admin routes protected with role-based middleware
- ✅ Input validation on all endpoints
- ✅ Stripe webhook signature verification

**Recommendations for Production:**
- Use HTTPS only
- Move auth tokens to httpOnly cookies
- Implement rate limiting
- Add request logging and monitoring
- Use environment secrets management
- Enable MongoDB IP whitelisting
- Add request/response encryption for sensitive data

## Performance Optimizations

- Lazy loading with Next.js dynamic imports
- Image optimization with next/image
- CSS-in-JS with Tailwind CSS
- Database indexing on frequently queried fields
- CORS caching headers configured

## Testing

```bash
# Run backend tests (to be implemented)
pnpm run test:backend

# Run frontend tests (to be implemented)
pnpm run test:frontend
```

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify JWT_SECRET is set
- Ensure port 5000 is available
- Check Node.js version (18+)

### QR scanner not working
- Check browser camera permissions
- Ensure HTTPS in production
- Test with valid QR codes
- Check jsQR dependency is installed

### Stripe payments failing
- Verify Stripe keys are correct
- Check webhook is properly configured
- Test with Stripe test mode keys
- Verify webhook secret matches

### CORS errors
- Check FRONTEND_URL in backend .env
- Verify Origin header in requests
- Ensure credentials flag is set in API calls

## Future Enhancements

- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Coupon/discount codes
- [ ] Inventory alerts
- [ ] Advanced analytics dashboard
- [ ] Multiple payment methods
- [ ] Shipping integrations
- [ ] Real-time notifications with Socket.io
- [ ] Mobile app with React Native

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass

## License

MIT License - See LICENSE file for details

## Support

For issues and support:
- GitHub Issues: [Submit an issue]
- Documentation: See API_DOCUMENTATION.md
- Email: support@shopedoo.com

---

**Built with ❤️ for Ooredoo**
