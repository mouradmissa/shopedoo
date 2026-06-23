'use client';

import Link from 'next/link';
import { LogIn, LogOut, QrCode, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

interface ShopNavProps {
  cartCount?: number;
}

export function ShopNav({ cartCount = 0 }: ShopNavProps) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-top">
      <div className="page-container h-14 sm:h-16 flex items-center justify-between gap-2">
        <ShopEdooLogo href="/" height={44} className="sm:hidden" priority />
        <ShopEdooLogo href="/" height={52} className="hidden sm:flex" priority />

        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
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
              <div className="hidden sm:block border-l border-border pl-3 ml-1">
                <p className="text-sm font-medium leading-tight max-w-[120px] truncate">{user?.name}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Déconnexion
                </button>
              </div>
              <button
                type="button"
                onClick={logout}
                className="sm:hidden touch-target hover:bg-muted rounded-lg transition"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Connexion</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
