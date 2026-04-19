import { getProductRouteAliases } from "./productRouteResolution";
import { cleanSeoSlug } from "./seoMarketplace";

export type ExShopiRouteSnapshot =
  | {
      kind: "product";
      path: string;
      product: any;
      relatedProducts?: any[];
    }
  | {
      kind: "category";
      path: string;
      category: {
        slug?: string;
        subcategorySlug?: string;
        name: string;
      };
      products: any[];
      categories?: any[];
    }
  | {
      kind: "landing" | "home" | "blog-index" | "blog-post" | "listing";
      path: string;
      [key: string]: unknown;
    }
  | {
      kind: "static" | "brand";
      path: string;
      [key: string]: unknown;
    };

export function readRouteSnapshot(): ExShopiRouteSnapshot | null {
  if (typeof window === "undefined") return null;
  const snapshot = window.__EXSHOPI_ROUTE_DATA__;
  if (!snapshot || typeof snapshot !== "object") return null;
  return snapshot as ExShopiRouteSnapshot;
}

function normalizeSnapshotPath(value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.startsWith("/") ? normalized.replace(/\/+$/, "") || "/" : `/${normalized}`.replace(/\/+$/, "") || "/";
}

function normalizeSnapshotIdentifier(value?: string | null) {
  return cleanSeoSlug(String(value || ""));
}

export function resolveProductSnapshot(
  snapshot: ExShopiRouteSnapshot | null,
  input: {
    identifier?: string | null;
    pathname?: string | null;
    category?: string | null;
    subcategory?: string | null;
  }
) {
  if (!snapshot || snapshot.kind !== "product" || !snapshot.product) return null;

  const normalizedPathname = normalizeSnapshotPath(input.pathname);
  const normalizedIdentifier = normalizeSnapshotIdentifier(input.identifier);
  const routePath = normalizeSnapshotPath(snapshot.path);
  const snapshotProduct = snapshot.product;
  const aliases = getProductRouteAliases(snapshotProduct).map((value) => normalizeSnapshotPath(value));
  const routeIdentifier = normalizeSnapshotIdentifier(snapshotProduct.slug || snapshotProduct.id);
  const requestedRoutePath = normalizeSnapshotPath(
    [input.category, input.subcategory, input.identifier].filter(Boolean).join("/")
  );

  if (normalizedPathname && (normalizedPathname === routePath || aliases.includes(normalizedPathname))) {
    return snapshotProduct;
  }

  if (requestedRoutePath && (requestedRoutePath === routePath || aliases.includes(requestedRoutePath))) {
    return snapshotProduct;
  }

  if (normalizedIdentifier && normalizedIdentifier === routeIdentifier) {
    return snapshotProduct;
  }

  return null;
}
