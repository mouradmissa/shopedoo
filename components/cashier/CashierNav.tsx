'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Home, Package, ScanLine, LogOut } from 'lucide-react';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

const navItems = [
  { href: '/caissier', label: 'Accueil', icon: Home, exact: true },
  { href: '/caissier/produits', label: 'Produits', icon: Package },
  { href: '/caissier/scan', label: 'Scanner', icon: ScanLine },
];

export function CashierNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/auth/signin');
  };

  const roleLabel = user?.role === 'admin' ? 'Administrateur' : 'Caissier';

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-3 sm:gap-6">
        <ShopEdooLogo
          href="/caissier"
          height={68}
          suffix={
            <span className="font-bold text-lg hidden md:inline text-muted-foreground">Caisse</span>
          }
        />

        <nav className="flex-1 flex items-center justify-center gap-1 sm:gap-2 min-w-0">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                isActive(href, exact)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden sm:block text-right text-sm">
            <p className="font-medium leading-tight">{user?.name}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
            >
              <LogOut className="w-3 h-3" />
              Déconnexion
            </button>
          </div>
          <span className="hidden lg:block text-xs text-muted-foreground border-l border-border pl-4">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function CashierShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
      <CashierNav />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
