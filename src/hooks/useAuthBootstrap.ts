import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import AuthService from '../lib/authService';

const IS_DEV = import.meta.env.DEV;

/**
 * App-level auth bootstrap hook
 * Ensures session is restored ONCE at app startup, before routes are evaluated
 * Restores from backend cookie/session state before route guards evaluate
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
        const restored = await AuthService.restoreSession();

        if (isMounted && IS_DEV) {
          console.debug(restored ? '[AUTH] Session restored' : '[AUTH] Session not available');
        }
      } catch (error) {
        if (isMounted && IS_DEV) {
          console.debug('[AUTH] Bootstrap check skipped for public session', error);
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
