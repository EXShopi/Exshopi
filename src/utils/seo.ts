import {
  DEFAULT_PRODUCT_DESCRIPTION_RANGE,
  DEFAULT_PRODUCT_KEYWORD_SEEDS,
  DEFAULT_PRODUCT_SEO_TITLE_SUFFIX,
  DEFAULT_PRODUCT_TITLE_RANGE,
  DEFAULT_SEO_PLACEHOLDERS,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_URL,
} from "../constants/defaultSeo";
import type { ProductSeoFields, ProductSeoInput, SeoFieldStatus, SeoPreviewData } from "../types/seo";
import {
  buildOptimizedProductTitle,
  buildProductMetaDescription,
  buildProductSearchTags,
  cleanSeoSlug,
} from "../lib/seoMarketplace";
import {
  getCountryConfig,
  getCountrySeoMarketLabel,
  getProductCountryPrice,
  getShippingChargeBusinessAed,
} from "../lib/countryConfig";

export function normalizeSeoText(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function slugifySeo(value: string) {
  return cleanSeoSlug(value);
}

export function clampSeoText(value: string, maxLength: number) {
  const normalized = normalizeSeoText(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function trimSeoKeywords(value: string) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((keyword) => normalizeSeoText(keyword))
        .filter(Boolean)
    )
  ).join(", ");
}

export function getSeoFieldStatus(
  value: string,
  min: number,
  max: number
): SeoFieldStatus {
  const length = normalizeSeoText(value).length;
  if (!length) return "short";
  if (length < min) return "short";
  if (length > max) return "long";
  return "good";
}

export function getSlugStatus(value: string): SeoFieldStatus {
  const slug = slugifySeo(value);
  if (!slug) return "invalid";
  if (slug.length < 8) return "short";
  if (slug.length > 120) return "long";
  return "good";
}

export function getKeywordStatus(value: string): SeoFieldStatus {
  const keywords = trimSeoKeywords(value)
    .split(",")
    .map((item) => normalizeSeoText(item))
    .filter(Boolean);

  if (keywords.length === 0) return "short";
  if (keywords.length > 12) return "long";
  return "good";
}

export function buildAbsoluteUrl(pathname: string) {
  const baseUrl = DEFAULT_SITE_URL.replace(/\/$/, "");
  if (!pathname) return baseUrl;
  return pathname.startsWith("http") ? pathname : `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function buildProductPreviewUrl(slug: string) {
  return buildAbsoluteUrl(`/product/${slug || DEFAULT_SEO_PLACEHOLDERS.slug}`);
}

export function generateProductSeo(input: ProductSeoInput): ProductSeoFields {
  const marketLabel = getCountrySeoMarketLabel(input.countryCode);
  const title = normalizeSeoText(input.title || "Marketplace Product");
  const shortDescription = normalizeSeoText(input.shortDescription || input.description || "");
  const category = normalizeSeoText(input.category || "");
  const subcategory = normalizeSeoText(input.subcategory || "");
  const nextSlug = slugifySeo(input.slug || title);
  const seoProduct = {
    title,
    brand: input.brand,
    year: (input as any)?.year,
    specs: {
      attributes: {
        processor: (input as any)?.processor,
        ram: (input as any)?.ram,
        storage: (input as any)?.storage,
      },
    },
    category,
    subcategory,
    condition: input.condition,
  };
  const optimizedTitle = buildOptimizedProductTitle(seoProduct, DEFAULT_PRODUCT_TITLE_RANGE.max);

  const generatedTitle = clampSeoText(
    input.metaTitle || optimizedTitle || `Buy ${title} in ${marketLabel} | Best Price | ${DEFAULT_SITE_NAME}`,
    DEFAULT_PRODUCT_TITLE_RANGE.max
  );

  const generatedDescription = clampSeoText(
    input.metaDescription || buildProductMetaDescription(seoProduct, DEFAULT_PRODUCT_DESCRIPTION_RANGE.max),
    DEFAULT_PRODUCT_DESCRIPTION_RANGE.max
  );

  const generatedKeywords = trimSeoKeywords(
    input.metaKeywords ||
      [...buildProductSearchTags(seoProduct), title, category, subcategory, ...DEFAULT_PRODUCT_KEYWORD_SEEDS]
        .filter(Boolean)
        .join(", ")
  );

  const canonicalUrl = normalizeSeoText(input.canonicalUrl || buildProductPreviewUrl(nextSlug));

  return {
    slug: nextSlug,
    metaTitle: generatedTitle,
    metaDescription: generatedDescription,
    metaKeywords: generatedKeywords,
    canonicalUrl,
    ogTitle: normalizeSeoText(input.ogTitle || generatedTitle),
    ogDescription: normalizeSeoText(input.ogDescription || generatedDescription),
    ogImage: normalizeSeoText(input.ogImage || input.image || ""),
  };
}

export function getProductSeoPayload(input: ProductSeoInput) {
  const seo = generateProductSeo(input);
  return {
    ...seo,
    preview: {
      title: seo.metaTitle || DEFAULT_SEO_PLACEHOLDERS.title,
      description: seo.metaDescription || DEFAULT_SEO_PLACEHOLDERS.description,
      url: seo.canonicalUrl || buildProductPreviewUrl(seo.slug || ""),
    } satisfies SeoPreviewData,
    quality: {
      title: getSeoFieldStatus(seo.metaTitle || "", DEFAULT_PRODUCT_TITLE_RANGE.min, DEFAULT_PRODUCT_TITLE_RANGE.max),
      description: getSeoFieldStatus(
        seo.metaDescription || "",
        DEFAULT_PRODUCT_DESCRIPTION_RANGE.min,
        DEFAULT_PRODUCT_DESCRIPTION_RANGE.max
      ),
      slug: getSlugStatus(seo.slug || ""),
      keywords: getKeywordStatus(seo.metaKeywords || ""),
    },
  };
}

export function buildProductJsonLd(input: ProductSeoInput) {
  const seo = generateProductSeo(input);
  const country = getCountryConfig(input.countryCode);
  const stock = Number(input.stock || 0);
  const normalizedCondition = String(input.condition || "").trim().toLowerCase();
  const itemCondition =
    /used|renewed|refurb/i.test(normalizedCondition)
      ? "https://schema.org/UsedCondition"
      : "https://schema.org/NewCondition";
  const images = Array.from(
    new Set([input.image, ...(Array.isArray(input.images) ? input.images : [])].filter(Boolean))
  ) as string[];
  const reviewCount = Number((input as any).reviewCount || (input as any).reviews || 0);
  const ratingValue = Number((input as any).ratingValue || (input as any).rating || 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title || "Marketplace Product",
    description: seo.metaDescription,
    image: images,
    sku: input.sku || undefined,
    brand: input.brand
      ? {
          "@type": "Brand",
          name: input.brand,
        }
      : undefined,
    aggregateRating:
      reviewCount > 0 && ratingValue > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(ratingValue.toFixed(1)),
            reviewCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: country.currency,
      price: Number(getProductCountryPrice(input as any, country.code) || input.price || 0),
      availability:
        stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: seo.canonicalUrl || buildProductPreviewUrl(seo.slug || ""),
      itemCondition,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: String(getShippingChargeBusinessAed(country.code)),
          currency: "AED",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: country.code,
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: country.code,
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      seller: input.seller
        ? {
            "@type": "Organization",
            name: input.seller,
          }
        : undefined,
    },
  };
}
