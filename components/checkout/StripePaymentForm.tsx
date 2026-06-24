'use client';

import { FormEvent, useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface StripePaymentFormProps {
  orderId: string;
  returnUrl: string;
  totalLabel: string;
  onSuccess: (order: { _id: string; status: string; totalAmount: number }) => void;
  onError: (message: string) => void;
}

export function StripePaymentForm({
  orderId,
  returnUrl,
  totalLabel,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError('');

    if (!stripe || !elements) {
      onError('Le formulaire de paiement n’est pas encore prêt. Patientez quelques secondes.');
      return;
    }

    setIsPaying(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setIsPaying(false);
      onError(submitError.message || 'Vérifiez les informations de votre carte.');
      return;
    }

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
      onError('Le paiement n’a pas pu être finalisé. Réessayez.');
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-background p-4 min-h-[220px]">
        {!isReady && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div className={isReady ? 'block' : 'sr-only'}>
          <PaymentElement
            onReady={() => setIsReady(true)}
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              wallets: {
                applePay: 'never',
                googlePay: 'never',
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span>Paiement chiffré et sécurisé par Stripe. Vos données bancaires ne sont pas stockées.</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || !isReady || isPaying}
        className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Paiement en cours...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Payer {totalLabel}
          </>
        )}
      </button>
    </form>
  );
}
