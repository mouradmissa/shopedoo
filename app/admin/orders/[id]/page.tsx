'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/orderLabels';

interface StoreInfo {
  name: string;
  city?: string;
  governorate?: string;
}

interface OrderItem {
  productId: { name: string; price: number };
  quantity: number;
  price: number;
}

interface OrderDetail {
  _id: string;
  userId: { name: string; email: string };
  storeId?: StoreInfo | null;
  confirmedByUserId?: { name: string } | null;
  items: OrderItem[];
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  invoiceQrCode?: string;
  paidAt?: string;
  createdAt: string;
}

const STATUS_LABELS = ORDER_STATUS_LABELS;
const PAYMENT_LABELS = PAYMENT_METHOD_LABELS;

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await apiClient.getOrder(id);
      if (response.success && response.data) {
        setOrder(response.data as OrderDetail);
      } else {
        setError(response.error || 'Commande introuvable');
      }
      setLoading(false);
    };
    if (id) void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">{error || 'Commande introuvable'}</p>
        <Link href="/admin/orders" className="text-primary font-semibold hover:underline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux commandes
      </Link>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground font-mono mb-1">
            #{order._id.slice(-8).toUpperCase()}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold">Détail commande</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString('fr-TN')}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">Boutique</p>
              <p className="font-semibold">{order.storeId?.name || 'Non assignée'}</p>
              {order.storeId?.governorate && (
                <p className="text-muted-foreground text-xs mt-1">
                  {order.storeId.city} — {order.storeId.governorate}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <p className="font-semibold">{order.userId?.name}</p>
              <p className="text-muted-foreground break-all text-xs">{order.userId?.email}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground mb-1">Statut</p>
              <p className="font-semibold">{STATUS_LABELS[order.status] ?? order.status}</p>
              <p className="text-muted-foreground mt-2">
                Paiement : {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>
              {order.confirmedByUserId?.name && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Caissier : {order.confirmedByUserId.name}
                </p>
              )}
            </div>
          </div>

          <div className="text-sm">
            <p className="text-xs text-muted-foreground mb-1">Adresse</p>
            <p>{order.shippingAddress}</p>
          </div>

          <div>
            <h2 className="font-semibold mb-3 text-sm">Articles</h2>
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {order.items?.map((item, i) => (
                <li key={i} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    {item.productId?.name ?? 'Produit'} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
            {order.subtotal !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
            )}
            {order.taxAmount !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {order.invoiceQrCode && (
            <p className="text-xs text-muted-foreground font-mono break-all">
              QR facture : {order.invoiceQrCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
