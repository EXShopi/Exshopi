import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import { buildApiUrl } from './services/api';

function sanitizeBrowserAuthState() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('refreshToken');

    const rawAuth = localStorage.getItem('auth-storage');
    if (rawAuth) {
      try {
        const parsed = JSON.parse(rawAuth);
        const currentState = parsed?.state && typeof parsed.state === 'object' ? parsed.state : {};
        const accessToken =
          typeof currentState.accessToken === 'string' && currentState.accessToken.trim()
            ? currentState.accessToken
            : null;

        const nextState = {
          ...currentState,
          accessToken,
          refreshToken: null,
        };

        localStorage.setItem(
          'auth-storage',
          JSON.stringify({
            ...parsed,
            state: nextState,
          })
        );

        if (!accessToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('adminId');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('sellerId');
          localStorage.removeItem('sellerEmail');
        }
      } catch {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('sellerId');
        localStorage.removeItem('sellerEmail');
      }
    } else if (!localStorage.getItem('token')) {
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerEmail');
    }

    for (const key of Object.keys(sessionStorage)) {
      if (
        key === 'refreshToken' ||
        key === 'token' ||
        key === 'adminId' ||
        key === 'adminEmail' ||
        key === 'sellerId' ||
        key === 'sellerEmail' ||
        key === 'auth-storage'
      ) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Could not sanitize browser auth state:', error);
  }
}

// Intercept client-side calls to paths starting with `/api`.
// If an explicit API base is configured this will rewrite to the absolute backend URL.
// If no API base exists in production, return a JSON 503 so callers receive structured errors
// instead of HTML (which causes `Unexpected token '<'` when code calls `res.json()`).
if (typeof window !== 'undefined') {
  sanitizeBrowserAuthState();

  try {
    const originalFetch = window.fetch.bind(window);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      try {
        if (typeof input === 'string' && input.startsWith('/api')) {
          const resolved = buildApiUrl(input);
          if (!resolved) {
            return new Response(JSON.stringify({ error: 'No API base configured; backend calls disabled in this runtime.' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return originalFetch(resolved, init);
        }
      } catch (err) {
        console.error('fetch rewrite error:', err);
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    // If we cannot wrap fetch, fail silently and let native fetch work as before.
    console.warn('Could not install global /api fetch wrapper:', err);
  }
}

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  console.error("Root element not found!");
}
