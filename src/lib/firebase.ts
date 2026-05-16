import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const LIVE_PHONE_VERIFICATION_HOSTS = new Set([
  'exshopi-frontend.onrender.com',
  'exshopi.onrender.com',
  'exshopi.com',
  'www.exshopi.com',
  'localhost',
  '127.0.0.1',
  '::1',
]);

export const EXPECTED_FIREBASE_AUTHORIZED_DOMAINS = Array.from(LIVE_PHONE_VERIFICATION_HOSTS).filter(
  (host) => !['localhost', '127.0.0.1', '::1'].includes(host)
);

function getRuntimeHostname() {
  if (typeof window === 'undefined') return '';
  return (window.location.hostname || '').trim().toLowerCase();
}

function logFirebaseRuntime(label: string, details: Record<string, unknown>) {
  console.info(`[firebase] ${label}`, details);
}

const FIREBASE_DEBUG_ENABLED =
  import.meta.env.DEV || String(import.meta.env.VITE_ENABLE_AUTH_DEBUG || '').trim().toLowerCase() === 'true';

const CUSTOMER_OTP_ENABLED = String(import.meta.env.VITE_ENABLE_CUSTOMER_OTP || '').trim().toLowerCase() === 'true';

export function isLivePhoneVerificationRuntime() {
  const host = getRuntimeHostname();
  if (!host) return false;

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1'
  ) {
    return false;
  }

  if (typeof window === 'undefined') return false;

  return window.location.protocol === 'https:' && LIVE_PHONE_VERIFICATION_HOSTS.has(host);
}

export function isLocalPhoneVerificationRuntime() {
  const host = getRuntimeHostname();
  return (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1'
  );
}

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
};

const missingFirebaseEnvVars = [
  !firebaseConfig.apiKey ? 'VITE_FIREBASE_API_KEY' : '',
  !firebaseConfig.authDomain ? 'VITE_FIREBASE_AUTH_DOMAIN' : '',
  !firebaseConfig.projectId ? 'VITE_FIREBASE_PROJECT_ID' : '',
  !firebaseConfig.storageBucket ? 'VITE_FIREBASE_STORAGE_BUCKET' : '',
  !firebaseConfig.appId ? 'VITE_FIREBASE_APP_ID' : '',
  !firebaseConfig.messagingSenderId ? 'VITE_FIREBASE_MESSAGING_SENDER_ID' : '',
].filter(Boolean);

const hasFirebasePhoneConfig = missingFirebaseEnvVars.length === 0;
const hasFirebaseWebConfig = missingFirebaseEnvVars.length === 0;

export function getFirebaseConfigStatus() {
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname || '';
  const origin = typeof window === 'undefined' ? '' : window.location.origin || '';
  return {
    hostname,
    origin,
    projectId: firebaseConfig.projectId || '',
    authDomain: firebaseConfig.authDomain || '',
    hasFirebaseWebConfig,
    customerOtpEnabled: CUSTOMER_OTP_ENABLED,
    missingFirebaseEnvVars: [...missingFirebaseEnvVars],
    authorizedDomainExpected: EXPECTED_FIREBASE_AUTHORIZED_DOMAINS.includes(hostname),
  };
}

export function logFirebaseAuthDebug(label: string, details: Record<string, unknown> = {}) {
  if (!FIREBASE_DEBUG_ENABLED || typeof window === 'undefined') return;

  console.info(`[firebase-auth-debug] ${label}`, {
    ...getFirebaseConfigStatus(),
    ...details,
  });
}

if (typeof window !== 'undefined') {
  if (!hasFirebaseWebConfig) {
    console.error('[firebase] Missing required Firebase env vars', {
      missingFirebaseEnvVars,
      hostname: window.location.hostname,
      origin: window.location.origin,
      projectId: firebaseConfig.projectId || '',
      authDomain: firebaseConfig.authDomain || '',
    });
  }

  logFirebaseAuthDebug('config', {
    liveRuntime: isLivePhoneVerificationRuntime(),
    expectedAuthorizedDomains: EXPECTED_FIREBASE_AUTHORIZED_DOMAINS,
    emailPasswordLoginPathEnabled: true,
  });
}

export const firebaseApp = hasFirebaseWebConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

if (firebaseAuth) {
  // Keep Firebase phone auth in real-verification mode on live environments.
  // Local development can still opt into Firebase's testing behavior when needed.
  firebaseAuth.settings.appVerificationDisabledForTesting = import.meta.env.DEV && isLocalPhoneVerificationRuntime();
}

export function isFirebasePhoneVerificationEnabled() {
  return CUSTOMER_OTP_ENABLED && hasFirebasePhoneConfig;
}

export function isFirebaseWebAuthConfigured() {
  return hasFirebaseWebConfig;
}

export function getMissingFirebasePhoneEnvVars() {
  return [...missingFirebaseEnvVars];
}

export function isFirebasePhoneVerificationSupportedOnCurrentOrigin() {
  const hostname = getRuntimeHostname();
  const isKnownHost = LIVE_PHONE_VERIFICATION_HOSTS.has(hostname);
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  return Boolean(hostname) && (isLocalhost || (window.location.protocol === 'https:' && isKnownHost));
}

export function canAttemptFirebasePhoneVerification() {
  return CUSTOMER_OTP_ENABLED && Boolean(firebaseAuth) && hasFirebasePhoneConfig && isFirebasePhoneVerificationSupportedOnCurrentOrigin();
}

export function isDevelopmentPhoneOtpFallbackAllowed() {
  return import.meta.env.DEV || isLocalPhoneVerificationRuntime();
}
