import { supabase } from '../supabaseClient';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  name?: string;
  fullName?: string;
  phone?: string | null;
  country?: string | null;
  role?: string;
  status?: string;
  sellerApplicationStatus?: string | null;
}

interface AuthResponse {
  user: AuthUser;
  role?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  seller?: { id?: string } | null;
  sellerApplication?: { id?: string; status?: string } | null;
  isDevMode?: boolean;
}

type PublicUserRow = {
  id?: string;
  email?: string;
  name?: string | null;
  full_name?: string | null;
  fullName?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  phone?: string | null;
  country?: string | null;
  role?: string | null;
  status?: string | null;
  seller_application_status?: string | null;
  sellerApplicationStatus?: string | null;
};

type BackendSessionResponse = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    fullName?: string;
    displayName?: string;
    phone?: string | null;
    country?: string | null;
    role?: string;
    status?: string;
    sellerApplicationStatus?: string | null;
  } | null;
  role?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  seller?: { id?: string } | null;
  sellerApplication?: { id?: string; status?: string } | null;
};

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_manager', 'support_agent'] as const;

function normalizeRole(role?: string | null): string {
  return (role || '').toLowerCase();
}

function normalizeStatus(status?: string | null): string {
  return (status || 'active').toLowerCase();
}

function buildDisplayName(authEmail: string, profile?: PublicUserRow | null): string {
  return (
    profile?.name ||
    profile?.full_name ||
    profile?.fullName ||
    profile?.display_name ||
    profile?.displayName ||
    authEmail ||
    'User'
  );
}

function getPersistedAdminEmail(): string {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem('adminEmail') || '').trim().toLowerCase();
}

function isPersistedAdminEmail(email?: string | null): boolean {
  const saved = getPersistedAdminEmail();
  const current = (email || '').trim().toLowerCase();
  return Boolean(saved && current && saved === current);
}

function isProfilePermissionError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('permission denied') ||
    normalized.includes('schema public') ||
    normalized.includes('row-level security') ||
    normalized.includes('not allowed')
  );
}

function buildProfileFromAuthUser(authUser: {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
}): PublicUserRow {
  const metadata = authUser.user_metadata || {};

  return {
    id: authUser.id,
    email: authUser.email || '',
    name: metadata.name || metadata.full_name || metadata.fullName || metadata.displayName || '',
    full_name: metadata.full_name || metadata.fullName || metadata.name || metadata.displayName || '',
    display_name: metadata.displayName || metadata.name || metadata.full_name || metadata.fullName || '',
    phone: metadata.phone || '',
    country: metadata.country || 'AE',
    role: metadata.role || null,
    status: metadata.status || 'active',
    seller_application_status:
      metadata.seller_application_status || metadata.sellerApplicationStatus || null,
  };
}

function mapBackendSessionToAuthResult(session: BackendSessionResponse): AuthResponse | null {
  if (!session?.user?.id) return null;

  const user = session.user;

  return {
    user: {
      id: user.id,
      email: user.email || '',
      displayName: user.displayName || user.name || user.fullName || user.email || 'User',
      name: user.name || user.fullName || user.displayName || '',
      fullName: user.fullName || user.name || user.displayName || '',
      phone: user.phone || '',
      country: user.country || 'AE',
      role: session.role || user.role || 'customer',
      status: user.status || 'active',
      sellerApplicationStatus:
        user.sellerApplicationStatus || session.sellerApplication?.status || null,
    },
    role: session.role || user.role || 'customer',
    accessToken: session.accessToken || null,
    refreshToken: null,
    seller: session.seller || null,
    sellerApplication: session.sellerApplication || null,
    isDevMode: false,
  };
}

async function getProfileByEmail(email: string): Promise<PublicUserRow | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isProfilePermissionError(error.message || '')) {
      console.warn('[AUTH] Could not load public.users profile:', error.message);
    }
    return null;
  }

  return (data as PublicUserRow | null) || null;
}

async function getCurrentAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('[AUTH] Could not read session token:', error.message);
    return null;
  }
  return data.session?.access_token || null;
}

function deriveRole(email?: string | null, profile?: PublicUserRow | null, storedRole?: string | null): string {
  const normalizedStoredRole = normalizeRole(storedRole);
  const normalizedProfileRole = normalizeRole(profile?.role);

  if (ADMIN_ROLES.includes(normalizedStoredRole as any)) return normalizedStoredRole;
  if (ADMIN_ROLES.includes(normalizedProfileRole as any)) return normalizedProfileRole;
  if (isPersistedAdminEmail(email)) return 'admin';

  return normalizedProfileRole || 'customer';
}

function mapAuthResult(params: {
  authUser: { id: string; email?: string | null };
  profile?: PublicUserRow | null;
  accessToken?: string | null;
  isDevMode?: boolean;
  storedRole?: string | null;
}): AuthResponse {
  const { authUser, profile, accessToken = null, isDevMode = false, storedRole = null } = params;
  const email = authUser.email || profile?.email || '';
  const role = deriveRole(email, profile, storedRole);
  const status = normalizeStatus(profile?.status);
  const sellerApplicationStatus =
    profile?.seller_application_status || profile?.sellerApplicationStatus || null;

  return {
    user: {
      id: authUser.id,
      email,
      displayName: buildDisplayName(email, profile),
      name: profile?.name || profile?.full_name || profile?.fullName || '',
      fullName: profile?.full_name || profile?.fullName || profile?.name || '',
      phone: profile?.phone || '',
      country: profile?.country || 'AE',
      role,
      status,
      sellerApplicationStatus,
    },
    role,
    accessToken,
    refreshToken: null,
    seller: null,
    sellerApplication: sellerApplicationStatus ? { status: sellerApplicationStatus } : null,
    isDevMode,
  };
}

function isHtmlErrorMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('<!doctype html') ||
    msg.includes('<html') ||
    msg.includes("unexpected token '<'") ||
    msg.includes('non-json') ||
    msg.includes('index.html')
  );
}

export class AuthService {
  static async signIn(
    email: string,
    password: string,
    options?: { requireBackendSession?: boolean }
  ): Promise<AuthResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const requireBackendSession = Boolean(options?.requireBackendSession);

      try {
        const backendSession = mapBackendSessionToAuthResult(
          await userAPI.login(normalizedEmail, password)
        );

        if (backendSession) {
          useAuthStore.getState().setAccessToken(backendSession.accessToken || null);
          useAuthStore.getState().setRefreshToken(null);
          return backendSession;
        }
      } catch (backendError: any) {
        if (requireBackendSession) {
          throw backendError;
        }
        console.warn('[AUTH] Backend sign-in fallback:', backendError?.message || backendError);
      }

      if (requireBackendSession) {
        throw new Error('Admin sign-in requires a live backend session. Please try again.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw new Error(error.message || 'Invalid credentials');
      if (!data.user?.id) throw new Error('Invalid login response. Missing user data.');

      let profile: PublicUserRow | null = null;
      // Prefer fetching profile by user id (works with RLS policies that allow users to read their own row)
      try {
        const { data: p, error: pErr } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
        if (pErr) {
          if (!isProfilePermissionError(pErr.message || '')) {
            console.warn('[AUTH] Could not load users profile by id:', pErr.message);
          }
        } else {
          profile = (p as PublicUserRow) || null;
        }
      } catch (e) {
        console.warn('[AUTH] Error fetching profile by id:', e);
      }

      // Fallback to email lookup (older deployments); may be restricted by RLS
      if (!profile) {
        profile = await getProfileByEmail(normalizedEmail);
      }

      if (!profile) {
        profile = buildProfileFromAuthUser(data.user as any);
      }

      const accessToken = data.session?.access_token || null;

      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().setRefreshToken(null);

      return mapAuthResult({
        authUser: {
          id: data.user.id,
          email: data.user.email,
        },
        profile,
        accessToken,
        storedRole: isPersistedAdminEmail(normalizedEmail) ? 'admin' : useAuthStore.getState().role,
      });
    } catch (error: any) {
      console.error('[AUTH] Sign-in error:', error?.message || error);

      const msg = String(error?.message || 'Failed to sign in');

      if (msg === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      if (isHtmlErrorMessage(msg)) {
        throw new Error('Authentication service returned an invalid response. Please check live auth configuration.');
      }

      if (msg.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please confirm your email. Check your inbox for a confirmation link.');
      }

      if (msg.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password.');
      }

      throw new Error(msg);
    }
  }

  static async signUp(
    email: string,
    password: string,
    displayName: string,
    phone = ''
  ): Promise<AuthResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const backendSession = mapBackendSessionToAuthResult(
          await userAPI.register({
            name: displayName,
            email: normalizedEmail,
            password,
            phone,
            role: 'customer',
            country: 'AE',
          })
        );

        if (backendSession) {
          useAuthStore.getState().setAccessToken(backendSession.accessToken || null);
          useAuthStore.getState().setRefreshToken(null);
          return backendSession;
        }
      } catch (backendError: any) {
        console.warn('[AUTH] Backend sign-up fallback:', backendError?.message || backendError);
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            displayName,
            name: displayName,
            phone,
          },
        },
      });

      if (error) throw new Error(error.message || 'Failed to register user');
      if (!data.user?.id) throw new Error('Failed to register user');

      const maybeToken = data.session?.access_token || null;
      useAuthStore.getState().setAccessToken(maybeToken);
      useAuthStore.getState().setRefreshToken(null);

      const baseProfile: PublicUserRow = {
        email: normalizedEmail,
        name: displayName,
        full_name: displayName,
        phone,
        country: 'AE',
        role: 'customer',
        status: 'active',
      };

      return mapAuthResult({
        authUser: {
          id: data.user.id,
          email: data.user.email,
        },
        profile: baseProfile,
        accessToken: maybeToken,
        storedRole: 'customer',
      });
    } catch (error: any) {
      console.error('[AUTH] Sign-up error:', error?.message || error);

      const msg = String(error?.message || 'Failed to register user');

      if (msg === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      if (isHtmlErrorMessage(msg)) {
        throw new Error('Authentication service returned an invalid response. Please check live auth configuration.');
      }

      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        throw new Error('This email is already registered.');
      }

      throw new Error(msg);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await userAPI.logout().catch(() => null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    } finally {
      localStorage.removeItem('sellerId');
      localStorage.removeItem('adminId');
      localStorage.removeItem('sellerEmail');
      localStorage.removeItem('adminEmail');
      useAuthStore.getState().resetAuth();
    }
  }

  static async restoreSession() {
    try {
      const storedAccessToken =
        useAuthStore.getState().accessToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      try {
        if (storedAccessToken) {
          const backendSession = mapBackendSessionToAuthResult(await userAPI.getSession());
          if (backendSession) {
            useAuthStore.getState().setAccessToken(backendSession.accessToken || null);
            useAuthStore.getState().setRefreshToken(null);
            return backendSession;
          }
        }
      } catch (backendSessionError: any) {
        console.warn(
          '[AUTH] Backend session check fallback:',
          backendSessionError?.message || backendSessionError
        );
      }

      try {
        const backendSession = mapBackendSessionToAuthResult(await userAPI.refresh());
        if (backendSession) {
          useAuthStore.getState().setAccessToken(backendSession.accessToken || null);
          useAuthStore.getState().setRefreshToken(null);
          return backendSession;
        }
      } catch (backendRefreshError: any) {
        console.warn(
          '[AUTH] Backend session restore fallback:',
          backendRefreshError?.message || backendRefreshError
        );
      }

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        useAuthStore.getState().setAccessToken(null);
        useAuthStore.getState().setRefreshToken(null);
        return null;
      }

      const authUser = data.session.user;
      const accessToken = data.session.access_token || null;
      let profile: PublicUserRow | null = null;
      try {
        const { data: p, error: pErr } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
        if (pErr) {
          if (!isProfilePermissionError(pErr.message || '')) {
            console.warn('[AUTH] Could not load users profile by id:', pErr.message);
          }
        } else {
          profile = (p as PublicUserRow) || null;
        }
      } catch (e) {
        console.warn('[AUTH] Error fetching profile by id:', e);
      }

      if (!profile) {
        profile = await getProfileByEmail(authUser.email || '');
      }

      if (!profile) {
        profile = buildProfileFromAuthUser(authUser as any);
      }

      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().setRefreshToken(null);

      return mapAuthResult({
        authUser: {
          id: authUser.id,
          email: authUser.email,
        },
        profile,
        accessToken,
        storedRole: useAuthStore.getState().role,
      });
    } catch (error) {
      console.error('[AUTH] Restore session error:', error);
      useAuthStore.getState().setAccessToken(null);
      useAuthStore.getState().setRefreshToken(null);
      return null;
    }
  }

  static async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('Email is required.');
    }

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/admin/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message || 'Failed to send reset email.');
    }

    return {
      success: true,
      message: 'Password reset link sent to your email.',
    };
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (!token) {
      console.warn('[AUTH] Reset password called without explicit token. Proceeding with recovery session if present.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'Failed to reset password.');
    }

    const accessToken = await getCurrentAccessToken();
    useAuthStore.getState().setAccessToken(accessToken);
    useAuthStore.getState().setRefreshToken(null);

    return {
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    };
  }
}

export default AuthService;
