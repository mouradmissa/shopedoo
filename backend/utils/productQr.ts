import QRCode from 'qrcode';
import { HydratedDocument } from 'mongoose';
import { IProduct } from '../models/Product';

export function getProductPageUrl(productId: string): string {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/products/${productId}`;
}

export async function generateProductQrImage(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export async function ensureProductQrImage(
  product: HydratedDocument<IProduct>
): Promise<string | undefined> {
  const productId = String(product._id);
  const payload = getProductPageUrl(productId);

  if (!product.qrCodeImage || product.qrCodePayload !== payload) {
    product.qrCodePayload = payload;
    product.qrCodeImage = await generateProductQrImage(payload);
    await product.save();
  }

  return product.qrCodeImage;
}
