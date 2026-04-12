import { slugifyProduct } from "./slug";

const DEFAULT_SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || "https://exshopi.com";

export const normalizeSeoText = (value: string) => String(value || "").replace(/\s+/g, " ").trim();

export const clampSeoText = (value: string, limit: number) => {
  const normalized = normalizeSeoText(value);
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}…`;
};

export const uniqueSeoKeywords = (values: string[]) =>
  Array.from(new Set(values.map((value) => normalizeSeoText(value)).filter(Boolean)));

export function generateProductSeoPayload(input: {
  title?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  image?: string;
}) {
  const title = normalizeSeoText(input.title || "Marketplace Product");
  const slug = slugifyProduct(input.slug || title);
  const shortDescription = normalizeSeoText(input.shortDescription || input.description || "");
  const category = normalizeSeoText(input.category || "");
  const subcategory = normalizeSeoText(input.subcategory || "");
  const metaTitle = clampSeoText(
    input.metaTitle || `${title} | Buy in UAE | ExShopi`,
    60
  );
  const metaDescription = clampSeoText(
    input.metaDescription ||
      `${shortDescription || title} Shop now on ExShopi with UAE delivery, trusted support, and premium marketplace product details.`,
    160
  );
  const metaKeywords = uniqueSeoKeywords([
    ...String(input.metaKeywords || "")
      .split(",")
      .map((keyword) => keyword.trim()),
    title,
    category,
    subcategory,
    "UAE",
    "Dubai",
    "GCC",
    "buy electronics UAE COD",
    "ExShopi",
  ]).join(", ");
  const canonicalUrl = normalizeSeoText(
    input.canonicalUrl || `${DEFAULT_SITE_URL.replace(/\/$/, "")}/product/${slug}`
  );

  return {
    slug,
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogTitle: normalizeSeoText(input.ogTitle || metaTitle),
    ogDescription: normalizeSeoText(input.ogDescription || metaDescription),
    ogImage: normalizeSeoText(input.ogImage || input.image || ""),
  };
}

export function mergeProductSeoIntoSpecs(
  specs: Record<string, any> | undefined,
  seo: ReturnType<typeof generateProductSeoPayload>
) {
  return {
    ...(specs || {}),
    slug: seo.slug,
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    metaKeywords: seo.metaKeywords,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
  };
}
