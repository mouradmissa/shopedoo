import Link from 'next/link';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';
import { ShopPromoBar } from '@/components/layout/ShopPromoBar';
import { ShopFooter } from '@/components/layout/ShopFooter';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen shop-page-bg flex flex-col">
      <header className="shop-header sticky top-0 z-50 safe-top shadow-md shadow-primary/5">
        <ShopPromoBar />
        <div className="page-container h-16 sm:h-[4.5rem] flex items-center justify-between">
          <ShopEdooLogo
            href="/"
            variant="nav"
            priority
            suffix={
              <span className="font-bold text-xs sm:text-sm text-primary hidden sm:inline">Boutique</span>
            }
          />
          <Link
            href="/"
            className="text-sm font-semibold text-secondary hover:text-primary transition"
          >
            Retour au catalogue
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">{children}</main>
      <ShopFooter />
    </div>
  );
}
