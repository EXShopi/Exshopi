import { useAuthStore } from '../store/auth';
import { supabase } from '../supabaseClient';

const DEFAULT_PROD_API_BASE = 'https://exshopi-api.onrender.com/api';
const DEFAULT_DEV_API_BASE = 'http://localhost:3001/api';

function readPersistedAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const explicitAccessToken = localStorage.getItem('accessToken');
  if (explicitAccessToken) return explicitAccessToken;

  const legacyToken = localStorage.getItem('token');
  if (legacyToken) return legacyToken;

  const persistedAuth = localStorage.getItem('auth-storage');
  if (!persistedAuth) return null;

  try {
    const parsed = JSON.parse(persistedAuth);
    const accessToken = parsed?.state?.accessToken;
    return typeof accessToken === 'string' && accessToken.trim() ? accessToken : null;
  } catch {
    return null;
  }
}

export function getAuthHeaders() {
  const token =
    useAuthStore.getState().accessToken ||
    readPersistedAccessToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const configuredApiBase =
  String(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || '').trim();

export const API_BASE =
  configuredApiBase ||
  (import.meta.env.PROD ? DEFAULT_PROD_API_BASE : DEFAULT_DEV_API_BASE);

// Only treat as an explicit API base when an env var was provided
export const hasExplicitApiBase = Boolean(configuredApiBase);

function isLocalDevRuntime() {
  return import.meta.env.DEV;
}

function shouldPreferBackendProductApi() {
  return Boolean(API_BASE) && !isLocalDevRuntime();
}

export function buildApiUrl(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null;

  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  if (API_BASE && pathOrUrl.startsWith(API_BASE)) return pathOrUrl;

  if (pathOrUrl.startsWith('/')) {
    if (!API_BASE) return null;
    return API_BASE.replace(/\/$/, '') + pathOrUrl;
  }

  if (!API_BASE) return null;
  return API_BASE.replace(/\/$/, '') + '/' + pathOrUrl;
}

function isDeletedMarketplaceProduct(product: any) {
  const deletionMeta = product?.specs?.__deletion || {};
  return Boolean(product?.isDeleted || product?.deletedAt || deletionMeta.isDeleted || deletionMeta.deletedAt);
}

function isPubliclyVisibleMarketplaceProduct(product: any) {
  if (!product || isDeletedMarketplaceProduct(product)) return false;

  const status = String(product.status || product.productStatus || '').toLowerCase();
  const approval = String(product.approval_status || product.approvalStatus || '').toLowerCase();
  const visibility = String(product.visibility_status || product.visibilityStatus || '').toLowerCase();

  return status === 'live' && approval === 'approved' && visibility === 'live';
}

if (typeof window !== 'undefined') {
  console.info('[api] API_BASE', API_BASE);
}

export async function safeFetchApi(pathOrUrl: string, init?: RequestInit) {
  const url = buildApiUrl(pathOrUrl);

  if (!url) {
    console.warn('No API base configured — skipping backend call');
    return Promise.resolve({
      ok: true,
      json: async () => [],
      text: async () => '[]',
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
    } as Response);
  }

  try {
    const response = await fetch(url, init);
    console.info('[api] response', {
      url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type') || '',
    });
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error while fetching ${url}: ${msg}`);
  }
}

function persistAuthTokens(data: { accessToken?: string | null; refreshToken?: string | null }) {
  const accessToken = typeof data?.accessToken === 'string' ? data.accessToken : null;

  if (typeof window !== 'undefined') {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  useAuthStore.getState().setAccessToken(accessToken);
  useAuthStore.getState().setRefreshToken(null);
}

function clearPersistedAuthState() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  useAuthStore.getState().setAccessToken(null);
  useAuthStore.getState().setRefreshToken(null);
}

const AUTH_REQUEST_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal || controller.signal,
    });
    console.info('[api] response', {
      url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type') || '',
    });
    return response;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  const looksLikeJson =
    contentType.includes('application/json') || /^\s*[\[{]/.test(rawText);

  if (!looksLikeJson) {
    const preview = rawText.slice(0, 200).replace(/\s+/g, ' ').trim();
    console.warn('Non-JSON response from API:', {
      status: res.status,
      contentType,
      preview,
    });
    throw new Error(
      `Unexpected non-JSON response from backend (status ${res.status}). Please check your API base and backend availability.`
    );
  }

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    console.warn('Failed to parse JSON response from API:', {
      status: res.status,
      contentType,
    });
    throw new Error(`Invalid JSON response from backend (status ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed with status ${res.status}`
    );
  }

  return data;
}

let refreshPromise: Promise<any> | null = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshUrl = buildApiUrl('/auth/refresh');
  if (!refreshUrl) {
    throw new Error('No API base configured; cannot refresh session.');
  }

  const legacyRefreshToken = useAuthStore.getState().refreshToken || '';

  refreshPromise = (async () => {
    const res = await fetchWithTimeout(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(
        legacyRefreshToken
          ? { refreshToken: legacyRefreshToken }
          : {}
      ),
    });
    const data = await parseApiResponse(res);
    persistAuthTokens({
      accessToken: data?.accessToken || null,
      refreshToken: null,
    });
    return data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const normalizedPath =
    path.startsWith('/api/')
      ? path.replace(/^\/api/, '')
      : path === '/api'
      ? ''
      : path;

  const resolved = buildApiUrl(normalizedPath);
  if (!resolved) {
    throw new Error('No API base configured; cannot perform authenticated request in this runtime.');
  }

  let token =
    useAuthStore.getState().accessToken ||
    readPersistedAccessToken();

  const makeRequest = async (bearer?: string) =>
    fetchWithTimeout(resolved, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    });

  let response = await makeRequest(token || undefined);

  if (response.status === 401) {
    const refreshUrl = buildApiUrl('/auth/refresh');
    if (!refreshUrl) {
      clearPersistedAuthState();
      throw new Error('Session expired. Please sign in again.');
    }

    const refreshRes = await fetchWithTimeout(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const refreshData = await parseJsonSafe(refreshRes);
    const newToken =
      typeof refreshData?.accessToken === 'string' ? refreshData.accessToken : '';

    if (!refreshRes.ok || !newToken) {
      clearPersistedAuthState();
      throw new Error('Session expired. Please sign in again.');
    }

    useAuthStore.getState().setAccessToken(newToken);

    token = newToken;
    response = await makeRequest(newToken);

    if (response.status === 401) {
      clearPersistedAuthState();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  return response;
}

async function fetchWithAuthRetry(input: string, init: RequestInit = {}) {
  try {
    return await authFetch(input, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}

async function uploadWithRetry(
  endpoint: string,
  payload: Record<string, unknown>,
  retries = 2
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await fetchWithAuthRetry(endpoint, {
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

function normalizeProductPayload(input: any) {
  const data = { ...(input || {}) };

  const title =
    data.title ||
    data.name ||
    data.productTitle ||
    '';

  const slug =
    data.slug ||
    String(title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const priceValue =
    data.price ??
    data.salePrice ??
    data.regularPrice ??
    0;

  const productStatus =
    data.status ||
    data.productStatus ||
    (data.mode === 'admin' ? 'live' : 'draft');

  const approvalStatus =
    data.approval_status ||
    data.approvalStatus ||
    (data.mode === 'admin' ? 'approved' : 'pending');

  const visibilityStatus =
    data.visibility_status ||
    data.visibilityStatus ||
    (data.mode === 'admin' ? 'live' : 'hidden');

  return {
    ...data,
    title,
    slug,
    meta_title: data.metaTitle || data.specs?.metaTitle || '',
    meta_description: data.metaDescription || data.specs?.metaDescription || '',
    meta_keywords: data.metaKeywords || data.specs?.metaKeywords || '',
    canonical_url: data.canonicalUrl || data.specs?.canonicalUrl || '',
    og_title: data.ogTitle || data.specs?.ogTitle || '',
    og_description: data.ogDescription || data.specs?.ogDescription || '',
    og_image: data.ogImage || data.specs?.ogImage || '',
    price: Number(priceValue || 0),
    images: Array.isArray(data.images) ? data.images : [],
    status: productStatus,
    approval_status: approvalStatus,
    visibility_status: visibilityStatus,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function createSupabaseProduct(data: any) {
  const payload = normalizeProductPayload(data);

  const { data: created, error } = await supabase
    .from('products')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return created;
}

async function updateSupabaseProduct(id: string, data: any) {
  const payload = normalizeProductPayload(data);

  const { data: updated, error } = await supabase
    .from('products')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

async function deleteSupabaseProduct(id: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('specs')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error('Product not found');
  }

  const deletedAt = new Date().toISOString();
  const nextSpecs = {
    ...((existing.specs as Record<string, any>) || {}),
    __deletion: {
      ...((((existing.specs as Record<string, any>) || {}).__deletion as Record<string, any>) || {}),
      isDeleted: true,
      deletedAt,
    },
  };

  const { error } = await supabase
    .from('products')
    .update({
      status: 'archived',
      productStatus: 'archived',
      visibilityStatus: 'hidden',
      isDeleted: true,
      deletedAt,
      specs: nextSpecs,
      updated_at: deletedAt,
      updatedAt: deletedAt,
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

// ==================== USERS ====================
export const userAPI = {
  async register(data: any) {
    const res = await safeFetchApi('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async login(email: string, password: string) {
    const res = await safeFetchApi('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await parseApiResponse(res);
    persistAuthTokens({
      accessToken: data?.accessToken || null,
      refreshToken: null,
    });
    return data;
  },

  async getSession() {
    const res = await fetchWithAuthRetry('/auth/session', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async refresh() {
    const refreshUrl = buildApiUrl('/auth/refresh');
    if (!refreshUrl) {
      throw new Error('No API base configured; cannot refresh session.');
    }

    const res = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    const data = await parseApiResponse(res);
    persistAuthTokens({
      accessToken: data?.accessToken || null,
      refreshToken: null,
    });
    return data;
  },

  async logout() {
    const res = await fetchWithAuthRetry('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    return parseApiResponse(res);
  },

  async getUser(id: string) {
    const res = await fetchWithAuthRetry(`/users/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async get(id: string) {
    return this.getUser(id);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/users/${id}`, {
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

// ==================== UPLOADS ====================
export const uploadAPI = {
  async uploadImage(_dataUrl: string, _options?: { folder?: string; fileName?: string }) {
    throw new Error(
      'Image upload is handled directly by Supabase Storage via uploadClient.ts. This API endpoint is disabled.'
    );
  },

  async uploadDocument(_dataUrl: string, _options?: { folder?: string; fileName?: string }) {
    throw new Error(
      'Document upload is handled directly by Supabase Storage. This API endpoint is disabled.'
    );
  },
};

export const sellerApplicationAPI = {
  async submit(data: any) {
    const res = await fetchWithAuthRetry('/seller-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async getMine() {
    const res = await fetchWithAuthRetry('/seller-applications/me', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
};

export const adminSellerApplicationAPI = {
  async getAll() {
    const res = await fetchWithAuthRetry('/admin/seller-applications', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async approve(id: string, notes = '') {
    const res = await fetchWithAuthRetry(`/admin/seller-applications/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    return parseApiResponse(res);
  },

  async reject(id: string, reason: string) {
    const res = await fetchWithAuthRetry(`/admin/seller-applications/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
    return parseApiResponse(res);
  },

  async requestInfo(id: string, notes: string) {
    const res = await fetchWithAuthRetry(`/admin/seller-applications/${id}/request-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ notes }),
    });
    return parseApiResponse(res);
  },
};

// ==================== SELLERS ====================
export const sellerAPI = {
  async create(data: any) {
    const res = await fetchWithAuthRetry('/sellers/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async get(id: string) {
    const res = await safeFetchApi(`/sellers/${id}`);
    return parseApiResponse(res);
  },

  async getAll() {
    const res = await safeFetchApi('/sellers');
    return parseApiResponse(res);
  },

  async getByUserId(userId: string) {
    const res = await fetchWithAuthRetry(`/sellers/user/${userId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getMyStore() {
    const res = await fetchWithAuthRetry('/seller/store/me', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getBySlug(storeSlug: string) {
    const res = await safeFetchApi(`/sellers/store/${storeSlug}`);
    return parseApiResponse(res);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/sellers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

// ==================== PRODUCTS ====================
export const productAPI = {
  async create(data: any) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry('/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return parseApiResponse(res);
    }
    return createSupabaseProduct(data);
  },

  async get(id: string, options?: { signal?: AbortSignal }) {
    if (shouldPreferBackendProductApi()) {
      const res = await safeFetchApi(`/products/${id}`, { signal: options?.signal });
      return parseApiResponse(res);
    }

    const useSupabase = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (useSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const status = data.status || data.productStatus || data.status;
          const approval = data.approval_status || data.approvalStatus || data.approvalStatus;
          const visibility = data.visibility_status || data.visibilityStatus || data.visibilityStatus;

          if (!isDeletedMarketplaceProduct(data) &&
            String(status) === 'live' &&
            String(approval) === 'approved' &&
            String(visibility) === 'live'
          ) {
            return data;
          }
        }

        const { data: bySlug, error: slugError } = await supabase
          .from('products')
          .select('*')
          .eq('slug', id)
          .maybeSingle();

        if (slugError) throw slugError;

        if (bySlug) {
          const status = bySlug.status || bySlug.productStatus || bySlug.status;
          const approval = bySlug.approval_status || bySlug.approvalStatus || bySlug.approvalStatus;
          const visibility = bySlug.visibility_status || bySlug.visibilityStatus || bySlug.visibilityStatus;

          if (!isDeletedMarketplaceProduct(bySlug) &&
            String(status) === 'live' &&
            String(approval) === 'approved' &&
            String(visibility) === 'live'
          ) {
            return bySlug;
          }
        }
      } catch (e) {
        console.warn('Supabase product fetch failed:', e);
        const explicitApi = Boolean(API_BASE);
        if (!explicitApi && !isLocalDevRuntime()) {
          return null;
        }
      }
    }

    const hasApi = Boolean(API_BASE);
    if (!hasApi && !isLocalDevRuntime()) return null;

    const res = await safeFetchApi(`/products/${id}`, { signal: options?.signal });
    return parseApiResponse(res);
  },

  async getAll(options?: { signal?: AbortSignal }) {
    if (shouldPreferBackendProductApi()) {
      const res = await safeFetchApi('/products', { signal: options?.signal });
      return parseApiResponse(res);
    }

    const useSupabase = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

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
          const safeData = data || [];
          const explicitApi = Boolean(API_BASE);
          if (safeData.length === 0 && explicitApi) {
            const res = await safeFetchApi('/products', { signal: options?.signal });
            return parseApiResponse(res);
          }
          return safeData.filter((product: any) => !isDeletedMarketplaceProduct(product));
        } catch (err) {
          console.warn('Filtered supabase query failed, falling back to client-side filter:', err);

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          const filtered = (data || []).filter((r: any) => isPubliclyVisibleMarketplaceProduct(r));

          return filtered;
        }
      } catch (e) {
        console.warn('Supabase products fetch failed:', e);
        const explicitApi = Boolean(API_BASE);
        if (!explicitApi && !isLocalDevRuntime()) {
          return [];
        }
      }
    }

    const hasApi = Boolean(API_BASE);
    if (!hasApi && !isLocalDevRuntime()) return [];

    const res = await safeFetchApi('/products', { signal: options?.signal });
    return parseApiResponse(res);
  },

  async getByCategory(categoryId: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await safeFetchApi(`/products?categoryId=${encodeURIComponent(categoryId)}`);
      return parseApiResponse(res);
    }

    const useSupabase = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

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

          return (data || []).filter(
            (p: any) => String(p.categoryId || p.specs?.backendCategoryId || '') === categoryId
          );
        } catch (err) {
          console.warn('Filtered supabase category query failed, falling back to client-side filter:', err);

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return (data || [])
            .filter(
              (p: any) => String(p.categoryId || p.specs?.backendCategoryId || '') === categoryId
            )
            .filter((r: any) => isPubliclyVisibleMarketplaceProduct(r));
        }
      } catch (e) {
        console.warn('Supabase category fetch failed:', e);
        const explicitApi = Boolean(API_BASE);
        if (!explicitApi && !isLocalDevRuntime()) {
          return [];
        }
      }
    }

    const explicitApi = Boolean(API_BASE);
    if (!explicitApi && !isLocalDevRuntime()) {
      return [];
    }

    const res = await safeFetchApi(`/products?categoryId=${encodeURIComponent(categoryId)}`);
    return parseApiResponse(res);
  },

  async getBySlug(categorySlug: string, subcategorySlug?: string) {
    if (shouldPreferBackendProductApi()) {
      const q = new URLSearchParams();
      if (categorySlug) q.set('categorySlug', categorySlug);
      if (subcategorySlug) q.set('subcategorySlug', subcategorySlug);
      const res = await safeFetchApi(`/products?${q.toString()}`);
      return parseApiResponse(res);
    }

    const useSupabase = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

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
          return all.filter((product: any) => {
            const specs = product.specs || {};
            if (subcategorySlug) {
              return (
                specs.categorySlug === categorySlug &&
                specs.subcategorySlug === subcategorySlug
              );
            }
            return (
              specs.parentCategorySlug === categorySlug ||
              specs.categorySlug === categorySlug ||
              specs.subcategorySlug === categorySlug
            );
          });
        } catch (err) {
          console.warn('Filtered supabase slug query failed, falling back to client-side filter:', err);

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return (data || [])
            .filter((product: any) => {
              const specs = product.specs || {};
              if (subcategorySlug) {
                return (
                  specs.categorySlug === categorySlug &&
                  specs.subcategorySlug === subcategorySlug
                );
              }
              return (
                specs.parentCategorySlug === categorySlug ||
                specs.categorySlug === categorySlug ||
                specs.subcategorySlug === categorySlug
              );
            })
            .filter((r: any) => isPubliclyVisibleMarketplaceProduct(r));
        }
      } catch (e) {
        console.warn('Supabase slug fetch failed:', e);
        const explicitApi = Boolean(API_BASE);
        if (!explicitApi && !isLocalDevRuntime()) {
          return [];
        }
      }
    }

    const q = new URLSearchParams();
    if (categorySlug) q.set('categorySlug', categorySlug);
    if (subcategorySlug) q.set('subcategorySlug', subcategorySlug);

    const explicitApi = Boolean(API_BASE);
    if (!explicitApi && !isLocalDevRuntime()) {
      return [];
    }

    const res = await safeFetchApi(`/products?${q.toString()}`);
    return parseApiResponse(res);
  },

  async getSellerProducts(sellerId: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await safeFetchApi(`/products/seller/${sellerId}`);
      return parseApiResponse(res);
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sellerId', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async update(id: string, data: any) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry(`/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return parseApiResponse(res);
    }
    return updateSupabaseProduct(id, data);
  },

  async submit(id: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry(`/products/${id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return parseApiResponse(res);
    }
    return updateSupabaseProduct(id, {
      status: 'live',
      approval_status: 'approved',
      visibility_status: 'live',
    });
  },

  async delete(id: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry(`/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return parseApiResponse(res);
    }
    return deleteSupabaseProduct(id);
  },
};

export function invalidateProductCaches(_ids?: string | string[]) {
  return;
}

function normalizeAdminProductList(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

// ==================== PRODUCT APPROVAL (ADMIN) ====================
export const adminProductAPI = {
  async getAll(params?: { status?: string; sellerId?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sellerId) searchParams.set('sellerId', params.sellerId);
    if (params?.search) searchParams.set('search', params.search);

    const res = await fetchWithAuthRetry(
      `/admin/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return normalizeAdminProductList(await parseApiResponse(res));
  },

  async getPendingProducts() {
    const res = await fetchWithAuthRetry('/admin/products/pending', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async approve(id: string, notes: string = '') {
    const res = await fetchWithAuthRetry(`/admin/products/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return parseApiResponse(res);
  },

  async reject(id: string, reason: string) {
    const res = await fetchWithAuthRetry(`/admin/products/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
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
    const res = await fetchWithAuthRetry('/admin/products/bulk-review', {
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
    const res = await fetchWithAuthRetry('/admin/products', {
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

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/admin/products/${id}`, {
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

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },
};

// ==================== ORDERS ====================
export const orderAPI = {
  async create(data: any) {
    const res = await fetchWithAuthRetry('/orders/create', {
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
    const res = await fetchWithAuthRetry(`/orders/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getCustomerOrders(customerId: string) {
    const res = await fetchWithAuthRetry(`/orders/customer/${customerId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async getSellerOrders(sellerId: string) {
    const res = await fetchWithAuthRetry(`/orders/seller/${sellerId}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async updateStatus(id: string, status: string) {
    const res = await fetchWithAuthRetry(`/orders/${id}/status`, {
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
    const res = await fetchWithAuthRetry(`/orders/${id}/dispatch-slot`, {
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
    const res = await fetchWithAuthRetry(`/orders/${id}/request-return`, {
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
    const res = await fetchWithAuthRetry('/admin/orders', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async processRefund(id: string, data: { action: 'approve' | 'reject'; refundAmount?: number; reason?: string }) {
    const res = await fetchWithAuthRetry(`/admin/orders/${id}/refund`, {
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
    const res = await fetchWithAuthRetry('/cod/otp/send', {
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
    const res = await fetchWithAuthRetry('/cod/otp/verify', {
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
    const res = await fetchWithAuthRetry('/payments/stripe/checkout-session', {
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
    const res = await safeFetchApi(`/tracking/${trackingCode}`);
    return parseApiResponse(res);
  },

  async scanQR(orderId: string) {
    const res = await fetchWithAuthRetry(`/tracking/${orderId}/scan-qr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },

  async markDelivered(orderId: string) {
    const res = await fetchWithAuthRetry(`/tracking/${orderId}/delivery-done`, {
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
    const res = await safeFetchApi(`/reviews/vendor/${sellerId}`);
    return parseApiResponse(res);
  },

  async getProductReviews(productId: string) {
    const res = await safeFetchApi(`/reviews/product/${productId}`);
    return parseApiResponse(res);
  },

  async create(data: any) {
    const res = await fetchWithAuthRetry('/reviews', {
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
    const res = await fetchWithAuthRetry(`/payouts/seller/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getAllPayouts() {
    const res = await fetchWithAuthRetry('/admin/payouts', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async process(id: string) {
    const res = await fetchWithAuthRetry(`/admin/payouts/${id}/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
};

// ==================== PAYOUT REQUESTS ====================
export const payoutRequestAPI = {
  async create(data: any) {
    const res = await fetchWithAuthRetry('/payout-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async getSellerRequests(sellerId: string) {
    const res = await fetchWithAuthRetry(`/payout-requests/seller/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getAllAdmin() {
    const res = await fetchWithAuthRetry('/admin/payout-requests', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/admin/payout-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
  async getAll() {
    const res = await safeFetchApi('/categories');
    return parseApiResponse(res);
  },

  async get(id: string) {
    const res = await safeFetchApi(`/categories/${id}`);
    return parseApiResponse(res);
  },

  async notifyInterest(id: string, data: { email?: string; phone?: string }) {
    const res = await fetchWithAuthRetry(`/categories/${id}/interest`, {
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
    const res = await fetchWithAuthRetry('/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
};

// ==================== BANNERS ====================
export const bannerAPI = {
  async getAll() {
    const res = await safeFetchApi('/banners');
    return parseApiResponse(res);
  },

  async create(data: any) {
    const res = await fetchWithAuthRetry('/banners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async update(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`/banners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async trackClick(id: string) {
    const res = await fetchWithAuthRetry(`/banners/${id}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({}),
    });
    return parseApiResponse(res);
  },

  async getAnalytics() {
    const res = await fetchWithAuthRetry('/admin/banners/analytics', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
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

    if (!hasExplicitApiBase && !isLocalDevRuntime()) {
      return { ok: true, skipped: true, reason: 'no-api-base' };
    }

    const res = await fetchWithAuthRetry('/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(event),
    });
    return parseApiResponse(res);
  },
};

// ==================== TRANSLATIONS ====================
export const translationAPI = {
  async getAll() {
    const res = await safeFetchApi('/translations');
    return parseApiResponse(res);
  },
};

// ==================== DASHBOARDS ====================
export const dashboardAPI = {
  async getAdminDashboard(params?: {
    range?: 'today' | '7d' | '30d' | 'custom';
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const res = await fetchWithAuthRetry(
      `/admin/dashboard${query.toString() ? `?${query.toString()}` : ''}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    return parseApiResponse(res);
  },

  async getSellerDashboard(sellerId: string) {
    const res = await fetchWithAuthRetry(`/seller/dashboard/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getAdminAnalytics() {
    const res = await fetchWithAuthRetry('/admin/analytics', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getSellerAnalytics(sellerId: string) {
    const res = await fetchWithAuthRetry(`/seller/analytics/${sellerId}`, {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },
};

export const customerAPI = {
  async getAllAdmin() {
    const res = await fetchWithAuthRetry('/admin/customers', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return parseApiResponse(res);
  },
};

export const adminOpsAPI = {
  async getActivityLogs() {
    const res = await fetchWithAuthRetry('/admin/activity-logs', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getNotifications() {
    const res = await fetchWithAuthRetry('/admin/notifications', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getMarketplaceSettings() {
    const res = await fetchWithAuthRetry('/settings/marketplace', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async updateMarketplaceSettings(data: any) {
    const res = await fetchWithAuthRetry('/settings/marketplace', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return parseApiResponse(res);
  },

  async generateContent(payload: { title?: string; category?: string; subcategory?: string; condition?: string }) {
    const res = await fetchWithAuthRetry('/admin/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return parseApiResponse(res);
  },
};

export const supportAPI = {
  async createTicket(data: any) {
    const res = await fetchWithAuthRetry('/support/tickets', {
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
    const res = await fetchWithAuthRetry('/support/tickets/me', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async getAdminTickets() {
    const res = await fetchWithAuthRetry('/admin/support/tickets', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse(res);
  },

  async updateTicket(id: string, data: any) {
    const res = await fetchWithAuthRetry(`/admin/support/tickets/${id}`, {
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
    const res = await fetchWithAuthRetry(`/support/tickets/${id}/messages`, {
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
