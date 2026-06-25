'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, MapPin, Phone } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS } from '@/lib/orderLabels';

interface Order {
  _id: string;
  userId: { name: string; email: string; phone?: string };
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod?: string;
  createdAt: string;
}

export default function LivreurPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const response = await apiClient.getDriverOrders();
    if (response.success) setOrders(response.data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markDelivered = async (orderId: string) => {
    const response = await apiClient.markOrderDelivered(orderId);
    if (response.success) {
      setOrders(orders.filter((o) => o._id !== orderId));
    } else {
      alert(response.error || 'Erreur');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes livraisons</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Aucune livraison assignée.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm">{order.userId?.name}</p>
                  <p className="text-xs text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
                </div>
                <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
              {order.userId?.phone && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Phone className="w-4 h-4" />
                  {order.userId.phone}
                </div>
              )}
              <button
                type="button"
                onClick={() => markDelivered(order._id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmer la livraison
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
