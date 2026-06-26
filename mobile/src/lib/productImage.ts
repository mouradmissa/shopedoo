import { API_BASE } from '../api/config';

/** Réécrit les URLs média du backend (souvent localhost) vers l'API mobile (IP LAN). */
export function normalizeMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;

  const apiPathMatch = url.match(
    /(\/api\/(?:products|catalog-products)\/[^?\s]+\/(?:image|qr-image))/
  );
  if (apiPathMatch) {
    return `${API_BASE}${apiPathMatch[1]}`;
  }

  if (url.startsWith('data:')) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/api/')) {
        return `${API_BASE}${parsed.pathname}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith('/api/') || url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }

  return url;
}

export function resolveProductImageUrl(image?: string, productId?: string): string | undefined {
  if (!image && !productId) return undefined;

  if (image) {
    const normalized = normalizeMediaUrl(image);
    if (normalized) return normalized;
  }

  if (productId) {
    return `${API_BASE}/api/products/${productId}/image`;
  }

  return undefined;
}

export function resolveCatalogImageUrl(catalogProductId: string): string {
  return `${API_BASE}/api/catalog-products/${catalogProductId}/image`;
}

export function resolveProductQrImageUrl(productId: string): string {
  return `${API_BASE}/api/products/${productId}/qr-image`;
}

/** Image pour un article catalogue (boutique en ligne) ou produit magasin */
export function resolveCatalogItemImageUrl(item: {
  _id: string;
  image?: string;
  defaultProductId?: string;
  catalogProductId?: string;
}): string | undefined {
  const storeProductId = item.defaultProductId;
  const catalogId = item.catalogProductId ?? (!storeProductId ? item._id : undefined);

  const resolved =
    resolveProductImageUrl(item.image, storeProductId) ||
    (catalogId ? resolveCatalogImageUrl(catalogId) : undefined) ||
    resolveProductImageUrl(item.image, item._id);

  return normalizeMediaUrl(resolved);
}
