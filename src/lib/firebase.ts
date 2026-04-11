import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

console.log('FIREBASE ENV CHECK', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.slice(0, 8),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
});

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

function getRuntimeOrigin() {
  if (typeof window === 'undefined') return '';
  return (window.location.origin || '').trim();
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
  apiKey: "AIzaSyD0xyGjeDV9GWShRhE7L6I_gKwWnmLBTFo",
  authDomain: "exshopi-ec718.firebaseapp.com",
  projectId: "exshopi-ec718",
  storageBucket: "exshopi-ec718.firebasestorage.app",
  messagingSenderId: "58717827364",
  appId: "1:58717827364:web:cd5de7f1b00c94f7943b1",
};

const hasFirebaseConfig = true;

if (typeof window !== 'undefined') {
  logFirebaseRuntime('config', {
    hostname: getRuntimeHostname(),
    origin: window.location.origin,
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    appId: firebaseConfig.appId,
    liveRuntime: isLivePhoneVerificationRuntime(),
    hasFirebaseConfig,
  });
}

export const firebaseApp = hasFirebaseConfig
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
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

export function isFirebasePhoneVerificationSupportedOnCurrentOrigin() {
  return true;
}

export function canAttemptFirebasePhoneVerification() {
  return Boolean(firebaseAuth);
}

export function isDevelopmentPhoneOtpFallbackAllowed() {
  return import.meta.env.DEV || isLocalPhoneVerificationRuntime();
}
