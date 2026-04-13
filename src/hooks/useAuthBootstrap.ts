import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import AuthService from '../lib/authService';

/**
 * App-level auth bootstrap hook
 * Ensures session is restored ONCE at app startup, before routes are evaluated
 * Prevents race conditions where routes redirect before auth check completes
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
        // Restore session from backend/Supabase
        const restored = await AuthService.restoreSession();
        
        if (isMounted) {
          if (restored) {
            console.log('[AUTH] Session restored:', {
              userId: restored.user?.id,
              role: restored.role,
            });
          } else {
            console.log('[AUTH] No session found, user is unauthenticated');
          }
        }
      } catch (error) {
        console.error('[AUTH] Bootstrap error:', error);
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
