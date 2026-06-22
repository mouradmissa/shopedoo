'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { formatCategory } from '@/lib/productCategories';
import { formatPrice } from '@/lib/currency';
import type { ProductItem } from './ProductCard';

interface ProductDetailViewProps {
  product: ProductItem;
  backHref: string;
  backLabel?: string;
  variant: 'customer' | 'cashier';
  onAddToCart?: () => void;
  canAddToCart?: boolean;
  isAdding?: boolean;
}

function stockInfo(stock: number) {
  if (stock <= 0) {
    return { label: 'Rupture de stock', className: 'bg-red-500/10 text-red-600 border-red-500/20' };
  }
  if (stock <= 5) {
    return {
      label: `Stock faible — ${stock} restant${stock > 1 ? 's' : ''}`,
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    };
  }
  return {
    label: `En stock — ${stock} disponible${stock > 1 ? 's' : ''}`,
    className: 'bg-green-500/10 text-green-700 border-green-500/20',
  };
}

export function ProductDetailView({
  product,
  backHref,
  backLabel = 'Retour',
  variant,
  onAddToCart,
  canAddToCart = true,
  isAdding = false,
}: ProductDetailViewProps) {
  const stock = stockInfo(product.stock);

  return (
    <div className="flex-1 p-4 sm:p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden border border-border relative flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-16 h-16 text-muted-foreground" />
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-semibold text-lg">Rupture de stock</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
              {formatCategory(product.category)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-3">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mt-4">{formatPrice(product.price)}</p>
          </div>

          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${stock.className}`}>
            {stock.label}
          </span>

          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {variant === 'customer' && onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={product.stock === 0 || !canAddToCart || isAdding}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ajout...
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
          )}

          {variant === 'cashier' && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Consultation caissier</p>
              <p>Cette page est en lecture seule. Informez le client de la disponibilité en magasin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
