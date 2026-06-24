'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

interface DashboardStats {
  stores: number;
  products: number;
  orders: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    stores: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [storesRes, productsRes, ordersRes] = await Promise.all([
        apiClient.getStores(),
        apiClient.getProducts(),
        apiClient.getAllOrders(),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const revenue = orders.reduce(
        (sum: number, order: { totalAmount?: number; status?: string }) =>
          order.status !== 'cancelled' ? sum + (order.totalAmount ?? 0) : sum,
        0
      );

      setStats({
        stores: Array.isArray(storesRes.data) ? storesRes.data.length : 0,
        products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
        orders: orders.length,
        revenue,
      });
      setIsLoading(false);
    };

    void load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Bonjour, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Boutiques</p>
          <p className="text-2xl sm:text-3xl font-bold">{stats.stores}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Produits</p>
          <p className="text-2xl sm:text-3xl font-bold">{stats.products}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Commandes</p>
          <p className="text-2xl sm:text-3xl font-bold">{stats.orders}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 col-span-2 lg:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Chiffre d&apos;affaires</p>
          <p className="text-xl sm:text-2xl font-bold text-primary">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/admin/stores"
          className="bg-card rounded-xl border border-border p-6 hover:border-primary/40 transition group"
        >
          <Store className="w-8 h-8 text-primary mb-4 group-hover:scale-105 transition" />
          <h2 className="text-lg font-bold">Boutiques & gérants</h2>
        </Link>

        <Link
          href="/admin/products"
          className="bg-card rounded-xl border border-border p-6 hover:border-primary/40 transition group"
        >
          <Package className="w-8 h-8 text-primary mb-4 group-hover:scale-105 transition" />
          <h2 className="text-lg font-bold">Catalogue produits</h2>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-card rounded-xl border border-border p-6 hover:border-primary/40 transition group"
        >
          <ShoppingBag className="w-8 h-8 text-primary mb-4 group-hover:scale-105 transition" />
          <h2 className="text-lg font-bold">Commandes clients</h2>
        </Link>
      </div>
    </div>
  );
}
