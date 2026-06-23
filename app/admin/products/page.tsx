'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { ProductQrDisplay } from '@/components/products/ProductQrDisplay';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  qrCode: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchProducts();
  }, [user, router]);

  const fetchProducts = async () => {
    const response = await apiClient.getProducts();
    if (response.success) {
      setProducts(response.data || []);
    }
    setIsLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiClient.createProduct({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock),
      image: formData.image,
    });

    if (response.success) {
      setProducts([...products, response.data]);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', image: '' });
      setShowForm(false);
      alert('Product created successfully!');
    } else {
      alert('Failed to create product');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const response = await apiClient.deleteProduct(productId);
      if (response.success) {
        setProducts(products.filter((p) => p._id !== productId));
        alert('Product deleted successfully!');
      }
    }
  };

  const viewQrCode = async (productId: string) => {
    setQrLoading(true);
    const response = await apiClient.getProduct(productId);
    setQrLoading(false);
    if (response.success && response.data) {
      setQrProduct(response.data);
    } else {
      alert('Impossible de charger le QR code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back</span>
          </Link>
          <h1 className="font-bold text-xl">Products Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Product</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create New Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  placeholder="Prix (DT)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  step="0.01"
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Name</th>
                  <th className="text-left py-4 px-4 font-semibold">Category</th>
                  <th className="text-left py-4 px-4 font-semibold">Prix (DT)</th>
                  <th className="text-left py-4 px-4 font-semibold">Stock</th>
                  <th className="text-left py-4 px-4 font-semibold">QR Code</th>
                  <th className="text-left py-4 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">{product.category}</td>
                    <td className="py-4 px-4 font-semibold text-primary">{formatPrice(product.price)}</td>
                    <td className="py-4 px-4">
                      <span className={`text-sm px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {product.qrCode ? (
                        <button
                          type="button"
                          onClick={() => viewQrCode(product._id)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Voir QR
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="p-2 hover:bg-muted rounded-lg transition"
                      >
                        <Edit2 className="w-5 h-5 text-secondary" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(qrProduct || qrLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !qrLoading && setQrProduct(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg truncate pr-2">{qrProduct?.name || 'QR produit'}</h3>
              <button
                type="button"
                onClick={() => setQrProduct(null)}
                className="touch-target hover:bg-muted rounded-lg"
              >
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
