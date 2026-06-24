import type { Types } from 'mongoose';

export function getApiBaseUrl(): string {
  const base =
    process.env.API_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 5000}`;
  return base.replace(/\/$/, '');
}

export function buildProductImageUrl(productId: Types.ObjectId | string): string {
  return `${getApiBaseUrl()}/api/products/${String(productId)}/image`;
}

export function hasStoredImage(product: {
  imageData?: Buffer | { length: number } | null;
  imageStored?: boolean;
}): boolean {
  if (product.imageStored) return true;
  const data = product.imageData;
  if (!data) return false;
  if (Buffer.isBuffer(data)) return data.length > 0;
  return (data as { length: number }).length > 0;
}

export function sanitizeProductForClient(product: {
  _id: unknown;
  image?: string;
  imageStored?: boolean;
  imageData?: Buffer;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  const { imageData, ...rest } = raw;

  if (hasStoredImage({ imageStored: raw.imageStored as boolean, imageData: imageData as Buffer })) {
    rest.image = buildProductImageUrl(String(raw._id));
  }

  return rest;
}
