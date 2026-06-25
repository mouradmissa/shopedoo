import { API_BASE } from '@/lib/api';

export function resolveProductImageUrl(image?: string, productId?: string): string | undefined {
  if (!image && !productId) return undefined;

  if (image?.startsWith('http://') || image?.startsWith('https://') || image?.startsWith('data:')) {
    return image;
  }

  if (image?.includes('/api/catalog-products/')) {
    return image.startsWith('/') ? `${API_BASE}${image}` : image;
  }

  if (productId) {
    return `${API_BASE}/api/products/${productId}/image`;
  }

  if (image?.startsWith('/api/catalog-products/')) {
    return `${API_BASE}${image}`;
  }

  if (image?.startsWith('/')) {
    return `${API_BASE}${image}`;
  }

  return image;
}

export function resolveCatalogImageUrl(catalogProductId: string): string {
  return `${API_BASE}/api/catalog-products/${catalogProductId}/image`;
}
