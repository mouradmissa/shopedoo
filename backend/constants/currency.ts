export const CURRENCY_CODE = 'TND';
export const CURRENCY_SYMBOL = 'DT';

const DEFAULT_TND_TO_EUR = 0.29;

export function getStripeCurrency(): string {
  return (process.env.STRIPE_CURRENCY || 'eur').toLowerCase();
}

export function toStripeAmount(amountInTnd: number): number {
  const currency = getStripeCurrency();
  const safeAmount = Number.isFinite(amountInTnd) ? amountInTnd : 0;

  if (currency === 'tnd') {
    return Math.max(100, Math.round(safeAmount * 1000));
  }

  if (currency === 'usd') {
    const rate = Number(process.env.STRIPE_TND_TO_USD_RATE || '0.32');
    return Math.max(50, Math.round(safeAmount * rate * 100));
  }

  const rate = Number(process.env.STRIPE_TND_TO_EUR_RATE || String(DEFAULT_TND_TO_EUR));
  return Math.max(50, Math.round(safeAmount * rate * 100));
}

export function stripeAmountLabel(amountInTnd: number): string {
  const currency = getStripeCurrency();
  const stripeAmount = toStripeAmount(amountInTnd);
  if (currency === 'eur') {
    return `${(stripeAmount / 100).toFixed(2)} EUR`;
  }
  if (currency === 'usd') {
    return `${(stripeAmount / 100).toFixed(2)} USD`;
  }
  return `${(stripeAmount / 1000).toFixed(3)} TND`;
}
