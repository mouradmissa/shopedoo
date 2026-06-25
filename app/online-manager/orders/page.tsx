'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/orderLabels';

interface Driver {
  _id: string;
  name: string;
  email: string;
}

interface Order {
  _id: string;
  userId: { name: string; email: string; phone?: string };
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  shippingAddress: string;
  assignedDriverId?: { _id: string; name: string } | null;
  createdAt: string;
}

export default function OnlineManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    const [ordersRes, driversRes] = await Promise.all([
      apiClient.getOnlineOrders(statusFilter === 'all' ? undefined : statusFilter),
      apiClient.getDrivers(),
    ]);
    if (ordersRes.success) setOrders(ordersRes.data || []);
    if (driversRes.success) setDrivers(driversRes.data || []);
    setLoading(false);
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    const response = await apiClient.assignOrderDriver(orderId, driverId);
    if (response.success && response.data) {
      setOrders(orders.map((o) => (o._id === orderId ? response.data : o)));
    } else {
      alert(response.error || 'Erreur assignation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commandes en ligne</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assignez les commandes aux livreurs. La confirmation de livraison est faite par le livreur.
        </p>
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
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune commande en ligne.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm">
                    {order.userId?.name} — {order.userId?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                  <p className="text-sm">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod} ·{' '}
                    <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                  </p>
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                      ORDER_STATUS_COLORS[order.status] || 'bg-muted'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                  {order.assignedDriverId && (
                    <p className="text-xs text-muted-foreground">
                      Livreur : {order.assignedDriverId.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 min-w-[220px]">
                  {['paid', 'shipped'].includes(order.status) && (
                    <select
                      defaultValue=""
                      onChange={(e) => assignDriver(order._id, e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    >
                      <option value="" disabled>
                        {order.assignedDriverId ? 'Changer livreur' : 'Assigner livreur'}
                      </option>
                      {drivers.map((driver) => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
