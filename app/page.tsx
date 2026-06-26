'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import {
  CreditCard,
  Loader2,
  MapPin,
  QrCode,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CustomerGuard } from '@/components/guards/CustomerGuard';
import { ShopNav } from '@/components/layout/ShopNav';
import { ShopFooter } from '@/components/layout/ShopFooter';
import { ProductCard } from '@/components/products/ProductCard';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '@/lib/productCategories';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

const CATEGORIES = [
  { id: 'all', label: CATEGORY_LABELS.all },
  ...PRODUCT_CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Catalogue complet',
    text: 'Forfaits, accessoires et services sélectionnés pour vous, mis à jour en temps réel.',
  },
  {
    icon: MapPin,
    title: 'Partout en Tunisie',
    text: 'Vérifiez la disponibilité par gouvernorat et récupérez en boutique près de chez vous.',
  },
  {
    icon: CreditCard,
    title: 'Payez comme vous voulez',
    text: 'Carte bancaire en ligne, espèces à la livraison ou règlement rapide à la caisse.',
  },
  {
    icon: QrCode,
    title: 'Scan QR instantané',
    text: 'Scannez un produit en magasin et ajoutez-le au panier en quelques secondes.',
  },
] as const;

const STATS = [
  { value: '24', label: 'Gouvernorats' },
  { value: '100+', label: 'Produits' },
  { value: '3', label: 'Modes de paiement' },
  { value: '24/7', label: 'Commande en ligne' },
] as const;

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
      <div className="min-h-screen shop-page-bg flex flex-col">
        <ShopNav cartCount={cartCount} />

        <section className="shop-hero">
          <div className="shop-hero-inner page-container py-10 sm:py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className="text-center lg:text-left">
                <span className="shop-badge mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Boutique officielle Shop-Edoo
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance leading-tight mb-4">
                  Shop-Edoo vous accompagne{' '}
                  <span className="text-primary">partout en Tunisie</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground text-balance max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                  Forfaits, smartphones et accessoires — commandez en ligne en toute sécurité ou
                  passez en boutique. Stock disponible dans les 24 gouvernorats.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="#catalogue" className="shop-cta-primary">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Découvrir le catalogue
                  </Link>
                  {!isAuthenticated ? (
                    <Link href="/auth/signup" className="shop-cta-secondary">
                      Créer mon compte gratuit
                    </Link>
                  ) : (
                    <Link href="/cart" className="shop-cta-secondary">
                      Voir mon panier
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-6">
                <ShopEdooLogo variant="hero" className="justify-center lg:justify-end" />
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="shop-stat-card">
                      <p className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-container py-10 sm:py-14">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="shop-section-title">Pourquoi choisir shopedoo ?</h2>
            <p className="shop-section-subtitle mx-auto">
              Une expérience d&apos;achat simple, rapide et pensée pour les clients tunisiens.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="shop-feature-card group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-container mb-6 sm:mb-8">
          <div className="shop-offer-banner">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-offer/30 items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-offer-foreground" />
              </div>
              <div>
                <p className="shop-offer-badge mb-2 w-fit mx-auto sm:mx-0">Offre</p>
                <p className="font-bold text-base sm:text-lg">Offre limitée — Ne ratez pas le stock</p>
                <p className="text-sm text-muted-foreground">
                  Les meilleures offres partent vite. Ajoutez au panier avant rupture.
                </p>
              </div>
            </div>
            <Link href="#catalogue" className="shop-cta-primary shrink-0 w-full sm:w-auto">
              Voir les offres
            </Link>
          </div>
        </section>

        <section id="catalogue" className="page-container mb-8 sm:mb-10 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="shop-section-title">Nos produits phares</h2>
              <p className="shop-section-subtitle">
                Parcourez le catalogue et filtrez par catégorie pour trouver votre prochain achat.
              </p>
            </div>
          </div>
          <div className="mobile-scroll-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`shop-category-pill ${
                  category === cat.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card text-foreground hover:bg-muted border border-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className="page-container pb-16 sm:pb-20 flex-1">
          {productsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
              <p className="text-muted-foreground">Aucun produit dans cette catégorie pour le moment.</p>
            </div>
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

        <ShopFooter />
      </div>
    </CustomerGuard>
  );
}
