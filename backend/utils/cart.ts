import Cart from '../models/Cart';

export async function clearCartForUser(userId: string): Promise<void> {
  const cart = await Cart.findOne({ userId });
  if (!cart) return;

  cart.items = [];
  await cart.save();
}
