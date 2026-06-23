'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { buildInvoiceQrString } from '@/lib/invoiceQr';
import { InvoiceQrImage } from '@/components/checkout/InvoiceQrImage';
import { InvoiceBrandHeader } from '@/components/checkout/InvoiceBrandHeader';
import { OnlinePaymentStep } from '@/components/checkout/OnlinePaymentStep';
import { PageTitleBar } from '@/components/layout/PageTitleBar';
import { clearLocalCart } from '@/lib/cartSync';

interface CartItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
}

interface Order {
  _id: string;
  invoiceQrCode?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  shippingAddress: string;
  createdAt?: string;
}

type PaymentMethod = 'cash_register' | 'cash_delivery' | 'online';
type CheckoutStep = 'form' | 'payment' | 'done';

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  title: string;
  description: string;
  icon: typeof Store;
}> = [
  {
    id: 'cash_register',
    title: 'Paiement à la caisse',
    description: 'Payez en magasin. Présentez le QR code au caissier.',
    icon: Store,
  },
  {
    id: 'cash_delivery',
    title: 'Espèces à la livraison',
    description: 'Payez en cash lors de la réception de votre commande.',
    icon: Banknote,
  },
  {
    id: 'online',
    title: 'Paiement en ligne',
    description: 'Carte bancaire sécurisée via Stripe.',
    icon: CreditCard,
  },
];

export default function CheckoutPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_register');
  const [shippingAddress, setShippingAddress] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    fetchCart();
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    const redirectStatus = params.get('redirect_status');
    const orderId = params.get('order_id');

    if (!paymentIntentId || redirectStatus !== 'succeeded' || !orderId) return;

    void (async () => {
      setIsLoading(true);
      const confirm = await apiClient.confirmPayment(orderId, paymentIntentId);
      setIsLoading(false);

      if (confirm.success && confirm.data) {
        const payload = confirm.data as { order?: Order };
        if (payload.order) {
          clearLocalCart();
          setOrder({ ...payload.order, paymentMethod: 'online', status: 'paid' });
          setCheckoutStep('done');
          window.history.replaceState({}, '', '/checkout');
          return;
        }
      }

      const orderResponse = await apiClient.getOrder(orderId);
      if (orderResponse.success && orderResponse.data) {
        clearLocalCart();
        setOrder({ ...(orderResponse.data as Order), paymentMethod: 'online', status: 'paid' });
        setCheckoutStep('done');
        window.history.replaceState({}, '', '/checkout');
        return;
      }

      setError(confirm.error || 'Échec de confirmation du paiement.');
    })();
  }, [authLoading, isAuthenticated]);

  const fetchCart = async () => {
    const response = await apiClient.getCart();
    if (response.success) {
      setCart(response.data as Cart);
    }
    setIsLoading(false);
  };

  const subtotal = useMemo(
    () => cart?.items.reduce((total, item) => total + item.productId.price * item.quantity, 0) ?? 0,
    [cart]
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const needsAddress = paymentMethod === 'cash_delivery' || paymentMethod === 'online';

  const paymentReturnUrl = useMemo(() => {
    if (typeof window === 'undefined' || !pendingOrder) return '';
    return `${window.location.origin}/checkout?order_id=${pendingOrder._id}`;
  }, [pendingOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cart || cart.items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }

    if (needsAddress && !shippingAddress.trim()) {
      setError("L'adresse de livraison est requise.");
      return;
    }

    setIsSubmitting(true);

    const address =
      paymentMethod === 'cash_register' ? 'Retrait en magasin' : shippingAddress.trim();

    const response = await apiClient.createOrder(address, paymentMethod);

    setIsSubmitting(false);

    if (!response.success || !response.data) {
      setError(response.error || 'Échec de la commande. Réessayez.');
      return;
    }

    const createdOrder = response.data as Order;

    if (paymentMethod === 'online') {
      setPendingOrder(createdOrder);
      setCheckoutStep('payment');
      return;
    }

    setOrder(createdOrder);
    setCheckoutStep('done');
    clearLocalCart();
  };

  const handlePaymentSuccess = (paidOrder: { _id: string; status: string; totalAmount: number }) => {
    clearLocalCart();
    setOrder({
      ...(pendingOrder ?? { shippingAddress: shippingAddress.trim(), paymentMethod: 'online' }),
      _id: paidOrder._id,
      status: paidOrder.status,
      totalAmount: paidOrder.totalAmount,
      paymentMethod: 'online',
    } as Order);
    setCheckoutStep('done');
    setPendingOrder(null);
  };

  const invoiceQrValue = useMemo(() => {
    if (!order?.invoiceQrCode || !user || !cart) return null;

    return buildInvoiceQrString(
      order,
      { name: user.name, email: user.email },
      cart.items.map((item) => ({
        name: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price,
      }))
    );
  }, [order, user, cart]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checkoutStep === 'payment' && pendingOrder) {
    return (
      <>
        <PageTitleBar title="Paiement carte" backHref="/" backLabel="Boutique" />
        <div className="page-container py-6 sm:py-8 flex-1">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Paiement en ligne</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Réglez votre commande par carte bancaire en toute sécurité.
            </p>
          </div>

          <OnlinePaymentStep
            order={pendingOrder}
            returnUrl={paymentReturnUrl}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </>
    );
  }

  if (checkoutStep === 'done' && order) {
    const isCashRegister = order.paymentMethod === 'cash_register';
    const isOnlinePaid = order.paymentMethod === 'online' && order.status === 'paid';

    return (
      <>
        <PageTitleBar title="Confirmation" backHref="/" backLabel="Boutique" />
        <div className="page-container py-6 sm:py-10 flex-1">
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <InvoiceBrandHeader
              orderRef={order._id.slice(-8).toUpperCase()}
              status={isCashRegister ? 'pending' : isOnlinePaid ? 'paid' : undefined}
            />

            <div className="p-5 sm:p-8 text-center">
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl sm:text-3xl font-bold mb-2">
                {isOnlinePaid ? 'Paiement réussi' : 'Commande confirmée'}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mb-6">
                {isCashRegister
                  ? 'Présentez cette facture au caissier pour régler votre commande.'
                  : isOnlinePaid
                    ? 'Votre paiement par carte a été accepté. Merci pour votre commande !'
                    : `Référence #${order._id.slice(-8).toUpperCase()}`}
              </p>

              <div className="rounded-xl bg-muted/50 border border-border p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Total</span>
                  <span className="font-bold text-primary text-right">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Paiement</span>
                  <span className="text-right">
                    {order.paymentMethod === 'cash_register'
                      ? 'À la caisse'
                      : order.paymentMethod === 'cash_delivery'
                        ? 'Espèces à la livraison'
                        : 'Carte bancaire'}
                  </span>
                </div>
                {isOnlinePaid && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-muted-foreground shrink-0">Statut</span>
                    <span className="text-green-700 font-medium text-right">Payé</span>
                  </div>
                )}
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Adresse</span>
                  <span className="text-right max-w-[65%] break-words">{order.shippingAddress}</span>
                </div>
              </div>

              {isCashRegister && invoiceQrValue && (
                <div className="mb-6">
                  <p className="font-semibold mb-3 text-sm sm:text-base">QR code à scanner en caisse</p>
                  <div className="flex justify-center mb-3">
                    <InvoiceQrImage value={invoiceQrValue} size={220} />
                  </div>
                  <p className="text-xs text-muted-foreground break-all px-1">{order.invoiceQrCode}</p>
                </div>
              )}

              {!isCashRegister && !isOnlinePaid && (
                <p className="text-sm text-muted-foreground mb-6">
                  Votre commande est enregistrée. Vous serez contacté pour la livraison.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  className="min-h-12 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center"
                >
                  Retour à la boutique
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <PageTitleBar title="Commande" backHref="/cart" backLabel="Panier" />
        <div className="flex items-center justify-center px-4 py-16 flex-1">
          <div className="text-center max-w-md">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Panier vide</h1>
            <p className="text-muted-foreground mb-6">
              Ajoutez des produits avant de passer commande.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Continuer vos achats
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitleBar
        title="Finaliser la commande"
        backHref="/cart"
        backLabel="Panier"
        icon={<CreditCard className="w-4 h-4 text-primary" />}
      />

      <div className="page-container py-6 sm:py-8 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <section className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Mode de paiement
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = paymentMethod === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.id}
                        checked={selected}
                        onChange={() => setPaymentMethod(option.id)}
                        className="mt-1"
                      />
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? 'text-primary' : ''}`} />
                      <div>
                        <p className="font-semibold">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {needsAddress && (
              <section className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Adresse de livraison
                </h2>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Rue, ville, gouvernorat, téléphone..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </section>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </p>
            )}
          </div>

          <div>
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="font-bold text-xl mb-4">Récapitulatif</h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId._id} className="flex justify-between text-sm gap-3">
                    <span className="text-muted-foreground">
                      {item.productId.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.productId.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-4 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA (10%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-green-600">Gratuite</span>
                </div>
              </div>

              <div className="flex justify-between py-4 border-t border-border mb-6">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl text-primary">{formatPrice(total)}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : paymentMethod === 'online' ? (
                  'Continuer vers le paiement'
                ) : (
                  'Confirmer la commande'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
