'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Package, ShoppingBag, Users, LogOut } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }

    // Placeholder for fetching stats
    // In a real implementation, you'd call API endpoints to get these numbers
    setTimeout(() => {
      setStats({
        totalOrders: 1250,
        totalProducts: 89,
        totalUsers: 3400,
        totalRevenue: 125430,
      });
      setIsLoading(false);
    }, 500);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <ShopEdooLogo
            href="/admin"
            height={68}
            suffix={<span className="font-bold text-lg hidden sm:inline text-muted-foreground">Admin</span>}
          />

          <div className="flex items-center gap-4">
            <div className="hidden sm:block border-l border-border pl-4">
              <div className="text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Tableau de bord administrateur shopedoo</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Products</p>
                <p className="text-3xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Chiffre d&apos;affaires</p>
                <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-primary/20" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Products
            </h2>
            <p className="text-muted-foreground mb-6">Manage your product inventory, categories, and QR codes</p>
            <Link
              href="/admin/products"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Go to Products
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              Orders
            </h2>
            <p className="text-muted-foreground mb-6">View and manage customer orders, track shipments</p>
            <Link
              href="/admin/orders"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Go to Orders
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Boutiques
            </h2>
            <p className="text-muted-foreground mb-6">
              Créer des boutiques en Tunisie et assigner un gérant à chacune
            </p>
            <Link
              href="/admin/stores"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Gérer les boutiques
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Users
            </h2>
            <p className="text-muted-foreground mb-6">View customer profiles and manage user accounts</p>
            <Link
              href="/admin/users"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Go to Users
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Analytics
            </h2>
            <p className="text-muted-foreground mb-6">View sales trends, QR scan data, and revenue reports</p>
            <Link
              href="/admin/analytics"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
            >
              Go to Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
