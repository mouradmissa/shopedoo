'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdmin } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin?redirect=/admin');
      return;
    }
    if (user?.role === 'cashier') {
      router.replace('/caissier');
      return;
    }
    if (user?.role === 'manager') {
      router.replace('/manager');
      return;
    }
    if (user && !canAccessAdmin(user.role)) {
      router.replace('/');
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !canAccessAdmin(user.role)) {
    return null;
  }

  return <>{children}</>;
}
