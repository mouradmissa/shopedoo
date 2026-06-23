'use client';

import { useEffect, useState } from 'react';
import { MapPin, Store } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface StoreRow {
  _id: string;
  name: string;
  city: string;
  governorate: string;
  address: string;
  isActive: boolean;
  managerId: { name: string; email: string; phone?: string };
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadStores();
  }, []);

  const loadStores = async () => {
    const response = await apiClient.getStores();
    if (response.success) setStores((response.data as StoreRow[]) || []);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Boutiques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les 24 boutiques Tunisie (gérant + 2 caissiers chacune) sont créées automatiquement au
          démarrage de l&apos;API
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            Aucune boutique pour le moment. Elles apparaîtront après le démarrage de l&apos;API.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => (
            <article key={store._id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <Store className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="font-bold text-lg">{store.name}</h2>
                  <p className="text-sm text-muted-foreground flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {store.address}, {store.city} — {store.governorate}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">Gérant : {store.managerId?.name}</p>
                <p className="text-muted-foreground break-all">{store.managerId?.email}</p>
              </div>
              <span
                className={`inline-block mt-3 text-xs px-2 py-1 rounded-full ${
                  store.isActive ? 'bg-green-500/15 text-green-700' : 'bg-muted text-muted-foreground'
                }`}
              >
                {store.isActive ? 'Active' : 'Inactive'}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
