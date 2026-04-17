import React, { useEffect } from "react";
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
  const resolvedImage = seo.ogImage || image || "";

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = seo.metaTitle || "ExShopi";

    const managedNodes: Element[] = [];

    const upsertTag = (
      selector: string,
      create: () => HTMLElement,
      apply: (element: HTMLElement) => void
    ) => {
      const matches = Array.from(document.head.querySelectorAll(selector)) as HTMLElement[];
      const [first, ...rest] = matches;
      for (const duplicate of rest) {
        duplicate.remove();
      }

      let element = first || null;
      if (!element) {
        element = create();
        element.setAttribute("data-exshopi-seo", "true");
        document.head.appendChild(element);
      }
      apply(element);
      managedNodes.push(element);
    };

    const setMetaName = (name: string, content?: string) => {
      if (!content) return;
      upsertTag(
        `meta[name="${name}"]`,
        () => {
          const meta = document.createElement("meta");
          meta.setAttribute("name", name);
          return meta;
        },
        (element) => {
          element.setAttribute("content", content);
        }
      );
    };

    const setMetaProperty = (property: string, content?: string) => {
      if (!content) return;
      upsertTag(
        `meta[property="${property}"]`,
        () => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", property);
          return meta;
        },
        (element) => {
          element.setAttribute("content", content);
        }
      );
    };

    upsertTag(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        return link;
      },
      (element) => {
        element.setAttribute("href", canonicalUrl);
      }
    );

    setMetaName(
      "robots",
      noindex ? "noindex, nofollow" : "index, follow"
    );
    setMetaName("description", seo.metaDescription || "");
    setMetaName("keywords", seo.metaKeywords || "");

    setMetaProperty("og:type", type);
    setMetaProperty("og:title", seo.ogTitle || seo.metaTitle || "");
    setMetaProperty("og:description", seo.ogDescription || seo.metaDescription || "");
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:site_name", "ExShopi");
    setMetaProperty("og:image", resolvedImage);

    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", seo.ogTitle || seo.metaTitle || "");
    setMetaName("twitter:description", seo.ogDescription || seo.metaDescription || "");
    setMetaName("twitter:image", resolvedImage);

    if (jsonLd) {
      upsertTag(
        'script[data-exshopi-jsonld="true"]',
        () => {
          const script = document.createElement("script");
          script.setAttribute("type", "application/ld+json");
          script.setAttribute("data-exshopi-jsonld", "true");
          return script;
        },
        (element) => {
          element.textContent = JSON.stringify(jsonLd);
        }
      );
    }

    return () => {
      for (const node of managedNodes) {
        if (node.getAttribute("data-exshopi-seo") === "true") {
          node.remove();
        }
      }
    };
  }, [
    canonicalUrl,
    image,
    jsonLd,
    noindex,
    pathname,
    resolvedImage,
    seo.canonicalUrl,
    seo.metaDescription,
    seo.metaKeywords,
    seo.metaTitle,
    seo.ogDescription,
    seo.ogImage,
    seo.ogTitle,
    type,
  ]);

  return null;
}
