import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { apiClient } from '@/lib/api';

let cachedStripePromise: Promise<Stripe | null> | null = null;
let cachedPublishableKey: string | null = null;

export async function getStripePublishableKey(): Promise<string | null> {
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (envKey) return envKey;

  const config = await apiClient.getPaymentConfig();
  if (config.success && config.data?.publishableKey) {
    return config.data.publishableKey;
  }

  return null;
}

export function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  if (cachedPublishableKey !== publishableKey) {
    cachedPublishableKey = publishableKey;
    cachedStripePromise = loadStripe(publishableKey);
  }
  return cachedStripePromise!;
}

export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#ff3131',
    colorBackground: '#ffffff',
    colorText: '#0f0f0f',
    colorDanger: '#ff3131',
    borderRadius: '10px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e8e8e8',
      boxShadow: 'none',
      padding: '12px',
    },
    '.Label': {
      fontWeight: '600',
      marginBottom: '8px',
    },
  },
};
