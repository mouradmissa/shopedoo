'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Loader2, Search } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '@/lib/productCategories';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

const CATEGORIES = [
  { id: 'all', label: CATEGORY_LABELS.all },
  ...PRODUCT_CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

export function CashierProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await apiClient.getProducts(
        category === 'all' ? undefined : category,
        search.trim() || undefined
      );
      if (response.success) {
        setProducts(response.data || []);
      }
      setLoading(false);
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [category, search]);

  const inStock = products.filter((p) => p.stock > 0).length;
  const outOfStock = products.length - inStock;

  return (
    <div className="flex-1 flex flex-col">
      <section className="shrink-0 p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Catalogue & disponibilité</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} produit{products.length !== 1 ? 's' : ''}
            {products.length > 0 && (
              <span>
                {' '}
                · {inStock} disponible{inStock !== 1 ? 's' : ''}
                {outOfStock > 0 && ` · ${outOfStock} en rupture`}
              </span>
            )}
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition ${
                category === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground hover:bg-muted border border-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex-1 px-4 sm:px-6 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Aucun produit trouvé.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                detailHref={`/caissier/produits/${product._id}`}
                showAddToCart={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
