export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';
export const CURRENCY_LOCALE = 'fr-TN';

export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} ${CURRENCY_SYMBOL}`;
}

export function formatPriceCompact(amount: number): string {
  return formatPrice(amount);
}

export function toStripeAmount(amountInTnd: number): number {
  return Math.round(amountInTnd * 1000);
}
