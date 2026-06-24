'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, MapPin, Package, ShoppingCart } from 'lucide-react';
import { formatCategory } from '@/lib/productCategories';
import { formatPrice } from '@/lib/currency';
import { ProductQrDisplay } from '@/components/products/ProductQrDisplay';
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
  const [showAvailability, setShowAvailability] = useState(false);
  const totalStock = product.totalStock ?? product.stock;
  const stock = stockInfo(totalStock);
  const showCustomerCta = variant === 'customer' && onAddToCart;
  const storeRows = product.storeAvailability ?? [];

  return (
    <div className={`flex-1 page-container py-4 sm:py-6 ${showCustomerCta ? 'pb-28 sm:pb-6' : ''}`}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span className="truncate">{backLabel}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="w-full max-h-[min(70vh,420px)] sm:max-h-none sm:aspect-square bg-muted rounded-2xl overflow-hidden border border-border relative flex items-center justify-center mx-auto lg:mx-0">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover max-h-[min(70vh,420px)] sm:max-h-none"
            />
          ) : (
            <Package className="w-16 h-16 text-muted-foreground" />
          )}
          {product.stock === 0 && totalStock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-semibold text-base sm:text-lg px-4 text-center">
                Rupture de stock
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-5 min-w-0">
          <div>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
              {formatCategory(product.category)}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-3 break-words">
              {product.name}
            </h1>
            <p className="text-2xl sm:text-3xl font-bold text-primary mt-3">
              {formatPrice(product.price)}
            </p>
          </div>

          <span
            className={`inline-block px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border ${stock.className}`}
          >
            {stock.label}
          </span>

          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base break-words">
              {product.description}
            </p>
          </div>

          {storeRows.length > 0 && variant === 'customer' && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAvailability((open) => !open)}
                className="w-full flex items-center justify-between gap-2 p-4 text-left font-semibold text-sm sm:text-base hover:bg-muted/40 transition"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Disponibilité par boutique (Tunisie)
                </span>
                {showAvailability ? (
                  <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
                )}
              </button>
              {showAvailability && (
                <ul className="divide-y divide-border border-t border-border px-4">
                  {storeRows.map((row) => (
                    <li key={row.storeId} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{row.storeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.city} — {row.governorate}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                          row.stock > 0
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {row.stock > 0 ? `${row.stock} en stock` : 'Rupture'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(product.qrCode || product.qrCodeImage) && (
            <ProductQrDisplay
              qrCode={product.qrCode}
              qrCodeImage={product.qrCodeImage}
              qrCodePayload={product.qrCodePayload}
              productName={product.name}
              productId={product._id}
            />
          )}

          {showCustomerCta && (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={totalStock === 0 || !canAddToCart || isAdding}
              className="hidden sm:flex w-full sm:w-auto min-h-11 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </>
              )}
            </button>
          )}

          {variant === 'cashier' && null}
        </div>
      </div>

      {showCustomerCta && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-background/95 backdrop-blur border-t border-border p-4 safe-bottom">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={product.stock === 0 || !canAddToCart || isAdding}
            className="w-full min-h-12 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier — {formatPrice(product.price)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
