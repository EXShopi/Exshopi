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
    };

export function readRouteSnapshot(): ExShopiRouteSnapshot | null {
  if (typeof window === "undefined") return null;
  const snapshot = window.__EXSHOPI_ROUTE_DATA__;
  if (!snapshot || typeof snapshot !== "object") return null;
  return snapshot as ExShopiRouteSnapshot;
}
