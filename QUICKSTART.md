# Shop-Edoo Quick Start Guide

Get your e-commerce platform running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- MongoDB Atlas account (free tier available)
- Stripe account (free tier for testing)

## Installation Steps

### 1. Clone & Install (30 seconds)

```bash
cd shop-edoo
pnpm install
```

### 2. Create MongoDB Database (2 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Create a database user
5. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/shopedoo`

### 3. Configure Environment Variables (1 minute)

Create `backend/.env`:
```
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/shopedoo
JWT_SECRET=your_super_secret_key_at_least_32_characters_long_here
NODE_ENV=development
PORT=5000
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
FRONTEND_URL=http://localhost:3000
```

Create `.env.local` in root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Everything (30 seconds)

**All in one command:**
```bash
pnpm run dev:all
```

**Or separately:**

Terminal 1:
```bash
pnpm run dev
```

Terminal 2:
```bash
pnpm run dev:backend
```

### 5. Access the App (15 seconds)

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Admin: Sign up, then manually set role to "admin" in MongoDB

## Test the Platform

### 1. Create Account
- Click "Get Started" on homepage
- Sign up with email and password

### 2. Browse Products
- Home page shows product grid
- Use category filters
- Click "Add to Cart"

### 3. Try QR Scanner
- Click QR Scanner icon in nav
- Allow camera permission
- Point at QR code (or print test QR codes)

### 4. Checkout Flow
- Go to Cart
- Click "Proceed to Checkout"
- Enter shipping address

### 5. Admin Dashboard
- Sign in as admin (need to set role in DB first)
- Go to `/admin`
- Manage products, view orders

## Sample Test Data

### Create Admin User

In MongoDB, insert:
```javascript
db.users.insertOne({
  email: "admin@shopedoo.com",
  password: "$2a$10$...", // bcrypt hash of "admin123"
  name: "Admin User",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Create Test Product

```javascript
db.products.insertOne({
  name: "Ooredoo Sim Card",
  description: "High-speed 4G sim card",
  price: 29.99,
  category: "accessories",
  stock: 100,
  qrCode: "SHOPEDOO-TEST-001",
  image: "https://via.placeholder.com/300",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MONGODB_URI in backend/.env
- Verify IP is whitelisted in MongoDB Atlas
- Test connection string in MongoDB Compass

### "API not responding"
- Ensure backend is running: `pnpm run dev:backend`
- Check console for errors
- Verify port 5000 is available

### "QR Scanner not working"
- Enable camera permissions
- Only works on HTTPS in production
- Test with valid QR code

### "Stripe errors"
- Use test key: sk_test_... (not sk_live_...)
- Use test card: 4242 4242 4242 4242
- Check webhook configuration

## Next Steps

1. **Customize**
   - Update colors in `app/globals.css`
   - Change logo in navigation
   - Add your own products

2. **Deploy**
   - Follow `DEPLOYMENT.md` guide
   - Deploy frontend to Vercel
   - Deploy backend to Render

3. **Add Features**
   - User profile page
   - Order status notifications
   - Product reviews
   - Wishlist

4. **Production Ready**
   - Set up error tracking (Sentry)
   - Configure monitoring
   - Enable rate limiting
   - Add security headers

## Useful Commands

```bash
# Development
pnpm run dev              # Frontend only
pnpm run dev:backend      # Backend only
pnpm run dev:all          # Both

# Building
pnpm run build            # Build frontend
pnpm run build:backend    # Build backend

# Linting
pnpm run lint             # Check code quality
```

## File Structure Overview

```
shop-edoo/
├── app/              # Frontend (Next.js pages)
├── backend/          # Backend (Express server)
├── context/          # State management
├── lib/              # Utilities & API client
├── components/       # React components
├── README.md         # Full documentation
├── DEPLOYMENT.md     # Production guide
└── package.json      # Dependencies
```

## Key Features to Try

1. **Product Browsing** - Filter by category on home page
2. **Cart Management** - Add/remove items, adjust quantities
3. **QR Scanning** - Point camera at QR code to add product
4. **Authentication** - Sign up and log in
5. **Admin Dashboard** - Create and manage products
6. **Order Management** - Place orders and track status

## Performance Tips

- Database queries are indexed
- Frontend uses Next.js optimization
- API responses cached where appropriate
- Images lazy loaded
- CSS-in-JS with Tailwind CSS

## Security Notes

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Admin routes protected
- Stripe integration secure
- Input validation on all endpoints

## Getting Help

1. **API Issues**: Check `backend/API_DOCUMENTATION.md`
2. **Setup Issues**: Review `README.md`
3. **Deployment**: See `DEPLOYMENT.md`
4. **Backend**: See `backend/README.md`

## What You Can Do

With Shop-Edoo, you can:
- Sell products online
- Accept payments via Stripe
- Manage inventory
- Process QR code orders
- Track orders and customers
- Run a full e-commerce business

## Time to Production

- Development: Complete (5 phases done)
- Testing: Quick integration tests
- Deployment: 1 hour with this guide
- Go Live: Same day possible

---

**You're all set! Start the dev server and begin exploring Shop-Edoo.**

For questions or issues, see the full documentation in `README.md`
