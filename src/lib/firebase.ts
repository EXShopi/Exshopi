import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const EXSHOPI_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDa8n-OTSLEQW5UITFRUqPY7NKZz__RJEE',
  authDomain: 'exshopi-ec718.firebaseapp.com',
  projectId: 'exshopi-ec718',
  storageBucket: 'exshopi-ec718.firebasestorage.app',
  messagingSenderId: '58717827364',
  appId: '1:58717827364:web:cd5de7f1b00c94f7943b1',
  measurementId: 'G-PG08TBT74Q',
};

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

  return window.location.protocol === 'https:';
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

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const envMatchesExshopiProject = envFirebaseConfig.projectId === EXSHOPI_FIREBASE_CONFIG.projectId;

const firebaseConfig =
  isLivePhoneVerificationRuntime() || !envMatchesExshopiProject
    ? { ...EXSHOPI_FIREBASE_CONFIG }
    : envFirebaseConfig;

const hasFirebaseConfig = Object.values(firebaseConfig).slice(0, 6).every(Boolean);

if (typeof window !== 'undefined') {
  logFirebaseRuntime('config', {
    hostname: getRuntimeHostname(),
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
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
