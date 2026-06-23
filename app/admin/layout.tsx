'use client';

import { AdminGuard } from '@/components/guards/AdminGuard';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
        <AdminNav />
        <main className="flex-1">{children}</main>
      </div>
    </AdminGuard>
  );
}
