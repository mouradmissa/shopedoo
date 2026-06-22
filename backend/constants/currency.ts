export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';

export function toStripeAmount(amountInTnd: number): number {
  return Math.round(amountInTnd * 1000);
}
