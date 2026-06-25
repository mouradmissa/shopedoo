'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface OnlineManager {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<OnlineManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const load = async () => {
    setLoading(true);
    const response = await apiClient.getStaffUsers();
    if (response.success) setUsers(response.data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiClient.createStaffUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    });

    if (response.success && response.data) {
      setUsers([response.data, ...users]);
      setFormData({ name: '', email: '', password: '', phone: '' });
      setShowForm(false);
    } else {
      alert(response.error || 'Erreur création compte');
    }
  };

  if (loading) return <div className="p-8" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Responsables boutique en ligne</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez les comptes responsable boutique en ligne. Les livreurs sont gérés par eux.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nouveau responsable
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Nom complet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
            <input
              required
              type="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
            <input
              placeholder="Téléphone (optionnel)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-3 border border-border rounded-lg bg-background"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
              Créer le compte
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border rounded-lg">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user._id} className="bg-card border border-border rounded-xl p-4 flex justify-between gap-4">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary h-fit">
              Responsable en ligne
            </span>
          </div>
        ))}
      </div>

      {users.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun responsable créé.</p>}
    </div>
  );
}
