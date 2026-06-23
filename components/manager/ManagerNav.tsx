'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Store, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

const NAV = [
  { href: '/manager', label: 'Tableau de bord', icon: Store, exact: true },
  { href: '/manager/products', label: 'Produits', icon: Package },
  { href: '/manager/cashiers', label: 'Caissiers', icon: Users },
];

export function ManagerNav() {
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
      logoHref="/manager"
      sectionLabel="Gérant"
      userName={user?.name}
      userSubtitle={user?.store?.name}
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
    />
  );
}
