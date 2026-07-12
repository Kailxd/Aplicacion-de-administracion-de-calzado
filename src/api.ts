import { Brand, Category, Color, Size, Product, StockItem, User } from './types';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.map((e: any) => e.message).join(' '));
    }
    const err = new Error(data.error || `Error en la solicitud (${response.status})`) as any;
    if (data.unverified) err.unverified = data.unverified;
    if (data.email) err.email = data.email;
    if (data.userId) err.userId = data.userId;
    throw err;
  }
  return data as T;
}

function getHeaders(contentType: string | null = 'application/json'): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const localCurrentUser = sessionStorage.getItem('sdc_current_user');
    if (localCurrentUser) {
      try {
        const user = JSON.parse(localCurrentUser);
        if (user.id) {
          headers['X-User-Id'] = user.id;
        }
        if (user.role) {
          headers['X-User-Role'] = user.role;
        }
      } catch (e) {
        // ignore JSON parsing errors
      }
    }
  }
  return headers;
}

export const api = {
  // Auth
  login: async (username: string, pass: string): Promise<User> => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password: pass })
    });
    const data = await handleResponse<{ user: User }>(res);
    return data.user;
  },

  // Reset DB
  resetDatabase: async (): Promise<void> => {
    const res = await fetch('/api/reset', { 
      method: 'POST',
      headers: getHeaders(null)
    });
    await handleResponse<{ message: string }>(res);
  },

  // Upload image
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getHeaders(null),
      body: formData
    });
    const data = await handleResponse<{ imageUrl: string }>(res);
    return data.imageUrl;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', {
      headers: getHeaders(null)
    });
    return handleResponse<User[]>(res);
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    return handleResponse<User>(res);
  },

  updateUser: async (id: string, user: Partial<User>): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    return handleResponse<User>(res);
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await fetch(`/api/users/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  sendVerificationCode: async (userId?: string, email?: string): Promise<{ success: boolean; message: string; code?: string }> => {
    const res = await fetch('/api/users/send-code', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, email })
    });
    return handleResponse<{ success: boolean; message: string; code?: string }>(res);
  },

  verifyCode: async (code: string, userId?: string, email?: string): Promise<{ success: boolean; message: string; user: User }> => {
    const res = await fetch('/api/users/verify-code', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, userId, email })
    });
    return handleResponse<{ success: boolean; message: string; user: User }>(res);
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const res = await fetch('/api/brands', {
      headers: getHeaders(null)
    });
    return handleResponse<Brand[]>(res);
  },

  createBrand: async (name: string, description: string, status: 'Activo' | 'Inactivo'): Promise<Brand> => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, status })
    });
    return handleResponse<Brand>(res);
  },

  updateBrand: async (id: string, name: string, description: string, status: 'Activo' | 'Inactivo'): Promise<Brand> => {
    const res = await fetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, status })
    });
    return handleResponse<Brand>(res);
  },

  deleteBrand: async (id: string): Promise<void> => {
    const res = await fetch(`/api/brands/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch('/api/categories', {
      headers: getHeaders(null)
    });
    return handleResponse<Category[]>(res);
  },

  createCategory: async (name: string, description: string): Promise<Category> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    });
    return handleResponse<Category>(res);
  },

  updateCategory: async (id: string, name: string, description: string): Promise<Category> => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    });
    return handleResponse<Category>(res);
  },

  deleteCategory: async (id: string): Promise<void> => {
    const res = await fetch(`/api/categories/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // Colors
  getColors: async (): Promise<Color[]> => {
    const res = await fetch('/api/colors', {
      headers: getHeaders(null)
    });
    return handleResponse<Color[]>(res);
  },

  createColor: async (name: string, hex: string): Promise<Color> => {
    const res = await fetch('/api/colors', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, hex })
    });
    return handleResponse<Color>(res);
  },

  updateColor: async (id: string, name: string, hex: string): Promise<Color> => {
    const res = await fetch(`/api/colors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, hex })
    });
    return handleResponse<Color>(res);
  },

  deleteColor: async (id: string): Promise<void> => {
    const res = await fetch(`/api/colors/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // Sizes
  getSizes: async (): Promise<Size[]> => {
    const res = await fetch('/api/sizes', {
      headers: getHeaders(null)
    });
    return handleResponse<Size[]>(res);
  },

  createSize: async (value: number, gender: 'Dama' | 'Caballero'): Promise<Size> => {
    const res = await fetch('/api/sizes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ value, gender })
    });
    return handleResponse<Size>(res);
  },

  updateSize: async (id: string, value: number, gender: 'Dama' | 'Caballero'): Promise<Size> => {
    const res = await fetch(`/api/sizes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ value, gender })
    });
    return handleResponse<Size>(res);
  },

  deleteSize: async (id: string): Promise<void> => {
    const res = await fetch(`/api/sizes/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch('/api/products', {
      headers: getHeaders(null)
    });
    return handleResponse<Product[]>(res);
  },

  createProduct: async (productPayload: Omit<Product, 'id'>): Promise<Product> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productPayload)
    });
    return handleResponse<Product>(res);
  },

  updateProduct: async (id: string, productPayload: Omit<Product, 'id'>): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productPayload)
    });
    return handleResponse<Product>(res);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // Stock
  getStock: async (): Promise<StockItem[]> => {
    const res = await fetch('/api/stock', {
      headers: getHeaders(null)
    });
    return handleResponse<StockItem[]>(res);
  },

  createStock: async (stockPayload: Omit<StockItem, 'id'>): Promise<StockItem> => {
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(stockPayload)
    });
    return handleResponse<StockItem>(res);
  },

  updateStock: async (id: string, updatedFields: Partial<StockItem>): Promise<StockItem> => {
    const res = await fetch(`/api/stock/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedFields)
    });
    return handleResponse<StockItem>(res);
  },

  deleteStock: async (id: string): Promise<void> => {
    const res = await fetch(`/api/stock/${id}`, { 
      method: 'DELETE',
      headers: getHeaders(null)
    });
    await handleResponse<{ success: boolean }>(res);
  }
};
