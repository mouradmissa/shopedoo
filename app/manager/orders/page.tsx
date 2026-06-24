'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Store } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/orderLabels';

interface StoreInfo {
  _id: string;
  name: string;
}

interface OrderRow {
  _id: string;
  userId: { name: string; email: string };
  storeId?: StoreInfo | null;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
  confirmedByUserId?: { name: string } | null;
  items: unknown[];
}

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const response = await apiClient.getManagerOrders(
      statusFilter === 'all' ? undefined : statusFilter
    );
    if (response.success) setOrders((response.data as OrderRow[]) || []);
    setLoading(false);
  };

  const storeName = orders[0]?.storeId?.name;
  const paidInStore = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'paid' && ['cash_register', 'cash'].includes(o.paymentMethod)
      ),
    [orders]
  );
  const storeRevenue = useMemo(
    () => paidInStore.reduce((sum, o) => sum + o.totalAmount, 0),
    [paidInStore]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Paiements boutique</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Encaissements enregistrés pour{' '}
          <span className="font-medium text-foreground">{storeName || 'votre boutique'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Paiements en boutique (payés)</p>
          <p className="text-3xl font-bold mt-1">{paidInStore.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total encaissé en boutique</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatPrice(storeRevenue)}</p>
        </div>
      </div>

      <div className="mobile-scroll-x mb-6">
        {(['all', 'pending', 'paid'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`shrink-0 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition min-h-10 ${
              statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucun paiement pour cette boutique.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="font-semibold">{order.userId?.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{order.userId?.email}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <Store className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">
                      {order.storeId?.name || storeName || 'Boutique'}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xl font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
                      ORDER_STATUS_COLORS[order.status] ?? 'bg-muted'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Paiement :{' '}
                  <strong className="text-foreground">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </strong>
                </span>
                <span>{order.items?.length || 0} article(s)</span>
                {order.confirmedByUserId?.name && (
                  <span>Caissier : {order.confirmedByUserId.name}</span>
                )}
                <span>
                  {new Date(order.paidAt || order.createdAt).toLocaleString('fr-TN')}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
