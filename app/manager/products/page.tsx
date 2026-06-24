'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from '@/lib/productCategories';
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
}

export default function ManagerProductsPage() {
  const [storeId, setStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
    image: '',
  });

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const id = (storeRes.data as { _id: string })._id;
        setStoreId(id);
        const productsRes = await apiClient.getProducts(undefined, undefined, id);
        if (productsRes.success) setProducts(productsRes.data || []);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiClient.createProduct({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock, 10) || 0,
      image: formData.image,
      storeId,
    });

    if (response.success && response.data) {
      setProducts([response.data, ...products]);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: PRODUCT_CATEGORIES[0],
        stock: '',
        image: '',
      });
      setShowForm(false);
    } else {
      alert(response.error || 'Erreur création produit');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    const response = await apiClient.deleteProduct(id);
    if (response.success) {
      setProducts(products.filter((p) => p._id !== id));
    }
  };

  const viewQr = async (id: string) => {
    const response = await apiClient.getProduct(id);
    if (response.success && response.data) setQrProduct(response.data);
  };

  if (loading) return <div className="p-8" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
        <h1 className="text-2xl font-bold">Produits de la boutique</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nouveau
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Nom du produit"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              step="0.001"
              placeholder="Prix (DT)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
            <input
              required
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
          </div>
          <textarea
            required
            rows={3}
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background resize-none"
          />
          <input
            placeholder="URL image (optionnel)"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
              Enregistrer
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border rounded-lg">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
            {product.image ? (
              <img src={product.image} alt="" className="w-20 h-20 rounded-lg object-cover bg-muted shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <p className="font-bold text-primary mt-1">{formatPrice(product.price)}</p>
              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => viewQr(product._id)}
                  className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted"
                >
                  Voir QR
                </button>
                <button
                  type="button"
                  onClick={() => deleteProduct(product._id)}
                  className="text-xs px-3 py-1.5 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && <div className="py-12" />}

      {qrProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full relative">
            <button type="button" onClick={() => setQrProduct(null)} className="absolute top-4 right-4">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold mb-4">QR — {qrProduct.name}</h3>
            <ProductQrDisplay
              qrCode={qrProduct.qrCode}
              qrCodeImage={qrProduct.qrCodeImage}
              qrCodePayload={qrProduct.qrCodePayload}
              productName={qrProduct.name}
              productId={qrProduct._id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
