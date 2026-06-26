import { apiClient } from '../api/client';
import {
  clearStoredCart,
  loadCartItems,
  persistCartResponse,
} from '../storage/cartStorage';

export async function restoreCartAfterLogin(): Promise<void> {
  const localItems = await loadCartItems();

  if (localItems.length > 0) {
    const sync = await apiClient.syncCart(localItems);
    if (sync.success && sync.data) {
      await persistCartResponse(sync.data);
      return;
    }
  }

  const cart = await apiClient.getCart();
  if (cart.success && cart.data) {
    await persistCartResponse(cart.data);
  }
}

export async function snapshotCartBeforeLogout(): Promise<void> {
  const cart = await apiClient.getCart();
  if (cart.success && cart.data) {
    await persistCartResponse(cart.data);
  }
}

export async function clearLocalCart(): Promise<void> {
  await clearStoredCart();
}
