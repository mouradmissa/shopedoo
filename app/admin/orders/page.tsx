'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/orderLabels';

interface StoreInfo {
  name: string;
  city?: string;
  governorate?: string;
}

interface Order {
  _id: string;
  userId: { name: string; email: string };
  storeId?: StoreInfo | null;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: string;
  createdAt: string;
  items: unknown[];
}

const STATUS_LABELS = ORDER_STATUS_LABELS;
const statusColors = ORDER_STATUS_COLORS;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const response = await apiClient.getAllOrders(statusFilter === 'all' ? undefined : statusFilter);
    if (response.success) setOrders(response.data || []);
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const response = await apiClient.updateOrderStatus(orderId, newStatus);
    if (response.success && response.data) {
      setOrders(orders.map((o) => (o._id === orderId ? response.data : o)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi et mise à jour des commandes clients</p>
      </div>

      <div className="mobile-scroll-x mb-6">
        {(['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
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
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune commande trouvée.</p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto bg-card border border-border rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Réf.</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Boutique</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Paiement</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Articles</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Voir</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {order.storeId?.name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{order.userId?.name}</p>
                      <p className="text-xs text-muted-foreground">{order.userId?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {order.paymentMethod
                        ? PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">{order.items?.length || 0}</td>
                    <td className="py-3 px-4 font-semibold text-primary text-sm">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border border-transparent cursor-pointer ${statusColors[order.status]}`}
                      >
                        {Object.entries(STATUS_LABELS)
                          .filter(([k]) => k !== 'all')
                          .map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('fr-TN')}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="inline-flex p-2 hover:bg-muted rounded-lg transition"
                        title="Voir le détail"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <article key={order._id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="font-semibold">{order.storeId?.name || 'Boutique non assignée'}</p>
                    <p className="font-semibold">{order.userId?.name}</p>
                    <p className="text-xs text-muted-foreground">{order.userId?.email}</p>
                  </div>
                  <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] ?? order.paymentMethod ?? '—'}
                  </span>
                  <span>{order.items?.length || 0} article(s)</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('fr-TN')}</span>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  className={`mt-3 w-full text-sm px-3 py-2 rounded-lg font-medium ${statusColors[order.status]}`}
                >
                  {Object.entries(STATUS_LABELS)
                    .filter(([k]) => k !== 'all')
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Voir le détail
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
