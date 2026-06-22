export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';
export const CURRENCY_LOCALE = 'fr-TN';

/** Dinar tunisien — 3 décimales (millimes) */
export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} ${CURRENCY_SYMBOL}`;
}

/** Montant compact pour tableaux admin */
export function formatPriceCompact(amount: number): string {
  return formatPrice(amount);
}

/** Conversion pour Stripe : 1 TND = 1000 millimes */
export function toStripeAmount(amountInTnd: number): number {
  return Math.round(amountInTnd * 1000);
}
