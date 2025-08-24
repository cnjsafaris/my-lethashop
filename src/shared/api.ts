import { config } from './config';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookie-based auth
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }

  // Auth endpoints
  async getOAuthRedirectUrl() {
    return this.request('/oauth/google/redirect_url');
  }

  async createSession(code: string) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async logout() {
    return this.request('/logout');
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  // Products
  async getProducts(params: { category?: string; featured?: boolean } = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.featured) searchParams.append('featured', 'true');
    
    const query = searchParams.toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(slug: string) {
    return this.request(`/products/${slug}`);
  }

  // Cart endpoints (placeholder - needs backend implementation)
  async getCart() {
    try {
      return this.request('/cart');
    } catch (error) {
      // Return empty cart if endpoint not implemented yet
      return { items: [], total: 0 };
    }
  }

  async addToCart(productId: number, quantity: number = 1) {
    try {
      return this.request('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      });
    } catch (error) {
      // For now, store cart in localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '{"items": [], "total": 0}');
      const existingItemIndex = cart.items.findIndex((item: any) => item.product_id === productId);
      
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ product_id: productId, quantity, id: Date.now() });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      return { success: true };
    }
  }

  async removeFromCart(itemId: number) {
    try {
      return this.request(`/cart/${itemId}`, { method: 'DELETE' });
    } catch (error) {
      // Remove from localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '{"items": [], "total": 0}');
      cart.items = cart.items.filter((item: any) => item.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(cart));
      return { success: true };
    }
  }

  async clearCart() {
    try {
      return this.request('/cart', { method: 'DELETE' });
    } catch (error) {
      localStorage.removeItem('cart');
      return { success: true };
    }
  }

  // Admin endpoints (placeholder)
  async deleteProduct(productId: number) {
    return this.request(`/admin/products/${productId}`, { method: 'DELETE' });
  }

  async createProduct(product: any) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(productId: number, product: any) {
    return this.request(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  // Orders (placeholder)
  async createOrder(order: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrderStatus(orderId: string) {
    return this.request(`/orders/${orderId}/status`);
  }

  // Payments (placeholder)
  async initiateMpesaPayment(payment: any) {
    return this.request('/payments/mpesa/stkpush', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }
}

export const apiClient = new ApiClient();