'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Store, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/stores', label: 'Boutiques', icon: Store },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/users', label: 'Resp. en ligne', icon: Users },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
  mobile,
}: {
  href: string;
  label: string;
  icon: typeof Store;
  exact?: boolean;
  pathname: string;
  mobile?: boolean;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={
        mobile
          ? `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
              active ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`
          : `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`
      }
    >
      <Icon className={mobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <AppHeader
      logoHref="/admin"
      sectionLabel="Admin"
      userName={user?.name}
      userSubtitle="Administrateur"
      onLogout={() => {
        logout();
        router.push('/');
      }}
      center={
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
      }
      mobileNav={
        <>
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} mobile />
          ))}
        </>
      }
    />
  );
}
