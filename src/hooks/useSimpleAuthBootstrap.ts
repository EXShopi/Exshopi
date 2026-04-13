import { useEffect, useRef } from 'react';
import AuthService from '../lib/authService';

/**
 * Simple app-level auth bootstrap
 * Restores session from backend on initial load (once only, handles page refresh)
 * No loading states, just silent restoration
 */
export function useSimpleAuthBootstrap() {
  const bootstrapDoneRef = useRef(false);
  
  useEffect(() => {
    // Only run once per app instance
    if (bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;

    (async () => {
      try {
        const restored = await AuthService.restoreSession();
        if (restored) {
          console.log('[AUTH] Session restored silently:', restored.user?.email);
        }
      } catch (error) {
        console.debug('[AUTH] Silent restore failed (expected for logged-out users):', error);
      }
    })();
  }, []);
}
