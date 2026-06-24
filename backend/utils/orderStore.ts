import { Types } from 'mongoose';
import Product from '../models/Product';
import Store from '../models/Store';

export async function resolveStoreIdFromProductIds(
  productIds: Array<string | Types.ObjectId>
): Promise<Types.ObjectId | null> {
  for (const productId of productIds) {
    const product = await Product.findById(productId).select('storeId');
    if (product?.storeId) {
      return product.storeId as Types.ObjectId;
    }
  }
  return null;
}

export async function getManagerStoreId(userId: string): Promise<Types.ObjectId | null> {
  const store = await Store.findOne({ managerId: userId }).select('_id');
  return store?._id ?? null;
}
