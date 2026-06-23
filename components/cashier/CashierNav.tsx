'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Home, Package, ScanLine } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';

const navItems = [
  { href: '/caissier', label: 'Accueil', icon: Home, exact: true },
  { href: '/caissier/produits', label: 'Produits', icon: Package },
  { href: '/caissier/scan', label: 'Scanner', icon: ScanLine },
];

export function CashierNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const roleLabel = user?.role === 'admin' ? 'Administrateur' : 'Caissier';

  const linkClass = (href: string, exact?: boolean, mobile?: boolean) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return mobile
      ? `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
          active ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`
      : `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
          active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`;
  };

  return (
    <AppHeader
      logoHref="/caissier"
      sectionLabel="Caisse"
      userName={user?.name}
      userSubtitle={roleLabel}
      onLogout={() => {
        logout();
        router.push('/auth/signin');
      }}
      center={
        <nav className="flex items-center justify-center gap-1 sm:gap-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact)}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      }
      mobileNav={
        <>
          {navItems.map(({ href, label, icon: Icon, exact }) => (
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

export function CashierShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
      <CashierNav />
      <main className="flex-1 flex flex-col page-container w-full">{children}</main>
    </div>
  );
}
