import fs from "node:fs/promises";
import path from "node:path";
import { getProductLifecycleState } from "../../src/lib/productLifecycle";

const ROOT = process.cwd();
const DEFAULT_REMOTE_API_BASE = "https://exshopi-api.onrender.com/api";

function normalizeApiBase(value?: string) {
  return String(value || "")
    .trim()
    .replace(/\/$/, "");
}

function resolveRemoteApiBase() {
  return (
    normalizeApiBase(process.env.PRERENDER_API_BASE) ||
    normalizeApiBase(process.env.VITE_API_BASE_URL) ||
    normalizeApiBase(process.env.VITE_API_BASE) ||
    DEFAULT_REMOTE_API_BASE
  );
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Response was not an array");
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export function isLivePrerenderProduct(product: any) {
  return getProductLifecycleState(product).isCustomerVisible;
}

async function loadLocalProducts() {
  const db = JSON.parse(await fs.readFile(path.join(ROOT, "backend", "db.json"), "utf8"));
  return Array.isArray(db.products) ? db.products : [];
}

export async function loadPrerenderProducts() {
  const remoteApiBase = resolveRemoteApiBase();

  try {
    const remoteProducts = await fetchJsonWithTimeout(`${remoteApiBase}/products`);
    return {
      source: `remote:${remoteApiBase}`,
      products: remoteProducts.filter(isLivePrerenderProduct),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[prerender-data] Falling back to backend/db.json after remote fetch failed: ${reason}`);
    const localProducts = await loadLocalProducts();
    return {
      source: "local:backend/db.json",
      products: localProducts.filter(isLivePrerenderProduct),
    };
  }
}
