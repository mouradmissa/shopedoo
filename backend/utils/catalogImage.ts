import type { Types } from 'mongoose';
import { getApiBaseUrl, hasStoredImage } from './productImage';

export function buildCatalogProductImageUrl(catalogProductId: Types.ObjectId | string): string {
  return `${getApiBaseUrl()}/api/catalog-products/${String(catalogProductId)}/image`;
}

export function sanitizeCatalogProductForClient(catalog: {
  _id: unknown;
  image?: string;
  imageStored?: boolean;
  imageData?: Buffer;
  toObject?: () => Record<string, unknown>;
}): Record<string, unknown> {
  const raw = typeof catalog.toObject === 'function' ? catalog.toObject() : { ...catalog };
  const { imageData, ...rest } = raw;

  if (hasStoredImage({ imageStored: raw.imageStored as boolean, imageData: imageData as Buffer })) {
    rest.image = buildCatalogProductImageUrl(String(raw._id));
  }

  return rest;
}
