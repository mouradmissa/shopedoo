'use client';

import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  logoHref: string;
  sectionLabel: string;
  center?: ReactNode;
  trailing?: ReactNode;
  mobileNav?: ReactNode;
  promoBar?: ReactNode;
  tone?: 'default' | 'shop';
  onLogout?: () => void;
  userName?: string;
  userSubtitle?: string;
}

export function AppHeader({
  logoHref,
  sectionLabel,
  center,
  trailing,
  mobileNav,
  promoBar,
  tone = 'default',
  onLogout,
  userName,
  userSubtitle,
}: AppHeaderProps) {
  const isShop = tone === 'shop';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 safe-top',
        isShop
          ? 'shop-header shadow-md shadow-primary/5'
          : 'bg-background/95 backdrop-blur border-b border-border'
      )}
    >
      {promoBar}
      <div
        className={cn(
          'page-container flex items-center justify-between gap-2 sm:gap-3',
          isShop ? 'h-16 sm:h-[4.5rem] py-2' : 'h-14 sm:h-16'
        )}
      >
        <ShopEdooLogo
          href={logoHref}
          variant="nav"
          suffix={
            <span
              className={cn(
                'font-semibold text-xs sm:text-sm hidden sm:inline truncate max-w-[88px] md:max-w-none',
                isShop ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              {sectionLabel}
            </span>
          }
          priority
        />

        {center && <div className="hidden md:flex flex-1 items-center justify-center min-w-0">{center}</div>}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {trailing}
          {(userName || onLogout) && (
            <>
              <div className="hidden sm:block text-right text-xs border-l border-border pl-3 ml-1">
                {userName && <p className="font-medium truncate max-w-[120px]">{userName}</p>}
                {userSubtitle && (
                  <p className="text-muted-foreground truncate max-w-[120px]">{userSubtitle}</p>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto mt-0.5"
                  >
                    <LogOut className="w-3 h-3" />
                    Déconnexion
                  </button>
                )}
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="sm:hidden touch-target hover:bg-muted rounded-lg transition"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {mobileNav && (
        <div className="md:hidden border-t border-border px-2 py-2 flex gap-1 overflow-x-auto">
          {mobileNav}
        </div>
      )}
    </header>
  );
}
