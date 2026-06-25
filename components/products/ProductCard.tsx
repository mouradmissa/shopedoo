'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { formatCategory } from '@/lib/productCategories';
import { formatPrice } from '@/lib/currency';
import { resolveProductImageUrl } from '@/lib/productImage';
import { OnlineStockBadge } from '@/components/products/OnlineStockBadge';

export interface StoreAvailability {
  storeId: string;
  storeName: string;
  city: string;
  governorate: string;
  stock: number;
  productId: string;
  price: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  onlineStock?: number;
  storeStock?: number;
  totalStock?: number;
  image?: string;
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
  storeAvailability?: StoreAvailability[];
}

interface ProductCardProps {
  product: ProductItem;
  detailHref: string;
  onAddToCart?: (productId: string) => void;
  canAddToCart?: boolean;
  showAddToCart?: boolean;
}

function pickProductIdForCart(product: ProductItem): string {
  const inStock = product.storeAvailability?.find((row) => row.stock > 0);
  return inStock?.productId ?? product._id;
}

export function ProductCard({
  product,
  detailHref,
  onAddToCart,
  canAddToCart = true,
  showAddToCart = true,
}: ProductCardProps) {
  const [showAvailability, setShowAvailability] = useState(false);
  const displayStock = product.totalStock ?? product.stock;
  const onlineStock = product.onlineStock ?? 0;
  const availableStores =
    product.storeAvailability?.filter((row) => row.stock > 0) ?? [];
  const imageSrc = resolveProductImageUrl(product.image, product._id);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition duration-300 border border-border hover:border-primary/40 flex flex-col h-full">
      <Link href={detailHref} className="block">
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Pas d&apos;image</div>
          )}
          {displayStock > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-1 rounded-full">
              En stock
            </div>
          )}
          {displayStock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2">
              <p className="text-white font-semibold text-sm text-center">Rupture de stock</p>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link href={detailHref}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{product.description}</p>

        <OnlineStockBadge onlineStock={onlineStock} className="mb-2" />

        {availableStores.length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowAvailability((open) => !open)}
              className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-primary px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition"
            >
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {showAvailability ? 'Masquer la disponibilité' : 'Voir disponibilité par gouvernorat'}
              </span>
              {showAvailability ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>
            {showAvailability && (
              <ul className="mt-2 text-[10px] sm:text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto rounded-lg border border-border p-2 bg-muted/30">
                {availableStores.map((row) => (
                  <li key={row.storeId} className="flex justify-between gap-2">
                    <span className="truncate">
                      {row.city} ({row.governorate})
                    </span>
                    <span className="shrink-0 text-green-600 font-medium">{row.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-base sm:text-lg font-bold text-primary truncate">
            {formatPrice(product.price)}
          </span>
          <span className="text-[10px] sm:text-xs bg-secondary/10 text-secondary px-2 py-1 rounded shrink-0">
            {formatCategory(product.category)}
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          {showAddToCart && onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(pickProductIdForCart(product))}
              disabled={displayStock === 0 || !canAddToCart}
              className="flex-1 min-h-11 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 hover:shadow-md hover:shadow-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Panier
            </button>
          )}
          <Link
            href={detailHref}
            className={`min-h-11 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted transition text-center flex items-center justify-center ${
              showAddToCart && onAddToCart ? 'flex-1' : 'w-full'
            }`}
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
}
