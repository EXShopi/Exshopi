import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseAuth, isFirebasePhoneVerificationEnabled } from './firebase';

export { isFirebasePhoneVerificationEnabled };

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;
let activeContainerId = '';

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
  const verifier = await ensureRecaptcha(containerId);
  confirmationResult = await signInWithPhoneNumber(firebaseAuth!, normalizedPhone, verifier);
  return {
    phone: normalizedPhone,
  };
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
}
