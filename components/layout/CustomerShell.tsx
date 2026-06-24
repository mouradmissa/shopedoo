'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { ShopNav } from '@/components/layout/ShopNav';
import { ShopFooter } from '@/components/layout/ShopFooter';

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getCart().then((response) => {
      if (response.success && response.data?.items) {
        setCartCount(response.data.items.length);
      }
    });
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen shop-page-bg flex flex-col">
      <ShopNav cartCount={cartCount} />
      <main className="flex-1 flex flex-col">{children}</main>
      <ShopFooter />
    </div>
  );
}
