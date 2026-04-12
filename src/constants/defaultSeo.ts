export const DEFAULT_SITE_NAME = "ExShopi";
export const DEFAULT_SITE_URL =
  (typeof import.meta !== "undefined" && String(import.meta.env.VITE_SITE_URL || "").trim()) ||
  "https://exshopi.com";

export const DEFAULT_PRODUCT_SEO_TITLE_SUFFIX = `| Buy in UAE | ${DEFAULT_SITE_NAME}`;
export const DEFAULT_PRODUCT_TITLE_RANGE = { min: 50, max: 60 };
export const DEFAULT_PRODUCT_DESCRIPTION_RANGE = { min: 150, max: 160 };

export const DEFAULT_SEO_PLACEHOLDERS = {
  title: "Premium product title for Google search results",
  description:
    "Write a clear description that explains the product and encourages clicks from Google search results.",
  keywords: "refurbished laptops UAE, used MacBook Dubai, cheap iPhone UAE",
  slug: "seo-friendly-product-slug",
};

export const DEFAULT_PRODUCT_KEYWORD_SEEDS = [
  "UAE",
  "Dubai",
  "Abu Dhabi",
  "GCC",
  "ExShopi",
  "buy electronics UAE",
  "buy electronics UAE COD",
];
