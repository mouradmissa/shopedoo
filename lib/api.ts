import { clearStoredCart, persistCartResponse, type StoredCartItem } from './cartStorage';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_URL = `${API_BASE}/api`;

export { API_BASE };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private syncTokenFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authToken');
      if (stored) this.token = stored;
    }
  }

  private getHeaders(): HeadersInit {
    this.syncTokenFromStorage();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private getAuthHeaders(): HeadersInit {
    this.syncTokenFromStorage();
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async requestForm<T>(
    endpoint: string,
    method: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const response = await fetch(url, {
        method,
        headers: this.getAuthHeaders(),
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async signup(email: string, password: string, name: string) {
    return this.request('/auth/signup', 'POST', { email, password, name });
  }

  async signin(email: string, password: string) {
    return this.request('/auth/signin', 'POST', { email, password });
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

  async getProducts(category?: string, search?: string, storeId?: string) {
    let url = '/products';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (storeId) params.append('storeId', storeId);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, 'GET');
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`, 'GET');
  }

  async getProductByQR(qrCode: string) {
    return this.request(`/products/qr/${qrCode}`, 'GET');
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
    imageFile?: File | null
  ) {
    if (imageFile) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.price !== undefined) formData.append('price', String(data.price));
      if (data.category) formData.append('category', data.category);
      formData.append('stock', String(data.stock));
      if (data.storeId) formData.append('storeId', data.storeId);
      if (data.catalogProductId) formData.append('catalogProductId', data.catalogProductId);
      formData.append('image', imageFile);
      return this.requestForm('/products', 'POST', formData);
    }
    return this.request('/products', 'POST', data);
  }

  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      stock: number;
    }>,
    imageFile?: File | null
  ) {
    if (imageFile) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.price !== undefined) formData.append('price', String(data.price));
      if (data.category) formData.append('category', data.category);
      if (data.stock !== undefined) formData.append('stock', String(data.stock));
      formData.append('image', imageFile);
      return this.requestForm(`/products/${id}`, 'PUT', formData);
    }
    return this.request(`/products/${id}`, 'PUT', data);
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, 'DELETE');
  }

  async getCart() {
    const response = await this.request('/cart', 'GET');
    if (response.success && response.data) {
      persistCartResponse(response.data);
    }
    return response;
  }

  async syncCart(items: StoredCartItem[]) {
    const response = await this.request('/cart/sync', 'POST', { items });
    if (response.success && response.data) {
      persistCartResponse(response.data);
    }
    return response;
  }

  async addToCart(productId: string, quantity: number) {
    const response = await this.request('/cart/add', 'POST', { productId, quantity });
    if (response.success && response.data) {
      persistCartResponse(response.data);
    }
    return response;
  }

  async removeFromCart(productId: string) {
    const response = await this.request(`/cart/remove/${productId}`, 'POST');
    if (response.success && response.data) {
      persistCartResponse(response.data);
    }
    return response;
  }

  async updateCartItem(productId: string, quantity: number) {
    const response = await this.request(`/cart/update/${productId}`, 'PUT', { quantity });
    if (response.success && response.data) {
      persistCartResponse(response.data);
    }
    return response;
  }

  async clearCart() {
    const response = await this.request('/cart/clear', 'DELETE');
    if (response.success) {
      clearStoredCart();
    }
    return response;
  }

  async getOrders() {
    return this.request('/orders', 'GET');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`, 'GET');
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

  async createStore(data: {
    name: string;
    city: string;
    governorate: string;
    address: string;
    manager: { name: string; email: string; password: string; phone?: string };
  }) {
    return this.request('/stores', 'POST', data);
  }

  async updateStore(
    id: string,
    data: Partial<{ name: string; city: string; governorate: string; address: string; isActive: boolean }>
  ) {
    return this.request(`/stores/${id}`, 'PUT', data);
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

  async getStaffUsers(role?: string) {
    let url = '/users';
    if (role) url += `?role=${role}`;
    return this.request(url, 'GET');
  }

  async createStaffUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'online_manager' | 'driver';
  }) {
    return this.request('/users', 'POST', data);
  }

  async getDrivers() {
    return this.request('/users/drivers', 'GET');
  }

  async getCatalogProducts(category?: string, search?: string) {
    let url = '/catalog-products';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request(url, 'GET');
  }

  async createCatalogProduct(
    data: {
      name: string;
      description: string;
      price: number;
      category: string;
    },
    imageFile?: File | null
  ) {
    if (imageFile) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      formData.append('category', data.category);
      formData.append('image', imageFile);
      return this.requestForm('/catalog-products', 'POST', formData);
    }
    return this.request('/catalog-products', 'POST', data);
  }

  async updateCatalogProduct(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      isActive: boolean;
    }>,
    imageFile?: File | null
  ) {
    if (imageFile) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.price !== undefined) formData.append('price', String(data.price));
      if (data.category) formData.append('category', data.category);
      formData.append('image', imageFile);
      return this.requestForm(`/catalog-products/${id}`, 'PUT', formData);
    }
    return this.request(`/catalog-products/${id}`, 'PUT', data);
  }

  async deleteCatalogProduct(id: string) {
    return this.request(`/catalog-products/${id}`, 'DELETE');
  }

  async getOnlineOrders(status?: string) {
    let url = '/orders/online/list';
    if (status) url += `?status=${status}`;
    return this.request(url, 'GET');
  }

  async getDriverOrders() {
    return this.request('/orders/driver/mine', 'GET');
  }

  async assignOrderDriver(orderId: string, driverId: string) {
    return this.request(`/orders/${orderId}/assign`, 'PUT', { driverId });
  }

  async markOrderDelivered(orderId: string) {
    return this.request(`/orders/${orderId}/driver/delivered`, 'PUT');
  }
}

export const apiClient = new ApiClient();
