const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_URL = `${API_BASE}/api`;

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

  // Auth endpoints
  async signup(email: string, password: string, name: string) {
    return this.request('/auth/signup', 'POST', { email, password, name });
  }

  async signin(email: string, password: string) {
    return this.request('/auth/signin', 'POST', { email, password });
  }

  async getMe() {
    return this.request('/auth/me', 'GET');
  }

  // Products endpoints
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

  async createProduct(data: any) {
    return this.request('/products', 'POST', data);
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, 'PUT', data);
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, 'DELETE');
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart', 'GET');
  }

  async addToCart(productId: string, quantity: number) {
    return this.request('/cart/add', 'POST', { productId, quantity });
  }

  async removeFromCart(productId: string) {
    return this.request(`/cart/remove/${productId}`, 'POST');
  }

  async updateCartItem(productId: string, quantity: number) {
    return this.request(`/cart/update/${productId}`, 'PUT', { quantity });
  }

  async clearCart() {
    return this.request('/cart/clear', 'DELETE');
  }

  // Orders endpoints
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

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, 'PUT', { status });
  }

  // Payment endpoints
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

  // Stores endpoints
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
}

export const apiClient = new ApiClient();
