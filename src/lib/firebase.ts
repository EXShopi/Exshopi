import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const LIVE_PHONE_VERIFICATION_HOSTS = new Set([
  'exshopi-frontend.onrender.com',
  'exshopi.onrender.com',
  'exshopi.com',
  'www.exshopi.com',
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

const hasFirebaseConfig = Object.values(firebaseConfig).slice(0, 6).every(Boolean);

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

export function isFirebasePhoneVerificationEnabled() {
  return Boolean(firebaseAuth);
}

export function isDevelopmentPhoneOtpFallbackAllowed() {
  return import.meta.env.DEV || isLocalPhoneVerificationRuntime();
}
