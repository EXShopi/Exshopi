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

async function ensureRecaptcha(containerId: string) {
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

  if (!recaptchaVerifier || activeContainerId !== containerId) {
    recaptchaVerifier?.clear();
    confirmationResult = null;
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
    });
    activeContainerId = containerId;
    await recaptchaVerifier.render();
  }

  return recaptchaVerifier;
}

export async function sendFirebasePhoneCode(phone: string, containerId: string) {
  const normalizedPhone = normalizeUaePhone(phone);
  try {
    const verifier = await ensureRecaptcha(containerId);
    confirmationResult = await signInWithPhoneNumber(firebaseAuth!, normalizedPhone, verifier);
    return {
      phone: normalizedPhone,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Firebase Phone Verification] sendFirebasePhoneCode failed:', describeFirebasePhoneVerificationError(error));
    }
    recaptchaVerifier?.clear();
    recaptchaVerifier = null;
    activeContainerId = '';
    confirmationResult = null;
    throw error;
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
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
  activeContainerId = '';
}
