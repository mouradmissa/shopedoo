'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccessCashierArea } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

export function CashierAreaGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin?redirect=/caissier');
      return;
    }
    if (user && !canAccessCashierArea(user.role)) {
      router.replace('/');
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !canAccessCashierArea(user.role)) {
    return null;
  }

  return <>{children}</>;
}
