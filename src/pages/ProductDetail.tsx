import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";

import { useCartStore } from "../store/cart";
import { OrbitLoader } from "../components/ui/OrbitLoader";
import { useWishlistStore } from "../store/wishlist";
import { useAuthStore } from "../store/auth";
import { analyticsAPI, productAPI, reviewAPI } from "../services/api";
import { formatCurrencyForCountry, formatCurrencyPlainForCountry } from "../lib/currency";
import { getSellerProfile, normalizeSellerSlug } from "../lib/sellerProfiles";
import {
  buildDetailedSpecificationGroups,
  getSpecificationTemplate,
  humanizeSpecificationValue,
} from "../lib/productSpecifications";
import { buildProductPath, buildAbsoluteUrl, buildProductBreadcrumbSchema, buildProductImageAlt, getCategoryPath } from "../lib/seo";
import { findProductRouteMatch } from "../lib/productRouteResolution";
import SEO from "../components/SEO";
import { buildProductJsonLd, getProductSeoPayload } from "../utils/seo";
import {
  buildOptimizedProductTitle,
  buildProductShortDescription,
  buildProductSeoNarrative,
  cleanSeoSlug,
  UAE_TRUST_SIGNALS,
} from "../lib/seoMarketplace";
import { readRouteSnapshot, resolveProductSnapshot } from "../lib/routeSnapshot";
import { getCountryConfig, getProductCountryCompareAtPrice, getProductCountryPrice } from "../lib/countryConfig";
import { useCountryStore } from "../store/country";
import { buildCountryAwareWhatsAppMessage, getExShopiWhatsAppNumber } from "../lib/whatsapp";
import LazyComponent from "../components/LazyComponent";
// Local helpers for safe category path and slugification
function slugifyLocal(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeCategoryPath(categorySlug?: string, subcategorySlug?: string) {
  const cat = slugifyLocal(categorySlug);
  const sub = slugifyLocal(subcategorySlug);
  return getCategoryPath(cat, sub || undefined);
}
import ProductSpecificationTable from "../components/product/ProductSpecificationTable";


const productDetailCache = new Map<string, any>();

function normalizeRouteIdentifier(value?: string) {
  return cleanSeoSlug(String(value || ""));
}

function getLookupErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "Unknown product lookup error");
}

function isProductLookupAbort(error: unknown) {
  return /abort/i.test(getLookupErrorMessage(error));
}

function isProductLookupNotFound(error: unknown) {
  const message = getLookupErrorMessage(error);
  return /product not found/i.test(message) || /\b404\b/.test(message);
}

function isResolvableProductEntity(value: any) {
  return Boolean(value && !value.error && (value.id || value.slug || value.title));
}

const productHighlights = [
  "Premium aluminum unibody design",
  "Fast performance with latest processor",
  "All-day battery life up to 20 hours",
  "Optimized for UAE delivery and warranty support",
];

type ProductVariant = {
  id?: string;
  color?: string;
  size?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  image?: string;
  isDefault?: boolean | null;
};

type VariantSelection = {
  color: string;
  size: string;
  storage: string;
  ram: string;
  processor: string;
};

const EMPTY_VARIANT_SELECTION: VariantSelection = {
  color: "",
  size: "",
  storage: "",
  ram: "",
  processor: "",
};

const VARIANT_SELECTION_KEYS: Array<keyof VariantSelection> = [
  "color",
  "size",
  "storage",
  "ram",
  "processor",
];

function normalizeVariantValue(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getVariantValue(variant: ProductVariant | null | undefined, key: keyof VariantSelection) {
  return normalizeVariantValue(String(variant?.[key] || ""));
}

function hasVariantValue(value?: string | null) {
  return Boolean(normalizeVariantValue(value));
}

function variantMatchesSelection(
  variant: ProductVariant | null | undefined,
  selection: VariantSelection,
  options?: {
    ignoreKeys?: Array<keyof VariantSelection>;
    requireKeys?: Array<keyof VariantSelection>;
  }
) {
  if (!variant) return false;

  const ignoreKeys = new Set(options?.ignoreKeys || []);
  const requireKeys = options?.requireKeys || VARIANT_SELECTION_KEYS;

  return requireKeys.every((key) => {
    if (ignoreKeys.has(key)) return true;

    const desiredValue = selection[key];
    if (!desiredValue) return true;

    return getVariantValue(variant, key) === desiredValue;
  });
}

function getVariantMatchScore(variant: ProductVariant, selection: VariantSelection) {
  return VARIANT_SELECTION_KEYS.reduce((score, key) => {
    const desiredValue = selection[key];
    if (!desiredValue) return score;
    return getVariantValue(variant, key) === desiredValue ? score + 1 : score;
  }, 0);
}

function getPreferredVariant(variants: ProductVariant[]) {
  return variants.find((variant) => Boolean(variant?.isDefault)) || variants[0] || null;
}

function resolveOptionLabel<T extends string | { label?: string; name?: string }>(
  options: T[],
  selectedValue: string,
  pickLabel: (option: T) => string
) {
  const match = options.find((option) => normalizeVariantValue(pickLabel(option)) === selectedValue);
  return match ? pickLabel(match) : selectedValue;
}

function buildDefaultVariantSelection(
  variants: ProductVariant[],
  baseAttributes: Record<string, any>
): VariantSelection {
  const defaultVariant = getPreferredVariant(variants);

  return {
    color: normalizeVariantValue(defaultVariant?.color || baseAttributes.color),
    size: normalizeVariantValue(defaultVariant?.size || baseAttributes.size || baseAttributes.Size),
    storage: normalizeVariantValue(
      defaultVariant?.storage || baseAttributes.storage || baseAttributes.Storage
    ),
    ram: normalizeVariantValue(defaultVariant?.ram || baseAttributes.ram || baseAttributes.RAM),
    processor: normalizeVariantValue(
      defaultVariant?.processor || baseAttributes.processor || baseAttributes.Processor
    ),
  };
}

function variantToSelection(variant?: ProductVariant | null): VariantSelection {
  if (!variant) return EMPTY_VARIANT_SELECTION;

  return {
    color: normalizeVariantValue(variant.color),
    size: normalizeVariantValue(variant.size),
    storage: normalizeVariantValue(variant.storage),
    ram: normalizeVariantValue(variant.ram),
    processor: normalizeVariantValue(variant.processor),
  };
}

function selectionsEqual(left: VariantSelection, right: VariantSelection) {
  return VARIANT_SELECTION_KEYS.every((key) => left[key] === right[key]);
}

function findBestVariantMatch(
  variants: ProductVariant[],
  desiredSelection: VariantSelection,
  requiredKeys: Array<keyof VariantSelection> = []
) {
  if (!variants.length) return null;

  const requiredCandidates = variants.filter((variant) =>
    variantMatchesSelection(variant, desiredSelection, {
      requireKeys: requiredKeys,
    })
  );

  const candidates = requiredCandidates.length ? requiredCandidates : variants;

  return (
    [...candidates].sort((left, right) => {
      const leftExact = variantMatchesSelection(left, desiredSelection) ? 1 : 0;
      const rightExact = variantMatchesSelection(right, desiredSelection) ? 1 : 0;
      if (leftExact !== rightExact) return rightExact - leftExact;

      const leftScore = getVariantMatchScore(left, desiredSelection);
      const rightScore = getVariantMatchScore(right, desiredSelection);
      if (leftScore !== rightScore) return rightScore - leftScore;

      const leftDefault = left?.isDefault ? 1 : 0;
      const rightDefault = right?.isDefault ? 1 : 0;
      if (leftDefault !== rightDefault) return rightDefault - leftDefault;

      const leftStock = Number(left?.stock || 0);
      const rightStock = Number(right?.stock || 0);
      return rightStock - leftStock;
    })[0] || getPreferredVariant(candidates)
  );
}

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#111827",
  silver: "#d1d5db",
  gold: "#d97706",
  gray: "#9ca3af",
  grey: "#9ca3af",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  white: "#f8fafc",
  purple: "#7c3aed",
  pink: "#ec4899",
  orange: "#ea580c",
};

function colorToHex(color: string) {
  if (!color) return "#cbd5e1";
  return COLOR_HEX_MAP[color.trim().toLowerCase()] || "#94a3b8";
}

function extractImageUrl(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const nestedUrl =
      candidate.url ||
      candidate.image ||
      candidate.src ||
      candidate.secure_url ||
      candidate.secureUrl ||
      candidate.preview ||
      candidate.thumbnail ||
      candidate.path;

    if (typeof nestedUrl === "string") {
      return nestedUrl.trim();
    }
  }

  return "";
}

function getProductImages(image?: string, gallery?: unknown) {
  const galleryImages = Array.isArray(gallery)
    ? gallery.map((item) => extractImageUrl(item)).filter(Boolean)
    : [];

  const images = [extractImageUrl(image), ...galleryImages].filter(Boolean);
  const uniqueImages = Array.from(new Set(images));
  return uniqueImages.length > 0 ? uniqueImages : ["/hero/hero-1.webp"];
}

function mapToCardProduct(item: any) {
  return {
    id: String(item.id),
    slug: item.slug || String(item.id),
    specs: item.specs || {},
    title: item.title,
    price: item.price,
    priceUae: item.priceUae ?? item.price,
    priceKsa: item.priceKsa,
    oldPrice: item.oldPrice,
    compareAtPriceUae: item.compareAtPriceUae ?? item.oldPrice,
    compareAtPriceKsa: item.compareAtPriceKsa,
    rating: item.rating || 4.5,
    reviews: item.reviews || 0,
    image: item.image,
    category: item.category || item.brand || "Marketplace",
    stock:
      typeof item.stock === "number"
        ? item.stock > 0
          ? "In Stock"
          : "Out of Stock"
        : item.stockText || item.stock || "In Stock",
    seller: item.seller || item.vendor || "ExShopi Official",
    freeDelivery: item.freeDelivery ?? true,
    badge: item.badges?.[0] || item.badge,
  };
}

function normalizeMarketplaceProduct(item: any) {
  return {
    ...item,
    slug: item.slug || item.id,
    seller: item.sellerName || item.seller || "ExShopi Official",
    sellerStoreSlug: item.sellerStoreSlug,
    badges: item.badges || [],
    stock: typeof item.stock === "number" ? item.stock : 20,
    rating: item.rating || 4.5,
    reviews: item.reviews || 0,
    category: item.category || item.brand || "Marketplace",
  };
}

function formatReviewDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function copyTextFallback(text: string) {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

type DetailSlimCardProps = {
  product: ReturnType<typeof mapToCardProduct>;
  onAddToCart: (product: ReturnType<typeof mapToCardProduct>) => void;
  countryCode: "AE" | "SA";
};

const DetailSlimCard: React.FC<DetailSlimCardProps> = React.memo(({
  product,
  onAddToCart,
  countryCode,
}) => {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const sellerMeta = getSellerProfile(product.seller || "ExShopi Official");
  const productHref = buildProductPath(product);

  return (
    <Link
      to={productHref}
      className="group relative mx-auto block h-full w-full max-w-[236px] overflow-hidden rounded-[16px] border border-slate-200 bg-white p-[11px] shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)]"
    >
      <div className="relative overflow-hidden rounded-[14px] border border-slate-100 bg-[#f8fafc]">
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-rose-500 px-2 py-1 text-[9px] font-bold leading-none text-white shadow-sm">
            {product.badge}
          </span>
        )}
        {product.freeDelivery && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold leading-none text-emerald-700 shadow-sm">
            Free shipping
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex translate-y-2 items-center justify-between px-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            aria-label={`Add ${product.title} to cart`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition hover:bg-slate-800"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            type="button"
            aria-label={`Save ${product.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                id: product.id,
                slug: product.slug,
                name: product.title,
                category: product.category,
                price: product.price,
                priceUae: product.priceUae ?? product.price,
                priceKsa: product.priceKsa,
                oldPrice: product.oldPrice,
                compareAtPriceUae: product.compareAtPriceUae ?? product.oldPrice,
                compareAtPriceKsa: product.compareAtPriceKsa,
                rating: product.rating,
                reviews: product.reviews,
                badge: product.badge,
                image: product.image,
                stock: product.stock,
              });
            }}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <img
          src={product.image}
          alt={buildProductImageAlt(product)}
          loading="lazy"
          className="h-[160px] w-full object-contain p-3 transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex min-h-[170px] flex-col px-0.5 pb-0.5 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{product.category}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[40px] text-[14px] font-bold leading-[1.35] text-slate-900">
          {product.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
              />
            ))}
          </div>
          <span className="text-[10px]">({product.reviews})</span>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-[22px] font-black leading-none text-slate-950">{formatCurrencyPlainForCountry(product.price, countryCode)}</span>
          {product.oldPrice && <span className="pb-0.5 text-[11px] text-slate-600 line-through">{formatCurrencyPlainForCountry(product.oldPrice, countryCode)}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={`text-[11px] font-semibold ${String(product.stock).toLowerCase().includes("out") ? "text-slate-600" : "text-emerald-600"}`}>
            {product.stock}
          </span>
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600">
            <img
              src={sellerMeta.avatar}
              alt={sellerMeta.name}
              loading="lazy"
              className="h-5 w-5 rounded-full border border-slate-200 object-cover"
            />
            <span className="truncate font-medium text-slate-700">{sellerMeta.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default function ProductDetail() {
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const country = getCountryConfig(selectedCountry);
  const { identifier, category: paramCategory, subcategory: paramSubcategory } = useParams<{
    identifier: string;
    category?: string;
    subcategory?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, updateQuantity } = useCartStore();
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const authRole = useAuthStore((state) => state.role);
  const authUser = useAuthStore((state) => state.user);
  const cacheKey = identifier ? String(identifier) : "";
  const cachedProduct = cacheKey ? productDetailCache.get(cacheKey) : null;
  const routeSnapshot = useMemo(() => readRouteSnapshot(), [location.pathname]);
  const snapshotProduct = useMemo(() => {
    const resolvedProduct = resolveProductSnapshot(routeSnapshot, {
      identifier,
      pathname: location.pathname,
      category: paramCategory,
      subcategory: paramSubcategory,
    });
    return resolvedProduct ? normalizeMarketplaceProduct(resolvedProduct) : null;
  }, [identifier, location.pathname, paramCategory, paramSubcategory, routeSnapshot]);
  const snapshotRelatedProducts = useMemo(
    () =>
      routeSnapshot?.kind === "product" && Array.isArray(routeSnapshot.relatedProducts)
        ? routeSnapshot.relatedProducts.map((item) => normalizeMarketplaceProduct(item))
        : [],
    [routeSnapshot]
  );
  // ...existing state and hooks...
  // ...existing state and hooks...

  // ...existing state and hooks...

  // Breadcrumb helpers: assign only after productSpecs and product are declared
  let breadcrumbCategorySlug: string;
  let breadcrumbCategoryLabel: string;
  let breadcrumbCategoryLink: string;

  // ...existing code...

  // After productSpecs and product are initialized (after all useState/useMemo)
  // Place this block just before the return statement

  const [product, setProduct] = useState<any>(() => cachedProduct || snapshotProduct || null);
  const [allProducts, setAllProducts] = useState<any[]>(() => snapshotRelatedProducts);
  const [loading, setLoading] = useState(() => !(cachedProduct || snapshotProduct));
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(() => Boolean(cachedProduct || snapshotProduct));
  const [productResolution, setProductResolution] = useState<"loading" | "ready" | "retryable-error" | "missing">(
    cachedProduct || snapshotProduct ? "ready" : "loading"
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<VariantSelection>(EMPTY_VARIANT_SELECTION);
  const [mainImage, setMainImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "specifications" | "reviews" | "delivery" | "seller">("overview");
  const [wishlistActive, setWishlistActive] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [deferredContentReady, setDeferredContentReady] = useState(false);
  const [lookupDiagnostics, setLookupDiagnostics] = useState<{
    source?: string;
    reason?: string;
    retryable?: boolean;
  } | null>(null);
  const seededProduct = useMemo(() => cachedProduct || snapshotProduct || null, [cachedProduct, snapshotProduct]);
  const seededProductId = seededProduct?.id ? String(seededProduct.id) : "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const reveal = () => {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) setDeferredContentReady(true);
      }, 900);
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(reveal, { timeout: 2200 });
      } else {
        reveal();
      }
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  useEffect(() => {
    if (!identifier) return;

    let active = true;
    const controller = new AbortController();

    const fetchProduct = async () => {
      const logRouteMatch = (message: string, extra?: Record<string, unknown>) => {
        if (import.meta.env.PROD) return;
        console.info("[product-route]", message, {
          identifier,
          category: paramCategory,
          subcategory: paramSubcategory,
          ...extra,
        });
      };

      if (seededProduct) {
        setProduct(seededProduct);
        setLoading(false);
        setHasAttemptedLoad(true);
        setProductResolution("ready");
        setLookupDiagnostics({
          source: cachedProduct ? "cache" : "prerender-snapshot",
        });
        logRouteMatch("resolved from snapshot/cache", {
          productId: String(seededProduct?.id || ""),
          canonicalPath: buildProductPath(seededProduct),
        });
      } else {
        setProduct(null);
        setLoading(true);
        setProductResolution("loading");
        setLookupDiagnostics(null);
      }

      const notFoundErrors: string[] = [];
      const transientErrors: string[] = [];

      const noteLookupFailure = (source: string, error: unknown) => {
        if (isProductLookupAbort(error)) return;

        const message = getLookupErrorMessage(error);
        if (isProductLookupNotFound(error)) {
          notFoundErrors.push(`${source}: ${message}`);
        } else {
          transientErrors.push(`${source}: ${message}`);
        }

        logRouteMatch("lookup failed", {
          source,
          message,
          notFound: isProductLookupNotFound(error),
        });
      };

      const commitResolvedProduct = (resolvedProduct: any, source: string, extra?: Record<string, unknown>) => {
        const normalizedProduct = normalizeMarketplaceProduct(resolvedProduct);
        productDetailCache.set(cacheKey, normalizedProduct);
        setProduct(normalizedProduct);
        setLoading(false);
        setHasAttemptedLoad(true);
        setProductResolution("ready");
        setLookupDiagnostics({ source });
        logRouteMatch(`resolved from ${source}`, {
          productId: String(normalizedProduct?.id || ""),
          canonicalPath: buildProductPath(normalizedProduct),
          ...extra,
        });
      };

      try {
        try {
          const directProduct = await productAPI.get(String(identifier), {
            signal: controller.signal,
          });

          if (!active) return;

          if (isResolvableProductEntity(directProduct)) {
            commitResolvedProduct(directProduct, "direct-lookup");
            return;
          }
        } catch (error) {
          if (!active || controller.signal.aborted) return;
          noteLookupFailure("direct-lookup", error);
        }

        if ((paramCategory || paramSubcategory) && String(identifier || "").trim()) {
          try {
            const candidates = await productAPI.getBySlug(
              paramCategory || String(paramCategory || ""),
              paramSubcategory || String(paramSubcategory || "")
            );
            const match = (candidates || []).find((p: any) => {
              const pSlug = normalizeRouteIdentifier(p?.slug || p?.id || "");
              const ident = normalizeRouteIdentifier(identifier || "");
              return pSlug === ident || String(p?.id) === String(identifier || "");
            });

            if (match) {
              commitResolvedProduct(match, "category-aware-lookup");
              return;
            }
          } catch (error) {
            if (!active || controller.signal.aborted) return;
            noteLookupFailure("category-aware-lookup", error);
          }
        }

        try {
          const allProducts = await productAPI.getAll({ signal: controller.signal });
          if (!active) return;

          const normalizedProducts = Array.isArray(allProducts)
            ? allProducts.map((item: any) => normalizeMarketplaceProduct(item))
            : [];
          const matchedRoute = findProductRouteMatch(
            normalizedProducts,
            String(identifier || ""),
            paramCategory,
            paramSubcategory
          );

          if (matchedRoute?.product) {
            commitResolvedProduct(matchedRoute.product, "route-alias-lookup", {
              canonicalPath: matchedRoute.canonicalPath,
              matchedAlias: matchedRoute.matchedAlias,
              redirected: !matchedRoute.isCanonical,
            });
            return;
          }
        } catch (error) {
          if (!active || controller.signal.aborted) return;
          noteLookupFailure("route-alias-lookup", error);
        }

        if (!active) return;

        setLoading(false);
        setHasAttemptedLoad(true);

        if (seededProduct) {
          setProduct(seededProduct);
          setProductResolution("ready");
          setLookupDiagnostics({
            source: cachedProduct ? "cache" : "prerender-snapshot",
            reason: [...transientErrors, ...notFoundErrors].join(" | ") || "Preserved seeded product content during route revalidation.",
            retryable: transientErrors.length > 0,
          });
          logRouteMatch("preserved seeded product after route revalidation", {
            transientErrors,
            notFoundErrors,
          });
          return;
        }

        if (transientErrors.length) {
          setProduct(null);
          setProductResolution("retryable-error");
          setLookupDiagnostics({
            source: "network-fallback",
            reason: transientErrors.join(" | "),
            retryable: true,
          });
          logRouteMatch("retryable lookup failure", {
            errors: transientErrors,
          });
          return;
        }

        setProduct(null);
        setProductResolution("missing");
        setLookupDiagnostics({
          source: "confirmed-missing",
          reason: notFoundErrors.join(" | ") || "No live product matched the requested route.",
          retryable: false,
        });
        logRouteMatch("confirmed missing product", {
          errors: notFoundErrors,
        });
      } catch (error: any) {
        if (!active || controller.signal.aborted) return;

        console.error("Error fetching product:", error);
        if (seededProduct) {
          setProduct(seededProduct);
          setProductResolution("ready");
          setLookupDiagnostics({
            source: cachedProduct ? "cache" : "prerender-snapshot",
            reason: getLookupErrorMessage(error),
            retryable: true,
          });
        } else {
          setProduct(null);
          setProductResolution("retryable-error");
          setLookupDiagnostics({
            source: "unexpected-failure",
            reason: getLookupErrorMessage(error),
            retryable: true,
          });
        }
        setLoading(false);
        setHasAttemptedLoad(true);
      }
    };

    fetchProduct();

    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, cachedProduct, identifier, paramCategory, paramSubcategory, seededProduct, seededProductId]);

  useEffect(() => {
    if (!product?.id) {
      setAllProducts(snapshotRelatedProducts);
      return;
    }

    if (!deferredContentReady) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    let timeoutId: number | null = null;

    timeoutId = window.setTimeout(() => {
      productAPI
        .getAll({ signal: controller.signal })
        .then((allProds) => {
          if (!active) return;
          setAllProducts((allProds || []).map((item: any) => normalizeMarketplaceProduct(item)));
        })
        .catch((error) => {
          if (!active || controller.signal.aborted) return;
          console.error("Error fetching related products:", error);
          setAllProducts((current) => (current.length ? current : snapshotRelatedProducts));
        });
    }, 250);

    return () => {
      active = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [deferredContentReady, product?.id, snapshotRelatedProducts]);

  useEffect(() => {
    setMainImage(0);
  }, [
    product?.id,
    selectedOptions.color,
    selectedOptions.size,
    selectedOptions.storage,
    selectedOptions.ram,
    selectedOptions.processor,
  ]);

  useEffect(() => {
    if (!product?.id) return;
    const canonicalPath = buildProductPath(product);
    if (location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [
    location.pathname,
    navigate,
    product?.id,
    product?.slug,
    product?.title,
    product?.category,
    product?.subcategory,
    product?.specs?.parentCategorySlug,
    product?.specs?.categorySlug,
    product?.specs?.subcategorySlug,
  ]);

  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }

    if (activeTab !== "reviews" && !deferredContentReady) {
      return;
    }

    if (reviews.length && activeTab !== "reviews") {
      return;
    }

    let active = true;
    setReviewsLoading(true);

    reviewAPI
      .getProductReviews(String(product.id))
      .then((items) => {
        if (!active) return;
        setReviews(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error fetching product reviews:", error);
        setReviews([]);
      })
      .finally(() => {
        if (!active) return;
        setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, deferredContentReady, product?.id, reviews.length]);

  const productSpecs = product?.specs || {};
  const productSeo = getProductSeoPayload({
    countryCode: selectedCountry,
    title: product?.title,
    shortDescription: productSpecs?.shortDescription,
    description: product?.description,
    category: productSpecs?.parentCategoryName || product?.category,
    subcategory: productSpecs?.subcategoryName || product?.subcategory,
    slug: product?.slug || productSpecs?.slug,
    metaTitle: product?.metaTitle || productSpecs?.metaTitle,
    metaDescription: product?.metaDescription || productSpecs?.metaDescription,
    metaKeywords: product?.metaKeywords || productSpecs?.metaKeywords,
    canonicalUrl: product?.canonicalUrl || productSpecs?.canonicalUrl,
    ogTitle: product?.ogTitle || productSpecs?.ogTitle,
    ogDescription: product?.ogDescription || productSpecs?.ogDescription,
    ogImage: product?.ogImage || productSpecs?.ogImage || product?.image,
    image: product?.image,
    price: getProductCountryPrice(product, selectedCountry),
    stock: product?.stock,
    sku: product?.sku,
    brand: product?.brand,
    seller: product?.sellerName || product?.seller,
    condition: productSpecs?.attributes?.condition || product?.condition,
    images: Array.isArray(product?.images) ? product.images : [],
  });
  const isProductLoading =
    productResolution === "loading" ||
    (productResolution === "retryable-error" && !product) ||
    (!hasAttemptedLoad && !product);
  const isMissingProduct = productResolution === "missing" && !product;
  const productTitle = product ? buildOptimizedProductTitle(product) : String(product?.title || product?.name || "").trim();
  const safeProductDescription =
    String(productSpecs?.shortDescription || "").trim() ||
    String(product?.shortDescription || "").trim() ||
    (product ? buildProductShortDescription(product) : "") ||
    String(product?.description || "").replace(/\s+/g, " ").trim() ||
    productSeo.metaDescription;
  const resolvedProductMetaTitle = productSeo.metaTitle || productTitle;
  const productReviewCount = reviews.length || Number(product?.reviews || 0);
  const productRatingValue =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
          ).toFixed(1)
        )
      : Number(product?.rating || 0);
  const loadingMetaTitle = "ExShopi UAE | Trusted Marketplace for Electronics";
  const loadingMetaDescription =
    "Shop verified products on ExShopi UAE with trusted sellers, delivery options, and marketplace-ready product details.";
  const canonicalProductPath = product
    ? buildProductPath(product)
    : location.pathname || `/product/${identifier || ""}`;
  const productMainImage = product
    ? String(product?.featuredImage || product?.primaryImage || product?.image || product?.images?.[0] || "").trim()
    : "";

  // Product canonicals must always match the live route Google can crawl.
  const finalCanonical = buildAbsoluteUrl(canonicalProductPath);

const productSchema = product
  ? [
      buildProductJsonLd({
        countryCode: selectedCountry,
        title: product.title,
        shortDescription: productSpecs?.shortDescription,
        description: product.description,
        slug: product.slug,
        canonicalUrl: finalCanonical,
        image: productMainImage,
        images: Array.isArray(product?.images) ? product.images : [],
        price: getProductCountryPrice(product, selectedCountry),
        stock: product.stock,
        sku: product.sku,
        brand: product.brand,
        seller: product.sellerName || product.seller,
        condition: productSpecs?.attributes?.condition || product?.condition,
        reviewCount: productReviewCount,
        ratingValue: productRatingValue,
      }),
      buildProductBreadcrumbSchema(product, canonicalProductPath),
    ]
  : null;
    
  const baseSpecifications = useMemo(
    () => productSpecs?.specifications || product?.specifications || {},
    [product?.specifications, productSpecs?.specifications]
  );
  const baseAttributes = useMemo(
    () => ({
      ...(productSpecs?.attributes || {}),
      ...(baseSpecifications || {}),
    }),
    [baseSpecifications, productSpecs?.attributes]
  );
  const variants = useMemo<ProductVariant[]>(
    () =>
      (Array.isArray(productSpecs?.variants) ? productSpecs.variants : [])
        .map((variant: any) => ({
          ...variant,
          id: variant?.id ? String(variant.id) : undefined,
          sku: variant?.sku ? String(variant.sku).trim() : undefined,
          color: String(variant?.color || "").trim(),
          size: String(variant?.size || "").trim(),
          storage: String(variant?.storage || "").trim(),
          ram: String(variant?.ram || "").trim(),
          processor: String(variant?.processor || "").trim(),
          image: String(variant?.image || "").trim(),
          isDefault: Boolean(variant?.isDefault),
        }))
        .filter((variant) =>
          VARIANT_SELECTION_KEYS.some((key) => hasVariantValue(String(variant[key] || "")))
        ),
    [productSpecs]
  );
  const variantDefaults = useMemo(
    () => buildDefaultVariantSelection(variants, baseAttributes),
    [variants, baseAttributes]
  );
  const initializedProductRef = useRef<string | null>(null);

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.color || "").trim())
            .filter(Boolean)
        )
      ).map((color) => {
        const colorValue = String(color);
        return {
        name: colorValue.toLowerCase(),
        label: colorValue,
        hex: colorToHex(colorValue),
      };
      }),
    [variants]
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.storage || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  const sizeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.size || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  const ramOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.ram || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  const processorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.processor || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  useEffect(() => {
    const productId = product?.id ? String(product.id) : "";

    if (!productId) {
      initializedProductRef.current = null;
      setSelectedOptions(EMPTY_VARIANT_SELECTION);
      return;
    }

    setSelectedOptions((previous) => {
      if (initializedProductRef.current !== productId) {
        initializedProductRef.current = productId;
        return variantDefaults;
      }

      if (!variants.length) {
        return selectionsEqual(previous, variantDefaults) ? previous : variantDefaults;
      }

      const bestVariant = findBestVariantMatch(variants, previous);
      if (!bestVariant) {
        return selectionsEqual(previous, variantDefaults) ? previous : variantDefaults;
      }

      const nextSelection = variantToSelection(bestVariant);
      return selectionsEqual(previous, nextSelection) ? previous : nextSelection;
    });
  }, [product?.id, variantDefaults, variants]);

  const updateSelectedOption = (key: keyof VariantSelection, value: string) => {
    const normalizedValue = normalizeVariantValue(value);

    setSelectedOptions((previous) => {
      const desiredSelection = {
        ...previous,
        [key]: normalizedValue,
      };

      if (!variants.length) return desiredSelection;

      const bestVariant = findBestVariantMatch(variants, desiredSelection, [key]);
      if (!bestVariant) return desiredSelection;

      const nextSelection = variantToSelection(bestVariant);
      return selectionsEqual(previous, nextSelection) ? previous : nextSelection;
    });
  };

  const selectedColor = selectedOptions.color;
  const selectedSize = selectedOptions.size;
  const selectedStorage = selectedOptions.storage;
  const selectedRam = selectedOptions.ram;
  const selectedProcessor = selectedOptions.processor;

  const activeVariant = useMemo(() => {
    return findBestVariantMatch(variants, selectedOptions);
  }, [variants, selectedOptions]);

  const displayPrice = Number(activeVariant?.price ?? getProductCountryPrice(product, selectedCountry) ?? 0);
  const displayOriginalPrice = Number(
    activeVariant?.originalPrice ?? getProductCountryCompareAtPrice(product, selectedCountry) ?? product?.salePrice ?? displayPrice
  );
  const displayStock = Number(activeVariant?.stock ?? product?.stock ?? 0);
  const displaySku = String(activeVariant?.sku || product?.sku || "");
  const selectedColorLabel = activeVariant?.color || resolveOptionLabel(colorOptions, selectedColor, (option) => option.label) || "";
  const selectedSizeLabel = activeVariant?.size || resolveOptionLabel(sizeOptions, selectedSize, (option) => option) || "";
  const selectedStorageLabel = activeVariant?.storage || resolveOptionLabel(storageOptions, selectedStorage, (option) => option) || "";
  const selectedRamLabel = activeVariant?.ram || resolveOptionLabel(ramOptions, selectedRam, (option) => option) || "";
  const selectedProcessorLabel = activeVariant?.processor || resolveOptionLabel(processorOptions, selectedProcessor, (option) => option) || "";
  const selectedVariantLabel = [
    selectedColorLabel,
    selectedSizeLabel,
    selectedStorageLabel,
    selectedRamLabel,
    selectedProcessorLabel,
  ]
    .filter(Boolean)
    .join(" / ");
  const baseTitle = String(product?.title || "");
  const displayTitle =
    selectedVariantLabel && baseTitle ? `${baseTitle} (${selectedVariantLabel})` : baseTitle;

  useEffect(() => {
    if (!product?.id) return;
    analyticsAPI
      .track({
        eventType: "product_view",
        entityType: "product",
        entityId: String(product.id),
        metadata: {
          title: product.title,
          sellerId: product.sellerId,
        },
      })
      .catch(() => undefined);
  }, [product?.id, product?.sellerId, product?.title]);

  useEffect(() => {
    if (!import.meta.env.DEV || !identifier) return;
    console.info("[product-route] diagnostics", {
      identifier,
      pathname: location.pathname,
      resolution: productResolution,
      hasProduct: Boolean(product?.id),
      source: lookupDiagnostics?.source || null,
      reason: lookupDiagnostics?.reason || null,
      retryable: lookupDiagnostics?.retryable || false,
    });
  }, [identifier, location.pathname, lookupDiagnostics, product?.id, productResolution]);

  const sellerProfile = useMemo(
    () => getSellerProfile(product?.seller || "ExShopi Official"),
    [product?.seller]
  );
  const sellerLinkSlug = product?.sellerStoreSlug || sellerProfile.slug;

  const sellerProducts = useMemo(
    () =>
      allProducts.filter(
        (item) =>
          (
            (product?.sellerId && item.sellerId && item.sellerId === product.sellerId) ||
            normalizeSellerSlug(item.seller || item.sellerName || item.vendor || "") === sellerProfile.slug
          ) &&
          String(item.id) !== String(product?.id)
      ).slice(0, 8),
    [allProducts, product?.id, product?.sellerId, sellerProfile.slug]
  );

  const relatedProducts = useMemo(
    () => {
      const currentCategory =
        product?.specs?.subcategorySlug ||
        product?.specs?.categorySlug ||
        product?.category ||
        "";

      const sameCategory = allProducts.filter(
        (item) =>
          String(item.id) !== String(product?.id) &&
          String(
            item?.specs?.subcategorySlug ||
              item?.specs?.categorySlug ||
              item?.category ||
              ""
          ) === String(currentCategory)
      );

      const source = sameCategory.length ? sameCategory : allProducts.filter((item) => String(item.id) !== String(product?.id));
      return source.slice(0, 12).map(mapToCardProduct);
    },
    [allProducts, product?.category, product?.id, product?.specs?.categorySlug, product?.specs?.subcategorySlug]
  );

  const viewedProducts = useMemo(
    () =>
      allProducts
        .filter((item) => String(item.id) !== String(product?.id))
        .slice(8, 16)
        .map(mapToCardProduct),
    [allProducts, product?.id]
  );

  const structuredTemplate = useMemo(
    () =>
      getSpecificationTemplate(
        productSpecs?.parentCategorySlug || product?.category || "",
        productSpecs?.subcategorySlug || productSpecs?.templateId || product?.subcategory || "",
        productSpecs?.subcategoryName || productSpecs?.templateName || product?.subcategory || ""
      ),
    [
      product?.category,
      product?.subcategory,
      productSpecs?.parentCategorySlug,
      productSpecs?.subcategoryName,
      productSpecs?.subcategorySlug,
      productSpecs?.templateId,
      productSpecs?.templateName,
    ]
  );

  const specificationGroups = useMemo(() => {
    if (Array.isArray(productSpecs?.specificationGroups) && productSpecs.specificationGroups.length) {
      return productSpecs.specificationGroups
        .map((group: any) => ({
          key: String(group?.key || group?.title || ''),
          title: String(group?.title || group?.key || 'Specifications'),
          items: Array.isArray(group?.items)
            ? group.items
                .map((item: any) => ({
                  key: String(item?.key || item?.label || ''),
                  label: String(item?.label || ''),
                  value: String(item?.value || '').trim(),
                }))
                .filter((item: any) => item.label && item.value)
            : [],
        }))
        .filter((group: any) => group.items.length);
    }

    const sourceValues = {
      ...(productSpecs?.specificationValues || {}),
      ...(baseSpecifications || {}),
      ...(baseAttributes || {}),
    };
    const extraGroups = Array.isArray(productSpecs?.additionalSpecificationGroups)
      ? productSpecs.additionalSpecificationGroups
      : [];
    return buildDetailedSpecificationGroups(sourceValues, structuredTemplate, extraGroups);
  }, [productSpecs?.specificationGroups, productSpecs?.specificationValues, productSpecs?.additionalSpecificationGroups, baseSpecifications, baseAttributes, structuredTemplate]);
  const productImages = useMemo(
    () => getProductImages(activeVariant?.image || product?.image, product?.images || product?.gallery || product?.media),
    [product?.gallery, product?.image, product?.images, product?.media, activeVariant?.image]
  );
  const primaryProductImage = productImages[mainImage] || productImages[0] || "/hero/hero-1.webp";

  useEffect(() => {
    setMainImage((currentIndex) => (currentIndex < productImages.length ? currentIndex : 0));
  }, [productImages]);

  const isOptionAvailable = (key: keyof VariantSelection, rawValue: string) => {
    const normalizedValue = normalizeVariantValue(rawValue);
    if (!normalizedValue || !variants.length) return true;

    const desiredSelection = {
      ...selectedOptions,
      [key]: normalizedValue,
    };

    return variants.some((variant) =>
      variantMatchesSelection(variant, desiredSelection, {
        requireKeys: VARIANT_SELECTION_KEYS,
      })
    );
  };

  const overviewParagraphs = useMemo(() => {
    const fallbackDescription = `${product?.title || "This product"} is a premium marketplace pick selected for UAE shoppers who want strong performance, trusted seller support, and a polished buying experience.`;
    const description = String(product?.description || fallbackDescription)
      .replace(/\r/g, "\n")
      .split(/\n+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    return description.length > 0 ? description : [fallbackDescription];
  }, [product?.description, product?.title]);

  const overviewVisibleParagraphs = overviewExpanded ? overviewParagraphs : overviewParagraphs.slice(0, 3);
  const hasMoreOverview = overviewParagraphs.length > 3;

  const overviewBullets = useMemo(() => {
    const explicitFeatures = Array.isArray(productSpecs?.briefHighlights)
      ? productSpecs.briefHighlights.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : Array.isArray(productSpecs?.keyFeatures)
      ? productSpecs.keyFeatures.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : [];

    const derivedFeatures = Object.entries(baseAttributes || {})
      .slice(0, 6)
      .map(([label, value]) => `${label}: ${humanizeSpecificationValue(value as any)}`);

    const merged = [...explicitFeatures, ...derivedFeatures, ...productHighlights]
      .map((item) => item.replace(/^[•\-\s]+/, "").trim())
      .filter(Boolean);

    return Array.from(new Set(merged)).slice(0, 6);
  }, [baseAttributes, productSpecs?.briefHighlights, productSpecs?.keyFeatures]);

  const reviewAverage = useMemo(() => {
    if (!reviews.length) return Number(product?.rating || 0);
    return reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
  }, [product?.rating, reviews]);

  const reviewBreakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((item) => Number(item.rating) === stars).length;
        const percentage = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
        return { stars, count, percentage };
      }),
    [reviews]
  );

  const latestReviewCards = useMemo(() => reviews.slice(0, 3), [reviews]);

  if (isProductLoading && !product) {
    return (
      <>
        <SEO
          title={loadingMetaTitle}
          description={loadingMetaDescription}
          metaTitle={loadingMetaTitle}
          metaDescription={loadingMetaDescription}
          pathname={location.pathname}
          canonicalUrl={buildAbsoluteUrl(location.pathname)}
          noindex={false}
        />
        <div className="flex items-center justify-center px-4 py-24">
          <OrbitLoader label="Loading product..." size={28} variant="normal" />
        </div>
      </>
    );
  }

  if (isMissingProduct) {
    return (
      <>
        <SEO
          title="Product Not Found | ExShopi"
          description="This product page is no longer available on ExShopi."
          pathname={location.pathname}
          canonicalUrl={buildAbsoluteUrl(location.pathname)}
          noindex={true}
        />

        <div className="flex items-center justify-center px-4 py-24">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold text-slate-900">Product not found</h1>
            <p className="mb-6 text-slate-600">This product page is unavailable or may have moved.</p>
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleAddToCart = () => {
    const compositeId = activeVariant && activeVariant.id ? `${product.id}::${activeVariant.id}` : String(product.id);
    const existingQuantity =
      useCartStore.getState().items.find((item) => item.id === compositeId)?.quantity || 0;
    addItem({
      id: compositeId,
      title: displayTitle,
      price: displayPrice,
      priceUae: product.priceUae ?? product.price,
      priceKsa: product.priceKsa,
      image: activeVariant?.image || product.image,
      slug: product.slug || String(product.id),
      originalPrice: displayOriginalPrice > displayPrice ? displayOriginalPrice : undefined,
      compareAtPriceUae: product.compareAtPriceUae ?? product.originalPrice ?? displayOriginalPrice,
      compareAtPriceKsa: product.compareAtPriceKsa,
      stockQuantity: displayStock,
      sku: displaySku || product.sku,
      variants: activeVariant ? [activeVariant] : [],
      // store both human-readable seller and canonical sellerId when available
      seller: product.seller || product.sellerName || product.storeId || 'ExShopi Official',
      sellerId: product.sellerId || product.storeId || undefined,
    });
    if (quantity > 1) {
      updateQuantity(compositeId, existingQuantity + quantity);
    }
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleAddRelatedToCart = (item: ReturnType<typeof mapToCardProduct>) => {
    addItem({
      id: String(item.id),
      title: item.title,
      price: item.price,
      priceUae: item.priceUae ?? item.price,
      priceKsa: item.priceKsa,
      image: item.image,
      slug: item.slug,
      originalPrice: item.oldPrice,
      compareAtPriceUae: item.compareAtPriceUae ?? item.oldPrice,
      compareAtPriceKsa: item.compareAtPriceKsa,
    });
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: String(product.id),
      slug: product.slug || String(product.id),
      name: product.title,
      category: product.category || product.brand || "Marketplace",
      price: product.price,
      priceUae: product.priceUae ?? product.price,
      priceKsa: product.priceKsa,
      oldPrice: displayOriginalPrice > displayPrice ? displayOriginalPrice : product.oldPrice,
      compareAtPriceUae: product.compareAtPriceUae ?? product.originalPrice ?? displayOriginalPrice,
      compareAtPriceKsa: product.compareAtPriceKsa,
      rating: product.rating,
      reviews: product.reviews,
      badge: product.badges?.[0] || product.badge,
      image: product.image,
      stock: displayStock > 0 ? "In Stock" : "Out of Stock",
    });
    setWishlistActive((prev) => !prev);
    analyticsAPI
      .track({
        eventType: wishlistActive ? "wishlist_remove" : "wishlist_add",
        entityType: "product",
        entityId: String(product.id),
        metadata: {
          title: product.title,
        },
      })
      .catch(() => undefined);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on ExShopi`,
          url: shareUrl,
        });
      } else {
        let copied = false;
        try {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        } catch {
          copied = copyTextFallback(shareUrl);
        }

        if (copied) {
          setShareMessage("Product link copied");
          setTimeout(() => setShareMessage(""), 2500);
        } else {
          setShareMessage("Copy link manually");
          window.prompt("Copy this product link:", shareUrl);
        }
      }
    } catch {
      try {
        let copied = false;
        try {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        } catch {
          copied = copyTextFallback(shareUrl);
        }

        if (copied) {
          setShareMessage("Product link copied");
          setTimeout(() => setShareMessage(""), 2500);
        } else {
          setShareMessage("Copy link manually");
          window.prompt("Copy this product link:", shareUrl);
        }
      } catch {
        setShareMessage("Unable to share right now");
      }
    }
  };

  const handleWhatsAppOrderHelp = () => {
    const message = buildCountryAwareWhatsAppMessage(selectedCountry, displayTitle);
    const whatsappUrl = `https://wa.me/${getExShopiWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!product?.id) return;

    if (authRole !== "customer") {
      setReviewError("Please sign in with a customer account to leave a review.");
      setReviewSuccess("");
      return;
    }

    const comment = reviewComment.trim();
    if (!comment) {
      setReviewError("Please write a short review before submitting.");
      setReviewSuccess("");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const createdReview = await reviewAPI.create({
        productId: String(product.id),
        vendorId: String(product.storeId || product.sellerId || ""),
        rating: reviewRating,
        comment,
      });

      setReviews((current) =>
        Array.isArray(current) ? [createdReview, ...current] : [createdReview]
      );
      setReviewComment("");
      setReviewRating(5);
      setReviewSuccess("Your review has been published.");
      setActiveTab("reviews");
    } catch (error: any) {
      setReviewError(error?.message || "We couldn't save your review right now.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Breadcrumb assignments (must be after productSpecs and product are available)
  breadcrumbCategorySlug = productSpecs?.parentCategorySlug || productSpecs?.categorySlug || product?.category || "electronics";
  breadcrumbCategoryLabel =
    productSpecs?.subcategoryName ||
    productSpecs?.categoryName ||
    productSpecs?.parentCategoryName ||
    product?.category ||
    "Electronics";
  breadcrumbCategoryLink = safeCategoryPath(
    breadcrumbCategorySlug,
    productSpecs?.subcategorySlug || productSpecs?.categorySlug || product?.subcategory || ""
  );

  const weeklySoldCount = Math.max(8, Math.min(49, Math.round((Number(product?.reviews || 0) || 12) * 1.6)));
  const liveViewerCount = Math.max(14, Math.min(58, Math.round((Number(product?.rating || 4.5) || 4.5) * 8)));
  const dealUrgencyLabel = displayOriginalPrice > displayPrice ? "Deal ends soon" : "Popular this week";
  const isOfficialSeller = normalizeSellerSlug(product?.sellerName || sellerProfile.name || "") === normalizeSellerSlug("ExShopi Official");

  return (
    <>
      {product ? (
        <SEO
          title={productTitle}
          description={safeProductDescription}
          metaTitle={resolvedProductMetaTitle}
          metaDescription={safeProductDescription}
          metaKeywords={productSeo.metaKeywords}
          pathname={canonicalProductPath}
          canonicalUrl={finalCanonical}
          ogTitle={resolvedProductMetaTitle}
          ogDescription={safeProductDescription}
          ogImage={productMainImage || productSeo.ogImage}
          image={productMainImage}
          type="product"
          noindex={false}
          jsonLd={productSchema || undefined}
        />
      ) : null}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1800px] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 overflow-x-auto text-sm text-slate-600">
            <Link to="/" className="whitespace-nowrap hover:text-blue-600">Home</Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link to={breadcrumbCategoryLink} className="whitespace-nowrap hover:text-blue-600">{breadcrumbCategoryLabel}</Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link to={`/vendor/${sellerLinkSlug}`} className="whitespace-nowrap hover:text-blue-600">{product.sellerName || sellerProfile.name}</Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate font-semibold text-slate-900">{productTitle}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-4 py-7 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:gap-5">
          <div className="xl:col-span-5">
            <div className="sticky top-[150px] overflow-visible rounded-[34px] border border-slate-200/90 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/70 max-md:backdrop-blur-0 md:shadow-[0_26px_70px_rgba(15,23,42,0.10)] md:backdrop-blur-sm">
              <div className="relative aspect-[1/1.02] overflow-hidden rounded-t-[34px] bg-white">
                <img
                  src={primaryProductImage}
                  alt={buildProductImageAlt(product, mainImage)}
                  className="relative z-10 block h-full max-h-full w-full max-w-full object-contain object-center p-6 md:p-8"
                  loading={mainImage === 0 ? "eager" : "lazy"}
                  fetchPriority={mainImage === 0 ? "high" : "auto"}
                  decoding="async"
                  width={1200}
                  height={1224}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 42vw"
                />
                {displayOriginalPrice > displayPrice ? (
                  <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-4 py-2 text-sm font-black text-white shadow-[0_18px_34px_rgba(239,68,68,0.28)] md:right-5 md:top-5">
                    Save {Math.max(1, Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100))}%
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-200/90 bg-white p-5">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setMainImage(idx);
                      }}
                      aria-label={`View ${product.title} image ${idx + 1}`}
                      className={`relative z-10 h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-[1.15rem] border-2 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-300 ${
                        mainImage === idx
                          ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2 shadow-[0_16px_32px_rgba(37,99,235,0.18)]"
                          : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_30px_rgba(15,23,42,0.10)]"
                      }`}
                    >
                      <img
                        src={img}
                        alt={buildProductImageAlt(product, idx)}
                        className="pointer-events-none block h-full max-h-full w-full max-w-full object-contain object-center p-2"
                        loading="lazy"
                        decoding="async"
                        width={96}
                        height={96}
                        sizes="96px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(249,251,255,0.98))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.07)] ring-1 ring-white/70">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Sold by</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <Link to={`/vendor/${sellerLinkSlug}`} className="inline-block text-sm font-bold text-blue-600 hover:underline">
                        {product.sellerName || sellerProfile.name}
                      </Link>
                      {isOfficialSeller ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 shadow-sm">
                          <Award className="h-3.5 w-3.5" />
                          Verified Seller
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link to={`/vendor/${sellerLinkSlug}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    More from seller →
                  </Link>
                </div>

                <div className="max-w-[28ch]">
                  <h1 className="text-[1.14rem] font-semibold leading-[1.32] tracking-[-0.02em] text-slate-950 md:text-[1.45rem] lg:text-[1.62rem]">
                    {productTitle}
                  </h1>
                  {selectedVariantLabel ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        Selected
                      </span>
                      <span className="text-sm font-medium text-slate-600">
                        {selectedVariantLabel}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">
                    {reviewAverage > 0 ? reviewAverage.toFixed(1) : (product.rating || 4.5)}
                  </span>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {(reviews.length || product.reviews || 0).toLocaleString()} reviews
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(product.badges || []).map((badge: string, idx: number) => (
                    <span key={`${badge}-${idx}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-blue-100/90 bg-[linear-gradient(180deg,#fcfdff,#eef5ff)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
                <div className="mb-4 border-b border-blue-100 pb-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="text-5xl font-black tracking-tight text-slate-950">{formatCurrencyPlainForCountry(displayPrice, selectedCountry)}</span>
                    {displayOriginalPrice > displayPrice && (
                      <>
                        <span className="pb-2 text-xl text-slate-600 line-through">{formatCurrencyPlainForCountry(displayOriginalPrice, selectedCountry)}</span>
                        <span className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-[0_14px_30px_rgba(239,68,68,0.24)]">
                          Save {Math.max(1, Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100))}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">Inclusive of {Math.round(country.vatRate * 100)}% VAT, fees, and marketplace protection</p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                      {weeklySoldCount} sold this week
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                      {liveViewerCount} people viewing now
                    </span>
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                      {dealUrgencyLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {productHighlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(249,251,255,0.98))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.07)]">
                <div className="space-y-4.5">
                  {colorOptions.length > 0 && (
                  <div>
                    <p className="mb-2.5 font-semibold text-slate-900">
                      Color: {selectedColorLabel || "Default"}
                    </p>
                    <div className="flex gap-2.5">
                      {colorOptions.map((color) => {
                        const isSelected = normalizeVariantValue(color.label) === selectedColor;
                        const isAvailable = isOptionAvailable("color", color.label);
                        return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => updateSelectedOption("color", color.label)}
                          disabled={!isAvailable}
                          className={`h-12 w-12 rounded-full border-2 transition ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-200"
                              : isAvailable
                              ? "border-slate-300 hover:border-slate-400"
                              : "cursor-not-allowed border-slate-200 opacity-40"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        />
                      )})}
                    </div>
                  </div>
                  )}

                  {storageOptions.length > 0 && (
                  <div>
                    <p className="mb-2.5 font-semibold text-slate-900">Storage</p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((size) => {
                        const isSelected = normalizeVariantValue(size) === selectedStorage;
                        const isAvailable = isOptionAvailable("storage", size);
                        return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateSelectedOption("storage", size)}
                          disabled={!isAvailable}
                          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : isAvailable
                              ? "border-slate-200 text-slate-900 hover:border-slate-300"
                              : "cursor-not-allowed border-slate-200 text-slate-400 opacity-60"
                          }`}
                        >
                          {size}
                        </button>
                      )})}
                    </div>
                  </div>
                  )}

                  {sizeOptions.length > 0 && (
                  <div>
                    <p className="mb-2.5 font-semibold text-slate-900">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => {
                        const isSelected = normalizeVariantValue(size) === selectedSize;
                        const isAvailable = isOptionAvailable("size", size);
                        return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateSelectedOption("size", size)}
                          disabled={!isAvailable}
                          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : isAvailable
                              ? "border-slate-200 text-slate-900 hover:border-slate-300"
                              : "cursor-not-allowed border-slate-200 text-slate-400 opacity-60"
                          }`}
                        >
                          {size}
                        </button>
                      )})}
                    </div>
                  </div>
                  )}

                  {ramOptions.length > 0 && (
                    <div>
                      <p className="mb-2.5 font-semibold text-slate-900">RAM</p>
                      <div className="flex flex-wrap gap-2">
                        {ramOptions.map((size) => {
                          const isSelected = normalizeVariantValue(size) === selectedRam;
                          const isAvailable = isOptionAvailable("ram", size);
                          return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateSelectedOption("ram", size)}
                            disabled={!isAvailable}
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                              isSelected
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : isAvailable
                                ? "border-slate-200 text-slate-900 hover:border-slate-300"
                                : "cursor-not-allowed border-slate-200 text-slate-400 opacity-60"
                            }`}
                          >
                            {size}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}

                  {processorOptions.length > 0 && (
                    <div>
                      <p className="mb-2.5 font-semibold text-slate-900">Processor</p>
                      <div className="flex flex-wrap gap-2">
                        {processorOptions.map((processor) => {
                          const isSelected = normalizeVariantValue(processor) === selectedProcessor;
                          const isAvailable = isOptionAvailable("processor", processor);
                          return (
                          <button
                            key={processor}
                            type="button"
                            onClick={() => updateSelectedOption("processor", processor)}
                            disabled={!isAvailable}
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                              isSelected
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : isAvailable
                                ? "border-slate-200 text-slate-900 hover:border-slate-300"
                                : "cursor-not-allowed border-slate-200 text-slate-400 opacity-60"
                            }`}
                          >
                            {processor}
                          </button>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{country.shortName} Trusted Marketplace</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {buildProductSeoNarrative(product)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {UAE_TRUST_SIGNALS.map((signal) => (
                    <span key={signal} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{country.availabilityLabel}</p>
                      <p className="text-sm text-slate-600">{country.shippingOptions[0].eta}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-slate-200 pt-3.5">
                    <RotateCcw className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Easy Returns</p>
                      <p className="text-sm text-slate-600">7 days return policy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-slate-200 pt-3.5">
                    <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Warranty</p>
                      <p className="text-sm text-slate-600">1-year manufacturer warranty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="sticky top-[150px] rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(249,251,255,0.98))] p-6 shadow-[0_18px_34px_rgba(15,23,42,0.08)] ring-1 ring-white/70 max-md:backdrop-blur-0 md:shadow-[0_26px_60px_rgba(15,23,42,0.09)]">
              <div className="rounded-[1.15rem] border border-emerald-200 bg-[linear-gradient(180deg,#f4fff9,#ecfdf5)] p-4 shadow-[0_12px_28px_rgba(16,185,129,0.10)]">
                <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                    <p className="font-semibold text-emerald-900">
                      {displayStock > 0 ? `In Stock - Only ${Math.max(displayStock, 1)} left!` : "Out of Stock"}
                    </p>
                    <p className="text-sm text-emerald-800">{country.shippingOptions[0].eta}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-slate-200/90 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="mb-2 text-sm text-slate-700">Price</p>
                <div className="text-4xl font-black text-slate-950">{formatCurrencyPlainForCountry(displayPrice, selectedCountry)}</div>
                <p className="mt-1 text-xs text-slate-700">Inclusive of VAT ({Math.round(country.vatRate * 100)}%)</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">{weeklySoldCount} sold this week</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">{liveViewerCount} viewing now</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-3 font-semibold text-slate-900">Quantity</p>
                <div className="inline-flex items-center rounded-full border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(236,243,255,0.92))] p-1 shadow-[0_18px_36px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="min-w-[52px] text-center text-lg font-bold text-slate-900">{quantity}</div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3.5">
                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-400/70 bg-[linear-gradient(135deg,#143ab8,#2456ea,#5a95ff)] px-6 py-3.5 font-semibold text-white shadow-[0_20px_40px_rgba(37,99,235,0.30)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_26px_52px_rgba(37,99,235,0.36)] active:scale-[0.99]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300/70 bg-[linear-gradient(135deg,#047857,#0da778,#60e0b0)] px-6 py-3.5 font-semibold text-white shadow-[0_20px_40px_rgba(16,185,129,0.26)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_26px_52px_rgba(16,185,129,0.32)] active:scale-[0.99]"
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleWishlist}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-medium shadow-sm transition duration-300 hover:-translate-y-0.5 ${
                    wishlistActive
                      ? "border-red-200 bg-red-50 text-red-600 shadow-[0_12px_24px_rgba(239,68,68,0.12)]"
                      : "border-slate-200 text-slate-800 hover:bg-slate-50 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${wishlistActive ? "fill-current" : ""}`} />
                  Wishlist
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {shareMessage && <p className="mt-3 text-center text-xs font-semibold text-emerald-600">{shareMessage}</p>}

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Genuine product guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>{country.shippingOptions[0].description}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Secure transactions</span>
                </div>
              </div>

              <button
                onClick={() => setContactOpen(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 font-semibold text-slate-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </button>

              <button
                onClick={handleWhatsAppOrderHelp}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 font-semibold text-emerald-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-[0_14px_28px_rgba(16,185,129,0.14)]"
              >
                <MessageCircle className="h-4 w-4" />
                Ask on WhatsApp
              </button>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.94))] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Cash on Delivery Available</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Fast Delivery Across the GCC</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>7 Days Easy Return</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>1 Month Warranty</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Verified Seller</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-200 bg-white">
            {(["overview", "specifications", "reviews", "delivery", "seller"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-6 py-4 font-semibold capitalize transition ${
                  activeTab === tab
                    ? "border-b-blue-600 bg-blue-50 text-blue-600"
                    : "border-b-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">
            {activeTab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-5">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Product Overview</p>
                  <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-blue-700">
                    <Link
                      to={getCategoryPath(
                        productSpecs?.parentCategorySlug || productSpecs?.categorySlug || product?.category,
                        undefined
                      )}
                      className="rounded-full bg-blue-50 px-3 py-1.5 hover:bg-blue-100"
                    >
                      {productSpecs?.parentCategoryName || productSpecs?.categoryName || product?.category || "Category"}
                    </Link>
                    {(productSpecs?.subcategorySlug || productSpecs?.templateId) ? (
                      <Link
                        to={getCategoryPath(
                          productSpecs?.parentCategorySlug || productSpecs?.categorySlug || product?.category,
                          productSpecs?.subcategorySlug || productSpecs?.templateId
                        )}
                        className="rounded-full bg-blue-50 px-3 py-1.5 hover:bg-blue-100"
                      >
                        {productSpecs?.subcategoryName || productSpecs?.templateName || productSpecs?.subcategorySlug}
                      </Link>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {overviewVisibleParagraphs.map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 12)}`} className="text-[15px] leading-7 text-slate-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {hasMoreOverview && (
                    <button
                      type="button"
                      onClick={() => setOverviewExpanded((current) => !current)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                      {overviewExpanded ? (
                        <>
                          See less <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          See more <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(247,250,255,1))] p-5">
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Top Highlights</p>
                  <div className="space-y-2.5">
                    {overviewBullets.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="space-y-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Technical Details</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">Specifications</h3>
                  </div>
                  <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 md:block">
                    Built for {country.shortName} marketplace buyers
                  </div>
                </div>
                {specificationGroups.length > 0 ? (
                  <ProductSpecificationTable groups={specificationGroups} />
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
                    Specifications will appear here once the seller completes the structured product specification section.
                  </div>
                )}

                {variants.length > 0 && (
                  <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Available Variants</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {variants.map((variant, index) => (
                        <div key={variant.id || index} className="rounded-[22px] border border-white/70 bg-white/85 px-4 py-4 shadow-sm">
                          <p className="text-sm font-black text-slate-900">
                            {[variant.color, variant.size, variant.storage, variant.ram, variant.processor]
                              .map((value) => String(value || "").trim())
                              .filter(Boolean)
                              .join(" / ") || `Variant ${index + 1}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                            {variant.sku ? <span className="rounded-full bg-slate-100 px-2.5 py-1">SKU {variant.sku}</span> : null}
                            {variant.stock !== undefined && variant.stock !== null ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Stock {variant.stock}</span>
                            ) : null}
                            {variant.price !== undefined && variant.price !== null ? (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{formatCurrencyPlainForCountry(Number(variant.price || 0), selectedCountry)}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="grid gap-8 rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#f4f8ff)] p-6 md:grid-cols-[0.35fr_1fr]">
                  <div className="text-center">
                    <p className="text-6xl font-black text-slate-950">
                      {reviewAverage > 0 ? reviewAverage.toFixed(1) : (product.rating || 4.5)}
                    </p>
                    <div className="mt-3 flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-6 w-6 ${i < Math.floor(reviewAverage || product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Based on {(reviews.length || product.reviews || 0).toLocaleString()} verified reviews
                    </p>
                  </div>
                  <div className="space-y-4">
                    {reviewBreakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <span className="w-10 text-sm font-semibold text-slate-700">{item.stars}★</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold text-slate-600">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <form
                    onSubmit={handleSubmitReview}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Write a review</p>
                        <h4 className="mt-2 text-2xl font-black text-slate-950">Share your purchase experience</h4>
                      </div>
                      {authRole === "customer" && authUser?.name && (
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                          {authUser.name}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setReviewRating(stars)}
                          className="transition hover:scale-105"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              stars <= reviewRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-slate-600">
                        {reviewRating} out of 5
                      </span>
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Write what you liked, how the product performed, delivery quality, and overall experience."
                      className="mt-5 min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-500"
                    />

                    <p className="mt-3 text-xs leading-6 text-slate-600">
                      Reviews are only accepted for delivered purchases, so every published review shown here is tied to a real order.
                    </p>

                    {reviewError && <p className="mt-3 text-sm font-semibold text-red-600">{reviewError}</p>}
                    {reviewSuccess && <p className="mt-3 text-sm font-semibold text-emerald-600">{reviewSuccess}</p>}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewSubmitting ? "Publishing..." : "Publish review"}
                    </button>
                  </form>

                  <div className="space-y-4">
                    {reviewsLoading ? (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600">
                        Loading reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                        <p className="text-lg font-bold text-slate-900">No customer reviews yet</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Be the first verified buyer to rate this product once your order is delivered.
                        </p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-slate-900">
                                  {review.customerName || "Verified Customer"}
                                </p>
                                {review.verifiedPurchase && (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                    Verified purchase
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-1">
                                {[...Array(5)].map((_, index) => (
                                  <Star
                                    key={index}
                                    className={`h-4 w-4 ${
                                      index < Number(review.rating || 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-slate-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-slate-600">
                              {formatReviewDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-700">
                            {review.comment || "Customer shared a verified purchase rating."}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
                  <p className="font-bold text-blue-900">Estimated Delivery</p>
                  <p className="mt-3 text-sm leading-7 text-blue-800">Standard: Wednesday, 31 Mar - Saturday, 3 Apr</p>
                  <p className="text-sm leading-7 text-blue-800">Express: Tuesday, 30 Mar (additional charge applies)</p>
                </div>
                <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="font-bold text-emerald-900">Return & Exchange</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                    <li>• 7-day easy returns</li>
                    <li>• Free return shipping</li>
                    <li>• Full refund in 7 to 10 business days</li>
                    <li>• Product must remain in original condition</li>
                  </ul>
                </div>
                <div className="rounded-[26px] border border-violet-100 bg-violet-50 p-5">
                  <p className="font-bold text-violet-900">Warranty</p>
                  <ul className="mt-3 space-y-2 text-sm text-violet-800">
                    <li>• 1-Year Manufacturer Warranty</li>
                    <li>• Covers manufacturing defects</li>
                    <li>• Service center support available</li>
                    <li>• Optional extension may apply</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "seller" && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[30px] border border-slate-200">
                  <div className="relative h-44 bg-slate-900">
                    <img src={sellerProfile.cover} alt={sellerProfile.name} className="h-full w-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.15),rgba(15,23,42,0.65))]" />
                  </div>
                  <div className="relative bg-white px-6 pb-6 pt-0">
                    <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-lg">
                          <img src={sellerProfile.avatar} alt={sellerProfile.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="pb-2">
                          <Link to={`/vendor/${sellerProfile.slug}`} className="text-2xl font-black text-slate-950 hover:text-blue-600">
                            {sellerProfile.name}
                          </Link>
                          <p className="mt-1 text-sm font-medium text-slate-600">{sellerProfile.verifiedLabel} • Since {sellerProfile.since}</p>
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="font-black text-slate-900">{sellerProfile.rating}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {sellerProfile.reviewCount.toLocaleString()} reviews
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-700">{sellerProfile.bio}</p>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-600">Positive Rating</p>
                        <p className="mt-2 text-3xl font-black text-emerald-600">{sellerProfile.positiveRate}%</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-600">On-time Delivery</p>
                        <p className="mt-2 text-3xl font-black text-emerald-600">{sellerProfile.onTimeDelivery}%</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-600">Categories</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{sellerProfile.categories.join(", ")}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setContactOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4" />
                      Contact Seller
                    </button>
                  </div>
                </div>

                {sellerProducts.length > 0 && (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900">More from this seller</h4>
                      <Link to={`/vendor/${sellerProfile.slug}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        View seller profile →
                      </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {sellerProducts.slice(0, 4).map((item) => (
                        <DetailSlimCard
                          key={item.slug || item.id}
                          product={mapToCardProduct(item)}
                          onAddToCart={handleAddRelatedToCart}
                          countryCode={selectedCountry}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <LazyComponent
          deferUntilVisible={true}
          delayMs={120}
          rootMargin="240px"
          placeholder={<div className="mt-14 min-h-[420px]" aria-hidden="true" />}
        >
          <div className="mt-14">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-slate-900">Similar Products</h2>
              <p className="mt-1 text-sm text-slate-500">Handpicked recommendations</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {relatedProducts.map((item) => (
                <DetailSlimCard key={item.slug} product={item} onAddToCart={handleAddRelatedToCart} countryCode={selectedCountry} />
              ))}
            </div>
          </div>
        </LazyComponent>

        <LazyComponent
          deferUntilVisible={true}
          delayMs={180}
          rootMargin="260px"
          placeholder={<div className="mt-14 min-h-[420px]" aria-hidden="true" />}
        >
          <div className="mt-14 pb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-slate-900">Customers Also Viewed</h2>
              <p className="mt-1 text-sm text-slate-500">Trending right now</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {viewedProducts.map((item) => (
                <DetailSlimCard key={item.slug} product={item} onAddToCart={handleAddRelatedToCart} countryCode={selectedCountry} />
              ))}
            </div>
          </div>
        </LazyComponent>

        <LazyComponent
          deferUntilVisible={true}
          delayMs={240}
          rootMargin="300px"
          placeholder={<div className="pb-12 min-h-[320px]" aria-hidden="true" />}
        >
          <div className="pb-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Customer Reviews</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Real buyer feedback with verified purchase protection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Open full reviews
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {latestReviewCards.length > 0 ? (
                latestReviewCards.map((review) => (
                  <div key={`footer-${review.id}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{review.customerName || "Verified Customer"}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < Number(review.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 lg:col-span-3">
                  <p className="text-lg font-bold text-slate-900">No reviews published yet</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Delivered customers will be able to rate this product here, and those original reviews will appear on this page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </LazyComponent>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Contact Seller</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">{sellerProfile.name}</h3>
              </div>
              <button
                onClick={() => {
                  setContactOpen(false);
                  setContactSent(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {contactSent ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-950">Message sent</h4>
                  <p className="mt-3 text-slate-600">Your inquiry has been prepared for {sellerProfile.name}. In a live environment this would be delivered to the seller inbox.</p>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSent(true);
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your name" required />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your email" type="email" required />
                  </div>
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Subject" defaultValue={`Question about ${product.title}`} required />
                  <textarea
                    className="min-h-[160px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Write your message to the seller..."
                    required
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
