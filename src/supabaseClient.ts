import { createClient } from "@supabase/supabase-js";
import { getAuthHeaders } from "./lib/authHeaders";

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Debug: surface env usage so Netlify / browser console shows misconfiguration quickly
console.log('SUPABASE URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE KEY EXISTS:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('SUPABASE CLIENT URL:', supabaseUrl);
// Extra diagnostics to help detect malformed env values (typos, whitespace, missing scheme)
try {
  console.log('SUPABASE CLIENT URL (raw):', JSON.stringify(supabaseUrl));
  console.log('SUPABASE CLIENT URL length:', supabaseUrl.length);
  try {
    const parsed = new URL(supabaseUrl);
    console.log('SUPABASE CLIENT HOSTNAME:', parsed.hostname);
    console.log('SUPABASE CLIENT PROTOCOL:', parsed.protocol);
  } catch (e) {
    console.warn('SUPABASE CLIENT URL is not a valid absolute URL:', e);
  }
} catch (e) {
  // ignore
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Firebase-compatible auth wrapper using Supabase
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    supabase.auth.onAuthStateChange((event, session) => {
      auth.currentUser = session?.user || null;
      callback(auth.currentUser);
    });
    return () => {};
  },
  signOut: async () => {
    await supabase.auth.signOut();
    auth.currentUser = null;
  }
};

// Initialize current user
supabase.auth.getSession().then(({ data: { session } }) => {
  auth.currentUser = session?.user || null;
});

export const db = null;
export const storage = null;

export class GoogleAuthProvider {
  providerId = "google.com";
}

export const googleProvider = new GoogleAuthProvider();

// Auth implementations using Supabase
export const signInWithPopup = async (authInstance: any, provider: any) => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    });
    if (error) throw error;
    return { user: auth.currentUser };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    auth.currentUser = data.user;
    return { user: data.user };
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    auth.currentUser = data.user;
    return { user: data.user };
  } catch (error) {
    console.error("Sign-up error:", error);
    throw error;
  }
};

export const updateProfile = async (authInstance: any, updates: any) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    auth.currentUser = null;
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

// Firestore-compatible mocks using Supabase (for future data operations)
// Backend API base for REST shims
const browserHost =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const hasExplicitApiBase = Boolean(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE);
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? `http://${browserHost}:3001/api` : '');

// Utility: normalize path segments (skip db/placeholders)
const buildPath = (...args: any[]) => {
  const segments = Array.from(args).filter(a => typeof a === 'string' || typeof a === 'number');
  return segments.map(String).join('/');
};

// Simple query builder tokens
export const collection = (...args: any[]) => ({ __path: buildPath(...args) });
export const doc = (...args: any[]) => ({ __path: buildPath(...args) });

export const where = (field: string, op: string, value: any) => ({ __type: 'where', field, op, value });
export const orderBy = (field: string, dir: string = 'asc') => ({ __type: 'orderBy', field, dir });
export const limit = (n: number) => ({ __type: 'limit', n });
export const query = (collectionRef: any, ...clauses: any[]) => ({ __path: collectionRef?.__path || buildPath(collectionRef), __clauses: clauses });

const toDocs = (arr: any[]) => (arr || []).map((item: any) => ({ id: item.id || item._id || '', data: () => item }));

const buildUrlWithClauses = (path: string, clauses: any[] = []) => {
  const url = new URL(`${API_BASE}/${path}`);
  const params = url.searchParams;
  for (const c of clauses || []) {
    if (!c || !c.__type) continue;
    if (c.__type === 'where' && c.op === '==') {
      params.append(c.field, String(c.value));
    }
    if (c.__type === 'orderBy') {
      params.append('_sort', c.field);
      params.append('_order', c.dir || 'asc');
    }
    if (c.__type === 'limit') {
      params.append('_limit', String(c.n));
    }
  }
  return url.toString();
};

export const getDocs = async (refOrQuery: any) => {
  try {
    if (!refOrQuery) return { docs: [] };
    if (!API_BASE) {
      console.warn('API_BASE not configured; skipping REST fetch in getDocs and returning empty list.');
      return { docs: [] };
    }
    let path = refOrQuery.__path || buildPath(refOrQuery);
    let url = '';
    if (refOrQuery.__clauses) {
      url = buildUrlWithClauses(path, refOrQuery.__clauses);
    } else {
      url = `${API_BASE}/${path}`;
    }
    const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
    const json = await res.json().catch(() => null);
    const items = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : (json && json.items ? json.items : (json && json.products ? json.products : [])));
    return { docs: toDocs(items) };
  } catch (err) {
    console.error('getDocs error:', err);
    return { docs: [] };
  }
};

export const getDoc = async (docRef: any) => {
  try {
    if (!docRef) return { exists: () => false, data: () => ({}) };
    const path = docRef.__path || buildPath(docRef);
    if (!API_BASE) {
      console.warn('API_BASE not configured; skipping REST fetch in getDoc and returning empty result.');
      return { exists: () => false, data: () => ({}) };
    }
    const res = await fetch(`${API_BASE}/${path}`, { headers: getAuthHeaders(), credentials: 'include' });
    if (res.status === 404) return { exists: () => false, data: () => ({}) };
    const json = await res.json().catch(() => null);
    if (!json) return { exists: () => false, data: () => ({}) };
    // If API returns wrapper object, try to unwrap
    const item = json && (json.item || json.data || json || {});
    return { exists: () => true, data: () => item, id: item.id || item._id || '' };
  } catch (err) {
    console.error('getDoc error:', err);
    return { exists: () => false, data: () => ({}) };
  }
};

export const addDoc = async (collectionRef: any, data: any) => {
  try {
    const path = collectionRef?.__path || buildPath(collectionRef);
    if (!API_BASE) {
      throw new Error('API_BASE not configured; cannot perform addDoc in this runtime.');
    }
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error('addDoc error:', err);
    throw err;
  }
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  // setDoc in Firestore is create/overwrite — map to PUT
  return updateDoc(docRef, data);
};

export const updateDoc = async (docRef: any, data: any) => {
  try {
    const path = docRef?.__path || buildPath(docRef);
    if (!API_BASE) {
      throw new Error('API_BASE not configured; cannot perform updateDoc in this runtime.');
    }
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error('updateDoc error:', err);
    throw err;
  }
};

export const deleteDoc = async (docRef: any) => {
  try {
    const path = docRef?.__path || buildPath(docRef);
    if (!API_BASE) {
      throw new Error('API_BASE not configured; cannot perform deleteDoc in this runtime.');
    }
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error('deleteDoc error:', err);
    throw err;
  }
};

export const onSnapshot = (refOrQuery: any, callback: any) => {
  // Best-effort: perform one-time fetch and call callback with a snapshot-like object.
  let mounted = true;
  (async () => {
    try {
      const snapshot = await getDocs(refOrQuery);
      if (!mounted) return;
      callback({ docs: snapshot.docs });
    } catch (err) {
      console.error('onSnapshot error:', err);
    }
  })();
  return () => { mounted = false; };
};

export const serverTimestamp = (...args: any[]) => new Date();

export const Timestamp = {
  now: () => new Date(),
};

// Storage mocks
export const ref = (...args: any[]) => ({});
export const uploadBytes = async (...args: any[]) => ({});
export const getDownloadURL = async (...args: any[]) => "";
export const deleteObject = async (...args: any[]) => {};

// Operation type
export const OperationType = {
  ADD: "add",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  READ: "read",
  GET: "get",
  CREATE: "create",
};

// Error handler
export const handleFirestoreError = (error: any): string => {
  console.error("Firestore error:", error);
  return error.message || "An error occurred";
};

// Type exports
export type FirebaseUser = any;
export type Auth = any;
export type Firestore = any;
export type Storage = any;
export type DocumentReference = any;
export type Query = any;
