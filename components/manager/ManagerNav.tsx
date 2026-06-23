'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Package, Store, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

const NAV = [
  { href: '/manager', label: 'Tableau de bord', icon: Store },
  { href: '/manager/products', label: 'Produits', icon: Package },
  { href: '/manager/cashiers', label: 'Caissiers', icon: Users },
];

export function ManagerNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <ShopEdooLogo
          href="/manager"
          height={32}
          className="shrink min-w-0"
          imageClassName="h-8 w-auto max-w-[100px]"
          suffix={<span className="font-bold text-sm hidden sm:inline text-muted-foreground">Gérant</span>}
        />

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right text-xs">
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground truncate max-w-[140px]">{user?.store?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="p-2 hover:bg-muted rounded-lg transition"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="md:hidden border-t border-border px-2 py-2 flex gap-1 overflow-x-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
