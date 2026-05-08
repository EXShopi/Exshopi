import { slugifyProduct } from "./slug";
import {
  buildOptimizedProductTitle,
  buildProductMetaDescription,
  buildProductSearchTags,
  buildProductShortDescription,
  buildProductSeoNarrative,
} from "../../src/lib/seoMarketplace";

const DEFAULT_SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || "https://exshopi.com";

export const normalizeSeoText = (value: string) => String(value || "").replace(/\s+/g, " ").trim();

export const clampSeoText = (value: string, limit: number) => {
  const normalized = normalizeSeoText(value);
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}…`;
};

export const uniqueSeoKeywords = (values: string[]) =>
  Array.from(new Set(values.map((value) => normalizeSeoText(value)).filter(Boolean)));

export const clampSeoKeywords = (values: string[], limit = 500) => {
  const keywords: string[] = [];
  for (const keyword of uniqueSeoKeywords(values)) {
    const candidate = [...keywords, keyword].join(", ");
    if (candidate.length > limit) continue;
    keywords.push(keyword);
  }
  return keywords.join(", ");
};

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
  brand?: string;
}) {
  const title = normalizeSeoText(input.title || "Marketplace Product");
  const slug = slugifyProduct(input.slug || title);
  const seoProduct = {
    ...input,
    title,
    specs: {
      attributes: {
        ...(input as any)?.specs?.attributes,
        brand: (input as any).brand,
        processor: (input as any).processor,
        ram: (input as any).ram,
        storage: (input as any).storage,
      },
      categoryName: input.category,
      subcategoryName: input.subcategory,
      shortDescription: input.shortDescription,
    },
  };
  const shortDescription = normalizeSeoText(input.shortDescription || buildProductShortDescription(seoProduct));
  const category = normalizeSeoText(input.category || "");
  const subcategory = normalizeSeoText(input.subcategory || "");
  const optimizedTitle = buildOptimizedProductTitle(seoProduct);
  const metaTitle = clampSeoText(
    input.metaTitle || optimizedTitle,
    90
  );
  const metaDescription = clampSeoText(
    input.metaDescription || buildProductMetaDescription(seoProduct),
    160
  );
  const metaKeywords = clampSeoKeywords([
    ...String(input.metaKeywords || "")
      .split(",")
      .map((keyword) => keyword.trim()),
    ...buildProductSearchTags(seoProduct),
    title,
    category,
    subcategory,
    "UAE",
    "Dubai",
    "GCC",
    "buy electronics UAE COD",
    "ExShopi",
  ]);
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
    shortDescription,
    description: normalizeSeoText(input.description || buildProductSeoNarrative(seoProduct)),
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
    shortDescription: (seo as any).shortDescription || specs?.shortDescription,
    longDescription: (seo as any).description || specs?.longDescription,
  };
}
