import { API_BASE } from '@/lib/api';

export function resolveProductImageUrl(image?: string, productId?: string): string | undefined {
  if (!image && !productId) return undefined;

  if (image?.startsWith('http://') || image?.startsWith('https://') || image?.startsWith('data:')) {
    return image;
  }

  if (productId) {
    return `${API_BASE}/api/products/${productId}/image`;
  }

  if (image?.startsWith('/')) {
    return `${API_BASE}${image}`;
  }

  return image;
}
