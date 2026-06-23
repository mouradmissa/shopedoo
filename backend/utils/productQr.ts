import QRCode from 'qrcode';
import { HydratedDocument } from 'mongoose';
import { IProduct } from '../models/Product';

export async function generateProductQrImage(code: string): Promise<string> {
  return QRCode.toDataURL(code, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export async function ensureProductQrImage(
  product: HydratedDocument<IProduct>
): Promise<string | undefined> {
  if (!product.qrCode) return undefined;
  if (product.qrCodeImage) return product.qrCodeImage;

  product.qrCodeImage = await generateProductQrImage(product.qrCode);
  await product.save();
  return product.qrCodeImage;
}
