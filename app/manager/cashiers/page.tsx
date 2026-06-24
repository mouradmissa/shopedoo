'use client';

import { useEffect, useState } from 'react';
import { Plus, User } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Cashier {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function ManagerCashiersPage() {
  const [storeId, setStoreId] = useState('');
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const id = (storeRes.data as { _id: string })._id;
        setStoreId(id);
        const cashiersRes = await apiClient.getStoreCashiers(id);
        if (cashiersRes.success) setCashiers(cashiersRes.data || []);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const response = await apiClient.createCashier(storeId, form);
    if (response.success && response.data) {
      setCashiers([response.data, ...cashiers]);
      setForm({ name: '', email: '', password: '', phone: '' });
      setShowForm(false);
    } else {
      setError(response.error || 'Impossible de créer le caissier');
    }
  };

  if (loading) return <div className="p-8" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Comptes caissiers</h1>
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
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3">
          <input
            required
            placeholder="Nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background"
          />
          <input
            required
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background"
          />
          <input
            placeholder="Téléphone (optionnel)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
            Créer le compte caissier
          </button>
        </form>
      )}

      <div className="space-y-3">
        {cashiers.map((cashier) => (
          <div key={cashier._id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{cashier.name}</p>
              <p className="text-sm text-muted-foreground">{cashier.email}</p>
            </div>
          </div>
        ))}
      </div>

      {cashiers.length === 0 && <div className="py-12" />}
    </div>
  );
}
