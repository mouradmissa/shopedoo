'use client';

import { useEffect, useState } from 'react';
import { Link2, Plus, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from '@/lib/productCategories';
import { ProductQrDisplay } from '@/components/products/ProductQrDisplay';
import { ProductImageUpload } from '@/components/products/ProductImageUpload';
import { resolveProductImageUrl } from '@/lib/productImage';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  catalogProductId?: string;
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
}

interface CatalogOption {
  _id: string;
  name: string;
  price: number;
  category: string;
}

type AddMode = 'link' | 'new';

export default function ManagerProductsPage() {
  const [storeId, setStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('link');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkForm, setLinkForm] = useState({ catalogProductId: '', stock: '', price: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
  });

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const id = (storeRes.data as { _id: string })._id;
        setStoreId(id);
        const [productsRes, catalogRes] = await Promise.all([
          apiClient.getProducts(undefined, undefined, id),
          apiClient.getCatalogProducts(),
        ]);
        if (productsRes.success) setProducts(productsRes.data || []);
        if (catalogRes.success) setCatalogOptions(catalogRes.data || []);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleLinkCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.catalogProductId) {
      alert('Sélectionnez un produit en ligne');
      return;
    }

    const selected = catalogOptions.find((c) => c._id === linkForm.catalogProductId);
    const response = await apiClient.createProduct({
      catalogProductId: linkForm.catalogProductId,
      name: selected?.name || '',
      description: '',
      price: linkForm.price ? parseFloat(linkForm.price) : selected?.price || 0,
      category: selected?.category || PRODUCT_CATEGORIES[0],
      stock: parseInt(linkForm.stock, 10) || 0,
      storeId,
    });

    if (response.success && response.data) {
      const existing = products.find((p) => p._id === (response.data as Product)._id);
      if (existing) {
        setProducts(products.map((p) => (p._id === existing._id ? response.data : p)));
      } else {
        setProducts([response.data, ...products]);
      }
      setLinkForm({ catalogProductId: '', stock: '', price: '' });
      setShowForm(false);
    } else {
      alert(response.error || 'Erreur ajout stock');
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiClient.createProduct(
      {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10) || 0,
        storeId,
      },
      imageFile
    );

    if (response.success && response.data) {
      setProducts([response.data, ...products]);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: PRODUCT_CATEGORIES[0],
        stock: '',
      });
      setImageFile(null);
      setShowForm(false);
      const catalogRes = await apiClient.getCatalogProducts();
      if (catalogRes.success) setCatalogOptions(catalogRes.data || []);
    } else {
      alert(response.error || 'Erreur création produit');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit de votre boutique ?')) return;
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
          <p className="text-sm text-muted-foreground mt-1">
            Liez un produit du catalogue en ligne ou créez un nouveau produit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
                addMode === 'link'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Produit existant en ligne
            </button>
            <button
              type="button"
              onClick={() => setAddMode('new')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
                addMode === 'new'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nouveau produit
            </button>
          </div>

          {addMode === 'link' ? (
            <form onSubmit={handleLinkCatalog} className="space-y-4">
              <select
                required
                value={linkForm.catalogProductId}
                onChange={(e) => setLinkForm({ ...linkForm, catalogProductId: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              >
                <option value="">Choisir un produit du catalogue en ligne</option>
                {catalogOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {formatPrice(item.price)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="number"
                  placeholder="Quantité en stock"
                  value={linkForm.stock}
                  onChange={(e) => setLinkForm({ ...linkForm, stock: e.target.value })}
                  className="px-4 py-3 border border-border rounded-lg bg-background"
                />
                <input
                  type="number"
                  step="0.001"
                  placeholder="Prix boutique (optionnel)"
                  value={linkForm.price}
                  onChange={(e) => setLinkForm({ ...linkForm, price: e.target.value })}
                  className="px-4 py-3 border border-border rounded-lg bg-background"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
                  Ajouter le stock
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateNew} className="space-y-4">
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
              <ProductImageUpload value={imageFile} onChange={setImageFile} />
              <div className="flex gap-2">
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
                  Créer et publier
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
            {product.image ? (
              <img
                src={resolveProductImageUrl(product.image, product._id)}
                alt=""
                className="w-20 h-20 rounded-lg object-cover bg-muted shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <p className="font-bold text-primary mt-1">{formatPrice(product.price)}</p>
              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
              {product.catalogProductId && (
                <p className="text-[10px] text-offer-foreground bg-offer/20 inline-block px-2 py-0.5 rounded mt-1">
                  Lié au catalogue en ligne
                </p>
              )}
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
