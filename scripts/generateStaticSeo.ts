import fs from "node:fs/promises";
import path from "node:path";
import { BLOG_POSTS } from "../src/lib/blog";
import { brands } from "../src/components/ShopByBrandSection";
import {
  buildCategorySeoBody,
  buildProductSeoNarrative,
  cleanSeoSlug,
  LANDING_PAGES,
  UAE_TRUST_SIGNALS,
} from "../src/lib/seoMarketplace";
import {
  buildAbsoluteUrl,
  buildBreadcrumbSchema,
  buildCategorySeoDescription,
  buildHomepageSchemas,
  buildProductBreadcrumbSchema,
  buildProductPath,
  buildProductSchema,
  generateCategorySeo,
  generateHomepageSeo,
  generateProductMeta,
  getCategoryPath,
} from "../src/lib/seo";
import { productMatchesCategoryAssignment, MASTER_CATEGORIES } from "../src/lib/masterCategories";
import { getProductRouteAliases } from "../src/lib/productRouteResolution";
import { loadPrerenderProducts } from "./lib/prerenderData";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SITE_URL = "https://exshopi.com";
const PRODUCTS_PER_SITEMAP = 5000;

type PrerenderedProduct = {
  id: string;
  rawSlug: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  sellerName: string;
  rating: number;
  reviews: number;
  stock: number;
  specs: Record<string, any>;
  category: string;
  description: string;
  brand: string;
  badges: string[];
};

type GeneratedRouteRecord = {
  routePath: string;
  outputPath: string;
  kind: string;
};

const generatedRouteRecords: GeneratedRouteRecord[] = [];
const CANONICAL_REDIRECTS = [
  "/term /terms 301!",
  "/terms-conditions /terms 301!",
  "/privacy-policy /privacy 301!",
];

const STATIC_PAGE_CONTENT: Array<{
  path: string;
  title: string;
  description: string;
  keywords: string;
  heading: string;
  paragraphs: string[];
}> = [
  {
    path: "/about",
    title: "About ExShopi UAE | Trusted Online Marketplace",
    description: "Learn about ExShopi, the UAE marketplace focused on electronics, verified sellers, and trusted customer shopping journeys.",
    keywords: "about ExShopi, UAE marketplace, trusted online shopping UAE, ExShopi company",
    heading: "About ExShopi",
    paragraphs: [
      "ExShopi is a UAE-focused marketplace built to connect shoppers with verified sellers, structured product pages, and trusted online buying experiences across electronics and daily-use categories.",
      "The platform combines clearer category navigation, route-specific product pages, and marketplace trust signals to help customers discover products faster and sellers launch with more confidence.",
    ],
  },
  {
    path: "/contact",
    title: "Contact ExShopi UAE | Marketplace Support",
    description: "Contact ExShopi UAE for marketplace support, order help, seller questions, and customer service assistance.",
    keywords: "contact ExShopi, ExShopi support, UAE marketplace support, customer service ExShopi",
    heading: "Contact ExShopi",
    paragraphs: [
      "Reach ExShopi for order support, seller onboarding help, and customer service questions related to the UAE marketplace.",
      "Use ExShopi support channels for assistance with products, orders, seller registration, and marketplace policies.",
    ],
  },
  {
    path: "/faq",
    title: "ExShopi FAQ | UAE Marketplace Help",
    description: "Read frequently asked questions about shopping, delivery, returns, sellers, and marketplace support on ExShopi UAE.",
    keywords: "ExShopi FAQ, marketplace FAQ UAE, delivery questions ExShopi, seller help UAE",
    heading: "ExShopi FAQ",
    paragraphs: [
      "Find answers about orders, delivery, returns, seller flows, and general marketplace support for ExShopi UAE.",
      "This FAQ hub helps shoppers and sellers quickly understand how ExShopi works across the UAE marketplace.",
    ],
  },
  {
    path: "/privacy",
    title: "Privacy Policy | ExShopi UAE",
    description: "Read the ExShopi UAE privacy policy to understand how marketplace data, account information, and shopping activity are handled.",
    keywords: "privacy policy ExShopi, ExShopi privacy, marketplace privacy UAE",
    heading: "Privacy Policy",
    paragraphs: [
      "Review how ExShopi handles account information, marketplace activity, and customer data across the UAE shopping platform.",
      "The privacy policy explains how data is collected, used, and protected while browsing, buying, or selling on ExShopi.",
    ],
  },
  {
    path: "/terms",
    title: "Terms and Conditions | ExShopi UAE",
    description: "Read the terms and conditions for shopping, selling, and using ExShopi UAE marketplace services.",
    keywords: "ExShopi terms, marketplace terms UAE, ExShopi conditions",
    heading: "Terms and Conditions",
    paragraphs: [
      "The ExShopi terms outline the rules for shopping, selling, orders, listings, and general use of the UAE marketplace.",
      "Review these terms to understand responsibilities, service conditions, and platform expectations across customer and seller journeys.",
    ],
  },
  {
    path: "/return-policy",
    title: "Return Policy | ExShopi UAE",
    description: "Read the ExShopi UAE return policy for orders, seller listings, and marketplace purchase support.",
    keywords: "return policy ExShopi, ExShopi returns UAE, marketplace returns",
    heading: "Return Policy",
    paragraphs: [
      "ExShopi provides clear return policy guidance for marketplace orders, listing conditions, and buyer support in the UAE.",
      "Use the return policy page to understand timelines, item eligibility, and how support works for marketplace transactions.",
    ],
  },
  {
    path: "/warranty",
    title: "Warranty Information | ExShopi UAE",
    description: "Review warranty information for eligible ExShopi marketplace products and UAE customer support policies.",
    keywords: "ExShopi warranty, UAE electronics warranty, marketplace warranty",
    heading: "Warranty Information",
    paragraphs: [
      "ExShopi highlights warranty information and support expectations for eligible marketplace products across the UAE.",
      "Review warranty coverage details and support guidance before completing your purchase on the marketplace.",
    ],
  },
  {
    path: "/support",
    title: "ExShopi Support | UAE Marketplace Help Center",
    description: "Visit the ExShopi support page for order tracking, customer service, seller help, and marketplace assistance.",
    keywords: "ExShopi support, help center ExShopi, seller help UAE, customer support marketplace",
    heading: "Marketplace Support",
    paragraphs: [
      "The ExShopi support page connects buyers and sellers to help for orders, product questions, seller onboarding, and general marketplace guidance.",
      "Use support resources to resolve issues faster and keep shopping and selling journeys moving smoothly across the UAE marketplace.",
    ],
  },
  {
    path: "/sell-on-exshopi",
    title: "Sell on ExShopi UAE | Start Selling Online in UAE Marketplace",
    description: "Sell online in UAE with ExShopi marketplace. Low commission, cash on delivery, fast seller approval. Start your ecommerce business today.",
    keywords: "sell on ExShopi, sell online UAE, ecommerce UAE, UAE marketplace, start online business UAE",
    heading: "Sell on ExShopi UAE",
    paragraphs: [
      "ExShopi helps businesses sell online in UAE through a trusted marketplace built for electronics, retail growth, and smoother seller onboarding.",
      "If you want to start online business UAE operations with cash on delivery support, faster approval, and clearer marketplace visibility, ExShopi provides a focused seller path.",
    ],
  },
  {
    path: "/promotions",
    title: "Marketplace Promotions in UAE | ExShopi",
    description: "Explore ExShopi promotions, seasonal marketplace offers, and curated shopping opportunities across UAE categories.",
    keywords: "ExShopi promotions, UAE marketplace offers, online shopping deals UAE",
    heading: "Marketplace Promotions",
    paragraphs: [
      "Browse ExShopi promotions, featured marketplace offers, and seasonal buying opportunities across UAE shopping categories.",
      "Promotions pages help shoppers discover curated deals while preserving clear internal links into products, categories, and campaigns.",
    ],
  },
  {
    path: "/campaigns/current",
    title: "Current Campaigns | ExShopi UAE Marketplace",
    description: "See the current ExShopi marketplace campaigns, featured offers, and curated product collections in the UAE.",
    keywords: "ExShopi campaign, marketplace campaigns UAE, featured offers ExShopi",
    heading: "Current Campaigns",
    paragraphs: [
      "Current campaign pages highlight marketplace collections, featured promotions, and curated product discovery routes across ExShopi UAE.",
      "These campaign pages support both shoppers and search engines with route-specific content linked to live marketplace offers.",
    ],
  },
];

const STATIC_PRERENDER_ROUTE_PATHS = STATIC_PAGE_CONTENT.map((page) => page.path);
const BRAND_PRERENDER_ROUTE_PATHS = brands.map((brand) => `/brands/${cleanSeoSlug(brand.name)}`);

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(value?: string) {
  const input = String(value || "").trim();
  if (!input) return `${SITE_URL}/logo.png`;
  if (/^https?:\/\//i.test(input)) return input;
  return `${SITE_URL}${input.startsWith("/") ? input : `/${input}`}`;
}

function productCardData(product: any): PrerenderedProduct {
  return {
    id: String(product.id),
    rawSlug: String(product.slug || product.id || "").trim(),
    slug: cleanSeoSlug(product.slug || product.title || product.id),
    title: product.title,
    image: normalizeUrl(product.image || product.images?.[0] || "/hero/hero-1.webp"),
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || 0),
    sellerName: product.sellerName || product.seller || "Marketplace Seller",
    rating: Number(product.rating || 4.5),
    reviews: Number(product.reviews || 0),
    stock: Number(product.stock || 0),
    specs: product.specs || {},
    category: product.category || product.specs?.categoryName || "Marketplace",
    description: product.description || "",
    brand: product.brand || product.specs?.attributes?.brand || "",
    badges: Array.isArray(product.badges) ? product.badges : [],
  };
}

function buildHeadMeta(html: string, input: {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  jsonLd?: unknown;
}) {
  let next = html;

  next = next
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']keywords["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:title["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:url["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+property=["']og:image["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:title["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:image["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");

  const headInsert = [
    `<title>${escapeHtml(input.title)}</title>`,
    `<meta name="description" content="${escapeHtml(input.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(input.keywords || "")}" />`,
    `<meta name="robots" content="${escapeHtml(input.robots || "index, follow")}" />`,
    `<meta property="og:title" content="${escapeHtml(input.ogTitle || input.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(input.ogDescription || input.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(input.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(normalizeUrl(input.ogImage || "/logo.png"))}" />`,
    `<meta name="twitter:title" content="${escapeHtml(input.ogTitle || input.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(input.ogDescription || input.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(normalizeUrl(input.ogImage || "/logo.png"))}" />`,
    `<link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />`,
  ];

  if (input.jsonLd) {
    headInsert.push(`<script type="application/ld+json">${JSON.stringify(input.jsonLd)}</script>`);
  }

  return next.replace("</head>", `  ${headInsert.join("\n  ")}\n</head>`);
}

function htmlDocument(template: string, input: {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
  jsonLd?: unknown;
  snapshotHtml: string;
  routeData?: unknown;
}) {
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyScripts = bodyMatch?.[1]?.match(/<script\b[\s\S]*?<\/script>/gi) || [];

  let html = buildHeadMeta(template, input);
  html = html.replace(
    "</head>",
    `  <style>
    .seo-prerender-fallback,
    [data-prerender-human-hidden="true"],
    [data-prerender-human-shell="true"] {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
    }
    #exshopi-initial-loader {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100svh;
      padding: 20px;
      color: #0f172a;
      text-align: center;
      background: #f6f7f9;
    }
    #exshopi-initial-loader .initial-loader-card {
      width: min(88vw, 360px);
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      background: #fff;
      box-shadow: 0 14px 34px rgba(15,23,42,.08);
      padding: 24px 20px;
    }
    #exshopi-initial-loader .initial-loader-logo {
      width: 58px;
      height: 58px;
      margin: 0 auto 14px;
      border-radius: 20px;
      background: #fff;
      object-fit: contain;
      padding: 8px;
      border: 1px solid #e2e8f0;
    }
    #exshopi-initial-loader .initial-loader-title { margin: 0; font-size: 18px; font-weight: 900; }
    #exshopi-initial-loader .initial-loader-text { margin: 6px 0 0; color: #64748b; font-size: 12px; font-weight: 700; }
    #exshopi-initial-loader .initial-loader-bar { height: 6px; margin-top: 18px; overflow: hidden; border-radius: 999px; background: #f1f5f9; }
    #exshopi-initial-loader .initial-loader-bar::after {
      content: "";
      display: block;
      width: 52%;
      height: 100%;
      border-radius: inherit;
      background: #0f172a;
      animation: exshopi-initial-sweep 1.15s ease-in-out infinite;
    }
    @keyframes exshopi-initial-sweep {
      0% { transform: translateX(-120%); }
      50% { transform: translateX(60%); }
      100% { transform: translateX(220%); }
    }
  </style>
</head>`
  );
  html = html.replace(
    /<body[^>]*>[\s\S]*<\/body>/i,
    `<body>
  <script>console.log("SEO PAGE SERVED", ${JSON.stringify(input.canonicalUrl)});</script>
  <div id="exshopi-initial-loader" aria-label="Loading ExShopi">
    <div class="initial-loader-card">
      <img src="/logo.png" alt="ExShopi" class="initial-loader-logo" />
      <p class="initial-loader-title">Loading ExShopi...</p>
      <p class="initial-loader-text">Preparing your marketplace</p>
      <div class="initial-loader-bar" aria-hidden="true"></div>
    </div>
  </div>
  <div id="root"><div class="seo-prerender-fallback">${input.snapshotHtml}</div></div>
  <noscript>
    <style>
      .seo-prerender-fallback,
      [data-prerender-human-hidden="true"],
      [data-prerender-human-shell="true"] {
        position: static !important;
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
        clip: auto !important;
        clip-path: none !important;
        white-space: normal !important;
      }
      #exshopi-initial-loader { display: none !important; }
    </style>
    ${input.snapshotHtml}
  </noscript>
  <script>window.__EXSHOPI_ROUTE_DATA__=${JSON.stringify(input.routeData || null)};</script>
  ${bodyScripts.join("\n  ")}
</body>`
  );

  return html;
}

async function writeRouteFile(routePath: string, html: string, kind = "route") {
  const cleanRoute = routePath.replace(/^\//, "").replace(/\/$/, "");
  const outputPath = cleanRoute ? path.join(DIST_DIR, cleanRoute, "index.html") : path.join(DIST_DIR, "index.html");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, "utf8");
  generatedRouteRecords.push({
    routePath: routePath || "/",
    outputPath,
    kind,
  });
}

function renderTrustSignals() {
  return UAE_TRUST_SIGNALS.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");
}

function stableProductDescription(product: PrerenderedProduct) {
  return generateProductMeta(product).metaDescription;
}

function textParagraphs(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => `<p style="font-size:17px;line-height:1.85;color:#475569;max-width:900px;">${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderCategorySnapshot(input: {
  heading: string;
  body: string[];
  products: PrerenderedProduct[];
  continueText: string;
}) {
  return `
    <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
      <section data-prerender-human-shell="true" style="display:grid;gap:20px;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);align-items:start;">
        <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:28px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
          <div style="width:132px;height:12px;border-radius:999px;background:#dbeafe;"></div>
          <div style="margin-top:16px;width:58%;height:40px;border-radius:18px;background:#e2e8f0;"></div>
          <div style="margin-top:14px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
          <div style="margin-top:10px;width:93%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
          <div style="margin-top:10px;width:78%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
        </div>
        <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:24px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
          <div style="width:72%;height:18px;border-radius:999px;background:#e2e8f0;"></div>
          <div style="margin-top:16px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
          <div style="margin-top:10px;width:94%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
          <div style="margin-top:20px;display:grid;gap:12px;">
            ${Array.from({ length: 4 })
              .map(
                () =>
                  `<div style="height:76px;border-radius:22px;border:1px solid rgba(226,232,240,.9);background:linear-gradient(180deg,#ffffff,#f8fafc);"></div>`
              )
              .join("")}
          </div>
        </div>
      </section>
      <section data-prerender-human-hidden="true">
        <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(input.heading)}</h1>
        ${textParagraphs(input.body)}
        <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Related products</h2>
        <ul style="padding-left:20px;line-height:2;">
          ${input.products
            .slice(0, 10)
            .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
            .join("")}
        </ul>
        <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">${input.continueText}</p>
      </section>
    </main>`;
}

function renderStaticSnapshot(input: {
  heading: string;
  paragraphs: string[];
  links?: Array<{ href: string; label: string }>;
}) {
  return `
    <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
      <section data-prerender-human-shell="true" style="padding:12px 0 24px;">
        <div style="display:grid;gap:20px;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);align-items:start;">
          <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:28px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
            <div style="width:126px;height:12px;border-radius:999px;background:#dbeafe;"></div>
            <div style="margin-top:16px;width:62%;height:40px;border-radius:18px;background:#e2e8f0;"></div>
            <div style="margin-top:14px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
            <div style="margin-top:10px;width:90%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
            <div style="margin-top:10px;width:76%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
          </div>
          <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:24px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
            <div style="width:70%;height:18px;border-radius:999px;background:#e2e8f0;"></div>
            <div style="margin-top:16px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
            <div style="margin-top:10px;width:88%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
            <div style="margin-top:28px;width:100%;height:44px;border-radius:18px;background:#dbeafe;"></div>
          </div>
        </div>
      </section>
      <section data-prerender-human-hidden="true">
        <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(input.heading)}</h1>
        ${textParagraphs(input.paragraphs)}
        ${
          input.links?.length
            ? `<ul style="padding-left:20px;line-height:2;margin-top:24px;">
          ${input.links.map((link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`).join("")}
        </ul>`
            : ""
        }
      </section>
    </main>`;
}

function productAliasRedirects(product: PrerenderedProduct) {
  const canonicalPath = buildProductPath(product);
  const aliases = new Set<string>(getProductRouteAliases(product));

  aliases.delete(canonicalPath);

  return Array.from(aliases)
    .filter(Boolean)
    .filter((alias) => alias !== canonicalPath)
    .map((alias) => `${alias} ${canonicalPath} 301!`);
}

function getSitemapPriority(kind: string, routePath: string) {
  if (routePath === "/") return "1.0";
  if (kind === "route") return "0.9";
  if (kind === "listing" || kind === "category" || kind === "category-alias") return "0.8";
  if (kind === "brand" || kind === "static") return "0.7";
  if (routePath.startsWith("/blog")) return "0.6";
  return "0.5";
}

function getSitemapChangefreq(kind: string, routePath: string) {
  if (routePath === "/") return "daily";
  if (kind === "route" || kind === "listing" || kind === "category" || kind === "category-alias") {
    return "daily";
  }
  if (kind === "brand" || kind === "static") return "weekly";
  if (routePath.startsWith("/blog")) return "monthly";
  return "weekly";
}

function buildXmlUrlSet(entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .sort((left, right) => left.loc.localeCompare(right.loc))
  .map(
    (entry) =>
      `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;
}

function buildXmlSitemapIndex(entries: Array<{ loc: string; lastmod: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <sitemap><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;
}

async function writeSupportFiles(input: {
  homeHtml: string;
  productRedirects: Array<{ alias: string; canonicalPath: string }>;
  prerenderedRoutePaths: string[];
}) {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /seller
Disallow: /dashboard
Disallow: /checkout
Disallow: /cart
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Sitemap: ${SITE_URL}/sitemap.xml
`;
  await fs.writeFile(path.join(DIST_DIR, "robots.txt"), robots, "utf8");

  const categoryRedirects = [
    `/mobiles /category/electronics/mobiles 301!`,
    `/laptops /category/electronics/laptops 301!`,
    `/computers /category/electronics/computers 301!`,
    `/pc /category/electronics/pc 301!`,
    `/category/laptops /category/electronics/laptops 301!`,
    `/category/computers /category/electronics/computers 301!`,
    `/category/pc /category/electronics/pc 301!`,
    `/electronics /category/electronics 301!`,
    `/tablets /category/electronics/tablets 301!`,
    `/accessories /category/electronics/accessories 301!`,
  ];

  const spaRewrites = [
    "/login /index.html 200",
    "/register /index.html 200",
    "/cart /index.html 200",
    "/checkout /index.html 200",
    "/order-success /index.html 200",
    "/invoice/* /index.html 200",
    "/order-tracking /index.html 200",
    "/order-tracking/* /index.html 200",
    "/wishlist /index.html 200",
    "/account /index.html 200",
    "/vendor /index.html 200",
    "/vendor/* /index.html 200",
    "/track-order /index.html 200",
    "/popular/* /index.html 200",
    "/vendors /index.html 200",
    "/deals /index.html 200",
    "/categories /index.html 200",
    "/seller/* /index.html 200",
    "/admin/* /index.html 200",
  ];

  const prerenderedRouteRewrites = new Set(
    input.prerenderedRoutePaths.map((routePath) => `${routePath} /index.html 200`)
  );

  const redirects = [
    ...CANONICAL_REDIRECTS,
    ...categoryRedirects,
    ...input.productRedirects
      .map((item) => `${item.alias} ${item.canonicalPath} 301!`)
      .sort(),
    ...spaRewrites.filter((rule) => !prerenderedRouteRewrites.has(rule)),
    "/404 /404.html 404",
    "/* /404.html 404",
  ].join("\n");

  await fs.writeFile(path.join(DIST_DIR, "_redirects"), redirects, "utf8");
  console.log(
    `[seo-prerender] Generated ${input.productRedirects.length} product redirects to canonical URLs.`
  );

  const notFoundHtml = buildHeadMeta(input.homeHtml, {
    title: "Page Not Found | ExShopi",
    description: "This page is not available on ExShopi.",
    canonicalUrl: `${SITE_URL}/404`,
    robots: "noindex, nofollow",
    ogImage: "/logo.png",
    jsonLd: buildBreadcrumbSchema([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "404", url: `${SITE_URL}/404` },
    ]),
  }).replace(
    /<body[^>]*>[\s\S]*<\/body>/i,
    `<body>
  <div id="root">
    <main style="max-width:960px;margin:0 auto;padding:80px 20px 96px;font-family:Inter,system-ui,sans-serif;">
      <h1 style="font-size:42px;line-height:1.1;color:#0f172a;margin-bottom:16px;">Page not found</h1>
      <p style="font-size:18px;line-height:1.8;color:#475569;max-width:720px;">The page you requested is unavailable. Use the internal links below to continue browsing live marketplace pages on ExShopi.</p>
      <ul style="margin-top:28px;padding-left:20px;line-height:2;color:#334155;">
        <li><a href="/">Homepage</a></li>
        <li><a href="/products">All products</a></li>
        <li><a href="/category/electronics">Electronics category</a></li>
        <li><a href="/blog">ExShopi blog</a></li>
      </ul>
    </main>
  </div>
</body>`
  );
  await fs.writeFile(path.join(DIST_DIR, "404.html"), notFoundHtml, "utf8");

  const reportPath = path.join(DIST_DIR, "prerender-report.json");
  const report = {
    generatedAt: new Date().toISOString(),
    routeCount: generatedRouteRecords.length,
    routes: generatedRouteRecords
      .slice()
      .sort((a, b) => a.routePath.localeCompare(b.routePath))
      .map((record) => ({
        routePath: record.routePath,
        outputPath: path.relative(ROOT, record.outputPath),
        kind: record.kind,
      })),
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`[seo-prerender] Wrote prerender report to ${path.relative(ROOT, reportPath)}.`);
  for (const record of report.routes) {
    console.log(
      `[seo-prerender] route ${record.routePath} -> ${record.outputPath} (${record.kind})`
    );
  }
}

async function main() {
  const template = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf8");
  const categories = (MASTER_CATEGORIES || []).map((category) => ({
    slug: category.slug,
    name: category.name,
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((subcategory) => ({
          slug: subcategory.slug,
          name: subcategory.name,
        }))
      : [],
  }));
  const { products: prerenderProducts, source: prerenderSource } = await loadPrerenderProducts();
  const liveProducts = prerenderProducts.map(productCardData);
  const now = new Date().toISOString().slice(0, 10);

  console.log(
    `[seo-prerender] Loaded ${liveProducts.length} live products from ${prerenderSource}.`
  );

  const homeSeo = generateHomepageSeo();
  const homeHtml = htmlDocument(template, {
    title: homeSeo.metaTitle,
    description: homeSeo.metaDescription,
    keywords: homeSeo.metaKeywords,
    canonicalUrl: buildAbsoluteUrl("/"),
    ogImage: "/logo.png",
    jsonLd: buildHomepageSchemas(),
    routeData: { kind: "home", path: "/" },
    snapshotHtml: `
      <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
        <section data-prerender-human-shell="true" style="padding:28px 0 12px;">
          <div style="display:grid;gap:20px;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);align-items:start;">
            <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:linear-gradient(180deg,#ffffff,#f8fbff);padding:28px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
              <div style="width:122px;height:12px;border-radius:999px;background:#dbeafe;"></div>
              <div style="margin-top:16px;width:72%;height:42px;border-radius:18px;background:#e2e8f0;"></div>
              <div style="margin-top:14px;width:95%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
              <div style="margin-top:10px;width:88%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
              <div style="margin-top:10px;width:68%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
            </div>
            <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:28px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
              <div style="width:100%;height:18px;border-radius:999px;background:#e2e8f0;"></div>
              <div style="margin-top:18px;width:100%;height:18px;border-radius:999px;background:#e2e8f0;"></div>
              <div style="margin-top:18px;width:82%;height:18px;border-radius:999px;background:#e2e8f0;"></div>
              <div style="margin-top:28px;width:100%;height:52px;border-radius:999px;background:#dbeafe;"></div>
            </div>
          </div>
        </section>
        <section data-prerender-human-hidden="true">
          <p style="font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#64748b;">UAE Trusted Marketplace</p>
          <h1 style="font-size:44px;line-height:1.1;margin:12px 0 16px;color:#0f172a;">ExShopi UAE Online Shopping Marketplace</h1>
          <p style="font-size:18px;line-height:1.8;color:#475569;max-width:760px;">Shop electronics, mobiles, refurbished laptops, and marketplace deals in the UAE with structured product pages, verified seller signals, cash on delivery support, and better internal navigation for search engines and shoppers.</p>
          <ul style="margin:24px 0 0;padding-left:20px;color:#334155;line-height:1.9;">${renderTrustSignals()}</ul>
        </section>
        <section data-prerender-human-hidden="true" style="margin-top:36px;">
          <h2 style="font-size:28px;color:#0f172a;">Popular routes</h2>
          <ul style="padding-left:20px;line-height:2;">
            <li><a href="/category/electronics">Electronics category</a></li>
            <li><a href="/category/electronics/laptops">Refurbished laptops UAE</a></li>
            <li><a href="/buy-iphone-uae">Buy iPhone UAE</a></li>
            <li><a href="/cheap-macbook-dubai">Cheap MacBook Dubai</a></li>
            <li><a href="/blog">ExShopi blog</a></li>
          </ul>
        </section>
        <section data-prerender-human-hidden="true" style="margin-top:36px;">
          <h2 style="font-size:28px;color:#0f172a;">Featured product routes</h2>
          <ul style="padding-left:20px;line-height:2;">
            ${liveProducts
              .slice(0, 6)
              .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
              .join("")}
          </ul>
        </section>
      </main>`,
  });
  await writeRouteFile("/", homeHtml, "home");

  const listingHtml = htmlDocument(template, {
    title: "All Products in UAE | Premium Marketplace | ExShopi",
    description: "Browse live marketplace products on ExShopi with secure checkout, verified seller signals, and UAE-focused shopping support.",
    keywords: "marketplace products UAE, electronics marketplace UAE, online shopping UAE, ExShopi products",
    canonicalUrl: buildAbsoluteUrl("/products"),
    ogImage: "/logo.png",
    routeData: { kind: "listing", path: "/products" },
    snapshotHtml: `
      <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
        <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">All marketplace products in UAE</h1>
        <p style="font-size:18px;line-height:1.8;color:#475569;max-width:780px;">Explore ExShopi listings across electronics, mobiles, laptops, and related categories with clean product URLs, structured titles, and internal links that help both buyers and Google discover the full marketplace.</p>
        <ul style="padding-left:20px;line-height:2;margin-top:24px;">
          ${liveProducts
            .slice(0, 12)
            .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
            .join("")}
        </ul>
        <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Explore more through <a href="/category/electronics">category pages</a>, <a href="/blog">UAE buying guides</a>, and dedicated <a href="/electronics-online-uae">landing pages</a>.</p>
      </main>`,
  });
  await writeRouteFile("/products", listingHtml, "listing");

  for (const page of STATIC_PAGE_CONTENT) {
    await writeRouteFile(
      page.path,
      htmlDocument(template, {
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        canonicalUrl: buildAbsoluteUrl(page.path),
        ogImage: "/logo.png",
        routeData: { kind: "static", path: page.path },
        snapshotHtml: renderStaticSnapshot({
          heading: page.heading,
          paragraphs: page.paragraphs,
          links: [
            { href: "/", label: "ExShopi homepage" },
            { href: "/products", label: "Marketplace products" },
            { href: "/category/electronics", label: "Electronics category" },
            ...(page.path !== "/sell-on-exshopi"
              ? [{ href: "/sell-on-exshopi", label: "Sell on ExShopi" }]
              : [{ href: "/seller/register", label: "Seller registration" }]),
          ],
        }),
      }),
      "static"
    );
  }

  for (const category of categories) {
    const categoryProducts = liveProducts.filter((product) =>
      productMatchesCategoryAssignment(product, category.slug)
    );

    const categorySeo = generateCategorySeo(category.name, category.slug);
    const categoryBody = buildCategorySeoBody({
      categoryName: category.name,
      categorySlug: category.slug,
      productCount: categoryProducts.length,
    });
    const categoryPath = getCategoryPath(category.slug);

    await writeRouteFile(
      categoryPath,
      htmlDocument(template, {
        title: categorySeo.metaTitle,
        description: buildCategorySeoDescription(category.name),
        keywords: categorySeo.metaKeywords,
        canonicalUrl: buildAbsoluteUrl(categoryPath),
        ogImage: "/logo.png",
        robots: categoryProducts.length > 0 ? "index, follow" : "noindex, follow",
        routeData: {
          kind: "category",
          path: categoryPath,
          category: { slug: category.slug, name: category.name },
          products: categoryProducts,
          categories,
        },
        snapshotHtml: renderCategorySnapshot({
          heading: `${category.name} in UAE`,
          body: categoryBody,
          products: categoryProducts,
          continueText:
            'Continue to <a href="/">homepage</a>, <a href="/blog">buyer guides</a>, or <a href="/electronics-online-uae">UAE electronics landing pages</a>.',
        }),
      }),
      categoryProducts.length > 0 ? "category" : "category-empty"
    );

    if (category.slug === "electronics") {
      await writeRouteFile(
        "/electronics",
        htmlDocument(template, {
          title: categorySeo.metaTitle,
          description: buildCategorySeoDescription(category.name),
          keywords: categorySeo.metaKeywords,
          canonicalUrl: buildAbsoluteUrl(categoryPath),
          ogImage: "/logo.png",
          robots: categoryProducts.length > 0 ? "index, follow" : "noindex, follow",
          routeData: {
            kind: "category",
            path: "/electronics",
            category: { slug: category.slug, name: category.name },
            products: categoryProducts,
            categories,
          },
          snapshotHtml: renderCategorySnapshot({
            heading: `${category.name} in UAE`,
            body: categoryBody,
            products: categoryProducts,
            continueText:
              'Continue to <a href="/">homepage</a>, <a href="/blog">buyer guides</a>, or <a href="/electronics-online-uae">UAE electronics landing pages</a>.',
          }),
        }),
        categoryProducts.length > 0 ? "category-alias" : "category-empty"
      );
    }

    for (const sub of category.subcategories || []) {
      const subProducts = liveProducts.filter((product) =>
        productMatchesCategoryAssignment(product, category.slug, sub.slug)
      );
      const routePath = getCategoryPath(category.slug, sub.slug);
      const subSeo = generateCategorySeo(sub.name, sub.slug);
      const subBody = buildCategorySeoBody({
        categoryName: sub.name,
        categorySlug: category.slug,
        subcategorySlug: sub.slug,
        productCount: subProducts.length,
      });

      await writeRouteFile(
        routePath,
        htmlDocument(template, {
          title: subSeo.metaTitle,
          description: buildCategorySeoDescription(sub.name),
          keywords: subSeo.metaKeywords,
          canonicalUrl: buildAbsoluteUrl(routePath),
          ogImage: "/logo.png",
          robots: subProducts.length > 0 ? "index, follow" : "noindex, follow",
          routeData: {
            kind: "category",
            path: routePath,
            category: { slug: category.slug, subcategorySlug: sub.slug, name: sub.name },
            products: subProducts,
            categories,
          },
          snapshotHtml: renderCategorySnapshot({
            heading: `${sub.name} in UAE`,
            body: subBody,
            products: subProducts,
            continueText: `Jump back to the <a href="${categoryPath}">${escapeHtml(category.name)} category</a>, read the <a href="/blog">blog</a>, or explore <a href="/refurbished-laptops-uae">laptop landing pages</a>.`,
          }),
        }),
        subProducts.length > 0 ? "category" : "category-empty"
      );

      if (category.slug === "electronics") {
        const aliasPath = `/electronics/${sub.slug}`;
        await writeRouteFile(
          aliasPath,
          htmlDocument(template, {
            title: subSeo.metaTitle,
            description: buildCategorySeoDescription(sub.name),
            keywords: subSeo.metaKeywords,
            canonicalUrl: buildAbsoluteUrl(routePath),
            ogImage: "/logo.png",
            robots: subProducts.length > 0 ? "index, follow" : "noindex, follow",
            routeData: {
              kind: "category",
              path: aliasPath,
              category: { slug: category.slug, subcategorySlug: sub.slug, name: sub.name },
              products: subProducts,
              categories,
            },
            snapshotHtml: renderCategorySnapshot({
              heading: `${sub.name} in UAE`,
              body: subBody,
              products: subProducts,
              continueText: `Jump back to the <a href="${categoryPath}">${escapeHtml(category.name)} category</a>, read the <a href="/blog">blog</a>, or explore <a href="/refurbished-laptops-uae">laptop landing pages</a>.`,
            }),
          }),
          subProducts.length > 0 ? "category-alias" : "category-empty"
        );
      }
    }
  }

  const brandDescriptions: Record<string, string> = {
    apple: "Premium Apple devices, laptops, tablets, and accessories selected for UAE marketplace buyers.",
    samsung: "Samsung smartphones, tablets, earbuds, and accessories with trusted marketplace offers.",
    dell: "Dell laptops, monitors, and computing essentials for work and daily use.",
    hp: "HP productivity devices, business machines, and reliable electronics for every workflow.",
    lenovo: "Lenovo laptops and professional computing picks from marketplace sellers.",
    acer: "Acer gaming and everyday computing products with competitive pricing.",
    asus: "ASUS laptops, components, and performance devices for modern shoppers.",
    gaming: "Gaming-focused devices, accessories, and performance products from top sellers.",
  };

  for (const brand of brands) {
    const brandSlug = cleanSeoSlug(brand.name);
    const brandPath = `/brands/${brandSlug}`;
    const brandProducts = liveProducts.filter((product) =>
      String(
        product.brand ||
          product.specs?.brand ||
          product.specs?.attributes?.brand ||
          ""
      )
        .toLowerCase()
        .includes(brandSlug)
    );

    await writeRouteFile(
      brandPath,
      htmlDocument(template, {
        title: `${brand.name} Products in UAE | ExShopi`,
        description:
          brandDescriptions[brandSlug] ||
          `${brand.name} products, listings, and marketplace offers in UAE on ExShopi.`,
        keywords: `${brand.name} UAE, ${brand.name} marketplace, ${brand.name} products ExShopi`,
        canonicalUrl: buildAbsoluteUrl(brandPath),
        ogImage: "/logo.png",
        routeData: { kind: "brand", path: brandPath, brand: brand.name, products: brandProducts },
        snapshotHtml: renderStaticSnapshot({
          heading: `${brand.name} on ExShopi UAE`,
          paragraphs: [
            brandDescriptions[brandSlug] ||
              `${brand.name} listings and brand-focused marketplace discovery for UAE shoppers.`,
            `Browse ${brand.name} alongside related categories, live product routes, and marketplace buying paths on ExShopi.`,
          ],
          links: brandProducts.slice(0, 8).map((product) => ({
            href: buildProductPath(product),
            label: product.title,
          })),
        }),
      }),
      "brand"
    );
  }

  const productRedirects = new Map<string, string>();

  for (const product of liveProducts) {
    const canonicalPath = buildProductPath(product);
    const meta = generateProductMeta(product);
    const relatedProducts = liveProducts
      .filter((entry) => entry.id !== product.id)
      .filter((entry) => {
        const a = cleanSeoSlug(entry.specs?.subcategorySlug || entry.specs?.categorySlug || entry.category);
        const b = cleanSeoSlug(product.specs?.subcategorySlug || product.specs?.categorySlug || product.category);
        return a === b;
      })
      .slice(0, 8);

    const productJsonLd = buildProductSchema(product, canonicalPath);
    const breadcrumbJsonLd = buildProductBreadcrumbSchema(product, canonicalPath);

    await writeRouteFile(
      canonicalPath,
      htmlDocument(template, {
        title: meta.metaTitle,
        description: stableProductDescription(product),
        keywords: meta.metaKeywords,
        canonicalUrl: buildAbsoluteUrl(canonicalPath),
        ogImage: product.image,
        jsonLd: [productJsonLd, breadcrumbJsonLd],
        routeData: {
          kind: "product",
          path: canonicalPath,
          product,
          relatedProducts,
        },
        snapshotHtml: `
          <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
            <section data-prerender-human-shell="true" style="display:grid;gap:22px;grid-template-columns:minmax(0,1fr) 340px;align-items:start;">
              <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:28px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
                <div style="width:140px;height:12px;border-radius:999px;background:#dbeafe;"></div>
                <div style="margin-top:16px;width:65%;height:40px;border-radius:18px;background:#e2e8f0;"></div>
                <div style="margin-top:14px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
                <div style="margin-top:10px;width:92%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
                <div style="margin-top:10px;width:75%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
              </div>
              <div style="border:1px solid rgba(226,232,240,.9);border-radius:30px;background:#ffffff;padding:24px;box-shadow:0 18px 42px rgba(15,23,42,.06);">
                <div style="aspect-ratio:1 / 1;border-radius:24px;background:linear-gradient(180deg,#eff6ff,#f8fafc);"></div>
                <div style="margin-top:20px;width:100%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
                <div style="margin-top:10px;width:84%;height:14px;border-radius:999px;background:#e2e8f0;"></div>
              </div>
            </section>
            <section data-prerender-human-hidden="true">
            <article>
              <p style="font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#64748b;">UAE Trusted Marketplace</p>
              <h1 style="font-size:38px;line-height:1.18;color:#0f172a;margin:12px 0;">${escapeHtml(product.title)}</h1>
              <p style="font-size:18px;line-height:1.8;color:#475569;max-width:860px;">${escapeHtml(buildProductSeoNarrative(product))}</p>
              <p style="margin-top:20px;font-size:16px;color:#334155;"><strong>Price:</strong> AED ${Number(product.price || 0).toFixed(2)} | <strong>Seller:</strong> ${escapeHtml(product.sellerName)} | <strong>Status:</strong> ${product.stock > 0 ? "In stock" : "Out of stock"}</p>
              <div style="margin-top:24px;display:grid;gap:24px;grid-template-columns:2fr 1fr;">
                <div>
                  <h2 style="font-size:28px;color:#0f172a;">Product overview</h2>
                  <p style="font-size:17px;line-height:1.85;color:#475569;">${escapeHtml(product.description || buildProductSeoNarrative(product))}</p>
                  <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Related products</h2>
                  <ul style="padding-left:20px;line-height:2;">
                    ${relatedProducts.map((item) => `<li><a href="${buildProductPath(item)}">${escapeHtml(item.title)}</a></li>`).join("")}
                  </ul>
                  <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Continue browsing through <a href="/">homepage</a>, <a href="${getCategoryPath(product.specs?.parentCategorySlug || product.specs?.categorySlug || product.category, product.specs?.subcategorySlug || product.specs?.templateId || undefined)}">matching categories</a>, <a href="/blog">the ExShopi blog</a>, or <a href="/electronics-online-uae">landing pages</a>.</p>
                </div>
                <aside>
                  <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" style="max-width:100%;height:auto;border-radius:20px;background:#fff;" />
                  <ul style="margin-top:20px;padding-left:20px;line-height:1.9;color:#334155;">${renderTrustSignals()}</ul>
                </aside>
              </div>
            </article>
            </section>
          </main>`,
      }),
      "product"
    );

    for (const redirect of productAliasRedirects(product)) {
      const [alias, canonicalPath] = redirect.split(/\s+/);
      if (!alias || !canonicalPath) continue;

      const existingCanonicalPath = productRedirects.get(alias);
      if (existingCanonicalPath && existingCanonicalPath !== canonicalPath) {
        console.warn(
          `[seo-prerender] Skipping ambiguous redirect alias ${alias} (${existingCanonicalPath} vs ${canonicalPath})`
        );
        productRedirects.delete(alias);
        continue;
      }

      productRedirects.set(alias, canonicalPath);
    }
  }

  const blogIndexHtml = htmlDocument(template, {
    title: "ExShopi Blog | UAE Buying Guides, Reviews & Shopping Tips",
    description: "Read ExShopi blog posts covering refurbished laptops UAE, used MacBook Dubai shopping tips, mobile buying guides, and premium marketplace advice.",
    keywords: "ExShopi blog, refurbished laptops UAE, used MacBook Dubai, electronics buying guide UAE",
    canonicalUrl: buildAbsoluteUrl("/blog"),
    ogImage: "/logo.png",
    routeData: { kind: "blog-index", path: "/blog" },
    snapshotHtml: `
      <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
        <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">ExShopi Blog</h1>
        <p style="font-size:18px;line-height:1.8;color:#475569;max-width:780px;">Buying guides, UAE shopping advice, and category-level content that strengthens organic discovery across products, categories, and landing pages.</p>
        <ul style="padding-left:20px;line-height:2;margin-top:24px;">
          ${BLOG_POSTS.map((post) => `<li><a href="/blog/${post.slug}">${escapeHtml(post.title)}</a></li>`).join("")}
        </ul>
        <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Use the blog alongside <a href="/">homepage</a>, <a href="/category/electronics/laptops">laptop categories</a>, and <a href="/refurbished-laptops-uae">landing pages</a> to navigate the marketplace.</p>
      </main>`,
  });
  await writeRouteFile("/blog", blogIndexHtml);

  for (const post of BLOG_POSTS) {
    await writeRouteFile(
      `/blog/${post.slug}`,
      htmlDocument(template, {
        title: `${post.title} | ExShopi Blog`,
        description: post.metaDescription,
        keywords: post.keywords.join(", "),
        canonicalUrl: buildAbsoluteUrl(`/blog/${post.slug}`),
        ogImage: "/logo.png",
        routeData: { kind: "blog-post", path: `/blog/${post.slug}` },
        snapshotHtml: `
          <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
            <article>
              <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(post.title)}</h1>
              ${post.content.map((paragraph) => `<p style="font-size:17px;line-height:1.85;color:#475569;max-width:860px;">${escapeHtml(paragraph)}</p>`).join("")}
              <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Continue browsing</h2>
              <ul style="padding-left:20px;line-height:2;">
                <li><a href="/">Homepage</a></li>
                <li><a href="/blog">Blog index</a></li>
                <li><a href="/category/electronics/laptops">Laptop category</a></li>
                <li><a href="/cheap-macbook-dubai">Cheap MacBook Dubai</a></li>
              </ul>
            </article>
          </main>`,
      })
    );
  }

  for (const landingPage of LANDING_PAGES) {
    await writeRouteFile(
      `/${landingPage.slug}`,
      htmlDocument(template, {
        title: landingPage.metaTitle,
        description: landingPage.metaDescription,
        keywords: landingPage.keywords.join(", "),
        canonicalUrl: buildAbsoluteUrl(`/${landingPage.slug}`),
        ogImage: "/logo.png",
        routeData: { kind: "landing", path: `/${landingPage.slug}` },
        snapshotHtml: `
          <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
            <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(landingPage.h1)}</h1>
            <p style="font-size:18px;line-height:1.8;color:#475569;max-width:860px;">${escapeHtml(landingPage.intro)}</p>
            ${landingPage.sections
              .map(
                (section) => `
                  <section style="margin-top:28px;">
                    <h2 style="font-size:28px;color:#0f172a;">${escapeHtml(section.heading)}</h2>
                    ${section.body.map((paragraph) => `<p style="font-size:17px;line-height:1.85;color:#475569;">${escapeHtml(paragraph)}</p>`).join("")}
                  </section>`
              )
              .join("")}
            <ul style="margin-top:24px;padding-left:20px;line-height:1.9;color:#334155;">${renderTrustSignals()}</ul>
            <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Continue to <a href="/">homepage</a>, <a href="/products">all products</a>, <a href="/blog">buyer guides</a>, and <a href="${getCategoryPath(landingPage.primaryCategorySlug, landingPage.primarySubcategorySlug)}">matching category pages</a>.</p>
          </main>`,
      })
    );
  }

  const sitemapEntries = Array.from(
    new Map(
      generatedRouteRecords
        .filter((record) => record.routePath !== "/404")
        .map((record) => [
          `${SITE_URL}${record.routePath === "/" ? "" : record.routePath}`,
          {
            loc: `${SITE_URL}${record.routePath === "/" ? "" : record.routePath}`,
            lastmod: now,
            changefreq: getSitemapChangefreq(record.kind, record.routePath),
            priority: getSitemapPriority(record.kind, record.routePath),
            kind: record.kind,
          },
        ])
    ).values()
  );

  const staticEntries = sitemapEntries.filter((entry) =>
    ["home", "static", "listing", "blog-index", "blog-post", "landing"].includes(entry.kind)
  );
  const categoryEntries = sitemapEntries.filter((entry) =>
    ["category", "category-alias"].includes(entry.kind)
  );
  const brandEntries = sitemapEntries.filter((entry) => entry.kind === "brand");
  const productEntries = sitemapEntries.filter((entry) => entry.kind === "product");
  const productChunks = [];
  for (let index = 0; index < productEntries.length; index += PRODUCTS_PER_SITEMAP) {
    productChunks.push(productEntries.slice(index, index + PRODUCTS_PER_SITEMAP));
  }

  await fs.mkdir(path.join(DIST_DIR, "sitemaps"), { recursive: true });
  await fs.writeFile(path.join(DIST_DIR, "sitemaps", "static.xml"), buildXmlUrlSet(staticEntries), "utf8");
  await fs.writeFile(path.join(DIST_DIR, "sitemaps", "categories.xml"), buildXmlUrlSet(categoryEntries), "utf8");
  await fs.writeFile(path.join(DIST_DIR, "sitemaps", "brands.xml"), buildXmlUrlSet(brandEntries), "utf8");
  await Promise.all(
    productChunks.map((chunk, index) =>
      fs.writeFile(path.join(DIST_DIR, "sitemaps", `products-${index + 1}.xml`), buildXmlUrlSet(chunk), "utf8")
    )
  );
  await fs.writeFile(
    path.join(DIST_DIR, "sitemap.xml"),
    buildXmlSitemapIndex([
      { loc: `${SITE_URL}/sitemaps/static.xml`, lastmod: now },
      { loc: `${SITE_URL}/sitemaps/categories.xml`, lastmod: now },
      { loc: `${SITE_URL}/sitemaps/brands.xml`, lastmod: now },
      ...productChunks.map((_, index) => ({
        loc: `${SITE_URL}/sitemaps/products-${index + 1}.xml`,
        lastmod: now,
      })),
    ]),
    "utf8"
  );
  await writeSupportFiles({
    homeHtml,
    productRedirects: Array.from(productRedirects.entries()).map(([alias, canonicalPath]) => ({
      alias,
      canonicalPath,
    })),
    prerenderedRoutePaths: [
      ...STATIC_PRERENDER_ROUTE_PATHS,
      ...BRAND_PRERENDER_ROUTE_PATHS,
      "/campaigns/current",
      "/promotions",
    ],
  });
}

void main().catch((error) => {
  console.error("[seo-prerender] Failed:", error);
  process.exit(1);
});
