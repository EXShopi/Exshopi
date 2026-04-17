import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { userAPI } from '../services/api';

const IS_DEV = import.meta.env.DEV;

/**
 * Proactive token refresh hook
 * Prevents surprise logouts by refreshing token BEFORE it expires
 * Refresh happens at 13m mark (2m before 15m expiration)
 */
export function useProactiveTokenRefresh() {
  const { accessToken, setAccessToken } = useAuthStore();
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!accessToken) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Cleanup previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Try to refresh after 13 minutes (780 seconds)
    // Token expires at 15 minutes, so this gives 2 minute buffer
    const REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutes in milliseconds

    timerRef.current = setTimeout(async () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      // Debounce: don't refresh if we refreshed in last 5 minutes
      if (timeSinceLastRefresh < 5 * 60 * 1000) {
        if (IS_DEV) {
          console.debug('[TOKEN] Refresh skipped, too recent');
        }
        return;
      }

        try {
          if (IS_DEV) {
            console.debug('[TOKEN] Proactive refresh starting...');
          }
          lastRefreshRef.current = now;

          const response = await userAPI.refresh();
          if (response?.accessToken) {
            setAccessToken(response.accessToken);
            if (IS_DEV) {
              console.debug('[TOKEN] Proactive refresh successful');
            }
          }
        } catch (error) {
          // Don't force logout on refresh error from proactive hook — just log
          if (IS_DEV) {
            console.warn('[TOKEN] Proactive refresh failed:', error);
          }
        }
    }, REFRESH_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [accessToken, setAccessToken]);
}
