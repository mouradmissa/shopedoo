import Order from '../models/Order';
import Product from '../models/Product';
import { clearCartForUser } from './cart';
import { resolveStoreIdFromProductIds } from './orderStore';

export async function fulfillOnlineOrderPayment(orderId: string, stripePaymentId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }

  if (order.status === 'paid') {
    return order;
  }

  if (order.paymentMethod === 'online') {
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error('Produit introuvable pour finaliser le paiement');
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save();
    }
  }

  order.status = 'paid';
  order.stripePaymentId = stripePaymentId;
  order.paidAt = new Date();

  if (!order.storeId) {
    const storeId = await resolveStoreIdFromProductIds(
      order.items.map((item) => item.productId as unknown as string)
    );
    if (storeId) order.storeId = storeId;
  }

  await order.save();

  await clearCartForUser(String(order.userId));

  return order;
}
