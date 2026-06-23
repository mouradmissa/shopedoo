import Link from 'next/link';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-top">
        <div className="page-container h-14 sm:h-16 flex items-center justify-between">
          <ShopEdooLogo href="/" variant="nav" priority />
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Boutique
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
