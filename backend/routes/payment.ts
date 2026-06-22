import express, { Router, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CURRENCY_CODE, toStripeAmount } from '../constants/currency';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

const router: Router = express.Router();

interface PaymentIntentRequest {
  orderId: string;
}

// Create payment intent for an order
router.post(
  '/create-payment-intent',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
      }

      const { orderId } = req.body as PaymentIntentRequest;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check if user owns this order
      if (order.userId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: toStripeAmount(order.totalAmount),
        currency: CURRENCY_CODE.toLowerCase(),
        metadata: {
          orderId: orderId,
          userId: req.user?.userId,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment intent', details: String(error) });
    }
  }
);

// Confirm payment
router.post(
  '/confirm-payment',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(503).json({ error: 'Stripe is not configured' });
        return;
      }

      const { orderId, paymentIntentId } = req.body;

      if (!orderId || !paymentIntentId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Verify payment intent status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update order status
        order.status = 'paid';
        order.stripePaymentId = paymentIntentId;
        await order.save();

        res.json({
          success: true,
          message: 'Payment successful',
          order,
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Payment not completed',
          status: paymentIntent.status,
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to confirm payment', details: String(error) });
    }
  }
);

// Webhook for payment events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: express.Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).send('Stripe webhook is not configured');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        const order = await Order.findByIdAndUpdate(
          orderId,
          {
            status: 'paid',
            stripePaymentId: paymentIntent.id,
          },
          { new: true }
        );

        console.log(`Payment confirmed for order: ${orderId}`, order);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        console.log(`Payment failed for order: ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed', details: String(error) });
  }
});

export default router;
