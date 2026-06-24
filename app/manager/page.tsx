'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Package, Receipt, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/orderLabels';

interface StoreInfo {
  _id: string;
  name: string;
  city: string;
  governorate: string;
  address: string;
}

interface OrderRow {
  _id: string;
  userId: { name: string };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
}

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState({ products: 0, cashiers: 0, paidInStore: 0, storeRevenue: 0 });
  const [recentPayments, setRecentPayments] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const storeData = storeRes.data as StoreInfo;
        setStore(storeData);

        const [productsRes, cashiersRes, ordersRes] = await Promise.all([
          apiClient.getProducts(undefined, undefined, storeData._id),
          apiClient.getStoreCashiers(storeData._id),
          apiClient.getManagerOrders(),
        ]);

        const orders = (ordersRes.data as OrderRow[]) || [];
        const paidInStore = orders.filter(
          (o) => o.status === 'paid' && ['cash_register', 'cash'].includes(o.paymentMethod)
        );

        setRecentPayments(paidInStore.slice(0, 5));
        setStats({
          products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
          cashiers: Array.isArray(cashiersRes.data) ? cashiersRes.data.length : 0,
          paidInStore: paidInStore.length,
          storeRevenue: paidInStore.reduce((sum, o) => sum + o.totalAmount, 0),
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <p className="text-xs text-muted-foreground">Paiements boutique</p>
          <p className="text-2xl font-bold mt-1">{stats.paidInStore}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Encaissé</p>
          <p className="text-lg sm:text-xl font-bold text-primary mt-1">
            {formatPrice(stats.storeRevenue)}
          </p>
        </div>
        <Link
          href="/manager/products"
          className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/40 transition"
        >
          <Package className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold">{stats.products}</p>
          <p className="text-xs text-muted-foreground">Produits</p>
        </Link>
        <Link
          href="/manager/cashiers"
          className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/40 transition"
        >
          <Users className="w-6 h-6 text-primary mb-2" />
          <p className="text-2xl font-bold">{stats.cashiers}</p>
          <p className="text-xs text-muted-foreground">Caissiers</p>
        </Link>
      </div>

      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Derniers paiements en boutique</h2>
          </div>
          <Link href="/manager/orders" className="text-sm font-semibold text-primary hover:underline">
            Tout voir →
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucun paiement en boutique enregistré pour {store?.name || 'cette boutique'}.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentPayments.map((order) => (
              <li key={order._id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{order.userId?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {store?.name} · {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} ·{' '}
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.paidAt || order.createdAt).toLocaleDateString('fr-TN')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
