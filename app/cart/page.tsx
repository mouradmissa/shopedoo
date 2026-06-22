'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';

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
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setIsUpdating(true);
      const response = await apiClient.clearCart();
      if (response.success) {
        setCart(response.data);
      }
      setIsUpdating(false);
    }
  };

  const subtotal = cart?.items.reduce(
    (total, item) => total + item.productId.price * item.quantity,
    0
  ) || 0;

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back to Shopping</span>
          </Link>
          <h1 className="font-bold text-xl flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Cart
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
            <Link href="/" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.productId._id} className="bg-card rounded-lg border border-border p-4 flex gap-4 items-start">
                  {item.productId.image && (
                    <img
                      src={item.productId.image}
                      alt={item.productId.name}
                      className="w-24 h-24 object-cover rounded-lg bg-muted"
                    />
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.productId.name}</h3>
                    <p className="text-primary font-bold text-lg">{formatPrice(item.productId.price)}</p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                          disabled={isUpdating}
                          className="p-2 hover:bg-muted transition disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="p-2 hover:bg-muted transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId._id)}
                        disabled={isUpdating}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-bold text-lg">{formatPrice(item.productId.price * item.quantity)}</p>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                disabled={isUpdating}
                className="text-destructive text-sm font-semibold hover:underline disabled:opacity-50"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <h2 className="font-bold text-xl mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (10%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="text-green-600">Gratuite</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-2xl text-primary">{formatPrice(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full block py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-center hover:opacity-90 transition"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={() => router.push('/')}
                  className="w-full mt-3 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
