'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, QrCode, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

interface ShopNavProps {
  cartCount?: number;
}

export function ShopNav({ cartCount = 0 }: ShopNavProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <AppHeader
      logoHref="/"
      sectionLabel="Boutique"
      userName={isAuthenticated ? user?.name : undefined}
      onLogout={isAuthenticated ? handleLogout : undefined}
      trailing={
        isAuthenticated ? (
          <>
            <Link
              href="/qr-scanner"
              className="touch-target hover:bg-muted rounded-lg transition"
              title="Scanner QR"
            >
              <QrCode className="w-5 h-5" />
            </Link>
            <Link
              href="/cart"
              className="touch-target hover:bg-muted rounded-lg transition relative"
              title="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Connexion</span>
          </Link>
        )
      }
    />
  );
}
