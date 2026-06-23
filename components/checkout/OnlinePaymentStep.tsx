'use client';

import { useEffect, useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { getStripePromise, getStripePublishableKey, stripeAppearance } from '@/lib/stripeClient';
import { StripePaymentForm } from '@/components/checkout/StripePaymentForm';

interface OnlinePaymentStepProps {
  order: {
    _id: string;
    totalAmount: number;
    shippingAddress: string;
  };
  returnUrl: string;
  onSuccess: (order: { _id: string; status: string; totalAmount: number }) => void;
}

export function OnlinePaymentStep({ order, returnUrl, onSuccess }: OnlinePaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsBootstrapping(true);
      setError('');

      const key = await getStripePublishableKey();
      if (cancelled) return;

      if (!key) {
        setError('Paiement en ligne indisponible : configurez la clé Stripe (pk_test_...).');
        setIsBootstrapping(false);
        return;
      }

      setPublishableKey(key);

      const payment = await apiClient.createPaymentIntent(order._id);
      if (cancelled) return;

      if (!payment.success || !payment.data?.clientSecret) {
        const detail = payment.details ? `\n${payment.details}` : '';
        setError((payment.error || 'Impossible d’initialiser le paiement.') + detail);
        setIsBootstrapping(false);
        return;
      }

      setClientSecret(payment.data.clientSecret);
      setIsBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [order._id]);

  const stripePromise = useMemo(
    () => (publishableKey ? getStripePromise(publishableKey) : null),
    [publishableKey]
  );

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: stripeAppearance,
            locale: 'fr' as const,
          }
        : null,
    [clientSecret]
  );

  if (isBootstrapping) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="font-medium">Préparation du paiement sécurisé...</p>
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise || !elementsOptions) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 space-y-4">
        <p className="text-sm text-destructive whitespace-pre-wrap">{error || 'Impossible d’afficher le formulaire de paiement.'}</p>
        <p className="text-xs text-muted-foreground">
          Vérifiez que <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> et{' '}
          <code className="bg-muted px-1 rounded">STRIPE_PUBLISHABLE_KEY</code> sont configurés sur Render.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-semibold hover:bg-muted"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>Saisissez les informations de votre carte bancaire ci-dessous.</span>
        </div>

        <Elements stripe={stripePromise} options={elementsOptions}>
          <StripePaymentForm
            orderId={order._id}
            returnUrl={returnUrl}
            totalLabel={formatPrice(order.totalAmount)}
            onSuccess={onSuccess}
            onError={setError}
          />
        </Elements>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      <aside className="lg:col-span-2">
        <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4 lg:sticky lg:top-24">
          <h2 className="font-bold text-lg">Récapitulatif</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Référence</span>
              <span className="font-mono">#{order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Livraison</span>
              <span className="text-right max-w-[60%] break-words">{order.shippingAddress}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="font-semibold">Total à payer</span>
            <span className="text-xl font-bold text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
