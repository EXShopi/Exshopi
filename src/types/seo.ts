export type SeoFieldStatus = "good" | "short" | "long" | "invalid";

export interface ProductSeoFields {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface ProductSeoInput extends ProductSeoFields {
  title?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  image?: string;
  price?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  brand?: string;
  pathname?: string;
}

export interface SlugAvailabilityResponse {
  available: boolean;
  slug: string;
  suggestedSlug?: string;
  message?: string;
}

export interface SeoPreviewData {
  title: string;
  description: string;
  url: string;
}
