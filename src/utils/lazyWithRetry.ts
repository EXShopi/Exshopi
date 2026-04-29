import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const DYNAMIC_IMPORT_RELOAD_PREFIX = "exshopi:dynamic-import-reload";
const DYNAMIC_IMPORT_PATTERNS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "chunkloaderror",
  "loading chunk",
  "error loading dynamically imported module",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message || "";
  return String(error || "");
}

export function isDynamicImportLikeError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return DYNAMIC_IMPORT_PATTERNS.some((pattern) => message.includes(pattern));
}

export function tryRecoverDynamicImport(error: unknown, scope = "app") {
  if (typeof window === "undefined") return false;
  if (!isDynamicImportLikeError(error)) return false;

  const storageKey = `${DYNAMIC_IMPORT_RELOAD_PREFIX}:${scope}:${window.location.pathname}`;

  try {
    if (sessionStorage.getItem(storageKey)) {
      sessionStorage.removeItem(storageKey);
      return false;
    }

    sessionStorage.setItem(storageKey, String(Date.now()));
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  scope: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (tryRecoverDynamicImport(error, scope)) {
        return new Promise<never>(() => undefined);
      }

      throw error;
    }
  });
}
