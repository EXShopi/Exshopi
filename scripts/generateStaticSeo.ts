import fs from "node:fs/promises";
import path from "node:path";
import { BLOG_POSTS } from "../src/lib/blog";
import {
  buildCategorySeoBody,
  buildProductSeoNarrative,
  buildRichProductTitle,
  cleanSeoSlug,
  LANDING_PAGES,
  UAE_TRUST_SIGNALS,
} from "../src/lib/seoMarketplace";
import {
  buildAbsoluteUrl,
  buildCategorySeoDescription,
  buildHomepageSchemas,
  buildProductPath,
  buildProductSchema,
  generateCategorySeo,
  generateHomepageSeo,
  generateProductMeta,
  getCategoryPath,
} from "../src/lib/seo";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SITE_URL = "https://exshopi.com";

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

function productCardData(product: any) {
  return {
    id: String(product.id),
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

function htmlDocument(template: string, input: {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd?: unknown;
  snapshotHtml: string;
  routeData?: unknown;
}) {
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyScripts = bodyMatch?.[1]?.match(/<script\b[\s\S]*?<\/script>/gi) || [];

  let html = template;

  const replaceOrInsertMeta = (key: string, attr: "name" | "property", value: string) => {
    const regex = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, "i");
    const replacement = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
    html = regex.test(html) ? html.replace(regex, replacement) : html.replace("</head>", `  ${replacement}\n</head>`);
  };

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(input.title)}</title>`);
  replaceOrInsertMeta("description", "name", input.description);
  replaceOrInsertMeta("keywords", "name", input.keywords || "");
  replaceOrInsertMeta("robots", "name", "index, follow");
  replaceOrInsertMeta("og:title", "property", input.ogTitle || input.title);
  replaceOrInsertMeta("og:description", "property", input.ogDescription || input.description);
  replaceOrInsertMeta("og:url", "property", input.canonicalUrl);
  replaceOrInsertMeta("og:image", "property", normalizeUrl(input.ogImage || "/logo.png"));
  replaceOrInsertMeta("twitter:title", "name", input.ogTitle || input.title);
  replaceOrInsertMeta("twitter:description", "name", input.ogDescription || input.description);
  replaceOrInsertMeta("twitter:image", "name", normalizeUrl(input.ogImage || "/logo.png"));

  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />`);
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />\n</head>`);
  }

  if (input.jsonLd) {
    html = html.replace(
      "</head>",
      `  <script type="application/ld+json">${JSON.stringify(input.jsonLd)}</script>\n</head>`
    );
  }

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

async function main() {
  const template = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf8");
  const db = JSON.parse(await fs.readFile(path.join(ROOT, "backend", "db.json"), "utf8"));
  const categories = Array.isArray(db.categories) ? db.categories : [];
  const liveProducts = (Array.isArray(db.products) ? db.products : []).filter(isLiveProduct).map(productCardData);
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
            <li><a href="/category/electronics/laptops">Refurbished laptops UAE</a></li>
            <li><a href="/buy-iphone-uae">Buy iPhone UAE</a></li>
            <li><a href="/cheap-macbook-dubai">Cheap MacBook Dubai</a></li>
            <li><a href="/blog">ExShopi blog</a></li>
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
      </main>`,
  });
  await writeRouteFile("/products", listingHtml);

  for (const category of categories) {
    const categoryProducts = liveProducts.filter((product) => {
      const specs = product.specs || {};
      return (
        cleanSeoSlug(specs.parentCategorySlug || specs.categorySlug || product.category) === cleanSeoSlug(category.slug)
      );
    });

    const categorySeo = generateCategorySeo(category.name, category.slug);
    const categoryBody = buildCategorySeoBody({
      categoryName: category.name,
      categorySlug: category.slug,
      productCount: categoryProducts.length,
    });
    const routeData = {
      kind: "category",
      path: getCategoryPath(category.slug),
      category: { slug: category.slug, name: category.name },
      products: categoryProducts,
      categories,
    };

    await writeRouteFile(
      getCategoryPath(category.slug),
      htmlDocument(template, {
        title: categorySeo.metaTitle,
        description: buildCategorySeoDescription(category.name),
        keywords: categorySeo.metaKeywords,
        canonicalUrl: buildAbsoluteUrl(getCategoryPath(category.slug)),
        ogImage: "/logo.png",
        routeData,
        snapshotHtml: `
          <main style="max-width:1100px;margin:0 auto;padding:48px 20px 64px;font-family:Inter,system-ui,sans-serif;">
            <h1 style="font-size:40px;line-height:1.15;color:#0f172a;">${escapeHtml(category.name)} in UAE</h1>
            ${categoryBody.map((paragraph) => `<p style="font-size:17px;line-height:1.85;color:#475569;max-width:900px;">${escapeHtml(paragraph)}</p>`).join("")}
            <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Related products</h2>
            <ul style="padding-left:20px;line-height:2;">
              ${categoryProducts
                .slice(0, 10)
                .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
                .join("")}
            </ul>
          </main>`,
      })
    );

    for (const sub of category.subcategories || []) {
      const subProducts = liveProducts.filter((product) => {
        const specs = product.specs || {};
        return (
          cleanSeoSlug(specs.parentCategorySlug || specs.categorySlug || product.category) === cleanSeoSlug(category.slug) &&
          cleanSeoSlug(specs.subcategorySlug || specs.templateId || sub.slug) === cleanSeoSlug(sub.slug)
        );
      });
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
              ${subBody.map((paragraph) => `<p style="font-size:17px;line-height:1.85;color:#475569;max-width:900px;">${escapeHtml(paragraph)}</p>`).join("")}
              <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Products in this subcategory</h2>
              <ul style="padding-left:20px;line-height:2;">
                ${subProducts
                  .slice(0, 10)
                  .map((product) => `<li><a href="${buildProductPath(product)}">${escapeHtml(product.title)}</a></li>`)
                  .join("")}
              </ul>
            </main>`,
        })
      );
    }
  }

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

    await writeRouteFile(
      canonicalPath,
      htmlDocument(template, {
        title: meta.metaTitle,
        description: meta.metaDescription,
        keywords: meta.metaKeywords,
        canonicalUrl: buildAbsoluteUrl(canonicalPath),
        ogImage: product.image,
        jsonLd: buildProductSchema(product, canonicalPath),
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
              <p style="margin-top:20px;font-size:16px;color:#334155;"><strong>Price:</strong> AED ${Number(product.price || 0).toFixed(2)} | <strong>Seller:</strong> ${escapeHtml(product.sellerName)} | <strong>Status:</strong> ${Number(product.stock || 0) > 0 ? "In stock" : "Out of stock"}</p>
              <div style="margin-top:24px;display:grid;gap:24px;grid-template-columns:2fr 1fr;">
                <div>
                  <h2 style="font-size:28px;color:#0f172a;">Product overview</h2>
                  <p style="font-size:17px;line-height:1.85;color:#475569;">${escapeHtml(product.description || buildProductSeoNarrative(product))}</p>
                  <h2 style="margin-top:28px;font-size:28px;color:#0f172a;">Related products</h2>
                  <ul style="padding-left:20px;line-height:2;">
                    ${relatedProducts.map((item) => `<li><a href="${buildProductPath(item)}">${escapeHtml(item.title)}</a></li>`).join("")}
                  </ul>
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
}

void main().catch((error) => {
  console.error("[seo-prerender] Failed:", error);
  process.exit(1);
});
