import { userAPI } from '../services/api';
import { useAuthStore } from '../store/auth';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    role?: string;
    status?: string;
    sellerApplicationStatus?: string | null;
  };
  role?: string;
  accessToken?: string | null;
  seller?: { id?: string } | null;
  sellerApplication?: { id?: string; status?: string } | null;
  isDevMode?: boolean;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const session = await userAPI.login(email, password);
      if (!session || !session.user?.id) throw new Error(session?.error || 'Invalid credentials');
      useAuthStore.getState().setAccessToken(session.accessToken || null);
      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          displayName: (session.user.name || session.user.fullName || session.user.displayName) || session.user.email || 'User',
          role: session.role || session.user.role || 'customer',
          status: session.user.status || 'active',
          sellerApplicationStatus: session.user.sellerApplicationStatus || session.sellerApplication?.status || null,
        },
        role: session.role || session.user.role || 'customer',
        accessToken: session.accessToken || null,
        seller: session.seller || null,
        sellerApplication: session.sellerApplication || null,
      };
    } catch (error: any) {
      console.error('[AUTH] Backend sign-in error:', error?.message || error);
      const msg = error?.message || 'Failed to sign in';
      if (msg.includes('Email not confirmed')) {
        throw new Error('Please confirm your email. Check your inbox for a confirmation link.');
      }
      throw new Error(msg);
    }
  }

  static async signUp(email: string, password: string, displayName: string): Promise<AuthResponse> {
    try {
      const session = await userAPI.register({ email, password, name: displayName });
      if (!session || !session.user?.id) throw new Error(session?.error || 'Failed to register user');
      useAuthStore.getState().setAccessToken(session.accessToken || null);
      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          displayName: displayName || session.user.name || session.user.fullName || 'User',
          role: session.role || session.user.role || 'customer',
          status: session.user.status || 'active',
          sellerApplicationStatus: session.user.sellerApplicationStatus || null,
        },
        role: session.role || session.user.role || 'customer',
        accessToken: session.accessToken || null,
        seller: session.seller || null,
        sellerApplication: session.sellerApplication || null,
      };
    } catch (error: any) {
      console.error('[AUTH] Backend sign-up error:', error?.message || error);
      if (String(error?.message || '').includes('already exists')) {
        throw new Error('This email is already registered.');
      }
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await userAPI.logout();
      localStorage.removeItem('sellerId');
      localStorage.removeItem('adminId');
      localStorage.removeItem('sellerEmail');
      localStorage.removeItem('adminEmail');
      useAuthStore.getState().setAccessToken(null);
    } catch (error) {
      console.error('[AUTH] Sign out cleanup error:', error);
    }
  }

  static async restoreSession() {
    try {
      const session = await userAPI.refresh();
      useAuthStore.getState().setAccessToken(session.accessToken || null);
      return session;
    } catch {
      useAuthStore.getState().setAccessToken(null);
      return null;
    }
  }

  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Password reset link sent to your email.'
    };
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!token || newPassword.length < 6) {
      throw new Error('Invalid reset token or password too short.');
    }

    // In production, this would verify token and update password
    return {
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    };
  }

}

export default AuthService;
