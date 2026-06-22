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
    <div className="group bg-card rounded-xl overflow-hidden hover:shadow-lg transition duration-300 border border-border hover:border-primary/50">
      <Link href={detailHref} className="block">
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          ) : (
            <div className="text-muted-foreground">No image</div>
          )}
          {product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              En stock ({product.stock})
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-semibold">Rupture de stock</p>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={detailHref}>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
            {formatCategory(product.category)}
          </span>
        </div>

        <div className="flex gap-2">
          {showAddToCart && onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(product._id)}
              disabled={product.stock === 0 || !canAddToCart}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          )}
          <Link
            href={detailHref}
            className={`py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition text-center ${
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
