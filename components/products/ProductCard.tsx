'use client';

import Link from 'next/link';
import { formatCategory } from '@/lib/productCategories';
import { formatPrice } from '@/lib/currency';

export interface ProductItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  qrCode?: string;
  qrCodeImage?: string;
}

interface ProductCardProps {
  product: ProductItem;
  detailHref: string;
  onAddToCart?: (productId: string) => void;
  canAddToCart?: boolean;
  showAddToCart?: boolean;
}

export function ProductCard({
  product,
  detailHref,
  onAddToCart,
  canAddToCart = true,
  showAddToCart = true,
}: ProductCardProps) {
  return (
    <div className="group bg-card rounded-xl overflow-hidden hover:shadow-lg transition duration-300 border border-border hover:border-primary/50 flex flex-col h-full">
      <Link href={detailHref} className="block">
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Pas d&apos;image</div>
          )}
          {product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-1 rounded-full max-w-[85%] truncate">
              En stock ({product.stock})
            </div>
          )}
          {product.stock === 0 && (
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
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description}</p>

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
              onClick={() => onAddToCart(product._id)}
              disabled={product.stock === 0 || !canAddToCart}
              className="flex-1 min-h-11 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
