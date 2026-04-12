import React from "react";
import SEO from "../SEO";

type SEOHeadProps = {
  title: string;
  description: string;
  keywords?: string;
  pathname?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
}: SEOHeadProps) {
  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      pathname={pathname}
      image={image}
      type={type}
      jsonLd={jsonLd}
      noindex={noindex}
      canonicalUrl={canonicalUrl}
      ogTitle={ogTitle}
      ogDescription={ogDescription}
      ogImage={ogImage}
    />
  );
}
