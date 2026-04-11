import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import {
  firebaseAuth,
  isDevelopmentPhoneOtpFallbackAllowed,
  isFirebasePhoneVerificationEnabled,
  isLivePhoneVerificationRuntime,
} from './firebase';

export { isFirebasePhoneVerificationEnabled };

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;
let activeContainerId = '';
let recaptchaRenderPromise: Promise<number> | null = null;

function extractErrorCode(error: unknown) {
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  return code.trim();
}

export function describeFirebasePhoneVerificationError(error: unknown) {
  const code = extractErrorCode(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : '';

  return [code, message].filter(Boolean).join(' ').trim() || 'Unknown Firebase phone verification error';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
    ? error
    : '';
}

export function shouldFallbackToBackendOtp(error: unknown) {
  if (!isDevelopmentPhoneOtpFallbackAllowed() || isLivePhoneVerificationRuntime()) {
    return false;
  }

  const normalized = describeFirebasePhoneVerificationError(error).toLowerCase();

  return (
    normalized.includes('firebase phone verification is not configured') ||
    normalized.includes('requires localhost or https') ||
    normalized.includes('auth/unauthorized-domain') ||
    normalized.includes('auth/invalid-app-credential') ||
    normalized.includes('auth/app-not-authorized') ||
    normalized.includes('auth/captcha-check-failed') ||
    normalized.includes('auth/operation-not-supported-in-this-environment') ||
    normalized.includes('phone verification widget is not ready yet')
  );
}

export function isFirebasePhoneVerificationSupportedOnCurrentOrigin() {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  return isLocalhost || window.isSecureContext;
}

export function normalizeUaePhone(phone: string) {
  const raw = String(phone || '').replace(/[^\d+]/g, '');
  if (raw.startsWith('+971')) return raw;
  if (raw.startsWith('971')) return `+${raw}`;
  if (raw.startsWith('05')) return `+971${raw.slice(1)}`;
  if (raw.startsWith('5')) return `+971${raw}`;
  return raw;
}

export function isValidUaePhone(phone: string) {
  return /^\+971(5\d{8}|[234679]\d{7,8})$/.test(normalizeUaePhone(phone));
}

function resetRecaptchaState() {
  recaptchaRenderPromise = null;
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
  activeContainerId = '';
}

function prepareRecaptchaContainer(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('Phone verification widget is not ready yet.');
  }

  // Firebase reCAPTCHA can fail with stale iframe/script state when the same
  // container is reused after retries or step transitions, so we always start
  // from a clean container before creating the next verifier.
  container.innerHTML = '';
  return container;
}

async function ensureRecaptcha(containerId: string, forceRefresh = false) {
  if (!firebaseAuth || !isFirebasePhoneVerificationEnabled()) {
    throw new Error('Firebase phone verification is not configured.');
  }

  if (!isFirebasePhoneVerificationSupportedOnCurrentOrigin()) {
    throw new Error('Firebase phone verification requires localhost or HTTPS.');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('Phone verification widget is not ready yet.');
  }

  if (forceRefresh || !recaptchaVerifier || activeContainerId !== containerId) {
    resetRecaptchaState();
    prepareRecaptchaContainer(containerId);
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        if (import.meta.env.DEV) {
          console.debug('[Firebase Phone Verification] reCAPTCHA solved.');
        }
      },
      'expired-callback': () => {
        if (import.meta.env.DEV) {
          console.debug('[Firebase Phone Verification] reCAPTCHA expired. Resetting verifier.');
        }
        resetRecaptchaState();
      },
      'error-callback': () => {
        if (import.meta.env.DEV) {
          console.debug('[Firebase Phone Verification] reCAPTCHA errored. Resetting verifier.');
        }
        resetRecaptchaState();
      },
    });
    activeContainerId = containerId;
    recaptchaRenderPromise = recaptchaVerifier.render();
  }

  if (!recaptchaRenderPromise) {
    throw new Error('Phone verification widget could not be prepared.');
  }

  await recaptchaRenderPromise;
  return recaptchaVerifier;
}

export async function sendFirebasePhoneCode(phone: string, containerId: string) {
  const normalizedPhone = normalizeUaePhone(phone);
  try {
    const verifier = await ensureRecaptcha(containerId, true);
    confirmationResult = null;
    confirmationResult = await signInWithPhoneNumber(firebaseAuth!, normalizedPhone, verifier);
    return {
      phone: normalizedPhone,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Firebase Phone Verification] sendFirebasePhoneCode failed:',
        describeFirebasePhoneVerificationError(error),
        error
      );
    }
    resetRecaptchaState();
    confirmationResult = null;
    const errorCode = extractErrorCode(error);
    const errorMessage = getErrorMessage(error);

    if (errorCode === 'auth/internal-error' && /recaptcha|app verification|app credential/i.test(errorMessage)) {
      throw new Error('auth/invalid-app-credential Firebase reCAPTCHA app verification failed.');
    }

    throw error instanceof Error ? error : new Error(String(error || 'Unknown phone verification error'));
  }
}

export async function verifyFirebasePhoneCode(code: string) {
  if (!confirmationResult) {
    throw new Error('Request a verification code first.');
  }

  const result = await confirmationResult.confirm(String(code || '').trim());
  return {
    uid: result.user.uid,
    phone: result.user.phoneNumber || '',
  };
}

export function resetFirebasePhoneVerification() {
  confirmationResult = null;
  resetRecaptchaState();
}
