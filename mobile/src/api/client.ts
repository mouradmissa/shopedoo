import { API_URL } from './config';
import {
  clearStoredCart,
  persistCartResponse,
  type StoredCartItem,
} from '../storage/cartStorage';
import { clearStoredToken, getStoredToken, setStoredToken } from '../storage/tokenStorage';

export { API_BASE } from './config';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

class ApiClient {
  private token: string | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.token = await getStoredToken();
    this.initialized = true;
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await setStoredToken(token);
  }

  getToken(): string | null {
    return this.token;
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await clearStoredToken();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handleUnauthorized(status: number, error?: string): Promise<void> {
    if (status !== 401) return;
    const hadToken = !!this.token;
    const sessionInvalid =
      error === 'Invalid token' || error === 'No token provided' || hadToken;
    if (!sessionInvalid) return;
    await this.clearToken();
    unauthorizedHandler?.();
  }

  private async requestForm<T>(
    endpoint: string,
    method: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: this.getAuthHeaders(),
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        await this.handleUnauthorized(response.status, data.error);
        return {
          success: false,
          error: data.error || 'Une erreur est survenue',
          details: data.details,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau',
      };
    }
  }

  async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        await this.handleUnauthorized(response.status, data.error);
        return {
          success: false,
          error: data.error || 'Une erreur est survenue',
          details: data.details,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau',
      };
    }
  }

  async signup(email: string, password: string, name: string) {
    return this.request<{ token: string; user: unknown }>('/auth/signup', 'POST', {
      email,
      password,
      name,
    });
  }

  async signin(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>('/auth/signin', 'POST', {
      email,
      password,
    });
  }

  async getMe() {
    return this.request('/auth/me', 'GET');
  }

  async getProductCatalog(category?: string, search?: string) {
    let url = '/products/catalog/list';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, 'GET');
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`, 'GET');
  }

  async getProductByQR(qrCode: string) {
    return this.request(`/products/qr/${qrCode}`, 'GET');
  }

  async getCart() {
    const response = await this.request('/cart', 'GET');
    if (response.success && response.data) {
      await persistCartResponse(response.data);
    }
    return response;
  }

  async syncCart(items: StoredCartItem[]) {
    const response = await this.request('/cart/sync', 'POST', { items });
    if (response.success && response.data) {
      await persistCartResponse(response.data);
    }
    return response;
  }

  async addToCart(productId: string, quantity: number) {
    const response = await this.request('/cart/add', 'POST', { productId, quantity });
    if (response.success && response.data) {
      await persistCartResponse(response.data);
    }
    return response;
  }

  async removeFromCart(productId: string) {
    const response = await this.request(`/cart/remove/${productId}`, 'POST');
    if (response.success && response.data) {
      await persistCartResponse(response.data);
    }
    return response;
  }

  async updateCartItem(productId: string, quantity: number) {
    const response = await this.request(`/cart/update/${productId}`, 'PUT', { quantity });
    if (response.success && response.data) {
      await persistCartResponse(response.data);
    }
    return response;
  }

  async clearCart() {
    const response = await this.request('/cart/clear', 'DELETE');
    if (response.success) {
      await clearStoredCart();
    }
    return response;
  }

  async getOrders() {
    return this.request('/orders', 'GET');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`, 'GET');
  }

  async getOrderPaymentStatus(id: string) {
    return this.request<{
      status: string;
      paidAt?: string;
      paymentMethod?: string;
      totalAmount?: number;
    }>(`/orders/${id}/payment-status`, 'GET');
  }

  async createOrder(shippingAddress: string, paymentMethod: string) {
    return this.request('/orders/checkout', 'POST', { shippingAddress, paymentMethod });
  }

  async getAllOrders(status?: string) {
    let url = '/orders/admin/all';
    if (status) url += `?status=${status}`;
    return this.request(url, 'GET');
  }

  async getManagerOrders(status?: string) {
    let url = '/orders/manager/mine';
    if (status) url += `?status=${status}`;
    return this.request(url, 'GET');
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, 'PUT', { status });
  }

  async getPaymentConfig() {
    return this.request<{ publishableKey: string; currency: string }>('/payment/config', 'GET');
  }

  async createPaymentIntent(orderId: string) {
    return this.request<{ clientSecret: string; paymentIntentId: string }>(
      '/payment/create-payment-intent',
      'POST',
      { orderId }
    );
  }

  async confirmPayment(orderId: string, paymentIntentId: string) {
    return this.request<{ success: boolean; order: unknown }>('/payment/confirm-payment', 'POST', {
      orderId,
      paymentIntentId,
    });
  }

  async confirmCashPayment(qrCode: string) {
    return this.request('/orders/cashier/invoice/confirm', 'POST', { invoiceQrCode: qrCode });
  }

  async getPublicStores() {
    return this.request('/stores/public', 'GET');
  }

  async getStores() {
    return this.request('/stores', 'GET');
  }

  async getMyStore() {
    return this.request('/stores/my', 'GET');
  }

  async getOnlineOrders(status?: string) {
    let url = '/orders/online/list';
    if (status) url += `?status=${status}`;
    return this.request(url, 'GET');
  }

  async getDriverOrders() {
    return this.request('/orders/driver/mine', 'GET');
  }

  async getDriverArchive() {
    return this.request('/orders/driver/archive', 'GET');
  }

  async assignOrderDriver(orderId: string, driverId: string) {
    return this.request(`/orders/${orderId}/assign`, 'PUT', { driverId });
  }

  async markOrderDelivered(orderId: string) {
    return this.request(`/orders/${orderId}/driver/delivered`, 'PUT');
  }

  async getProducts(category?: string, search?: string, storeId?: string) {
    let url = '/products';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (storeId) params.append('storeId', storeId);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, 'GET');
  }

  async getCatalogProducts(category?: string, search?: string) {
    let url = '/catalog-products';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, 'GET');
  }

  async getDrivers() {
    return this.request('/users/drivers', 'GET');
  }

  async createProduct(
    data: {
      name: string;
      description: string;
      price: number;
      category: string;
      stock: number;
      storeId?: string;
      catalogProductId?: string;
    },
    imageUri?: string | null
  ) {
    if (imageUri) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      formData.append('category', data.category);
      formData.append('stock', String(data.stock));
      if (data.storeId) formData.append('storeId', data.storeId);
      if (data.catalogProductId) formData.append('catalogProductId', data.catalogProductId);
      formData.append('image', {
        uri: imageUri,
        name: 'product.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      return this.requestForm('/products', 'POST', formData);
    }
    return this.request('/products', 'POST', data);
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, 'DELETE');
  }

  async getStoreCashiers(storeId: string) {
    return this.request(`/stores/${storeId}/cashiers`, 'GET');
  }

  async createCashier(
    storeId: string,
    data: { name: string; email: string; password: string; phone?: string }
  ) {
    return this.request(`/stores/${storeId}/cashiers`, 'POST', data);
  }

  async createCatalogProduct(
    data: {
      name: string;
      description: string;
      price: number;
      category: string;
      stock?: number;
    },
    imageUri?: string | null
  ) {
    if (imageUri) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      formData.append('category', data.category);
      if (data.stock !== undefined) formData.append('stock', String(data.stock));
      formData.append('image', {
        uri: imageUri,
        name: 'catalog.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      return this.requestForm('/catalog-products', 'POST', formData);
    }
    return this.request('/catalog-products', 'POST', data);
  }

  async deleteCatalogProduct(id: string) {
    return this.request(`/catalog-products/${id}`, 'DELETE');
  }

  async createDriver(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return this.request('/users/drivers', 'POST', data);
  }
}

export const apiClient = new ApiClient();
