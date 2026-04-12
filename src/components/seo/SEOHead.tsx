import React from "react";
import { Helmet } from "react-helmet-async";
import { buildAbsoluteUrl } from "../../lib/seo";

type SEOHeadProps = {
  title: string;
  description: string;
  keywords?: string;
  pathname?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
};

export default function SEOHead({
  title,
  description,
  keywords,
  pathname = "/",
  image,
  type = "website",
  jsonLd,
  noindex = false,
}: SEOHeadProps) {
  const canonicalUrl = buildAbsoluteUrl(pathname);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ExShopi" />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}
