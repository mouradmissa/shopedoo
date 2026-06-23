import express, { Router, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getStripeCurrency, toStripeAmount } from '../constants/currency';
import { fulfillOnlineOrderPayment } from '../utils/orderPayment';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

function stripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

const router: Router = express.Router();

router.get('/config', (_req, res: Response): void => {
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    res.status(503).json({ error: 'Clé publique Stripe non configurée (pk_test_...)' });
    return;
  }

  res.json({
    publishableKey,
    currency: getStripeCurrency(),
  });
});

async function createOrReusePaymentIntent(
  stripe: Stripe,
  order: InstanceType<typeof Order>,
  orderId: string,
  userId: string
) {
  if (order.stripePaymentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.stripePaymentId);
      const reusable = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
      if (reusable.includes(existing.status) && existing.client_secret) {
        return existing;
      }
    } catch {
      // intent invalide — on en crée un nouveau
    }
  }

  const amount = toStripeAmount(order.totalAmount);
  const currency = getStripeCurrency();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ['card'],
    metadata: {
      orderId,
      userId,
      displayAmountTnd: String(order.totalAmount),
    },
  });

  order.stripePaymentId = paymentIntent.id;
  await order.save();

  return paymentIntent;
}

router.post(
  '/create-payment-intent',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(503).json({
          error: 'Stripe non configuré',
          details: 'Ajoutez STRIPE_SECRET_KEY sur le serveur API.',
        });
        return;
      }

      const { orderId } = req.body as { orderId?: string };

      if (!orderId) {
        res.status(400).json({ error: 'Identifiant de commande requis' });
        return;
      }

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({ error: 'Commande introuvable' });
        return;
      }

      if (order.userId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'Non autorisé' });
        return;
      }

      if (order.paymentMethod !== 'online') {
        res.status(400).json({ error: 'Cette commande ne requiert pas de paiement en ligne' });
        return;
      }

      if (order.status === 'paid') {
        res.status(400).json({ error: 'Commande déjà payée' });
        return;
      }

      const paymentIntent = await createOrReusePaymentIntent(
        stripe,
        order,
        orderId,
        req.user?.userId ?? ''
      );

      if (!paymentIntent.client_secret) {
        res.status(500).json({ error: 'Secret de paiement Stripe manquant' });
        return;
      }

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency: getStripeCurrency(),
      });
    } catch (error) {
      const details = stripeErrorMessage(error);
      console.error('create-payment-intent:', details);
      res.status(500).json({
        error: 'Impossible de créer le paiement',
        details,
      });
    }
  }
);

router.post(
  '/confirm-payment',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(503).json({ error: 'Stripe non configuré' });
        return;
      }

      const { orderId, paymentIntentId } = req.body as {
        orderId?: string;
        paymentIntentId?: string;
      };

      if (!orderId || !paymentIntentId) {
        res.status(400).json({ error: 'Champs requis manquants' });
        return;
      }

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({ error: 'Commande introuvable' });
        return;
      }

      if (order.userId.toString() !== req.user?.userId) {
        res.status(403).json({ error: 'Non autorisé' });
        return;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.metadata?.orderId !== orderId) {
        res.status(400).json({ error: 'Paiement invalide pour cette commande' });
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const updatedOrder = await fulfillOnlineOrderPayment(orderId, paymentIntentId);

        res.json({
          success: true,
          message: 'Paiement réussi',
          order: updatedOrder,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Paiement non finalisé',
        status: paymentIntent.status,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Échec de confirmation du paiement',
        details: stripeErrorMessage(error),
      });
    }
  }
);

export async function handleStripeWebhook(
  req: express.Request,
  res: Response
): Promise<void> {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).send('Stripe webhook is not configured');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await fulfillOnlineOrderPayment(orderId, paymentIntent.id);
        console.log(`Paiement confirmé pour la commande: ${orderId}`);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        console.log(`Paiement échoué pour la commande: ${orderId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).send(`Webhook Error: ${message}`);
  }
}

export default router;
