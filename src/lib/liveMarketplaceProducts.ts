import type { ProductCardProps } from "../components/ProductCard";

export type LiveMarketplaceProduct = ProductCardProps & {
  raw: any;
  sellerId?: string;
  discount: number;
  categoryKey: string;
};

export function isLiveMarketplaceProduct(product: any) {
  if (!product) return false;

  const deletionMeta = product.specs?.__deletion || {};
  if (product.isDeleted || product.deletedAt || deletionMeta.isDeleted || deletionMeta.deletedAt) {
    return false;
  }

  const status = String(
    product.status || product.productStatus || product.product_status || ''
  ).toLowerCase();
  const approval = String(
    product.approval_status || product.approvalStatus || ''
  ).toLowerCase();
  const visibility = String(
    product.visibility_status || product.visibilityStatus || ''
  ).toLowerCase();

  if (['draft', 'pending', 'pending_approval', 'rejected', 'archived'].includes(status)) return false;
  if (approval === 'rejected' || visibility === 'archived') return false;

  if (status === 'live') return true;
  if (approval === 'approved' && (!visibility || visibility === 'live' || status === 'approved')) return true;
  return false;
}

export function mapLiveMarketplaceProduct(product: any): LiveMarketplaceProduct {
  const price = Number(product.price || 0);
  const oldPrice = Number(product.originalPrice || product.oldPrice || 0);
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
    title: product.title || "Marketplace Product",
    price,
    oldPrice: oldPrice > price ? oldPrice : undefined,
    rating: Number(product.rating || 4.5),
    reviews: Number(product.reviews || 0),
    image: product.image || product.images?.[0] || "/placeholder.svg",
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
    .filter((product) => product.price > 0);
}

export function getCampaignProducts(items: any[], featuredProductIds: string[] = []) {
  const liveProducts = getLiveMarketplaceProducts(items);
  const normalizedFeaturedIds = featuredProductIds.map((value) => String(value).trim()).filter(Boolean);

  if (normalizedFeaturedIds.length) {
    const selected = liveProducts.filter((product) =>
      normalizedFeaturedIds.includes(String(product.id)) ||
      normalizedFeaturedIds.includes(String(product.slug)) ||
      normalizedFeaturedIds.includes(String(product.raw?.id || '')) ||
      normalizedFeaturedIds.includes(String(product.raw?.slug || ''))
    );

    if (selected.length) {
      return selected;
    }
  }

  return liveProducts.filter((product) => product.discount > 0 || /deal|offer|sale|flash|campaign/i.test(product.badge || ""));
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
