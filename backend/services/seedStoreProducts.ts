import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import Product from '../models/Product';
import QRCode from '../models/QRCode';
import { SEED_PRODUCTS } from '../data/seedProducts';
import { generateProductQrImage, getProductPageUrl } from '../utils/productQr';

export async function ensureProductsForStore(
  storeId: string | Types.ObjectId,
  governorate: string
): Promise<{ created: number; details: string[] }> {
  let created = 0;
  const details: string[] = [];
  const storeObjectId = new Types.ObjectId(String(storeId));

  for (const template of SEED_PRODUCTS) {
    const existing = await Product.findOne({
      storeId: storeObjectId,
      name: template.name,
      category: template.category,
    });

    if (existing) {
      continue;
    }

    const product = new Product({
      name: template.name,
      description: template.description,
      price: template.price,
      category: template.category,
      stock: template.stock,
      image: template.image,
      storeId: storeObjectId,
    });
    await product.save();

    const code = `SHOPEDOO-${randomUUID()}`;
    const payload = getProductPageUrl(String(product._id));
    const qrCodeImage = await generateProductQrImage(payload);

    await new QRCode({
      productId: product._id,
      code,
    }).save();

    product.qrCode = code;
    product.qrCodePayload = payload;
    product.qrCodeImage = qrCodeImage;
    await product.save();

    details.push(`${governorate}: produit créé — ${template.name}`);
    created++;
  }

  return { created, details };
}
