'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function OnlineManagerDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await apiClient.getDrivers();
      if (response.success) setDrivers(response.data || []);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <div className="p-8" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Livreurs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les comptes livreur sont créés par l&apos;administrateur. Assignez-les depuis les commandes.
        </p>
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => (
          <div key={driver._id} className="bg-card border border-border rounded-xl p-4 flex justify-between gap-4">
            <div>
              <p className="font-semibold">{driver.name}</p>
              <p className="text-sm text-muted-foreground">{driver.email}</p>
              {driver.phone && <p className="text-sm text-muted-foreground">{driver.phone}</p>}
            </div>
          </div>
        ))}
      </div>

      {drivers.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Aucun livreur. L&apos;admin peut en créer depuis Équipe en ligne.
        </p>
      )}
    </div>
  );
}
