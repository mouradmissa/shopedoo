const CART_STORAGE_KEY = 'shopedoo_cart_v1';

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export function saveCartItems(items: StoredCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function loadCartItems(): StoredCartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
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

export function clearStoredCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
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

export function persistCartResponse(cart: unknown): void {
  const items = extractCartItemsFromResponse(cart);
  saveCartItems(items);
}
