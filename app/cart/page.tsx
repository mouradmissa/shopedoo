'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';
import { PageHeader } from '@/components/layout/PageHeader';

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

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    fetchCart();
  }, [isAuthenticated, router]);

  const fetchCart = async () => {
    const response = await apiClient.getCart();
    if (response.success) {
      setCart(response.data);
    }
    setIsLoading(false);
  };

  const removeFromCart = async (productId: string) => {
    setIsUpdating(true);
    const response = await apiClient.removeFromCart(productId);
    if (response.success) {
      setCart(response.data);
    }
    setIsUpdating(false);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setIsUpdating(true);
    const response = await apiClient.updateCartItem(productId, quantity);
    if (response.success) {
      setCart(response.data);
    }
    setIsUpdating(false);
  };

  const clearCart = async () => {
    if (window.confirm('Vider le panier ?')) {
      setIsUpdating(true);
      const response = await apiClient.clearCart();
      if (response.success) {
        setCart(response.data);
      }
      setIsUpdating(false);
    }
  };

  const subtotal =
    cart?.items.reduce((total, item) => total + item.productId.price * item.quantity, 0) || 0;

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <p className="text-muted-foreground">Chargement du panier...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <PageHeader
        title="Panier"
        backHref="/"
        backLabel="Boutique"
        icon={<ShoppingCart className="w-5 h-5 shrink-0" />}
      />

      <div className="page-container py-6 sm:py-8">
        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Votre panier est vide</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Ajoutez des produits pour commencer
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition min-h-11"
            >
              Continuer vos achats
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.productId._id}
                  className="bg-card rounded-xl border border-border p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start"
                >
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    {item.productId.image && (
                      <img
                        src={item.productId.image}
                        alt={item.productId.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-muted shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{item.productId.name}</h3>
                      <p className="text-primary font-bold text-base sm:text-lg">
                        {formatPrice(item.productId.price)}
                      </p>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                            disabled={isUpdating}
                            className="touch-target hover:bg-muted transition disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 sm:px-4 py-2 font-medium min-w-10 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="touch-target hover:bg-muted transition disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId._id)}
                          disabled={isUpdating}
                          className="touch-target hover:bg-destructive/10 text-destructive rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 border-border pt-2 sm:pt-0 flex sm:block justify-between items-center">
                    <p className="text-sm text-muted-foreground sm:hidden">Sous-total</p>
                    <div>
                      <p className="text-sm text-muted-foreground hidden sm:block">Sous-total</p>
                      <p className="font-bold text-lg">{formatPrice(item.productId.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={clearCart}
                disabled={isUpdating}
                className="text-destructive text-sm font-semibold hover:underline disabled:opacity-50"
              >
                Vider le panier
              </button>
            </div>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <h2 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6">Récapitulatif</h2>

                <div className="space-y-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border text-sm">
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

                <div className="flex justify-between mb-5 sm:mb-6">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl sm:text-2xl text-primary">{formatPrice(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full block py-3 min-h-12 bg-primary text-primary-foreground rounded-lg font-semibold text-center hover:opacity-90 transition"
                >
                  Passer commande
                </Link>

                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full mt-3 py-3 min-h-11 border border-border rounded-lg font-semibold hover:bg-muted transition"
                >
                  Continuer vos achats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
