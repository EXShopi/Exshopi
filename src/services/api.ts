import { useAuthStore } from '../store/auth';
import { supabase } from '../supabaseClient';

export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const defaultApiBase =
  typeof window !== 'undefined'
    ? import.meta.env.DEV
      ? '/api'
      : `${window.location.origin}/api`
    : 'http://localhost:3001/api';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  defaultApiBase;

function isLocalDevRuntime() {
  if (typeof window === 'undefined') return import.meta.env.DEV;
  const host = window.location.hostname || '';
  return (
    import.meta.env.DEV ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  if (!contentType.includes('application/json')) {
    const preview = rawText.slice(0, 140).replace(/\s+/g, ' ').trim();
    throw new Error(preview || `Unexpected non-JSON response (${res.status})`);
  }

  const data = rawText ? JSON.parse(rawText) : null;

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status ${res.status}`);
  }

  return data;
}

async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseApiResponse(res);
  useAuthStore.getState().setAccessToken(data?.accessToken || null);
  return data;
}

async function fetchWithAuthRetry(input: string, init: RequestInit = {}) {
  const runRequest = () =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...getAuthHeaders(),
      },
      credentials: init.credentials || 'include',
    });

  let response = await runRequest();
  if (response.status !== 401) {
    return response;
  }

  try {
    await refreshAccessToken();
  } catch {
    useAuthStore.getState().setAccessToken(null);
    throw new Error('Session expired. Please sign in again.');
  }

  response = await runRequest();
  if (response.status === 401) {
    useAuthStore.getState().setAccessToken(null);
    throw new Error('Session expired. Please sign in again.');
  }

  return response;
}

async function uploadWithRetry(
  endpoint: string,
  payload: Record<string, unknown>,
  retries = 2
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    try {
      return await parseApiResponse(res);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const shouldRetry =
        attempt < retries &&
        (res.status === 429 || /too many requests/i.test(lastError.message));

      if (!shouldRetry) {
        throw lastError;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 900 * (attempt + 1)));
    }
  }

  throw lastError || new Error('Upload failed');
}

// `getAuthHeaders` exported from this module to ensure callers can import it
// without circular import issues. It reads a client-side token from localStorage.

// ==================== USERS ====================
export const userAPI = {
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return parseApiResponse(res);
  },

  async getSession() {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async refresh() {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },
  async get(id: string) {
    return this.getUser(id);
  },
  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

export const uploadAPI = {
  async uploadImage(dataUrl: string, options?: { folder?: string; fileName?: string }) {
    return uploadWithRetry('/uploads/image', {
        dataUrl,
        folder: options?.folder || 'general',
        fileName: options?.fileName,
    });
  },

  async uploadDocument(dataUrl: string, options?: { folder?: string; fileName?: string }) {
    return uploadWithRetry('/uploads/document', {
        dataUrl,
        folder: options?.folder || 'documents',
        fileName: options?.fileName,
    });
  },
};

export const sellerApplicationAPI = {
  async submit(data: any) {
    const res = await fetch(`${API_BASE}/seller-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMine() {
    const res = await fetch(`${API_BASE}/seller-applications/me`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const adminSellerApplicationAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/admin/seller-applications`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async approve(id: string, notes = '') {
    const res = await fetch(`${API_BASE}/admin/seller-applications/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },
  async reject(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/admin/seller-applications/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },
  async requestInfo(id: string, notes: string) {
    const res = await fetch(`${API_BASE}/admin/seller-applications/${id}/request-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },
};

// ==================== SELLERS ====================
export const sellerAPI = {
  async create(data: any) {
    const res = await fetch(`${API_BASE}/sellers/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async get(id: string) {
    const res = await fetch(`${API_BASE}/sellers/${id}`);
    return res.json();
  },

  async getAll() {
    const res = await fetch(`${API_BASE}/sellers`);
    return res.json();
  },

  async getByUserId(userId: string) {
    const res = await fetch(`${API_BASE}/sellers/user/${userId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return res.json();
  },
  async getMyStore() {
    const res = await fetch(`${API_BASE}/seller/store/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return res.json();
  },
  async getBySlug(storeSlug: string) {
    const res = await fetch(`${API_BASE}/sellers/store/${storeSlug}`);
    return res.json();
  },
  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/sellers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// ==================== PRODUCTS ====================
export const productAPI = {
  async create(data: any) {
    const res = await fetch(`${API_BASE}/products/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async get(id: string, options?: { signal?: AbortSignal }) {
    const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (useSupabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (data) {
          console.log('Fetched product by id (supabase):', data);
          // Ensure product is live/approved/visible before returning to public UI
          const status = data.status || data.productStatus || data.status;
          const approval = data.approval_status || data.approvalStatus || data.approvalStatus;
          const visibility = data.visibility_status || data.visibilityStatus || data.visibilityStatus;
          if (String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live') {
            return data;
          }
          // if not live/approved/visible, fall through to API fallback (may be admin view)
        }
        const { data: bySlug, error: slugError } = await supabase.from('products').select('*').eq('slug', id).maybeSingle();
        if (slugError) throw slugError;
        if (bySlug) {
          console.log('Fetched product by slug (supabase):', bySlug);
          const status = bySlug.status || bySlug.productStatus || bySlug.status;
          const approval = bySlug.approval_status || bySlug.approvalStatus || bySlug.approvalStatus;
          const visibility = bySlug.visibility_status || bySlug.visibilityStatus || bySlug.visibilityStatus;
          if (String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live') {
            return bySlug;
          }
        }
        // fallback to API
      } catch (e) {
        console.warn('Supabase product fetch failed:', e);
        const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
        if (!hasExplicitApiBase && !isLocalDevRuntime()) {
          console.warn('Supabase fetch failed and no explicit API base configured — skipping API fallback and returning null. Set VITE_API_BASE_URL or VITE_API_BASE if you want a backend fallback.');
          return null;
        }
        console.warn('Falling back to API_BASE:', API_BASE);
      }
    }
    const res = await fetch(`${API_BASE}/products/${id}`, { signal: options?.signal });
    return parseApiResponse(res);
  },

  async getAll(options?: { signal?: AbortSignal }) {
    const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (useSupabase) {
      try {
        // Try server-side filtering with canonical column names
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'live')
            .eq('approval_status', 'approved')
            .eq('visibility_status', 'live')
            .order('created_at', { ascending: false });
          if (error) throw error;
          console.log('Fetched products (supabase filtered):', data?.length || 0);
          return data || [];
        } catch (err) {
          // If filtered query fails (column names or permissions), fallback to unfiltered then client-side filter
          console.warn('Filtered supabase query failed, falling back to client-side filter:', err);
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const filtered = (data || []).filter((r: any) => {
            const status = r.status || r.productStatus || r.status;
            const approval = r.approval_status || r.approvalStatus || r.approvalStatus;
            const visibility = r.visibility_status || r.visibilityStatus || r.visibilityStatus;
            return String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live';
          });
          console.log('Fetched products (client-side filtered):', filtered.length);
          return filtered;
        }
      } catch (e) {
        console.warn('Supabase products fetch failed:', e);
        const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
        if (!hasExplicitApiBase && !isLocalDevRuntime()) {
          console.warn('Supabase fetch failed and no explicit API base configured — skipping API fallback and returning empty list. Set VITE_API_BASE_URL or VITE_API_BASE if you want a backend fallback.');
          return [];
        }
        console.warn('Falling back to API_BASE:', API_BASE);
      }
    }
    const res = await fetch(`${API_BASE}/products`, { signal: options?.signal });
    return parseApiResponse(res);
  },

  async getByCategory(categoryId: string) {
    const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (useSupabase) {
      try {
        // Server-side filter for public listings
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'live')
            .eq('approval_status', 'approved')
            .eq('visibility_status', 'live')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const filtered = (data || []).filter((p: any) => String(p.categoryId || p.specs?.backendCategoryId || '') === categoryId);
          console.log('Fetched products by category (supabase):', filtered.length);
          return filtered;
        } catch (err) {
          console.warn('Filtered supabase category query failed, falling back to client-side filter:', err);
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const filtered = (data || []).filter((p: any) => String(p.categoryId || p.specs?.backendCategoryId || '') === categoryId)
            .filter((r: any) => {
              const status = r.status || r.productStatus || r.status;
              const approval = r.approval_status || r.approvalStatus || r.approvalStatus;
              const visibility = r.visibility_status || r.visibilityStatus || r.visibilityStatus;
              return String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live';
            });
          console.log('Fetched products by category (client-side filtered):', filtered.length);
          return filtered;
        }
      } catch (e) {
        console.warn('Supabase category fetch failed:', e);
        const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
        if (!hasExplicitApiBase && !isLocalDevRuntime()) {
          console.warn('Supabase fetch failed and no explicit API base configured — skipping API fallback and returning empty list. Set VITE_API_BASE_URL or VITE_API_BASE if you want a backend fallback.');
          return [];
        }
        console.warn('Falling back to API_BASE:', API_BASE);
      }
    }
    const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
    if (!hasExplicitApiBase && !isLocalDevRuntime()) {
      return [];
    }
    const res = await fetch(`${API_BASE}/products?categoryId=${categoryId}`);
    return await parseApiResponse(res);
  },

  async getBySlug(categorySlug: string, subcategorySlug?: string) {
    const useSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (useSupabase) {
      try {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'live')
            .eq('approval_status', 'approved')
            .eq('visibility_status', 'live')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const all = data || [];
          console.log('Fetched products for slug filter (supabase):', all.length);
          return all.filter((product: any) => {
            const specs = product.specs || {};
            if (subcategorySlug) {
              return specs.categorySlug === categorySlug && specs.subcategorySlug === subcategorySlug;
            }
            return specs.parentCategorySlug === categorySlug || specs.categorySlug === categorySlug || specs.subcategorySlug === categorySlug;
          });
        } catch (err) {
          console.warn('Filtered supabase slug query failed, falling back to client-side filter:', err);
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const all = data || [];
          return all.filter((product: any) => {
            const specs = product.specs || {};
            if (subcategorySlug) {
              return specs.categorySlug === categorySlug && specs.subcategorySlug === subcategorySlug;
            }
            return specs.parentCategorySlug === categorySlug || specs.categorySlug === categorySlug || specs.subcategorySlug === categorySlug;
          }).filter((r: any) => {
            const status = r.status || r.productStatus || r.status;
            const approval = r.approval_status || r.approvalStatus || r.approvalStatus;
            const visibility = r.visibility_status || r.visibilityStatus || r.visibilityStatus;
            return String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live';
          });
        }
      } catch (e) {
        console.warn('Supabase slug fetch failed:', e);
        const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
        if (!hasExplicitApiBase && !isLocalDevRuntime()) {
          console.warn('Supabase fetch failed and no explicit API base configured — skipping API fallback and returning empty list. Set VITE_API_BASE_URL or VITE_API_BASE if you want a backend fallback.');
          return [];
        }
        console.warn('Falling back to API_BASE:', API_BASE);
      }
    }
    const q = new URLSearchParams();
    if (categorySlug) q.set('categorySlug', categorySlug);
    if (subcategorySlug) q.set('subcategorySlug', subcategorySlug);
    const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
    if (!hasExplicitApiBase && !isLocalDevRuntime()) {
      return [];
    }
    const res = await fetch(`${API_BASE}/products?${q.toString()}`);
    return parseApiResponse(res);
  },

  async getSellerProducts(sellerId: string) {
    const res = await fetch(`${API_BASE}/products/seller/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
  async submit(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// Invalidate product-related short-lived caches (used to propagate deletes/updates across tabs)
export function invalidateProductCaches(ids?: string | string[]) {
  return;
}

// ==================== PRODUCT APPROVAL (ADMIN) ====================
export const adminProductAPI = {
  async getAll(params?: { status?: string; sellerId?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    if (params?.search) query.set('search', params.search);
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products${query.toString() ? `?${query.toString()}` : ''}`);
    return parseApiResponse(res);
  },

  async getPendingProducts() {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/pending`);
    return parseApiResponse(res);
  },

  async approve(id: string, notes: string = '') {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    return parseApiResponse(res);
  },

  async reject(id: string, reason: string) {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return parseApiResponse(res);
  },

  async bulkReview(data: {
    ids: string[];
    action: 'approve' | 'reject' | 'request_changes';
    reason?: string;
    notes?: string;
  }) {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/bulk-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async create(data: any) {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
    });
    return parseApiResponse(res);
  },
};

// ==================== ORDERS ====================
export const orderAPI = {
  async create(data: any) {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async get(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getCustomerOrders(customerId: string) {
    const res = await fetch(`${API_BASE}/orders/customer/${customerId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getSellerOrders(sellerId: string) {
    const res = await fetch(`${API_BASE}/orders/seller/${sellerId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async updateStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return parseApiResponse(res);
  },

  async updateDispatchSlot(
    id: string,
    data: {
      dispatchSlotDate?: string;
      dispatchSlotWindow?: string;
      dispatchNotes?: string;
      courierPartner?: string;
      status?: string;
    }
  ) {
    const res = await fetch(`${API_BASE}/orders/${id}/dispatch-slot`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async requestReturn(id: string, data: { reason: string; refundAmount?: number }) {
    const res = await fetch(`${API_BASE}/orders/${id}/request-return`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async getAllOrders() {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async processRefund(id: string, data: { action: 'approve' | 'reject'; refundAmount?: number; reason?: string }) {
    const res = await fetch(`${API_BASE}/admin/orders/${id}/refund`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

export const codAPI = {
  async sendOtp(data: { phone: string; email: string }) {
    const res = await fetch(`${API_BASE}/cod/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async verifyOtp(data: { sessionId: string; code: string }) {
    const res = await fetch(`${API_BASE}/cod/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

export const paymentAPI = {
  async createStripeCheckoutSession(data: {
    items: Array<{
      sellerId: string;
      productId: string;
      quantity: number;
      unitPrice?: number;
    }>;
    shippingAddress: {
      emirate: string;
      area: string;
      building?: string;
      flat?: string;
      addressLine: string;
      method?: string;
    };
    deliveryCountry?: string;
  }) {
    const res = await fetch(`${API_BASE}/payments/stripe/checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

// ==================== TRACKING ====================
export const trackingAPI = {
  async get(trackingCode: string) {
    const res = await fetch(`${API_BASE}/tracking/${trackingCode}`);
    return parseApiResponse(res);
  },

  async scanQR(orderId: string) {
    const res = await fetch(`${API_BASE}/tracking/${orderId}/scan-qr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async markDelivered(orderId: string) {
    const res = await fetch(`${API_BASE}/tracking/${orderId}/delivery-done`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },
};

// ==================== REVIEWS ====================
export const reviewAPI = {
  async getSellerReviews(sellerId: string) {
    const res = await fetch(`${API_BASE}/reviews/vendor/${sellerId}`);
    return parseApiResponse(res);
  },

  async getProductReviews(productId: string) {
    const res = await fetch(`${API_BASE}/reviews/product/${productId}`);
    return parseApiResponse(res);
  },

  async create(data: any) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

// ==================== PAYOUTS ====================
export const payoutAPI = {
  async getSellerPayouts(sellerId: string) {
    const res = await fetch(`${API_BASE}/payouts/seller/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAllPayouts() {
    const res = await fetch(`${API_BASE}/admin/payouts`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async process(id: string) {
    const res = await fetch(`${API_BASE}/admin/payouts/${id}/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// ==================== PAYOUT REQUESTS ====================
export const payoutRequestAPI = {
  async create(data: any) {
    const res = await fetch(`${API_BASE}/payout-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSellerRequests(sellerId: string) {
    const res = await fetch(`${API_BASE}/payout-requests/seller/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAllAdmin() {
    const res = await fetch(`${API_BASE}/admin/payout-requests`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/payout-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/categories`);
    return parseApiResponse(res);
  },

  async get(id: string) {
    const res = await fetch(`${API_BASE}/categories/${id}`);
    return parseApiResponse(res);
  },
  async notifyInterest(id: string, data: { email?: string; phone?: string }) {
    const res = await fetch(`${API_BASE}/categories/${id}/interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
  async create(data: any) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// ==================== BANNERS ====================
export const bannerAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/banners`);
    return res.json();
  },
  async create(data: any) {
    const res = await fetch(`${API_BASE}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async update(id: string, data: any) {
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async trackClick(id: string) {
    const res = await fetch(`${API_BASE}/banners/${id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({}),
    });
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/admin/banners/analytics`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  async track(event: {
    eventType: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }) {
    if (isLocalDevRuntime()) {
      return { ok: true, skipped: true, reason: 'local-dev-runtime' };
    }

    const res = await fetch(`${API_BASE}/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(event),
    });
    return res.json();
  },
};

// ==================== TRANSLATIONS ====================
export const translationAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/translations`);
    return res.json();
  },
};

// ==================== DASHBOARDS ====================
export const dashboardAPI = {
  async getAdminDashboard(params?: { range?: 'today' | '7d' | '30d' | 'custom'; from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const res = await fetch(`${API_BASE}/admin/dashboard${query.toString() ? `?${query.toString()}` : ''}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getSellerDashboard(sellerId: string) {
    const res = await fetch(`${API_BASE}/seller/dashboard/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async getAdminAnalytics() {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async getSellerAnalytics(sellerId: string) {
    const res = await fetch(`${API_BASE}/seller/analytics/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const customerAPI = {
  async getAllAdmin() {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },
};

export const adminOpsAPI = {
  async getActivityLogs() {
    const res = await fetch(`${API_BASE}/admin/activity-logs`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async getNotifications() {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async getMarketplaceSettings() {
    const res = await fetch(`${API_BASE}/settings/marketplace`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
  async updateMarketplaceSettings(data: any) {
    const res = await fetch(`${API_BASE}/settings/marketplace`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

export const supportAPI = {
  async createTicket(data: any) {
    const res = await fetch(`${API_BASE}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
  async getMyTickets() {
    const res = await fetch(`${API_BASE}/support/tickets/me`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
  async getAdminTickets() {
    const res = await fetch(`${API_BASE}/admin/support/tickets`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
  async updateTicket(id: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/support/tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
  async addMessage(id: string, data: any) {
    const res = await fetch(`${API_BASE}/support/tickets/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};
