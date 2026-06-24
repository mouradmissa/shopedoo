'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, QrCode, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { cn } from '@/lib/utils';

interface ShopNavProps {
  cartCount?: number;
}

const NAV_LINKS = [
  { href: '/', label: 'Accueil', exact: true },
  { href: '/#catalogue', label: 'Catalogue', exact: false },
  { href: '/qr-scanner', label: 'Scanner QR', exact: false },
] as const;

export function ShopNav({ cartCount = 0 }: ShopNavProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string, exact: boolean) => {
    if (href === '/#catalogue') return pathname === '/';
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <AppHeader
      logoHref="/"
      sectionLabel="Boutique"
      tone="shop"
      center={
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      }
      mobileNav={
        <>
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </>
      }
      userName={isAuthenticated ? user?.name : undefined}
      onLogout={isAuthenticated ? handleLogout : undefined}
      trailing={
        isAuthenticated ? (
          <>
            <Link
              href="/qr-scanner"
              className="touch-target hover:bg-primary/10 rounded-lg transition text-primary"
              title="Scanner QR"
            >
              <QrCode className="w-5 h-5" />
            </Link>
            <Link
              href="/cart"
              className="touch-target hover:bg-primary/10 rounded-lg transition relative"
              title="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition text-sm font-bold shadow-md shadow-primary/25"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Connexion</span>
          </Link>
        )
      }
    />
  );
}
