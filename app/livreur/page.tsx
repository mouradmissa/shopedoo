'use client';

import { useEffect, useState } from 'react';
import { Archive, CheckCircle, Loader2, MapPin, Package, Phone, Truck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS } from '@/lib/orderLabels';

interface OrderItem {
  productId: { name: string; price?: number } | string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userId: { name: string; email: string; phone?: string };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod?: string;
  createdAt: string;
  assignedAt?: string;
  deliveredAt?: string;
}

type Tab = 'active' | 'archive';

function getProductName(item: OrderItem) {
  if (typeof item.productId === 'object' && item.productId?.name) {
    return item.productId.name;
  }
  return 'Produit';
}

function OrderCard({
  order,
  onDeliver,
  archive = false,
}: {
  order: Order;
  onDeliver?: (orderId: string) => void;
  archive?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold">#{order._id.slice(-8).toUpperCase()}</p>
          <p className="text-sm">{order.userId?.name}</p>
          <p className="text-xs text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
          {archive && order.deliveredAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Livré le {new Date(order.deliveredAt).toLocaleString('fr-TN')}
            </p>
          )}
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

      <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          Produits à livrer
        </p>
        <ul className="space-y-2">
          {order.items?.map((item, index) => (
            <li key={`${order._id}-${index}`} className="flex justify-between gap-3 text-sm">
              <span className="line-clamp-2">
                {getProductName(item)} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      {!archive && onDeliver && (
        <button
          type="button"
          onClick={() => onDeliver(order._id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
        >
          <CheckCircle className="w-5 h-5" />
          Marquer comme livré
        </button>
      )}
    </div>
  );
}

export default function LivreurPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [archiveOrders, setArchiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [activeRes, archiveRes] = await Promise.all([
      apiClient.getDriverOrders(),
      apiClient.getDriverArchive(),
    ]);
    if (activeRes.success) setActiveOrders(activeRes.data || []);
    if (archiveRes.success) setArchiveOrders(archiveRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markDelivered = async (orderId: string) => {
    if (!window.confirm('Confirmer que cette commande a bien été livrée ?')) return;

    const response = await apiClient.markOrderDelivered(orderId);
    if (response.success && response.data) {
      setActiveOrders(activeOrders.filter((o) => o._id !== orderId));
      setArchiveOrders([response.data, ...archiveOrders]);
      setTab('archive');
    } else {
      alert(response.error || 'Erreur');
    }
  };

  const orders = tab === 'active' ? activeOrders : archiveOrders;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-7 h-7 text-primary" />
          Mes livraisons
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consultez les produits de chaque commande et confirmez la livraison.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
            tab === 'active'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          <Truck className="w-4 h-4" />
          En cours ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('archive')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
            tab === 'archive'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          <Archive className="w-4 h-4" />
          Archive ({archiveOrders.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          {tab === 'active'
            ? 'Aucune livraison en cours assignée à vous.'
            : 'Aucune livraison dans votre archive.'}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              archive={tab === 'archive'}
              onDeliver={tab === 'active' ? markDelivered : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
