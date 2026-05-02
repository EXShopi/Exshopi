import type { ProductCardProps } from "../components/ProductCard";
import { getProductLifecycleState } from "./productLifecycle";
import { normalizeMerchandisingSelectionValue } from "./homepageMerchandising";
import { buildOptimizedProductTitle } from "./seoMarketplace";

export type LiveMarketplaceProduct = ProductCardProps & {
  raw: any;
  sellerId?: string;
  discount: number;
  categoryKey: string;
};

const MARKETPLACE_PLACEHOLDER_IMAGE = "/placeholder.svg";

function extractMarketplaceImageUrl(value: unknown): string {
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

function resolveMarketplaceProductImage(product: any) {
  const galleryCandidates = [
    product?.primaryImage,
    product?.image,
    product?.thumbnail,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.gallery) ? product.gallery : []),
    ...(Array.isArray(product?.media) ? product.media : []),
  ];

  const resolvedImages = galleryCandidates
    .map((item) => extractMarketplaceImageUrl(item))
    .filter(Boolean);

  return resolvedImages[0] || MARKETPLACE_PLACEHOLDER_IMAGE;
}

function normalizeMarketplaceValue(value: any) {
  return String(value || '').trim().toLowerCase();
}

function shouldDebugVisibility() {
  try {
    return typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.DEV);
  } catch {
    return false;
  }
}

function getMarketplaceVisibilityDecision(product: any) {
  if (!product) return { visible: false, reason: 'missing-product' };
  const lifecycle = getProductLifecycleState(product);
  return {
    visible: lifecycle.isCustomerVisible,
    reason: lifecycle.isCustomerVisible
      ? lifecycle.effectiveStatus === 'live'
        ? 'status:live'
        : 'approval:approved'
      : lifecycle.exclusionReason || 'not-live-or-approved',
  };
}

export function isLiveMarketplaceProduct(product: any) {
  const decision = getMarketplaceVisibilityDecision(product);
  if (!decision.visible && shouldDebugVisibility()) {
    console.debug('[marketplace-visibility] excluded', {
      productId: product?.id || product?.slug || product?.title || 'unknown-product',
      reason: decision.reason,
      status: product?.status || product?.productStatus || product?.product_status || '',
      approvalStatus: product?.approvalStatus || product?.approval_status || '',
      visibilityStatus: product?.visibilityStatus || product?.visibility_status || '',
    });
  }
  return decision.visible;
}

export function mapLiveMarketplaceProduct(product: any): LiveMarketplaceProduct {
  const priceUae = Number(product.priceUae ?? product.price ?? 0);
  const priceKsa =
    product.priceKsa != null && String(product.priceKsa).trim() !== ''
      ? Number(product.priceKsa)
      : undefined;
  const compareAtPriceUae = Number((product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice) || 0);
  const compareAtPriceKsa =
    product.compareAtPriceKsa != null && String(product.compareAtPriceKsa).trim() !== ''
      ? Number(product.compareAtPriceKsa)
      : undefined;
  const price = priceUae;
  const oldPrice = compareAtPriceUae;
  const sellerName =
    product.sellerName ||
    product.seller ||
    product.storeName ||
    (product.createdByRole === "admin" || product.ownership === "official"
      ? "ExShopi Official"
      : "Marketplace Seller");
  const category =
    product.categoryName ||
    product.category ||
    product.specs?.brand ||
    product.brand ||
    "Marketplace";
  const discount =
    oldPrice > price && price > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return {
    id: String(product.id),
    slug: product.slug || String(product.id),
    title: buildOptimizedProductTitle(product),
    price,
    priceUae,
    priceKsa,
    oldPrice: oldPrice > price ? oldPrice : undefined,
    compareAtPriceUae: compareAtPriceUae > price ? compareAtPriceUae : undefined,
    compareAtPriceKsa,
    rating: Number(product.rating || 4.5),
    reviews: Number(product.reviews || 0),
    image: resolveMarketplaceProductImage(product),
    badge:
      product.badge ||
      (discount >= 30
        ? `Save ${discount}%`
        : product.createdByRole === "admin" || product.ownership === "official"
          ? "Official"
          : "Live"),
    badges: Array.isArray(product.badges) ? product.badges : undefined,
    category,
    categoryKey: String(category).toLowerCase(),
    stock:
      typeof product.stock === "number"
        ? product.stock > 0
          ? "In Stock"
          : "Out of Stock"
        : product.stock || "In Stock",
    seller: sellerName,
    freeDelivery: Boolean(product.freeDelivery),
    raw: product,
    sellerId: product.sellerId ? String(product.sellerId) : undefined,
    discount,
  };
}

export function getLiveMarketplaceProducts(items: any[]) {
  return (items || [])
    .filter(isLiveMarketplaceProduct)
    .map(mapLiveMarketplaceProduct)
    .filter(
      (product) =>
        product.price > 0 &&
        Boolean(String(product.title || "").trim()) &&
        Boolean(String(product.image || "").trim()) &&
        product.image !== MARKETPLACE_PLACEHOLDER_IMAGE
    );
}

export function getCampaignProducts(items: any[], featuredProductIds: string[] = []) {
  const liveProducts = getLiveMarketplaceProducts(items);
  const normalizedFeaturedIds = featuredProductIds
    .map((value) => normalizeMerchandisingSelectionValue(value))
    .filter(Boolean);

  if (normalizedFeaturedIds.length) {
    const selected = liveProducts.filter((product) => {
      const candidateTokens = [
        product.id,
        product.slug,
        product.raw?.id,
        product.raw?.slug,
      ]
        .map((value) => normalizeMerchandisingSelectionValue(value))
        .filter(Boolean);

      return candidateTokens.some((token) => normalizedFeaturedIds.includes(token));
    });

    if (selected.length) {
      return selected;
    }
  }

  return liveProducts.filter((product) => product.discount > 0 || /deal|offer|sale|flash|campaign/i.test(product.badge || ""));
}

export function productMatchesCategoryTerms(product: LiveMarketplaceProduct, terms: string[]) {
  const normalizedTerms = (terms || []).map((term) => String(term || "").trim().toLowerCase()).filter(Boolean);
  if (!normalizedTerms.length) return false;

  const haystack = [
    product.title,
    product.category,
    product.categoryKey,
    product.seller,
    product.raw?.category,
    product.raw?.subcategory,
    product.raw?.categoryName,
    product.raw?.subcategoryName,
    product.raw?.specs?.categorySlug,
    product.raw?.specs?.subcategorySlug,
    product.raw?.specs?.categoryName,
    product.raw?.specs?.subcategoryName,
    product.raw?.specs?.templateId,
    product.raw?.specs?.templateName,
    product.raw?.brand,
    product.raw?.specs?.brand,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return normalizedTerms.some((term) => haystack.includes(term));
}

export function productMatchesBrand(product: LiveMarketplaceProduct, brandSlug: string) {
  const haystack = [
    product.title,
    product.category,
    product.seller,
    product.raw?.brand,
    product.raw?.specs?.brand,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(brandSlug.toLowerCase());
}
