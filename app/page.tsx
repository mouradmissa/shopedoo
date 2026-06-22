'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { ShoppingCart, QrCode, LogOut, LogIn } from 'lucide-react';
import { CustomerGuard } from '@/components/guards/CustomerGuard';
import { formatPrice } from '@/lib/currency';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  qrCode: string;
}

export default function Home() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    const response = await apiClient.getProducts(category === 'all' ? undefined : category);
    if (response.success) {
      setProducts(response.data || []);
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
      alert('Please sign in to add items to cart');
      return;
    }

    const response = await apiClient.addToCart(productId, 1);
    if (response.success) {
      setCart(response.data);
      alert('Added to cart!');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const categories = ['all', 'electronics', 'accessories', 'services'];
  const cartCount = cart?.items?.length || 0;

  return (
    <CustomerGuard>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <ShopEdooLogo href="/" height={68} priority />

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/qr-scanner"
                  className="p-2 hover:bg-muted rounded-lg transition"
                  title="QR Scanner"
                >
                  <QrCode className="w-5 h-5" />
                </Link>
                <Link
                  href="/cart"
                  className="p-2 hover:bg-muted rounded-lg transition relative"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <div className="hidden sm:block border-l border-border pl-4">
                  <div className="text-sm">
                    <p className="font-medium">{user?.name}</p>
                    <button
                      onClick={logout}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Logout
                    </button>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="sm:hidden p-2 hover:bg-muted rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link href="/auth/signin" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance flex flex-wrap items-center justify-center gap-3">
            Welcome to <ShopEdooLogo height={72} imageClassName="md:h-16 w-auto" />
          </h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Explore premium telecom products and services with innovative QR code scanning technology
          </p>
        </div>

        {!isAuthenticated && (
          <div className="text-center mb-12">
            <Link href="/auth/signup" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        )}
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground hover:bg-muted'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {productsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="group bg-card rounded-xl overflow-hidden hover:shadow-lg transition duration-300 border border-border hover:border-primary/50"
              >
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
                      In Stock
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <p className="text-white font-semibold">Out of Stock</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(product._id)}
                      disabled={product.stock === 0 || !isAuthenticated}
                      className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                    <Link
                      href={`/products/${product._id}`}
                      className="flex-1 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition text-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
            <ShopEdooLogo height={36} />
            <p>&copy; 2024 shopedoo. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
    </CustomerGuard>
  );
}
