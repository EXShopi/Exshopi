import fs from "node:fs/promises";
import path from "node:path";
import { BLOG_POSTS } from "../src/lib/blog";
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

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SITE_URL = "https://exshopi.com";

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

function isLiveProduct(product: any) {
  const specs = product?.specs || {};
  const deletionMeta = specs?.__deletion || {};
  if (product?.isDeleted || product?.deletedAt || deletionMeta?.isDeleted || deletionMeta?.deletedAt) {
    return false;
  }

  const status = String(product?.status || product?.productStatus || "").toLowerCase();
  const approval = String(product?.approvalStatus || "").toLowerCase();
  const visibility = String(product?.visibilityStatus || "").toLowerCase();

  if (["draft", "pending", "pending_approval", "rejected", "archived"].includes(status)) return false;
  if (approval === "rejected") return false;
  if (visibility && !["live", "public", "visible"].includes(visibility)) return false;
  return status === "live" || approval === "approved";
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
    /<body[^>]*>[\s\S]*<\/body>/i,
    `<body>
  <div id="root">${input.snapshotHtml}</div>
  <script>window.__EXSHOPI_ROUTE_DATA__=${JSON.stringify(input.routeData || null)};</script>
  ${bodyScripts.join("\n  ")}
</body>`
  );

  return html;
}

async function writeRouteFile(routePath: string, html: string) {
  const cleanRoute = routePath.replace(/^\//, "").replace(/\/$/, "");
  const outputPath = cleanRoute ? path.join(DIST_DIR, cleanRoute, "index.html") : path.join(DIST_DIR, "index.html");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, "utf8");
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

function productAliasRedirects(product: PrerenderedProduct) {
  const canonicalPath = buildProductPath(product);
  const aliases = new Set<string>(getProductRouteAliases(product));

  aliases.delete(canonicalPath);

  return Array.from(aliases)
    .filter(Boolean)
    .filter((alias) => alias !== canonicalPath)
    .map((alias) => `${alias} ${canonicalPath} 301!`);
}

async function writeSupportFiles(input: {
  homeHtml: string;
  productRedirects: Array<{ alias: string; canonicalPath: string }>;
}) {
  const robots = `User-agent: *
Allow: /
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
    "/support /index.html 200",
    "/about /index.html 200",
    "/contact /index.html 200",
    "/faq /index.html 200",
    "/privacy /index.html 200",
    "/terms /index.html 200",
    "/privacy-policy /index.html 200",
    "/terms-conditions /index.html 200",
    "/return-policy /index.html 200",
    "/warranty /index.html 200",
    "/track-order /index.html 200",
    "/brands/* /index.html 200",
    "/popular/* /index.html 200",
    "/campaigns/current /index.html 200",
    "/promotions /index.html 200",
    "/vendors /index.html 200",
    "/deals /index.html 200",
    "/categories /index.html 200",
    "/seller/* /index.html 200",
    "/admin/* /index.html 200",
  ];

  const redirects = [
    ...categoryRedirects,
    ...input.productRedirects
      .map((item) => `${item.alias} ${item.canonicalPath} 301!`)
      .sort(),
    ...spaRewrites,
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
}

async function main() {
  const template = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf8");
  const db = JSON.parse(await fs.readFile(path.join(ROOT, "backend", "db.json"), "utf8"));
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
  const liveProducts = (Array.isArray(db.products) ? db.products : [])
    .filter(isLiveProduct)
    .map(productCardData);
  const now = new Date().toISOString().slice(0, 10);

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
        <section>
          <p style="font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#64748b;">UAE Trusted Marketplace</p>
          <h1 style="font-size:44px;line-height:1.1;margin:12px 0 16px;color:#0f172a;">ExShopi UAE Online Shopping Marketplace</h1>
          <p style="font-size:18px;line-height:1.8;color:#475569;max-width:760px;">Shop electronics, mobiles, refurbished laptops, and marketplace deals in the UAE with structured product pages, verified seller signals, cash on delivery support, and better internal navigation for search engines and shoppers.</p>
          <ul style="margin:24px 0 0;padding-left:20px;color:#334155;line-height:1.9;">${renderTrustSignals()}</ul>
        </section>
        <section style="margin-top:36px;">
          <h2 style="font-size:28px;color:#0f172a;">Popular routes</h2>
          <ul style="padding-left:20px;line-height:2;">
            <li><a href="/category/electronics">Electronics category</a></li>
            <li><a href="/category/electronics/laptops">Refurbished laptops UAE</a></li>
            <li><a href="/buy-iphone-uae">Buy iPhone UAE</a></li>
            <li><a href="/cheap-macbook-dubai">Cheap MacBook Dubai</a></li>
            <li><a href="/blog">ExShopi blog</a></li>
          </ul>
        </section>
        <section style="margin-top:36px;">
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
  await writeRouteFile("/", homeHtml);

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
  await writeRouteFile("/products", listingHtml);

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
        routeData: {
          kind: "category",
          path: categoryPath,
          category: { slug: category.slug, name: category.name },
          products: categoryProducts,
          categories,
        },
        snapshotHtml: `
          <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
            <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(category.name)} in UAE</h1>
            ${textParagraphs(categoryBody)}
            <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Related products</h2>
            <ul style="padding-left:20px;line-height:2;">
              ${categoryProducts
                .slice(0, 10)
                .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
                .join("")}
            </ul>
            <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Continue to <a href="/">homepage</a>, <a href="/blog">buyer guides</a>, or <a href="/electronics-online-uae">UAE electronics landing pages</a>.</p>
          </main>`,
      })
    );

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
          routeData: {
            kind: "category",
            path: routePath,
            category: { slug: category.slug, subcategorySlug: sub.slug, name: sub.name },
            products: subProducts,
            categories,
          },
          snapshotHtml: `
            <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
              <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(sub.name)} in UAE</h1>
              ${textParagraphs(subBody)}
              <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Products in this subcategory</h2>
              <ul style="padding-left:20px;line-height:2;">
                ${subProducts
                  .slice(0, 10)
                  .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
                  .join("")}
              </ul>
              <p style="margin-top:24px;font-size:16px;line-height:1.8;color:#475569;">Jump back to the <a href="${categoryPath}">${escapeHtml(category.name)} category</a>, read the <a href="/blog">blog</a>, or explore <a href="/refurbished-laptops-uae">laptop landing pages</a>.</p>
            </main>`,
        })
      );
    }
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
          </main>`,
      })
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

  const sitemapUrls = new Set<string>([
    `${SITE_URL}/`,
    `${SITE_URL}/products`,
    `${SITE_URL}/blog`,
    ...LANDING_PAGES.map((page) => `${SITE_URL}/${page.slug}`),
    ...BLOG_POSTS.map((post) => `${SITE_URL}/blog/${post.slug}`),
  ]);

  for (const category of categories) {
    sitemapUrls.add(`${SITE_URL}${getCategoryPath(category.slug)}`);
    for (const sub of category.subcategories || []) {
      sitemapUrls.add(`${SITE_URL}${getCategoryPath(category.slug, sub.slug)}`);
    }
  }

  for (const product of liveProducts) {
    sitemapUrls.add(`${SITE_URL}${buildProductPath(product)}`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(sitemapUrls)
  .sort()
  .map((url) => `  <url><loc>${url}</loc><lastmod>${now}</lastmod></url>`)
  .join("\n")}
</urlset>`;

  await fs.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
  await writeSupportFiles({
    homeHtml,
    productRedirects: Array.from(productRedirects.entries()).map(([alias, canonicalPath]) => ({
      alias,
      canonicalPath,
    })),
  });
}

void main().catch((error) => {
  console.error("[seo-prerender] Failed:", error);
  process.exit(1);
});
