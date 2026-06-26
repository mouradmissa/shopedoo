export type ParsedProductQr =
  | { type: 'product'; productId: string }
  | { type: 'code'; code: string };

const PRODUCT_ID_PATTERN = /[a-f0-9]{24}/i;

export function parseScannedQrData(raw: string): ParsedProductQr | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('SHOPEDOO-')) {
    return { type: 'code', code: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const productPathMatch = url.pathname.match(/\/products\/([a-f0-9]{24})/i);
    if (productPathMatch) {
      return { type: 'product', productId: productPathMatch[1] };
    }

    if (url.pathname.includes('/qr-scanner')) {
      const fromQuery =
        url.searchParams.get('product') ||
        url.searchParams.get('id') ||
        url.searchParams.get('code');
      if (fromQuery) {
        if (PRODUCT_ID_PATTERN.test(fromQuery)) {
          return { type: 'product', productId: fromQuery };
        }
        if (fromQuery.startsWith('SHOPEDOO-')) {
          return { type: 'code', code: fromQuery };
        }
      }
    }
  } catch {
    const pathMatch = trimmed.match(/\/products\/([a-f0-9]{24})/i);
    if (pathMatch) {
      return { type: 'product', productId: pathMatch[1] };
    }
  }

  if (PRODUCT_ID_PATTERN.test(trimmed) && trimmed.length === 24) {
    return { type: 'product', productId: trimmed };
  }

  return null;
}
