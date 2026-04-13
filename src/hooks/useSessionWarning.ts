import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth';

export type SessionWarningState = 'idle' | 'warning' | 'expired';

export interface SessionWarningConfig {
  warningBeforeExpiry?: number; // ms before expiry to show warning (default: 2 min = 120000)
  onWarning?: () => void; // Called when warning shown
  onExpired?: () => void; // Called when session expired
}

/**
 * Session timeout warning hook
 * Monitors session and shows warning before timeout
 */
export function useSessionWarning(config: SessionWarningConfig = {}) {
  const { warningBeforeExpiry = 2 * 60 * 1000, onWarning, onExpired } = config;
  const { accessToken } = useAuthStore();
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningShownRef = useRef(false);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      onWarning?.();
      console.log('[SESSION] Warning: session about to expire');
    }
  }, [onWarning]);

  const resetWarning = useCallback(() => {
    warningShownRef.current = false;
  }, []);

  useEffect(() => {
    if (!accessToken) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);
    resetWarning();

    // Show warning 2 minutes before 15-minute expiration
    // So warning at 13 minutes mark
    const EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes
    const WARNING_TIME = EXPIRY_TIME - warningBeforeExpiry;

    timerRef.current = setTimeout(() => {
      showWarning();

      // Show expired notification after warning
      const expiredTimer = setTimeout(() => {
        onExpired?.();
        console.log('[SESSION] Expired: session timeout reached');
      }, warningBeforeExpiry);

      return () => clearTimeout(expiredTimer);
    }, WARNING_TIME);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [accessToken, warningBeforeExpiry, showWarning, resetWarning, onExpired]);

  return { resetWarning };
}
