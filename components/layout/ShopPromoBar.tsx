import { Sparkles } from 'lucide-react';

export function ShopPromoBar() {
  return (
    <div className="shop-promo-bar">
      <div className="page-container py-2 flex items-center justify-center gap-2 text-center">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-primary-foreground/90" />
        <p className="text-xs sm:text-sm font-medium text-primary-foreground">
          <span className="font-bold">Offre du moment</span>
          <span className="hidden sm:inline"> — </span>
          <span className="opacity-90">
            Nouveautés télécom & stock actualisé dans nos boutiques partout en Tunisie
          </span>
        </p>
      </div>
    </div>
  );
}
