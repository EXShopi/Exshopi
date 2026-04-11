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

function getRuntimeHostname() {
  if (typeof window === 'undefined') return '';
  return (window.location.hostname || '').trim().toLowerCase();
}

function logFirebaseRuntime(label: string, details: Record<string, unknown>) {
  console.info(`[firebase] ${label}`, details);
}

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
  !firebaseConfig.appId ? 'VITE_FIREBASE_APP_ID' : '',
  !firebaseConfig.messagingSenderId ? 'VITE_FIREBASE_MESSAGING_SENDER_ID' : '',
].filter(Boolean);

const hasFirebasePhoneConfig = missingFirebaseEnvVars.length === 0;

if (typeof window !== 'undefined') {
  console.log('FIREBASE ENV CHECK', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    hostname: window.location.hostname,
    origin: window.location.origin,
  });

  if (!hasFirebasePhoneConfig) {
    console.error('[firebase] Missing required Firebase env vars for Phone Auth', {
      missingFirebaseEnvVars,
      firebaseConfig,
      hostname: window.location.hostname,
      origin: window.location.origin,
    });
  }

  logFirebaseRuntime('config', {
    hostname: getRuntimeHostname(),
    origin: window.location.origin,
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    appId: firebaseConfig.appId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    liveRuntime: isLivePhoneVerificationRuntime(),
    hasFirebasePhoneConfig,
    missingFirebaseEnvVars,
  });
}

export const firebaseApp = hasFirebasePhoneConfig
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
  return hasFirebasePhoneConfig;
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
  return Boolean(firebaseAuth) && hasFirebasePhoneConfig && isFirebasePhoneVerificationSupportedOnCurrentOrigin();
}

export function isDevelopmentPhoneOtpFallbackAllowed() {
  return import.meta.env.DEV || isLocalPhoneVerificationRuntime();
}
