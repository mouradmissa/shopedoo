interface OnlineStockBadgeProps {
  onlineStock: number;
  className?: string;
}

export function OnlineStockBadge({ onlineStock, className = '' }: OnlineStockBadgeProps) {
  const available = onlineStock > 0;

  return (
    <span
      className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${
        available
          ? 'bg-green-500/10 text-green-700 border border-green-500/20'
          : 'bg-muted text-muted-foreground border border-border'
      } ${className}`}
    >
      {available ? 'Disponible en ligne' : 'Non disponible en ligne'}
    </span>
  );
}
