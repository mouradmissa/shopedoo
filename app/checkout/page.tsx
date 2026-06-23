'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

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
    description: 'Carte bancaire (commande en attente de paiement).',
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    fetchCart();
  }, [isAuthenticated, authLoading, router]);

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

    if (response.success && response.data) {
      setOrder(response.data as Order);
      return;
    }

    setError(response.error || 'Échec de la commande. Réessayez.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Panier vide</h1>
          <p className="text-muted-foreground mb-6">Ajoutez des produits avant de passer commande.</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
          >
            Continuer vos achats
          </Link>
        </div>
      </div>
    );
  }

  if (order) {
    const isCashRegister = order.paymentMethod === 'cash_register';

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-0 py-6 sm:py-10">
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <InvoiceBrandHeader
              orderRef={order._id.slice(-8).toUpperCase()}
              status={isCashRegister ? 'pending' : undefined}
            />

            <div className="p-5 sm:p-8 text-center">
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl sm:text-3xl font-bold mb-2">Commande confirmée</h1>
              <p className="text-muted-foreground text-sm sm:text-base mb-6">
                {isCashRegister
                  ? 'Présentez cette facture au caissier pour régler votre commande.'
                  : `Référence #${order._id.slice(-8).toUpperCase()}`}
              </p>

              <div className="rounded-xl bg-muted/50 border border-border p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Total</span>
                  <span className="font-bold text-primary text-right">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Paiement</span>
                  <span className="text-right">
                    {order.paymentMethod === 'cash_register'
                      ? 'À la caisse'
                      : order.paymentMethod === 'cash_delivery'
                        ? 'Espèces à la livraison'
                        : 'En ligne'}
                  </span>
                </div>
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

              {!isCashRegister && (
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
                {isCashRegister && (
                  <Link
                    href="/cart"
                    className="min-h-12 px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition flex items-center justify-center"
                  >
                    Voir le panier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-top">
        <div className="page-container h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/cart" className="flex items-center gap-2 hover:opacity-75 transition min-w-0">
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="font-semibold hidden sm:inline truncate">Retour au panier</span>
          </Link>
          <ShopEdooLogo
            href="/"
            height={32}
            className="sm:hidden shrink min-w-0"
            imageClassName="h-8 w-auto max-w-[110px]"
          />
          <ShopEdooLogo
            href="/"
            height={44}
            className="hidden sm:flex"
            imageClassName="h-11 w-auto"
          />
          <div className="w-10 sm:w-24" />
        </div>
      </div>

      <div className="page-container py-6 sm:py-8">
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
                ) : (
                  'Confirmer la commande'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
