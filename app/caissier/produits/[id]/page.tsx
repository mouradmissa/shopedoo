'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import type { ProductItem } from '@/components/products/ProductCard';

export default function CashierProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await apiClient.getProduct(id);
      if (response.success && response.data) {
        setProduct(response.data);
        setError('');
      } else {
        setError(response.error || 'Produit introuvable');
      }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 p-6 text-center text-muted-foreground">
        <p>{error || 'Produit introuvable'}</p>
      </div>
    );
  }

  return (
    <ProductDetailView
      product={product}
      backHref="/caissier/produits"
      backLabel="Retour au catalogue"
      variant="cashier"
    />
  );
}
