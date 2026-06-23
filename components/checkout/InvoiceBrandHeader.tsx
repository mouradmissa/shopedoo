import { ShopEdooLogo } from '@/components/brand/ShopEdooLogo';

interface InvoiceBrandHeaderProps {
  orderRef?: string;
  status?: 'pending' | 'paid';
}

export function InvoiceBrandHeader({ orderRef, status }: InvoiceBrandHeaderProps) {
  return (
    <div className="px-4 sm:px-5 py-4 border-b border-border bg-muted/40">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-3 min-w-0 w-full sm:w-auto">
          <ShopEdooLogo variant="invoice" className="justify-center sm:justify-start shrink-0" />
          {orderRef && (
            <p className="text-xs text-muted-foreground font-mono text-center sm:text-left">
              #{orderRef}
            </p>
          )}
        </div>

        {status && (
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
              status === 'paid'
                ? 'bg-green-500/15 text-green-700 border border-green-500/30'
                : 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
            }`}
          >
            {status === 'paid' ? 'PAYÉE' : 'EN ATTENTE'}
          </span>
        )}
      </div>
    </div>
  );
}
