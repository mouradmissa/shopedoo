'use client';

import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { formatCategory } from '@/lib/productCategories';
import { ProductQrDisplay } from '@/components/products/ProductQrDisplay';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
  storeId?: { name: string; city: string; governorate: string } | string;
}

function storeLabel(storeId: Product['storeId']) {
  if (!storeId || typeof storeId === 'string') return 'Sans boutique';
  return `${storeId.name} — ${storeId.city}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await apiClient.getProducts();
    if (response.success) setProducts(response.data || []);
    setIsLoading(false);
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    const response = await apiClient.deleteProduct(productId);
    if (response.success) {
      setProducts(products.filter((p) => p._id !== productId));
    }
  };

  const viewQrCode = async (productId: string) => {
    setQrLoading(true);
    const response = await apiClient.getProduct(productId);
    setQrLoading(false);
    if (response.success && response.data) setQrProduct(response.data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue globale du catalogue. Les gérants ajoutent les produits depuis leur espace.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Chargement...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Aucun produit pour le moment.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Créez une boutique et connectez-vous en tant que gérant pour ajouter des produits.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto bg-card border border-border rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Boutique</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Catégorie</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Prix</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">{storeLabel(product.storeId)}</td>
                    <td className="py-3 px-4 text-sm">{formatCategory(product.category)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-primary">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 0
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {product.qrCode && (
                          <button
                            type="button"
                            onClick={() => viewQrCode(product._id)}
                            className="text-xs text-primary hover:underline"
                          >
                            QR
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteProduct(product._id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <article key={product._id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex gap-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{storeLabel(product.storeId)}</p>
                    <p className="text-sm font-bold text-primary mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Stock: {product.stock} · {formatCategory(product.category)}
                  </span>
                  <div className="flex gap-2">
                    {product.qrCode && (
                      <button
                        type="button"
                        onClick={() => viewQrCode(product._id)}
                        className="text-xs px-2 py-1 border border-border rounded-lg"
                      >
                        QR
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteProduct(product._id)}
                      className="text-xs px-2 py-1 border border-destructive/30 text-destructive rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {(qrProduct || qrLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !qrLoading && setQrProduct(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold truncate pr-2">{qrProduct?.name || 'QR produit'}</h3>
              <button type="button" onClick={() => setQrProduct(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {qrLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : qrProduct ? (
              <ProductQrDisplay
                qrCode={qrProduct.qrCode}
                qrCodeImage={qrProduct.qrCodeImage}
                qrCodePayload={qrProduct.qrCodePayload}
                productName={qrProduct.name}
                productId={qrProduct._id}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
