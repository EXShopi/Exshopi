import React from "react";
import { Helmet } from "react-helmet-async";
import type { ProductSeoFields } from "../types/seo";
import { buildAbsoluteUrl, generateProductSeo } from "../utils/seo";

type SEOProps = ProductSeoFields & {
  pathname?: string;
  image?: string;
  title?: string;
  description?: string;
  keywords?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function SEO({
  title,
  description,
  keywords,
  pathname = "/",
  image,
  type = "website",
  noindex = false,
  jsonLd,
  ...seoFields
}: SEOProps) {
  const seo = generateProductSeo({
    title,
    description,
    image,
    metaTitle: seoFields.metaTitle || title,
    metaDescription: seoFields.metaDescription || description,
    metaKeywords: seoFields.metaKeywords || keywords,
    canonicalUrl: seoFields.canonicalUrl || buildAbsoluteUrl(pathname),
    ogTitle: seoFields.ogTitle,
    ogDescription: seoFields.ogDescription,
    ogImage: seoFields.ogImage || image,
    slug: seoFields.slug,
  });

  const canonicalUrl = seo.canonicalUrl || buildAbsoluteUrl(pathname);

  return (
    <Helmet prioritizeSeoTags>
      <title>{seo.metaTitle}</title>
      <meta name="description" content={seo.metaDescription} />
      {seo.metaKeywords ? <meta name="keywords" content={seo.metaKeywords} /> : null}
      <meta
        name="robots"
        content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}
      />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={seo.ogTitle || seo.metaTitle || ""} />
      <meta property="og:description" content={seo.ogDescription || seo.metaDescription || ""} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ExShopi" />
      {(seo.ogImage || image) ? <meta property="og:image" content={seo.ogImage || image || ""} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.ogTitle || seo.metaTitle || ""} />
      <meta name="twitter:description" content={seo.ogDescription || seo.metaDescription || ""} />
      {(seo.ogImage || image) ? <meta name="twitter:image" content={seo.ogImage || image || ""} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
