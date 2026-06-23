import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mongodb';
import { seedTunisiaStores } from './services/seedTunisiaStores';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import storeRoutes from './routes/stores';
import paymentRoutes, { handleStripeWebhook } from './routes/payment';

dotenv.config({ path: 'backend/.env' });

const app: Express = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    void handleStripeWebhook(req, res).catch(next);
  }
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

async function startServer() {
  await connectDB();

  if (process.env.SEED_TUNISIA_ON_START !== 'false') {
    try {
      const result = await seedTunisiaStores();
      console.log(
        `Seed Tunisie: ${result.storesCreated} boutique(s), ${result.cashiersCreated} caissier(s), ${result.productsCreated} produit(s) créés`
      );
    } catch (error) {
      console.error('Seed Tunisie échoué:', error);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });
}

void startServer();

export default app;
