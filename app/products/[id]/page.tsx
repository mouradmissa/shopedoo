'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { CustomerGuard } from '@/components/guards/CustomerGuard';
import { ShopNav } from '@/components/layout/ShopNav';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import type { ProductItem } from '@/components/products/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await apiClient.getProduct(id);
      if (response.success && response.data) {
        const data = response.data as ProductItem & {
          totalStock?: number;
          storeAvailability?: ProductItem['storeAvailability'];
        };
        setProduct({
          ...data,
          stock: data.totalStock ?? data.stock ?? 0,
          storeAvailability: data.storeAvailability,
        });
        setError('');
      } else {
        setError(response.error || 'Produit introuvable');
      }
      setLoading(false);
    };

    if (id) load();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getCart().then((response) => {
      if (response.success && response.data?.items) {
        setCartCount(response.data.items.length);
      }
    });
  }, [isAuthenticated]);

  const addToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?redirect=/products/${id}`);
      return;
    }

    setIsAdding(true);
    const response = await apiClient.addToCart(id, 1);
    setIsAdding(false);

    if (response.success) {
      setCartCount(response.data?.items?.length ?? cartCount + 1);
    }
  };

  return (
    <CustomerGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
        <ShopNav cartCount={cartCount} />

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error || !product ? (
          <div className="flex-1 page-container py-16 text-center">
            <p className="text-muted-foreground mb-6">{error || 'Produit introuvable'}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Retour à la boutique
            </button>
          </div>
        ) : (
          <ProductDetailView
            product={product}
            backHref="/"
            backLabel="Retour à la boutique"
            variant="customer"
            onAddToCart={addToCart}
            canAddToCart={(product.totalStock ?? product.stock) > 0}
            isAdding={isAdding}
          />
        )}
      </div>
    </CustomerGuard>
  );
}
