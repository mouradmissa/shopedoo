'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Store, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TUNISIA_GOVERNORATES } from '@/lib/tunisia';

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
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    city: '',
    governorate: TUNISIA_GOVERNORATES[0],
    address: '',
    managerName: '',
    managerEmail: '',
    managerPassword: '',
    managerPhone: '',
  });

  useEffect(() => {
    void loadStores();
  }, []);

  const loadStores = async () => {
    const response = await apiClient.getStores();
    if (response.success) setStores((response.data as StoreRow[]) || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const response = await apiClient.createStore({
      name: form.name,
      city: form.city,
      governorate: form.governorate,
      address: form.address,
      manager: {
        name: form.managerName,
        email: form.managerEmail,
        password: form.managerPassword,
        phone: form.managerPhone || undefined,
      },
    });

    if (response.success && response.data) {
      setStores([response.data as StoreRow, ...stores]);
      setShowForm(false);
      setForm({
        name: '',
        city: '',
        governorate: TUNISIA_GOVERNORATES[0],
        address: '',
        managerName: '',
        managerEmail: '',
        managerPassword: '',
        managerPhone: '',
      });
      return;
    }

    setError(response.error || 'Erreur lors de la création');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Boutiques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les boutiques et leurs gérants. Les 24 boutiques Tunisie sont aussi créées au
            démarrage de l&apos;API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle boutique</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">Aucune boutique pour le moment.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            Créer une boutique
          </button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleCreate}
            className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border p-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Nouvelle boutique + gérant</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                required
                placeholder="Nom de la boutique"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
              <input
                required
                placeholder="Ville"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
              <select
                value={form.governorate}
                onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              >
                {TUNISIA_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Adresse complète"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />

              <hr className="border-border" />
              <p className="text-sm font-semibold">Compte gérant</p>

              <input
                required
                placeholder="Nom du gérant"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
              <input
                required
                type="email"
                placeholder="Email gérant"
                value={form.managerEmail}
                onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
              <input
                required
                type="password"
                placeholder="Mot de passe gérant"
                value={form.managerPassword}
                onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
              <input
                placeholder="Téléphone gérant"
                value={form.managerPhone}
                onChange={(e) => setForm({ ...form, managerPhone: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background"
              />
            </div>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold min-h-12"
            >
              Créer la boutique
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
