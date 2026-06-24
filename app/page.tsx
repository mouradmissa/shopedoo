'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { CustomerGuard } from '@/components/guards/CustomerGuard';
import { ShopNav } from '@/components/layout/ShopNav';
import { ProductCard } from '@/components/products/ProductCard';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '@/lib/productCategories';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

const CATEGORIES = [
  { id: 'all', label: CATEGORY_LABELS.all },
  ...PRODUCT_CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    const response = await apiClient.getProductCatalog(category === 'all' ? undefined : category);
    if (response.success) {
      const items = (response.data || []).map((item: any) => ({
        ...item,
        stock: item.totalStock ?? item.stock ?? 0,
      }));
      setProducts(items);
    }
    setProductsLoading(false);
  };

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    const response = await apiClient.getCart();
    if (response.success) {
      setCart(response.data);
    }
  };

  const addToCart = async (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    const response = await apiClient.addToCart(productId, 1);
    if (response.success) {
      setCart(response.data);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const cartCount = cart?.items?.length || 0;

  return (
    <CustomerGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
        <ShopNav cartCount={cartCount} />

        <section className="page-container py-6 sm:py-12 md:py-16">
          <div className="text-center mb-6 sm:mb-12">
            <ShopEdooLogo variant="hero" className="justify-center mx-auto" />
          </div>

          {!isAuthenticated && (
            <div className="text-center mb-8 sm:mb-12">
              <Link
                href="/auth/signup"
                className="inline-block px-6 sm:px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition min-h-11"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </section>

        <section className="page-container mb-8 sm:mb-12">
          <div className="mobile-scroll-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition min-h-11 ${
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

        <section className="page-container pb-16 sm:pb-20">
          {productsLoading ? (
            <div className="py-12" />
          ) : products.length === 0 ? (
            <div className="py-12" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  detailHref={`/products/${product._id}`}
                  onAddToCart={addToCart}
                  canAddToCart={isAuthenticated}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="bg-card border-t border-border mt-12 sm:mt-20 safe-bottom">
          <div className="page-container py-8 sm:py-12">
            <div className="flex flex-col items-center gap-3">
              <ShopEdooLogo variant="footer" />
            </div>
          </div>
        </footer>
      </div>
    </CustomerGuard>
  );
}
