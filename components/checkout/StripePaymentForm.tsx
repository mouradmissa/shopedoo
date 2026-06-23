'use client';

import { FormEvent, useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface StripePaymentFormProps {
  orderId: string;
  returnUrl: string;
  onSuccess: (order: { _id: string; status: string; totalAmount: number }) => void;
  onError: (message: string) => void;
}

export function StripePaymentForm({
  orderId,
  returnUrl,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe n’est pas encore prêt. Réessayez dans un instant.');
      return;
    }

    setIsPaying(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (result.error) {
      setIsPaying(false);
      onError(result.error.message || 'Le paiement a échoué.');
      return;
    }

    const paymentIntent = result.paymentIntent;
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      setIsPaying(false);
      onError('Le paiement n’a pas pu être finalisé.');
      return;
    }

    const confirm = await apiClient.confirmPayment(orderId, paymentIntent.id);
    setIsPaying(false);

    if (confirm.success && confirm.data) {
      const payload = confirm.data as { order?: { _id: string; status: string; totalAmount: number } };
      if (payload.order) {
        onSuccess(payload.order);
        return;
      }
    }

    onError(confirm.error || 'Échec de confirmation du paiement.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || isPaying}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Paiement en cours...
          </>
        ) : (
          'Payer par carte bancaire'
        )}
      </button>
    </form>
  );
}
