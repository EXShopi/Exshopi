import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import { buildApiUrl } from './services/api';

// Intercept client-side calls to paths starting with `/api`.
// If an explicit API base is configured this will rewrite to the absolute backend URL.
// If no API base exists in production, return a JSON 503 so callers receive structured errors
// instead of HTML (which causes `Unexpected token '<'` when code calls `res.json()`).
if (typeof window !== 'undefined') {
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
