'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccessOnlineManagerArea } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

export function OnlineManagerGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !canAccessOnlineManagerArea(user?.role)) {
      router.replace('/auth/signin');
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canAccessOnlineManagerArea(user?.role)) {
    return null;
  }

  return <>{children}</>;
}
