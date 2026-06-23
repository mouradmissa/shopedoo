export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';

export function toStripeAmount(amountInTnd: number): number {
  const currency = (process.env.STRIPE_CURRENCY || CURRENCY_CODE).toLowerCase();
  if (currency === 'eur' || currency === 'usd') {
    return Math.round(amountInTnd * 100);
  }
  return Math.round(amountInTnd * 1000);
}
