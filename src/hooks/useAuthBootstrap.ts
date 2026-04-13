import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import AuthService from '../lib/authService';

/**
 * App-level auth bootstrap hook
 * Ensures session is restored ONCE at app startup, before routes are evaluated
 * Only attempts auth check if user likely has a session (token in storage)
 * Prevents unnecessary 401 errors on public pages
 */
export function useAuthBootstrap() {
  const { setLoading } = useAuthStore();
  const bootstrapDoneRef = useRef(false);
  
  useEffect(() => {
    if (bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;

    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        // Only attempt restore if we have evidence of a session
        const hasStoredToken = typeof window !== 'undefined' 
          ? Boolean(localStorage.getItem('token') || localStorage.getItem('auth-storage'))
          : false;
        
        if (!hasStoredToken) {
          // No stored credentials - skip auth restore on public pages
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Restore session from backend/Supabase only if we have a token
        const restored = await AuthService.restoreSession();
        
        if (isMounted) {
          if (restored) {
            console.log('[AUTH] Session restored');
          } else {
            console.log('[AUTH] Session not available');
          }
        }
      } catch (error) {
        // Silently fail - don't log auth errors on public pages
        if (isMounted) {
          console.debug('[AUTH] Bootstrap check skipped for public session');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setLoading]);
}
