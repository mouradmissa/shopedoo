'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface Order {
  _id: string;
  userId: { name: string; email: string };
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: any[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  paid: 'bg-blue-500/10 text-blue-600',
  shipped: 'bg-purple-500/10 text-purple-600',
  delivered: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchOrders();
  }, [user, router, statusFilter]);

  const fetchOrders = async () => {
    const response = await apiClient.getAllOrders(statusFilter === 'all' ? undefined : statusFilter);
    if (response.success) {
      setOrders(response.data || []);
    }
    setIsLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const response = await apiClient.updateOrderStatus(orderId, newStatus);
    if (response.success) {
      setOrders(orders.map((o) => (o._id === orderId ? response.data : o)));
      alert('Order status updated!');
    }
  };

  const getStatusBadgeClass = (status: string) => statusColors[status] || 'bg-gray-500/10 text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back</span>
          </Link>
          <h1 className="font-bold text-xl">Orders Management</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground hover:bg-muted border border-border'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-4 px-4 font-semibold">Customer</th>
                  <th className="text-left py-4 px-4 font-semibold">Items</th>
                  <th className="text-left py-4 px-4 font-semibold">Amount</th>
                  <th className="text-left py-4 px-4 font-semibold">Status</th>
                  <th className="text-left py-4 px-4 font-semibold">Date</th>
                  <th className="text-left py-4 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-mono text-sm">{order._id.slice(0, 8)}...</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold">{order.userId?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.userId?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">{order.items?.length || 0} items</td>
                    <td className="py-4 px-4 font-bold text-primary">{formatPrice(order.totalAmount)}</td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`text-sm px-3 py-1 rounded-full font-medium border border-current cursor-pointer ${getStatusBadgeClass(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/admin/orders/${order._id}`} className="p-2 hover:bg-muted rounded-lg transition">
                        <Eye className="w-5 h-5 text-secondary" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
