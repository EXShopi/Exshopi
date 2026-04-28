import { useAuthStore } from '../store/auth';
import { supabase } from '../supabaseClient';
import { productMatchesCategoryAssignment, resolveCanonicalCategoryAssignment } from '../lib/masterCategories';
import { getProductLifecycleState } from '../lib/productLifecycle';

const DEFAULT_PROD_API_BASE = 'https://exshopi-api.onrender.com/api';
const DEFAULT_DEV_API_BASE = 'http://localhost:3001/api';
const IS_DEV = import.meta.env.DEV;
const KNOWN_FRONTEND_HOSTS = new Set([
  'exshopi.com',
  'www.exshopi.com',
  'exshopi.onrender.com',
  'exshopi-frontend.onrender.com',
]);

function logDev(level: 'info' | 'warn' | 'debug', message: string, ...args: any[]) {
  if (!IS_DEV) return;
  console[level](message, ...args);
}

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

function normalizeApiBaseCandidate(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const normalizedPath = url.pathname.replace(/\/+$/, '');
    url.pathname = normalizedPath.endsWith('/api')
      ? normalizedPath
      : `${normalizedPath || ''}/api`;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

function isFrontendLikeApiBase(value: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === 'exshopi-api.onrender.com') return false;
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.PROD;
    }

    if (KNOWN_FRONTEND_HOSTS.has(host)) {
      return true;
    }

    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      return import.meta.env.PROD;
    }

    return false;
  } catch {
    return false;
  }
}

const rawConfiguredApiBase = String(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || ''
).trim();

const normalizedConfiguredApiBase = normalizeApiBaseCandidate(rawConfiguredApiBase);

export const API_BASE =
  normalizedConfiguredApiBase && !isFrontendLikeApiBase(normalizedConfiguredApiBase)
    ? normalizedConfiguredApiBase
    : import.meta.env.PROD
      ? DEFAULT_PROD_API_BASE
      : DEFAULT_DEV_API_BASE;

// Only treat as an explicit API base when an env var was provided
export const hasExplicitApiBase = Boolean(
  normalizedConfiguredApiBase && !isFrontendLikeApiBase(normalizedConfiguredApiBase)
);

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

function isPubliclyVisibleMarketplaceProduct(product: any) {
  return getProductLifecycleState(product).isCustomerVisible;
}

if (typeof window !== 'undefined') {
  logDev('info', '[api] API_BASE', API_BASE);
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
    logDev('info', '[api] response', {
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
  useAuthStore.getState().setRefreshToken(
    typeof data?.refreshToken === 'string' ? data.refreshToken : null
  );
}

function clearPersistedAuthState(reason = 'unknown') {
  logDev('warn', '[auth] clearing persisted auth state', { reason });

  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  useAuthStore.getState().setAccessToken(null);
  useAuthStore.getState().setRefreshToken(null);
}

const AUTH_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_REQUEST_TIMEOUT_MS) || 60000; // default 60s
const PRODUCT_LIST_CACHE_TTL_MS = import.meta.env.PROD ? 60_000 : 5_000;
const BANNER_LIST_CACHE_TTL_MS = import.meta.env.PROD ? 120_000 : 5_000;

let productListCache:
  | {
      data: any[];
      timestamp: number;
    }
  | null = null;
let productListRequest: Promise<any[]> | null = null;

let bannerListCache:
  | {
      data: any[];
      timestamp: number;
    }
  | null = null;
let bannerListRequest: Promise<any[]> | null = null;

function readFreshListCache<T>(cache: { data: T[]; timestamp: number } | null, ttlMs: number): T[] | null {
  if (!cache) return null;
  if (Date.now() - cache.timestamp > ttlMs) return null;
  return cache.data;
}

function writeProductListCache(data: any[]) {
  productListCache = {
    data,
    timestamp: Date.now(),
  };
  return data;
}

function writeBannerListCache(data: any[]) {
  bannerListCache = {
    data,
    timestamp: Date.now(),
  };
  return data;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal || controller.signal,
    });
    logDev('info', '[api] response', {
      url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type') || '',
    });
    return response;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
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
    logDev('warn', 'Non-JSON response from API:', {
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
    logDev('warn', 'Failed to parse JSON response from API:', {
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

function isAuthFailureResponse(status: number) {
  return status === 401 || status === 403;
}

function isConfirmedAuthFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message === 'AUTH_INVALID_SESSION' || /session expired/i.test(message);
}

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
    logDev('info', '[auth] token refresh started');
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

    if (isAuthFailureResponse(res.status)) {
      logDev('warn', '[auth] token refresh rejected', { status: res.status });
      throw new Error('AUTH_INVALID_SESSION');
    }

    const data = await parseApiResponse(res);
    persistAuthTokens({
      accessToken: data?.accessToken || null,
      refreshToken: data?.refreshToken || null,
    });
    logDev('info', '[auth] token refresh successful');
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
    try {
      const refreshData = await refreshAccessToken();
      const newToken = typeof refreshData?.accessToken === 'string' ? refreshData.accessToken : '';

      if (!newToken) {
        throw new Error('AUTH_INVALID_SESSION');
      }

      token = newToken;
      response = await makeRequest(newToken);
    } catch (error) {
      if (isConfirmedAuthFailure(error)) {
        clearPersistedAuthState('confirmed_refresh_failure');
        throw new Error('Session expired. Please sign in again.');
      }

      logDev('warn', '[auth] token refresh failed without confirmed logout', error);
      throw error instanceof Error ? error : new Error('Failed to refresh session.');
    }

    if (response.status === 401) {
      clearPersistedAuthState('retry_still_unauthorized');
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
    data.priceUae ??
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
    priceUae: Number(data.priceUae ?? priceValue ?? 0),
    priceKsa:
      data.priceKsa != null && String(data.priceKsa).trim() !== ''
        ? Number(data.priceKsa)
        : null,
    compareAtPriceUae:
      data.compareAtPriceUae != null && String(data.compareAtPriceUae).trim() !== ''
        ? Number(data.compareAtPriceUae)
        : Number(data.originalPrice ?? priceValue ?? 0),
    compareAtPriceKsa:
      data.compareAtPriceKsa != null && String(data.compareAtPriceKsa).trim() !== ''
        ? Number(data.compareAtPriceKsa)
        : null,
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

    // If the refresh attempt is unauthorized for a guest user, handle
    // silently and return null instead of throwing noisy errors.
    if (res.status === 401 || res.status === 403) {
      // Clear any persisted auth state if present and return null.
      clearPersistedAuthState();
      return null;
    }

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
      const payload = await parseApiResponse(res);
      invalidateProductCaches();
      return payload;
    }
    const payload = await createSupabaseProduct(data);
    invalidateProductCaches();
    return payload;
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

        if (data && isPubliclyVisibleMarketplaceProduct(data)) {
          return data;
        }

        const { data: bySlug, error: slugError } = await supabase
          .from('products')
          .select('*')
          .eq('slug', id)
          .maybeSingle();

        if (slugError) throw slugError;

        if (bySlug && isPubliclyVisibleMarketplaceProduct(bySlug)) {
          return bySlug;
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
    const cached = readFreshListCache(productListCache, PRODUCT_LIST_CACHE_TTL_MS);
    if (cached) return cached;
    if (productListRequest) return productListRequest;

    if (shouldPreferBackendProductApi()) {
      productListRequest = safeFetchApi('/products', { signal: options?.signal })
        .then((res) => parseApiResponse(res))
        .then((data) => writeProductListCache(Array.isArray(data) ? data : []))
        .finally(() => {
          productListRequest = null;
        });
      return productListRequest;
    }

    const useSupabase = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    if (useSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const filtered = (data || []).filter((product: any) => isPubliclyVisibleMarketplaceProduct(product));
        const explicitApi = Boolean(API_BASE);
        if (filtered.length === 0 && explicitApi) {
          productListRequest = safeFetchApi('/products', { signal: options?.signal })
            .then((res) => parseApiResponse(res))
            .then((fallbackData) => writeProductListCache(Array.isArray(fallbackData) ? fallbackData : []))
            .finally(() => {
              productListRequest = null;
            });
          return productListRequest;
        }
        return writeProductListCache(filtered);
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

    productListRequest = safeFetchApi('/products', { signal: options?.signal })
      .then((res) => parseApiResponse(res))
      .then((data) => writeProductListCache(Array.isArray(data) ? data : []))
      .finally(() => {
        productListRequest = null;
      });
    return productListRequest;
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
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const all = data || [];
        return all
          .filter((product: any) =>
            productMatchesCategoryAssignment(
              { ...product, specs: { ...(product.specs || {}), ...resolveCanonicalCategoryAssignment(product) } },
              categorySlug,
              subcategorySlug
            )
          )
          .filter((r: any) => isPubliclyVisibleMarketplaceProduct(r));
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
      const payload = await parseApiResponse(res);
      invalidateProductCaches(id);
      return payload;
    }
    const payload = await updateSupabaseProduct(id, data);
    invalidateProductCaches(id);
    return payload;
  },

  async submit(id: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry(`/products/${id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const payload = await parseApiResponse(res);
      invalidateProductCaches(id);
      return payload;
    }
    const payload = await updateSupabaseProduct(id, {
      status: 'live',
      approval_status: 'approved',
      visibility_status: 'live',
    });
    invalidateProductCaches(id);
    return payload;
  },

  async delete(id: string) {
    if (shouldPreferBackendProductApi()) {
      const res = await fetchWithAuthRetry(`/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const payload = await parseApiResponse(res);
      invalidateProductCaches(id);
      return payload;
    }
    const payload = await deleteSupabaseProduct(id);
    invalidateProductCaches(id);
    return payload;
  },
};

export function invalidateProductCaches(_ids?: string | string[]) {
  productListCache = null;
  productListRequest = null;
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
    const payload = await parseApiResponse(res);
    invalidateProductCaches(id);
    return payload;
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
    const payload = await parseApiResponse(res);
    invalidateProductCaches(id);
    return payload;
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
    const payload = await parseApiResponse(res);
    invalidateProductCaches(data.ids);
    return payload;
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
    const payload = await parseApiResponse(res);
    invalidateProductCaches();
    return payload;
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
    const payload = await parseApiResponse(res);
    invalidateProductCaches(id);
    return payload;
  },

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const payload = await parseApiResponse(res);
    invalidateProductCaches(id);
    return payload;
  },
};

export const adminProductBulkUploadAPI = {
  async preview(data: { fileName: string; fileDataBase64: string; mode?: 'admin' | 'seller' }) {
    const res = await fetchWithAuthRetry('/admin/products/bulk-upload/preview', {
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

  async importRows(data: { rows: any[]; mode?: 'admin' | 'seller' }) {
    const res = await fetchWithAuthRetry('/admin/products/bulk-upload/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const payload = await parseApiResponse(res);
    invalidateProductCaches();
    return payload;
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
  async sendOtp(data: { phone: string; email: string; country?: string }) {
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
    const cached = readFreshListCache(bannerListCache, BANNER_LIST_CACHE_TTL_MS);
    if (cached) return cached;
    if (bannerListRequest) return bannerListRequest;

    bannerListRequest = safeFetchApi('/banners')
      .then((res) => parseApiResponse(res))
      .then((data) => writeBannerListCache(Array.isArray(data) ? data : []))
      .finally(() => {
        bannerListRequest = null;
      });
    return bannerListRequest;
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
    const payload = await parseApiResponse(res);
    bannerListCache = null;
    bannerListRequest = null;
    return payload;
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
    const payload = await parseApiResponse(res);
    bannerListCache = null;
    bannerListRequest = null;
    return payload;
  },

  async delete(id: string) {
    const res = await fetchWithAuthRetry(`/banners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const payload = await parseApiResponse(res);
    bannerListCache = null;
    bannerListRequest = null;
    return payload;
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

  async getAdminAnalytics(params?: {
    range?: 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom';
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.range) query.set('range', params.range);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);

    const res = await fetchWithAuthRetry(`/admin/analytics${query.toString() ? `?${query.toString()}` : ''}`, {
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
