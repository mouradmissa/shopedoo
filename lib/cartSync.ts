import { apiClient } from '@/lib/api';
import {
  clearStoredCart,
  loadCartItems,
  persistCartResponse,
  type StoredCartItem,
} from '@/lib/cartStorage';

/** Restaure le panier sauvegardé après connexion / reconnexion */
export async function restoreCartAfterLogin(): Promise<void> {
  const localItems = loadCartItems();

  if (localItems.length > 0) {
    const sync = await apiClient.syncCart(localItems);
    if (sync.success && sync.data) {
      persistCartResponse(sync.data);
      return;
    }
  }

  const cart = await apiClient.getCart();
  if (cart.success && cart.data) {
    persistCartResponse(cart.data);
  }
}

/** Sauvegarde le panier serveur en local avant déconnexion */
export async function snapshotCartBeforeLogout(): Promise<void> {
  const cart = await apiClient.getCart();
  if (cart.success && cart.data) {
    persistCartResponse(cart.data);
  }
}

export async function syncCartItems(items: StoredCartItem[]) {
  return apiClient.syncCart(items);
}

export function clearLocalCart(): void {
  clearStoredCart();
}
