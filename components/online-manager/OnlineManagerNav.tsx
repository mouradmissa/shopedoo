'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Package, ShoppingBag, Truck, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

const NAV = [
  { href: '/online-manager', label: 'Tableau de bord', icon: Globe, exact: true },
  { href: '/online-manager/products', label: 'Catalogue en ligne', icon: Package },
  { href: '/online-manager/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/online-manager/drivers', label: 'Livreurs', icon: Users },
];

export function OnlineManagerNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const linkClass = (href: string, exact?: boolean, mobile?: boolean) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return mobile
      ? `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
          active ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`
      : `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
          active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
        }`;
  };

  return (
    <AppHeader
      logoHref="/online-manager"
      sectionLabel="Boutique en ligne"
      userName={user?.name}
      userSubtitle="Responsable en ligne"
      onLogout={() => {
        logout();
        router.push('/');
      }}
      center={
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact)}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      }
      mobileNav={
        <>
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact, true)}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </>
      }
      trailing={
        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="w-3.5 h-3.5" />
          Livraison
        </span>
      }
    />
  );
}
