'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from '@/lib/productCategories';
import { ProductImageUpload } from '@/components/products/ProductImageUpload';
import { resolveCatalogImageUrl, resolveProductImageUrl } from '@/lib/productImage';

interface CatalogItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  image?: string;
  isActive?: boolean;
}

export default function OnlineManagerProductsPage() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
  });

  const load = async () => {
    setLoading(true);
    const response = await apiClient.getCatalogProducts();
    if (response.success) setProducts(response.data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiClient.createCatalogProduct(
      {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10) || 0,
      },
      imageFile
    );

    if (response.success && response.data) {
      setProducts([response.data, ...products]);
      setFormData({ name: '', description: '', price: '', category: PRODUCT_CATEGORIES[0], stock: '' });
      setImageFile(null);
      setShowForm(false);
    } else {
      alert(response.error || 'Erreur création produit');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit du catalogue en ligne ?')) return;
    const response = await apiClient.deleteCatalogProduct(id);
    if (response.success) {
      setProducts(products.filter((p) => p._id !== id));
    }
  };

  if (loading) return <div className="p-8" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catalogue en ligne</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Les gérants de boutique peuvent lier ces produits et ajouter leur stock physique.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nouveau produit
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
              placeholder="Stock en ligne"
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
          <ProductImageUpload value={imageFile} onChange={setImageFile} />
          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
              Publier en ligne
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border rounded-lg">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const imageSrc =
            resolveProductImageUrl(product.image, product._id) || resolveCatalogImageUrl(product._id);
          return (
            <div key={product._id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
              {imageSrc ? (
                <img src={imageSrc} alt="" className="w-20 h-20 rounded-lg object-cover bg-muted shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <p className="font-bold text-primary mt-1">{formatPrice(product.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[product.category] || product.category} · Stock: {product.stock ?? 0}
                </p>
                <button
                  type="button"
                  onClick={() => deleteProduct(product._id)}
                  className="mt-3 text-xs px-3 py-1.5 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun produit en ligne.</p>}
    </div>
  );
}
