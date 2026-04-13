const DEFAULT_SITE_NAME = "ExShopi";
const DEFAULT_SITE_URL =
  (typeof import.meta !== "undefined" && String(import.meta.env.VITE_SITE_URL || "").trim()) ||
  "https://exshopi.com";

const UAE_KEYWORDS = [
  "UAE",
  "Dubai",
  "Abu Dhabi",
  "GCC",
  "Cash on Delivery",
  "COD",
  "ExShopi",
];

const FOCUS_KEYWORDS = [
  "refurbished laptops UAE",
  "used MacBook Dubai",
  "cheap iPhone UAE",
  "buy electronics UAE COD",
];

export function slugifySeo(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toTitleCase(value: string) {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clampText(value: string, limit: number) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function uniqueKeywords(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

export function normalizeSeoText(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function trimSeoKeywords(value: string) {
  return uniqueKeywords(
    String(value || "")
      .split(",")
      .map((item) => normalizeSeoText(item))
      .filter(Boolean)
  ).join(", ");
}

export function getSeoLengthStatus(
  value: string,
  minimum: number,
  maximum: number
): "short" | "good" | "long" {
  const length = normalizeSeoText(value).length;
  if (length === 0 || length < minimum) return "short";
  if (length > maximum) return "long";
  return "good";
}

export function buildSeoTitle(value: string, fallback?: string) {
  const normalized = normalizeSeoText(value || fallback || DEFAULT_SITE_NAME);
  return clampText(normalized, 60);
}

export function buildSeoDescription(value: string, fallback: string) {
  return clampText(normalizeSeoText(value || fallback), 160);
}

export function generateAdminSeoFields(input: {
  title?: string;
  shortDescription?: string;
  category?: string;
  slugBase?: string;
  canonicalBasePath?: string;
}) {
  const title = normalizeSeoText(input.title || "Marketplace Product");
  const category = normalizeSeoText(input.category || "electronics");
  const slug = slugifySeo(input.slugBase || title);
  const metaTitle = buildSeoTitle(`${title} | Buy in UAE | ${DEFAULT_SITE_NAME}`);
  const metaDescription = buildSeoDescription(
    `${normalizeSeoText(input.shortDescription) || title} Shop now on ExShopi with UAE delivery, trusted support, and marketplace-ready product details.`,
    `${title} available on ExShopi with UAE delivery, trusted support, and premium marketplace service.`
  );
  const metaKeywords = trimSeoKeywords(
    [title, category, `${category} UAE`, "buy electronics UAE", "Dubai", "ExShopi"]
      .filter(Boolean)
      .join(", ")
  );
  const canonicalUrl = input.canonicalBasePath
    ? buildAbsoluteUrl(`${input.canonicalBasePath.replace(/\/$/, "")}/${slug}`.replace(/\/+/g, "/"))
    : "";

  return {
    slug,
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: "",
  };
}

export function getSiteUrl() {
  return DEFAULT_SITE_URL.replace(/\/$/, "");
}

export function buildAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function getProductCategorySlugs(product: any) {
  const specs = product?.specs || {};

  const parentSlug = String(
    specs.parentCategorySlug ||
      specs.categorySlug ||
      product?.category ||
      "electronics"
  )
    .trim()
    .toLowerCase();

  const subcategorySlug = String(
    specs.subcategorySlug ||
      specs.templateId ||
      product?.subcategory ||
      "products"
  )
    .trim()
    .toLowerCase();

  return {
    parentSlug: slugifySeo(parentSlug || "electronics"),
    subcategorySlug: slugifySeo(subcategorySlug || "products"),
  };
}

export function getProductSlug(product: any) {
  return slugifySeo(
    product?.slug ||
      product?.seoSlug ||
      product?.specs?.seoSlug ||
      product?.title ||
      product?.name ||
      "product"
  );
}

export function buildProductPath(product: any) {
  const { parentSlug, subcategorySlug } = getProductCategorySlugs(product);
  const slug = getProductSlug(product);
  return `/${parentSlug}/${subcategorySlug}/${slug}`;
}

export function getCategoryPath(categorySlug?: string, subcategorySlug?: string) {
  if (categorySlug && subcategorySlug) {
    return `/category/${slugifySeo(categorySlug)}/${slugifySeo(subcategorySlug)}`;
  }
  if (categorySlug) {
    return `/category/${slugifySeo(categorySlug)}`;
  }
  return "/categories";
}

export function generateProductMeta(product: any) {
  const title = String(product?.title || product?.name || "Marketplace Product").trim();
  const brand = String(product?.brand || product?.specs?.attributes?.brand || "").trim();
  const storedTitle =
    product?.metaTitle || product?.specs?.metaTitle || product?.specs?.seo?.metaTitle || "";
  const storedDescription =
    product?.metaDescription ||
    product?.specs?.metaDescription ||
    product?.specs?.seo?.metaDescription ||
    "";
  const storedKeywords =
    product?.metaKeywords ||
    product?.specs?.metaKeywords ||
    product?.specs?.seo?.metaKeywords ||
    "";

  const generatedTitle = clampText(
    storedTitle ||
      `${title}${brand && !title.toLowerCase().includes(brand.toLowerCase()) ? ` by ${brand}` : ""} | Buy in UAE | ${DEFAULT_SITE_NAME}`,
    60
  );

  const generatedDescription = clampText(
    storedDescription ||
      `${title} available on ExShopi with UAE delivery, trusted seller support, and secure COD checkout. Shop ${brand || "premium"} deals for Dubai and GCC buyers today.`,
    160
  );

  const keywordList = uniqueKeywords([
    ...String(storedKeywords || "")
      .split(",")
      .map((value) => value.trim()),
    title,
    brand,
    ...UAE_KEYWORDS,
    ...FOCUS_KEYWORDS.filter((keyword) => {
      const loweredTitle = title.toLowerCase();
      return (
        keyword.includes("electronics") ||
        keyword.includes("laptop") && /laptop|macbook|notebook/.test(loweredTitle) ||
        keyword.includes("iphone") && /iphone|phone|mobile/.test(loweredTitle)
      );
    }),
  ]);

  return {
    metaTitle: generatedTitle,
    metaDescription: generatedDescription,
    metaKeywords: keywordList.join(", "),
    slug: getProductSlug(product),
  };
}

export function generateCategorySeo(categoryName: string, categorySlug?: string) {
  const normalizedName = String(categoryName || toTitleCase(categorySlug || "Category")).trim();
  const title = clampText(`Buy ${normalizedName} in UAE | Best Prices | ${DEFAULT_SITE_NAME}`, 60);
  const description = clampText(
    `${normalizedName} on ExShopi for UAE and GCC shoppers. Compare trusted marketplace listings, secure COD checkout, and premium electronics deals with fast Dubai delivery.`,
    160
  );
  const keywords = uniqueKeywords([
    normalizedName,
    `${normalizedName} UAE`,
    `buy ${normalizedName.toLowerCase()} UAE`,
    "electronics UAE",
    "Dubai shopping",
    ...UAE_KEYWORDS,
  ]);

  return {
    metaTitle: title,
    metaDescription: description,
    metaKeywords: keywords.join(", "),
  };
}

export function buildCategorySeoDescription(categoryName: string) {
  const title = String(categoryName || "products").trim();
  return (
    `${title} on ExShopi are curated for UAE and GCC shoppers who want better value, clear specifications, and trusted marketplace protection before they buy. ` +
    `This collection brings together competitive pricing, clean product details, and seller offers that are easier to compare than scattered social listings or vague classifieds. ` +
    `Customers browsing ${title.toLowerCase()} can review structured specifications, delivery expectations, warranty notes, and stock signals in one premium shopping experience designed for mobile-first discovery. ` +
    `We also connect shoppers with related products, same-category recommendations, and fresh arrivals so every visit becomes easier for both buyers and search engines to understand. ` +
    `That structure improves crawlability, supports internal linking, and gives Google more context about what makes each category page useful for local search intent. ` +
    `Instead of thin archive pages, ExShopi category collections aim to behave more like premium marketplace destinations where users can compare offers, discover top sellers, and move naturally from broad research to a confident purchase decision. ` +
    `If you are searching from Dubai, Abu Dhabi, Sharjah, or anywhere across the GCC, ExShopi helps you find trusted marketplace deals with COD-ready checkout, stronger product context, and a cleaner path from discovery to conversion. ` +
    `This is especially important for buyers looking for high-intent searches such as refurbished laptops UAE, used MacBook Dubai, cheap iPhone UAE, and buy electronics UAE COD, because those shoppers usually convert best when the marketplace gives them both strong SEO signals and genuinely useful content.`
  );
}

export function generateHomepageSeo() {
  return {
    metaTitle: "ExShopi UAE | Online Shopping for Electronics, Mobiles, Laptops & More",
    metaDescription: clampText(
      "Shop electronics, mobiles, refurbished laptops, accessories and more in the UAE on ExShopi. Trusted sellers, fast delivery, and cash on delivery.",
      160
    ),
    metaKeywords: uniqueKeywords([
      "ExShopi",
      "online shopping UAE",
      "buy electronics UAE",
      "mobiles UAE",
      "laptops UAE",
      "refurbished laptops UAE",
      "electronics UAE COD",
      "cash on delivery UAE",
      ...UAE_KEYWORDS,
    ]).join(", "),
  };
}

export function buildProductSchema(product: any, pathname?: string) {
  const seo = generateProductMeta(product);
  const stock = Number(product?.stock || 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.title || "Marketplace Product",
    description: seo.metaDescription,
    image: [product?.image, ...(Array.isArray(product?.images) ? product.images : [])].filter(Boolean),
    sku: product?.sku || undefined,
    brand: product?.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: Number(product?.price || 0),
      availability:
        stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: buildAbsoluteUrl(pathname || buildProductPath(product)),
      itemCondition: "https://schema.org/UsedCondition",
    },
  };
}

export function getDefaultPageTitle(pathname: string) {
  const normalized = String(pathname || "/").toLowerCase();
  if (normalized === "/") return generateHomepageSeo().metaTitle;
  if (normalized.startsWith("/products")) return "All Products in UAE | Premium Marketplace | ExShopi";
  if (normalized.startsWith("/blog")) return "ExShopi Blog | UAE Buying Guides, Reviews & Shopping Tips";
  if (normalized.startsWith("/contact")) return "Contact ExShopi | UAE Marketplace Support";
  if (normalized.startsWith("/about")) return "About ExShopi | UAE Marketplace";
  return `${DEFAULT_SITE_NAME} | Premium UAE Marketplace`;
}

export function getDefaultPageDescription(pathname: string) {
  const normalized = String(pathname || "/").toLowerCase();
  if (normalized === "/") return generateHomepageSeo().metaDescription;
  if (normalized.startsWith("/products")) {
    return "Browse live marketplace products on ExShopi with premium listings, secure checkout, and UAE delivery support.";
  }
  if (normalized.startsWith("/blog")) {
    return "Read ExShopi buying guides, product comparisons, and UAE-focused shopping insights for electronics and marketplace deals.";
  }
  return "Discover premium marketplace products, category collections, and trusted seller offers across ExShopi in the UAE.";
}

/**
 * Generate Organization structured data (JSON-LD)
 * Helps Google understand ExShopi as a legitimate business
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ExShopi",
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/logo.png`,
    description: "ExShopi is a UAE-based online marketplace offering electronics, mobiles, laptops, and accessories with trusted sellers, fast delivery, and cash on delivery (COD) options.",
    sameAs: [
      "https://www.instagram.com/exshopi",
      "https://www.facebook.com/exshopi",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
      addressLocality: "Dubai",
      addressRegion: "Dubai, UAE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      telephone: "+971-XXXX-XXXX",
      email: "support@exshopi.com",
    },
  };
}

/**
 * Generate WebSite structured data (JSON-LD) with SearchAction
 * Helps Google show sitelinks and understand search functionality
 */
export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ExShopi",
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Breadcrumb structured data for navigation hierarchy
 */
export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate combined schema array for all structured data
 */
export function buildHomepageSchemas() {
  return [
    buildOrganizationSchema(),
    buildWebsiteSchema(),
  ];
}
