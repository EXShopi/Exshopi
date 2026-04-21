import {
  ConfirmationResult,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut,
  signInWithCredential,
  signInWithPhoneNumber,
} from 'firebase/auth';
import {
  EXPECTED_FIREBASE_AUTHORIZED_DOMAINS,
  canAttemptFirebasePhoneVerification,
  firebaseApp,
  firebaseAuth,
  getMissingFirebasePhoneEnvVars,
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
    __exshopiFirebasePhoneState?: {
      recaptchaVerifier: RecaptchaVerifier | null;
      confirmationResult: ConfirmationResult | null;
      activeContainerId: string;
      activeContainerElement: HTMLElement | null;
      recaptchaRenderPromise: Promise<number> | null;
      activePhoneNumber: string;
      pendingSendPromise: Promise<{ phone: string; verificationId: string }> | null;
      cooldownUntil: number;
    };
  }
}

type PersistedPhoneOtpSession = {
  phone: string;
  verificationId: string;
  createdAt: string;
};

type FirebasePhoneSendResult = {
  phone: string;
  verificationId: string;
  resendAvailableAt: string;
};

const OTP_SESSION_STORAGE_KEY = 'exshopi:firebase-phone-otp-session:v1';
const PHONE_SEND_COOLDOWN_MS = 45_000;

function getGlobalState() {
  if (typeof window === 'undefined') {
    return {
      recaptchaVerifier: null,
      confirmationResult: null,
      activeContainerId: '',
      activeContainerElement: null,
      recaptchaRenderPromise: null,
      activePhoneNumber: '',
      pendingSendPromise: null,
      cooldownUntil: 0,
    };
  }

  if (!window.__exshopiFirebasePhoneState) {
    window.__exshopiFirebasePhoneState = {
      recaptchaVerifier: null,
      confirmationResult: null,
      activeContainerId: '',
      activeContainerElement: null,
      recaptchaRenderPromise: null,
      activePhoneNumber: '',
      pendingSendPromise: null,
      cooldownUntil: 0,
    };
  }

  return window.__exshopiFirebasePhoneState;
}

function readPersistedOtpSession(): PersistedPhoneOtpSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(OTP_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.phone !== 'string' ||
      typeof parsed.verificationId !== 'string'
    ) {
      return null;
    }

    return {
      phone: parsed.phone,
      verificationId: parsed.verificationId,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function persistOtpSession(session: PersistedPhoneOtpSession | null) {
  if (typeof window === 'undefined') return;

  if (!session) {
    window.sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(OTP_SESSION_STORAGE_KEY, JSON.stringify(session));
}

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
  const state = getGlobalState();
  const persistedSession = readPersistedOtpSession();
  return {
    hostname: typeof window === 'undefined' ? '' : window.location.hostname || '',
    origin: typeof window === 'undefined' ? '' : window.location.origin || '',
    projectId: firebaseApp?.options?.projectId || '',
    authDomain: firebaseApp?.options?.authDomain || '',
    liveRuntime: isLivePhoneVerificationRuntime(),
    enabled: isFirebasePhoneVerificationEnabled(),
    supportedOrigin: isFirebasePhoneVerificationSupportedOnCurrentOrigin(),
    hasRecaptchaVerifier: Boolean(state.recaptchaVerifier),
    hasConfirmationResult: Boolean(state.confirmationResult),
    activeContainerId: state.activeContainerId,
    persistedOtpPhone: persistedSession?.phone || '',
    persistedOtpCreatedAt: persistedSession?.createdAt || '',
    hasPendingSend: Boolean(state.pendingSendPromise),
    cooldownRemainingMs: Math.max(0, state.cooldownUntil - Date.now()),
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
  if (normalized.includes('auth/too-many-requests') || normalized.includes('auth/quota-exceeded')) {
    return 'Too many attempts. Please wait.';
  }
  if (normalized.includes('auth/invalid-verification-code')) {
    return 'The verification code is incorrect.';
  }
  if (normalized.includes('auth/code-expired') || normalized.includes('auth/session-expired')) {
    return 'The verification code expired. Please request a new code.';
  }
  if (normalized.includes('auth/operation-not-allowed')) {
    return 'Phone Authentication is not enabled in Firebase Authentication for this project.';
  }
  if (normalized.includes('auth/unauthorized-domain')) {
    return `This domain is not authorized for Firebase phone verification yet. Add ${EXPECTED_FIREBASE_AUTHORIZED_DOMAINS.join(', ')} to Firebase Authorized Domains.`;
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
  const state = getGlobalState();
  logPhoneVerification('verifier-reset', {
    hadVerifier: Boolean(state.recaptchaVerifier || (typeof window !== 'undefined' && window.recaptchaVerifier)),
    activeContainerId: state.activeContainerId,
  });
  state.recaptchaRenderPromise = null;
  state.recaptchaVerifier?.clear();
  if (typeof window !== 'undefined' && window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    delete window.recaptchaVerifier;
  }
  state.recaptchaVerifier = null;
  state.activeContainerId = '';
  state.activeContainerElement = null;
}

export function getFirebasePhoneSendCooldownRemainingMs() {
  const state = getGlobalState();
  return Math.max(0, state.cooldownUntil - Date.now());
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
  const state = getGlobalState();
  if (!canAttemptFirebasePhoneVerification() || !firebaseAuth) {
    const missingEnvVars = getMissingFirebasePhoneEnvVars();
    throw new Error(
      missingEnvVars.length
        ? `Firebase phone verification is not configured. Missing env vars: ${missingEnvVars.join(', ')}`
        : 'Firebase phone verification is not configured.'
    );
  }

  if (!isFirebasePhoneVerificationSupportedOnCurrentOrigin()) {
    throw new Error('Firebase phone verification requires localhost or HTTPS.');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    logPhoneVerification('verifier-missing-container', { containerId });
    throw new Error('Phone verification widget is not ready yet.');
  }

  const hasDetachedContainer =
    Boolean(state.activeContainerElement) &&
    !document.body.contains(state.activeContainerElement as HTMLElement);
  const hasReplacedContainer =
    Boolean(state.activeContainerElement) && state.activeContainerElement !== container;
  const shouldRecreateVerifier =
    forceRefresh ||
    !state.recaptchaVerifier ||
    state.activeContainerId !== containerId ||
    hasDetachedContainer ||
    hasReplacedContainer;

  if (shouldRecreateVerifier) {
    logPhoneVerification('verifier-create-start', {
      containerId,
      forceRefresh,
      hadVerifier: Boolean(state.recaptchaVerifier),
      activeContainerId: state.activeContainerId,
      hasDetachedContainer,
      hasReplacedContainer,
    });
    if (forceRefresh || state.activeContainerId !== containerId || hasDetachedContainer || hasReplacedContainer) {
      resetRecaptchaState();
      prepareRecaptchaContainer(containerId);
    }
    state.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
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
      window.recaptchaVerifier = state.recaptchaVerifier;
    }
    state.activeContainerId = containerId;
    state.activeContainerElement = container;
    state.recaptchaRenderPromise = state.recaptchaVerifier
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

  if (!state.recaptchaRenderPromise) {
    throw new Error('Phone verification widget could not be prepared.');
  }

  await state.recaptchaRenderPromise;
  return state.recaptchaVerifier;
}

export function getActiveFirebasePhoneOtpSession() {
  return readPersistedOtpSession();
}

function clearPhoneConfirmationState(options?: { resetRecaptcha?: boolean }) {
  const state = getGlobalState();
  state.confirmationResult = null;
  state.activePhoneNumber = '';
  persistOtpSession(null);
  if (options?.resetRecaptcha) {
    resetRecaptchaState();
  }
}

export async function sendFirebasePhoneCode(phone: string, containerId: string): Promise<FirebasePhoneSendResult> {
  const state = getGlobalState();
  const normalizedPhone = normalizeUaePhone(phone);
  const cooldownRemainingMs = getFirebasePhoneSendCooldownRemainingMs();
  if (cooldownRemainingMs > 0) {
    logPhoneVerification('send-code-blocked-cooldown', {
      phone: normalizedPhone,
      containerId,
      cooldownRemainingMs,
    });
    throw new Error('auth/too-many-requests Please wait before requesting another code.');
  }

  if (state.pendingSendPromise) {
    logPhoneVerification('send-code-duplicate-blocked', {
      phone: normalizedPhone,
      containerId,
      activePhoneNumber: state.activePhoneNumber,
    });
    throw new Error('auth/too-many-requests Verification code request already in progress.');
  }

  const sendPromise: Promise<FirebasePhoneSendResult> = (async () => {
    try {
      logPhoneVerification('send-code-start', {
        phone: normalizedPhone,
        containerId,
        hadExistingVerifier: Boolean(state.recaptchaVerifier),
      });
      const verifier = await ensureRecaptcha(containerId, false);
      state.confirmationResult = null;
      state.activePhoneNumber = normalizedPhone;
      const nextConfirmationResult = await signInWithPhoneNumber(firebaseAuth!, normalizedPhone, verifier);
      state.confirmationResult = nextConfirmationResult;
      state.cooldownUntil = Date.now() + PHONE_SEND_COOLDOWN_MS;
      persistOtpSession({
        phone: normalizedPhone,
        verificationId: nextConfirmationResult.verificationId,
        createdAt: new Date().toISOString(),
      });
      logPhoneVerification('send-code-success', {
        phone: normalizedPhone,
        containerId,
        verificationId: nextConfirmationResult.verificationId,
        cooldownUntil: state.cooldownUntil,
      });
      return {
        phone: normalizedPhone,
        verificationId: nextConfirmationResult.verificationId,
        resendAvailableAt: new Date(state.cooldownUntil).toISOString(),
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
    const errorCode = extractErrorCode(error);
    const errorMessage = getErrorMessage(error);
    const normalizedError = describeFirebasePhoneVerificationError(error).toLowerCase();

    if (
      errorCode === 'auth/too-many-requests' ||
      errorCode === 'auth/quota-exceeded' ||
      normalizedError.includes('too many')
    ) {
      state.cooldownUntil = Date.now() + PHONE_SEND_COOLDOWN_MS;
    }

    clearPhoneConfirmationState({
      resetRecaptcha:
        normalizedError.includes('removed') ||
        errorCode === 'auth/captcha-check-failed' ||
        errorCode === 'auth/invalid-app-credential' ||
        errorCode === 'auth/internal-error' ||
        errorCode === 'auth/network-request-failed',
    });

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
    } finally {
      state.pendingSendPromise = null;
    }
  })();

  state.pendingSendPromise = sendPromise;
  return sendPromise;
}

export async function verifyFirebasePhoneCode(code: string) {
  const state = getGlobalState();
  const normalizedCode = String(code || '').trim();
  const persistedSession = readPersistedOtpSession();
  const verificationId =
    state.confirmationResult?.verificationId || persistedSession?.verificationId || '';

  if (!verificationId) {
    throw new Error('Request a verification code first.');
  }

  logPhoneVerification('verify-code-start', {
    codeLength: normalizedCode.length,
    hasInMemoryConfirmationResult: Boolean(state.confirmationResult),
    hasPersistedVerificationId: Boolean(persistedSession?.verificationId),
  });

  try {
    const result = state.confirmationResult
      ? await state.confirmationResult.confirm(normalizedCode)
      : await signInWithCredential(
          firebaseAuth!,
          PhoneAuthProvider.credential(verificationId, normalizedCode)
        );

    logPhoneVerification('verify-code-success', {
      phone: result.user.phoneNumber || '',
      verificationId,
    });

    clearPhoneConfirmationState();
    await signOut(firebaseAuth!);

    return {
      uid: result.user.uid,
      phone: result.user.phoneNumber || persistedSession?.phone || '',
      verificationId,
    };
  } catch (error) {
    console.error(
      '[Firebase Phone Verification] verifyFirebasePhoneCode failed:',
      describeFirebasePhoneVerificationError(error),
      error
    );
    const errorCode = extractErrorCode(error);
    const normalizedError = describeFirebasePhoneVerificationError(error).toLowerCase();
    if (
      errorCode === 'auth/code-expired' ||
      errorCode === 'auth/session-expired' ||
      errorCode === 'auth/captcha-check-failed' ||
      errorCode === 'auth/invalid-app-credential' ||
      errorCode === 'auth/internal-error' ||
      errorCode === 'auth/network-request-failed' ||
      normalizedError.includes('removed') ||
      normalizedError.includes('expired')
    ) {
      clearPhoneConfirmationState({
        resetRecaptcha: true,
      });
    }
    logPhoneVerification('verify-code-failure', {
      verificationId,
      error: describeFirebasePhoneVerificationError(error),
    });
    throw error instanceof Error ? error : new Error(String(error || 'Unknown phone verification error'));
  }
}

export function resetFirebasePhoneVerification(options?: { resetRecaptcha?: boolean }) {
  clearPhoneConfirmationState(options);
}
