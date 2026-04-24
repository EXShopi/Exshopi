import type { SyntheticEvent } from "react";

export const PRODUCT_PLACEHOLDER_IMAGE = "/assets/product-placeholder.png";

function isDev() {
  try {
    return typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);
  } catch {
    return false;
  }
}

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProductImagePath(value: unknown): string {
  const raw = asCleanString(value);
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("public/")) return `/${raw.slice("public/".length)}`;
  if (raw.startsWith("assets/")) return `/${raw}`;
  if (raw.startsWith("category-card/")) return `/${raw}`;
  if (raw.startsWith("products/")) return `/${raw}`;
  if (raw.startsWith("uploads/")) return `/${raw}`;

  return `/${raw.replace(/^\/+/, "")}`;
}

function extractImageValues(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    const normalized = normalizeProductImagePath(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractImageValues(item));
  }

  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    return [
      candidate.url,
      candidate.image,
      candidate.imageUrl,
      candidate.image_url,
      candidate.src,
      candidate.secure_url,
      candidate.secureUrl,
      candidate.preview,
      candidate.thumbnail,
      candidate.thumbnailUrl,
      candidate.mainImage,
      candidate.main_image,
      candidate.path,
    ].flatMap((item) => extractImageValues(item));
  }

  return [];
}

export function getProductImageUrls(product: unknown): string[] {
  if (!product) return [];

  if (typeof product === "string" || Array.isArray(product)) {
    return Array.from(new Set(extractImageValues(product).filter(Boolean)));
  }

  const source = product as Record<string, unknown>;
  const candidates = [
    source.image,
    source.imageUrl,
    source.image_url,
    source.thumbnail,
    source.thumbnailUrl,
    source.mainImage,
    source.main_image,
    source.images,
    source.gallery,
    source.media,
    source.productImages,
  ];

  return Array.from(new Set(candidates.flatMap((item) => extractImageValues(item)).filter(Boolean)));
}

export function getPrimaryProductImage(product: unknown): string {
  return getProductImageUrls(product)[0] || PRODUCT_PLACEHOLDER_IMAGE;
}

export function handleProductImageError(
  event: SyntheticEvent<HTMLImageElement>,
  product?: { id?: string | number; title?: string },
  imageUrl?: string
) {
  if (isDev()) {
    console.warn("Broken product image:", product?.id, product?.title, imageUrl);
  }

  const target = event.currentTarget;
  target.onerror = null;
  target.src = PRODUCT_PLACEHOLDER_IMAGE;
}
