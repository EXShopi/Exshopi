import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import {
  canAttemptFirebasePhoneVerification,
  firebaseApp,
  firebaseAuth,
  isDevelopmentPhoneOtpFallbackAllowed,
  isFirebasePhoneVerificationEnabled,
  isFirebasePhoneVerificationSupportedOnCurrentOrigin,
  isLivePhoneVerificationRuntime,
} from './firebase';

export {
  canAttemptFirebasePhoneVerification,
  isFirebasePhoneVerificationEnabled,
  isFirebasePhoneVerificationSupportedOnCurrentOrigin,
};

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;
let activeContainerId = '';
let recaptchaRenderPromise: Promise<number> | null = null;

function logPhoneVerification(label: string, details: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  console.info(`[firebase-phone] ${label}`, {
    hostname: window.location.hostname || '',
    projectId: firebaseApp?.options?.projectId || '',
    authDomain: firebaseApp?.options?.authDomain || '',
    ...details,
  });
}

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

export function getFirebasePhoneVerificationRuntimeInfo() {
  return {
    hostname: typeof window === 'undefined' ? '' : window.location.hostname || '',
    origin: typeof window === 'undefined' ? '' : window.location.origin || '',
    projectId: firebaseApp?.options?.projectId || '',
    authDomain: firebaseApp?.options?.authDomain || '',
    liveRuntime: isLivePhoneVerificationRuntime(),
    enabled: isFirebasePhoneVerificationEnabled(),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
    ? error
    : '';
}

function isBillingNotEnabledError(error: unknown) {
  const normalized = describeFirebasePhoneVerificationError(error).toLowerCase();
  return (
    normalized.includes('auth/billing-not-enabled') ||
    normalized.includes('billing-not-enabled') ||
    normalized.includes('billing not enabled')
  );
}

export function getReadableFirebasePhoneVerificationError(error: unknown) {
  const normalized = describeFirebasePhoneVerificationError(error).toLowerCase();

  if (isBillingNotEnabledError(error)) {
    return 'Firebase billing issue. Contact support.';
  }
  if (normalized.includes('auth/invalid-phone-number')) {
    return 'Enter a valid UAE phone number';
  }
  if (normalized.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait.';
  }
  if (normalized.includes('auth/operation-not-allowed')) {
    return 'Phone Authentication is not enabled in Firebase Authentication for this project.';
  }
  if (normalized.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized for Firebase phone verification yet.';
  }
  if (normalized.includes('auth/captcha-check-failed')) {
    return 'Refresh the page and try again';
  }
  if (normalized.includes('auth/invalid-app-credential') || normalized.includes('auth/app-not-authorized')) {
    return 'Firebase phone verification is blocked for this app right now. Check the Firebase app config and authorized domains.';
  }
  if (normalized.includes('auth/network-request-failed')) {
    return 'Check your internet connection';
  }
  if (
    normalized.includes('recaptcha enterprise') ||
    normalized.includes('recaptcha v2') ||
    normalized.includes('recaptchaparams') ||
    normalized.includes('app verification')
  ) {
    return 'Phone verification could not start securely. Firebase fell back to reCAPTCHA v2 for this session. Refresh the page and try again.';
  }

  return error instanceof Error && error.message
    ? error.message
    : 'We could not complete phone verification right now. Please try again.';
}

export function shouldFallbackToBackendOtp(error: unknown) {
  if (!isDevelopmentPhoneOtpFallbackAllowed() || isLivePhoneVerificationRuntime()) {
    return false;
  }

  const normalized = describeFirebasePhoneVerificationError(error).toLowerCase();

  return (
    isBillingNotEnabledError(error) ||
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
  logPhoneVerification('verifier-reset', {
    hadVerifier: Boolean(recaptchaVerifier || (typeof window !== 'undefined' && window.recaptchaVerifier)),
    activeContainerId,
  });
  recaptchaRenderPromise = null;
  recaptchaVerifier?.clear();
  if (typeof window !== 'undefined' && window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    delete window.recaptchaVerifier;
  }
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
  if (!canAttemptFirebasePhoneVerification() || !firebaseAuth) {
    throw new Error('Firebase phone verification is not configured.');
  }

  if (!isFirebasePhoneVerificationSupportedOnCurrentOrigin()) {
    throw new Error('Firebase phone verification requires localhost or HTTPS.');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    logPhoneVerification('verifier-missing-container', { containerId });
    throw new Error('Phone verification widget is not ready yet.');
  }

  if (forceRefresh || !recaptchaVerifier || activeContainerId !== containerId) {
    logPhoneVerification('verifier-create-start', {
      containerId,
      forceRefresh,
      hadVerifier: Boolean(recaptchaVerifier),
      activeContainerId,
    });
    resetRecaptchaState();
    prepareRecaptchaContainer(containerId);
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        logPhoneVerification('verifier-callback', { containerId });
      },
      'expired-callback': () => {
        logPhoneVerification('verifier-expired', { containerId });
        resetRecaptchaState();
      },
      'error-callback': () => {
        logPhoneVerification('verifier-error-callback', { containerId });
        resetRecaptchaState();
      },
    });
    if (typeof window !== 'undefined') {
      window.recaptchaVerifier = recaptchaVerifier;
    }
    activeContainerId = containerId;
    recaptchaRenderPromise = recaptchaVerifier
      .render()
      .then((widgetId) => {
        logPhoneVerification('verifier-create-success', {
          containerId,
          widgetId,
        });
        return widgetId;
      })
      .catch((error) => {
        logPhoneVerification('verifier-create-failure', {
          containerId,
          error: describeFirebasePhoneVerificationError(error),
        });
        resetRecaptchaState();
        throw error;
      });
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
    logPhoneVerification('send-code-start', {
      phone: normalizedPhone,
      containerId,
    });
    const verifier = await ensureRecaptcha(containerId, true);
    confirmationResult = null;
    confirmationResult = await signInWithPhoneNumber(firebaseAuth!, normalizedPhone, verifier);
    logPhoneVerification('send-code-success', {
      phone: normalizedPhone,
      containerId,
    });
    return {
      phone: normalizedPhone,
    };
  } catch (error) {
    console.error(
      '[Firebase Phone Verification] sendFirebasePhoneCode failed:',
      describeFirebasePhoneVerificationError(error),
      error
    );
    logPhoneVerification('send-code-failure', {
      phone: normalizedPhone,
      containerId,
      error: describeFirebasePhoneVerificationError(error),
    });
    resetRecaptchaState();
    confirmationResult = null;
    const errorCode = extractErrorCode(error);
    const errorMessage = getErrorMessage(error);

    if (isBillingNotEnabledError(error)) {
      throw new Error(
        'auth/billing-not-enabled Firebase phone verification requires billing to be enabled before real SMS OTP can be sent from this project.'
      );
    }

    if (errorCode === 'auth/internal-error' && /recaptcha|app verification|app credential/i.test(errorMessage)) {
      throw new Error('auth/invalid-app-credential Firebase reCAPTCHA app verification failed.');
    }

    if (errorCode === 'auth/internal-error') {
      throw new Error(`auth/internal-error ${errorMessage || 'Firebase phone verification failed internally.'}`.trim());
    }

    throw error instanceof Error ? error : new Error(String(error || 'Unknown phone verification error'));
  }
}

export async function verifyFirebasePhoneCode(code: string) {
  if (!confirmationResult) {
    throw new Error('Request a verification code first.');
  }

  logPhoneVerification('verify-code-start', {
    codeLength: String(code || '').trim().length,
  });
  const result = await confirmationResult.confirm(String(code || '').trim());
  logPhoneVerification('verify-code-success', {
    phone: result.user.phoneNumber || '',
  });
  return {
    uid: result.user.uid,
    phone: result.user.phoneNumber || '',
  };
}

export function resetFirebasePhoneVerification() {
  confirmationResult = null;
  resetRecaptchaState();
}
