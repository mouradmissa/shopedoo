'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Package, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

interface StoreInfo {
  _id: string;
  name: string;
  city: string;
  governorate: string;
  address: string;
}

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState({ products: 0, cashiers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const storeData = storeRes.data as StoreInfo;
        setStore(storeData);

        const [productsRes, cashiersRes] = await Promise.all([
          apiClient.getProducts(undefined, undefined, storeData._id),
          apiClient.getStoreCashiers(storeData._id),
        ]);

        setStats({
          products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
          cashiers: Array.isArray(cashiersRes.data) ? cashiersRes.data.length : 0,
        });
      }
      setLoading(false);
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bonjour, {user?.name}</h1>
      <p className="text-muted-foreground mb-8">Gérez votre boutique shopedoo en Tunisie</p>

      {store && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-8">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-lg">{store.name}</h2>
              <p className="text-sm text-muted-foreground">
                {store.address}, {store.city} — {store.governorate}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/manager/products"
          className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition"
        >
          <Package className="w-8 h-8 text-primary mb-3" />
          <p className="text-2xl font-bold">{stats.products}</p>
          <p className="text-sm text-muted-foreground">Produits en boutique</p>
        </Link>

        <Link
          href="/manager/cashiers"
          className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition"
        >
          <Users className="w-8 h-8 text-primary mb-3" />
          <p className="text-2xl font-bold">{stats.cashiers}</p>
          <p className="text-sm text-muted-foreground">Comptes caissiers</p>
        </Link>
      </div>
    </div>
  );
}
