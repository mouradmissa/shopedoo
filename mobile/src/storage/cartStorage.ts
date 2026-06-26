import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'shopedoo_cart_v1';

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export async function saveCartItems(items: StoredCartItem[]): Promise<void> {
  await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export async function loadCartItems(): Promise<StoredCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredCartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) => item && typeof item.productId === 'string' && item.quantity > 0
    );
  } catch {
    return [];
  }
}

export async function clearStoredCart(): Promise<void> {
  await AsyncStorage.removeItem(CART_STORAGE_KEY);
}

export function extractCartItemsFromResponse(cart: unknown): StoredCartItem[] {
  if (!cart || typeof cart !== 'object') return [];

  const items = (cart as { items?: unknown[] }).items;
  if (!Array.isArray(items)) return [];

  return items
    .map((row) => {
      const item = row as {
        productId?: { _id?: string } | string;
        quantity?: number;
      };
      const productId =
        typeof item.productId === 'string'
          ? item.productId
          : item.productId?._id
            ? String(item.productId._id)
            : null;

      if (!productId || !item.quantity || item.quantity < 1) return null;
      return { productId, quantity: item.quantity };
    })
    .filter((row): row is StoredCartItem => row !== null);
}

export async function persistCartResponse(cart: unknown): Promise<void> {
  const items = extractCartItemsFromResponse(cart);
  await saveCartItems(items);
}
