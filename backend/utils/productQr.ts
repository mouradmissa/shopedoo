import QRCodeLib from 'qrcode';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IProduct } from '../models/Product';
import QRCode from '../models/QRCode';

export function getProductPageUrl(productId: string): string {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/products/${productId}`;
}

export async function generateProductQrImage(payload: string): Promise<string> {
  return QRCodeLib.toDataURL(payload, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export async function ensureProductQr(product: HydratedDocument<IProduct>): Promise<void> {
  const productId = String(product._id);
  const payload = getProductPageUrl(productId);

  let qrRecord = await QRCode.findOne({ productId: product._id });

  if (!product.qrCode) {
    if (qrRecord) {
      product.qrCode = qrRecord.code;
    } else {
      const code = `SHOPEDOO-${uuidv4()}`;
      qrRecord = await new QRCode({ productId: product._id, code }).save();
      product.qrCode = code;
    }
  } else if (!qrRecord) {
    qrRecord = await new QRCode({ productId: product._id, code: product.qrCode }).save();
  }

  if (!product.qrCodeImage || product.qrCodePayload !== payload) {
    product.qrCodePayload = payload;
    product.qrCodeImage = await generateProductQrImage(payload);
  }

  await product.save();
}

/** @deprecated Use ensureProductQr */
export async function ensureProductQrImage(
  product: HydratedDocument<IProduct>
): Promise<string | undefined> {
  await ensureProductQr(product);
  return product.qrCodeImage;
}
