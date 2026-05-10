import fs from "node:fs/promises";
import path from "node:path";
import { findProductRouteMatch, getProductRouteAliases } from "../src/lib/productRouteResolution";
import { buildProductPath } from "../src/lib/seo";
import { loadPrerenderProducts } from "./lib/prerenderData";

const DIST_DIR = path.join(process.cwd(), "dist");
const TARGETED_CANONICAL_PRODUCT_PATHS = [
  "/electronics/laptops/apple-macbook-pro-a1708-2017",
];
const TARGETED_STATIC_ROUTE_PATHS = [
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/return-policy",
  "/warranty",
  "/support",
  "/sell-on-exshopi",
  "/promotions",
  "/campaigns/current",
];
const TARGETED_BRAND_ROUTE_PATHS = [
  "/brands/apple",
];
const GENERIC_HOMEPAGE_SHELL_TEXT = normalizeText("ExShopi UAE Online Shopping Marketplace");
const PRERENDERED_ROUTE_PATHS = [
  ...TARGETED_STATIC_ROUTE_PATHS,
  ...TARGETED_BRAND_ROUTE_PATHS,
];
const FORBIDDEN_INDEX_REWRITES = [
  "/sell-on-exshopi /index.html 200",
  "/support /index.html 200",
  "/privacy /index.html 200",
  "/terms /index.html 200",
  "/promotions /index.html 200",
  "/campaigns/current /index.html 200",
  "/brands/* /index.html 200",
];
const REQUIRED_CANONICAL_REDIRECTS = [
  "/term /terms 301!",
  "/terms-conditions /terms 301!",
  "/privacy-policy /privacy 301!",
];
const TARGETED_LEGACY_PRODUCT_PATHS = [
  "/electronics/laptops/apple-macbook-pro-a1708-2017-laptop-with-13-3-inch-display-intel-core-i5-processor-7th-gen-8gb-ram-128gb-ssd-1-5gb-intel",
];

type ValidationIssue = {
  file: string;
  message: string;
};

type RouteValidationRecord = {
  routePath: string;
  outputPath: string;
  kind: string;
  uniqueHtml: boolean;
  containsGenericShell: boolean;
  valid: boolean;
};

type RouteSnapshot =
  | {
      kind: "product";
      path?: string;
      product?: {
        title?: string;
        slug?: string;
        id?: string;
      };
    }
  | {
      kind?: string;
      path?: string;
      [key: string]: unknown;
    }
  | null;

function collectHtmlFiles(dir: string, acc: string[] = []) {
  return fs.readdir(dir, { withFileTypes: true }).then(async (entries) => {
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectHtmlFiles(fullPath, acc);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        acc.push(fullPath);
      }
    }
    return acc;
  });
}

function countMatches(html: string, pattern: RegExp) {
  return (html.match(pattern) || []).length;
}

function hasRouteKind(html: string, kind: string) {
  return html.includes(`"kind":"${kind}"`);
}

function getTitle(html: string) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
}

function extractRouteSnapshot(html: string): RouteSnapshot {
  const match = html.match(/window\.__EXSHOPI_ROUTE_DATA__=([\s\S]*?)<\/script>/i);
  if (!match?.[1]) return null;

  const raw = match[1].replace(/;\s*$/, "").trim();
  try {
    return JSON.parse(raw) as RouteSnapshot;
  } catch {
    return null;
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonLdBlocks(html: string) {
  return Array.from(
    html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  )
    .map((match) => match[1]?.trim())
    .filter(Boolean)
    .map((raw) => {
      try {
        return JSON.parse(String(raw));
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<Record<string, any> | Array<Record<string, any>>>;
}

function flattenJsonLdNodes(nodes: Array<Record<string, any> | Array<Record<string, any>>>) {
  return nodes.flatMap((node) => (Array.isArray(node) ? node : [node])).filter(Boolean);
}

function extractSitemapLocs(xml: string) {
  return new Set(
    Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi))
      .map((match) => String(match[1] || "").trim())
      .filter(Boolean)
  );
}

function sitemapLocToDistFile(loc: string) {
  const normalized = String(loc || "").replace(/^https:\/\/exshopi\.com\/?/i, "");
  return path.join(DIST_DIR, normalized);
}

async function collectSitemapLocs(filePath: string, visited = new Set<string>()): Promise<Set<string>> {
  const normalizedPath = path.resolve(filePath);
  if (visited.has(normalizedPath)) return new Set();
  visited.add(normalizedPath);

  const xml = await fs.readFile(normalizedPath, "utf8");
  const locs = extractSitemapLocs(xml);

  if (!/<sitemapindex\b/i.test(xml)) {
    return locs;
  }

  const nestedLocs = new Set<string>();
  for (const loc of locs) {
    const nestedFile = sitemapLocToDistFile(loc);
    try {
      const nested = await collectSitemapLocs(nestedFile, visited);
      for (const nestedLoc of nested) nestedLocs.add(nestedLoc);
    } catch {
      nestedLocs.add(loc);
    }
  }
  return nestedLocs;
}

async function collectProductSitemapLocs() {
  const productLocs = new Set<string>();
  const sitemapDir = path.join(DIST_DIR, "sitemaps");
  try {
    const entries = await fs.readdir(sitemapDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !/^products(?:-\d+)?\.xml$/i.test(entry.name)) continue;
      const xml = await fs.readFile(path.join(sitemapDir, entry.name), "utf8");
      for (const loc of extractSitemapLocs(xml)) {
        productLocs.add(loc);
      }
    }
  } catch {
    // Reported later when product locs are missing.
  }
  return productLocs;
}

function relativeHtmlPathToRoute(relative: string) {
  if (relative === "index.html") return "/";
  if (relative === "404.html") return "/404";
  return `/${relative.replace(/\/index\.html$/, "").replace(/\.html$/, "")}`;
}

async function main() {
  const files = await collectHtmlFiles(DIST_DIR);
  const issues: ValidationIssue[] = [];
  const routeValidationRecords: RouteValidationRecord[] = [];
  const productSnapshots: Array<{ path: string; product: any }> = [];
  const productPathsInDist = new Set<string>();
  const htmlRoutesInDist = new Set<string>();
  let redirectsContent = "";
  const { products: sourceProducts, source: prerenderSource } = await loadPrerenderProducts();

  console.log(
    `[seo-validate] Validating prerender output against ${sourceProducts.length} live products from ${prerenderSource}.`
  );

  try {
    redirectsContent = await fs.readFile(path.join(DIST_DIR, "_redirects"), "utf8");
  } catch {
    issues.push({ file: "_redirects", message: "Missing _redirects file" });
  }

  for (const file of files) {
    const html = await fs.readFile(file, "utf8");
    const relative = path.relative(DIST_DIR, file) || "index.html";
    const routePath = relativeHtmlPathToRoute(relative);
    const routeSnapshot = extractRouteSnapshot(html);
    const pageText = stripHtml(html);
    const jsonLdNodes = flattenJsonLdNodes(extractJsonLdBlocks(html));

    if (routePath !== "/404") {
      htmlRoutesInDist.add(routePath);
    }

    if (!/404\.html$/.test(relative)) {
      if (!getTitle(html)) issues.push({ file: relative, message: "Missing <title>" });
      if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) {
        issues.push({ file: relative, message: "Missing meta description" });
      }
      if (!/<meta\s+name="robots"\s+content="index, follow"/i.test(html)) {
        issues.push({ file: relative, message: "Missing robots index, follow" });
      }
      if (!/<link\s+rel="canonical"\s+href="https:\/\/exshopi\.com/i.test(html)) {
        issues.push({ file: relative, message: "Missing canonical" });
      }
    } else {
      if (!/<meta\s+name="robots"\s+content="noindex,\s*(follow|nofollow)"/i.test(html)) {
        issues.push({ file: relative, message: "404 page must be noindex" });
      }
    }

    if (countMatches(html, /<meta\s+name="robots"/gi) > 1) {
      issues.push({ file: relative, message: "Duplicate robots tags" });
    }
    if (countMatches(html, /<link\s+rel="canonical"/gi) > 1) {
      issues.push({ file: relative, message: "Duplicate canonical tags" });
    }

    if (hasRouteKind(html, "product")) {
      if (routeSnapshot?.product && routeSnapshot?.path) {
        productSnapshots.push({
          path: String(routeSnapshot.path),
          product: routeSnapshot.product,
        });
        productPathsInDist.add(String(routeSnapshot.path));
      }

      const expectedPath = routeSnapshot?.path || `/${relative.replace(/\/index\.html$/, "").replace(/^index\.html$/, "")}`;
      const expectedCanonical = `https://exshopi.com${expectedPath === "/" ? "" : expectedPath}`;
      const productTitle = normalizeText(String((routeSnapshot as any)?.product?.title || ""));

      if (/Product Not Found/i.test(html)) {
        issues.push({ file: relative, message: 'Product page contains "Product Not Found"' });
      }
      if (/Product unavailable/i.test(html) || /We couldn&apos;t load this product right now/i.test(html)) {
        issues.push({ file: relative, message: 'Product page contains the unavailable fallback copy' });
      }
      if (/<meta\s+name="robots"\s+content="noindex/i.test(html)) {
        issues.push({ file: relative, message: "Product page contains noindex" });
      }
      if (!new RegExp(`<link\\s+rel="canonical"\\s+href="${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "i").test(html)) {
        issues.push({ file: relative, message: "Product canonical does not match prerendered route path" });
      }
      if (!/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
        issues.push({ file: relative, message: "Missing visible product heading" });
      }
      if (!productTitle) {
        issues.push({ file: relative, message: "Missing product title in route snapshot" });
      } else if (!normalizeText(pageText).includes(productTitle)) {
        issues.push({ file: relative, message: "Prerendered HTML does not contain the product title text" });
      }
      if (!/"@type":"Product"/.test(html)) {
        issues.push({ file: relative, message: "Missing Product JSON-LD" });
      }
      if (!/"@type":"BreadcrumbList"/.test(html)) {
        issues.push({ file: relative, message: "Missing BreadcrumbList JSON-LD" });
      }
      const productJsonLd = jsonLdNodes.find((node) => node?.["@type"] === "Product");
      const offerJsonLd = productJsonLd?.offers;
      if (!productJsonLd) {
        issues.push({ file: relative, message: "Product JSON-LD block could not be parsed" });
      } else {
        if (!Array.isArray(productJsonLd.image) || productJsonLd.image.length === 0) {
          issues.push({ file: relative, message: "Product JSON-LD is missing image array data" });
        }
        if (!offerJsonLd?.shippingDetails) {
          issues.push({
            file: relative,
            message: "Product Offer JSON-LD is missing shippingDetails",
          });
        }
        if (!offerJsonLd?.hasMerchantReturnPolicy) {
          issues.push({
            file: relative,
            message: "Product Offer JSON-LD is missing hasMerchantReturnPolicy",
          });
        }
      }
      if (!/UAE Trusted Marketplace/.test(html)) {
        issues.push({ file: relative, message: "Missing crawlable product body content" });
      }
    }

    if (hasRouteKind(html, "category") || hasRouteKind(html, "landing")) {
      const textLength = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim().length;

      if (textLength < 500) {
        issues.push({ file: relative, message: "Static crawlable body content too thin" });
      }
    }
  }

  for (const product of sourceProducts) {
    const canonicalPath = buildProductPath(product);
    if (!productPathsInDist.has(canonicalPath)) {
      issues.push({
        file: canonicalPath,
        message: "Live product is missing a prerendered canonical HTML route",
      });
    }
  }

  for (const targetPath of TARGETED_CANONICAL_PRODUCT_PATHS) {
    if (!productPathsInDist.has(targetPath)) {
      issues.push({
        file: targetPath,
        message: "Targeted canonical product URL is missing prerendered HTML",
      });
    }
  }

  for (const targetPath of TARGETED_STATIC_ROUTE_PATHS) {
    const filePath =
      targetPath === "/"
        ? "index.html"
        : `${targetPath.replace(/^\//, "")}/index.html`;
    const absolutePath = path.join(DIST_DIR, filePath);

    try {
      const html = await fs.readFile(absolutePath, "utf8");
      const snapshot = extractRouteSnapshot(html);
      const pageText = normalizeText(stripHtml(html));

      if (!getTitle(html)) {
        issues.push({ file: filePath, message: "Missing static page title" });
      }
      if (
        pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT) &&
        !targetPath.startsWith("/campaigns")
      ) {
        issues.push({
          file: filePath,
          message: "Static route is still rendering the generic homepage shell content",
        });
      }
      if (!snapshot || !["static", "landing"].includes(String((snapshot as any).kind || ""))) {
        issues.push({
          file: filePath,
          message: "Static route is missing route snapshot metadata",
        });
      }
      routeValidationRecords.push({
        routePath: targetPath,
        outputPath: filePath,
        kind: String((snapshot as any)?.kind || "unknown"),
        uniqueHtml: !pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
        containsGenericShell: pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
        valid:
          Boolean(getTitle(html)) &&
          Boolean(snapshot) &&
          ["static", "landing"].includes(String((snapshot as any)?.kind || "")) &&
          !pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
      });
    } catch {
      issues.push({
        file: filePath,
        message: "Expected static prerendered route is missing",
      });
    }
  }

  for (const targetPath of TARGETED_BRAND_ROUTE_PATHS) {
    const filePath = `${targetPath.replace(/^\//, "")}/index.html`;
    const absolutePath = path.join(DIST_DIR, filePath);

    try {
      const html = await fs.readFile(absolutePath, "utf8");
      const snapshot = extractRouteSnapshot(html);
      const pageText = normalizeText(stripHtml(html));

      if (pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT)) {
        issues.push({
          file: filePath,
          message: "Brand route is still rendering the generic homepage shell content",
        });
      }
      if (!snapshot || String((snapshot as any).kind || "") !== "brand") {
        issues.push({
          file: filePath,
          message: "Brand route is missing brand route snapshot metadata",
        });
      }
      if (!pageText.includes("Apple on ExShopi UAE")) {
        issues.push({
          file: filePath,
          message: "Brand route is missing its unique Apple heading",
        });
      }

      routeValidationRecords.push({
        routePath: targetPath,
        outputPath: filePath,
        kind: String((snapshot as any)?.kind || "unknown"),
        uniqueHtml: !pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
        containsGenericShell: pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
        valid:
          String((snapshot as any)?.kind || "") === "brand" &&
          pageText.includes("Apple on ExShopi UAE") &&
          !pageText.includes(GENERIC_HOMEPAGE_SHELL_TEXT),
      });
    } catch {
      issues.push({
        file: filePath,
        message: "Expected brand prerendered route is missing",
      });
    }
  }

  if (redirectsContent) {
    const safeRedirectExpectations = new Map<string, string>();
    const ambiguousAliases = new Set<string>();

    for (const snapshot of productSnapshots) {
      const aliases = getProductRouteAliases(snapshot.product).filter(
        (alias) => alias && alias !== snapshot.path
      );

      for (const alias of aliases) {
        const currentExpectedPath = safeRedirectExpectations.get(alias);
        if (currentExpectedPath && currentExpectedPath !== snapshot.path) {
          ambiguousAliases.add(alias);
          safeRedirectExpectations.delete(alias);
          continue;
        }

        if (!ambiguousAliases.has(alias)) {
          safeRedirectExpectations.set(alias, snapshot.path);
        }
      }
    }

    for (const [alias, targetPath] of safeRedirectExpectations.entries()) {
      const expectedRedirect = `${alias} ${targetPath} 301!`;
      if (!redirectsContent.includes(expectedRedirect)) {
        issues.push({
          file: "_redirects",
          message: `Missing product redirect: ${expectedRedirect}`,
        });
      }
    }

    for (const legacyPath of TARGETED_LEGACY_PRODUCT_PATHS) {
      const segments = legacyPath.split("/").filter(Boolean);
      const match = findProductRouteMatch(
        sourceProducts,
        segments.at(-1),
        segments.at(-3),
        segments.at(-2)
      );

      if (match?.canonicalPath) {
        if (match.canonicalPath === legacyPath) {
          continue;
        }
        const expectedRedirect = `${legacyPath} ${match.canonicalPath} 301!`;
        if (!redirectsContent.includes(expectedRedirect)) {
          issues.push({
            file: "_redirects",
            message: `Targeted legacy product URL is not redirected: ${expectedRedirect}`,
          });
        }
      } else {
        console.warn(
          `[seo-validate] Targeted legacy product path did not map to a live product in the current catalog: ${legacyPath}`
        );
      }
    }

    for (const forbiddenRule of FORBIDDEN_INDEX_REWRITES) {
      if (redirectsContent.includes(forbiddenRule)) {
        issues.push({
          file: "_redirects",
          message: `Prerendered route is incorrectly rewritten to the SPA shell: ${forbiddenRule}`,
        });
      }
    }

    for (const requiredRule of REQUIRED_CANONICAL_REDIRECTS) {
      if (!redirectsContent.includes(requiredRule)) {
        issues.push({
          file: "_redirects",
          message: `Missing canonical redirect: ${requiredRule}`,
        });
      }
    }

    for (const routePath of PRERENDERED_ROUTE_PATHS) {
      const forbiddenRewrite = `${routePath} /index.html 200`;
      if (redirectsContent.includes(forbiddenRewrite)) {
        issues.push({
          file: "_redirects",
          message: `Route-specific HTML is being masked by an SPA rewrite: ${forbiddenRewrite}`,
        });
      }
    }
  }

  try {
    const robotsTxt = await fs.readFile(path.join(DIST_DIR, "robots.txt"), "utf8");
    if (!/User-agent:\s*\*/i.test(robotsTxt)) {
      issues.push({ file: "robots.txt", message: "Missing robots User-agent rule" });
    }
    if (!/Allow:\s*\/\s*/i.test(robotsTxt)) {
      issues.push({ file: "robots.txt", message: "Missing robots Allow rule" });
    }
    if (!/Sitemap:\s*https:\/\/exshopi\.com\/sitemap\.xml/i.test(robotsTxt)) {
      issues.push({ file: "robots.txt", message: "Missing canonical sitemap reference" });
    }
  } catch {
    issues.push({ file: "robots.txt", message: "Missing robots.txt file" });
  }

  try {
    const sitemapXml = await fs.readFile(path.join(DIST_DIR, "sitemap.xml"), "utf8");
    const sitemapLocs = await collectSitemapLocs(path.join(DIST_DIR, "sitemap.xml"));
    const productSitemapLocs = await collectProductSitemapLocs();

    if (!/(<urlset\b|<sitemapindex\b)/i.test(sitemapXml)) {
      issues.push({ file: "sitemap.xml", message: "Root sitemap is not a valid sitemap XML document" });
    }
    if (/<urlset\b/i.test(sitemapXml) && !/<lastmod>[^<]+<\/lastmod>/i.test(sitemapXml)) {
      issues.push({ file: "sitemap.xml", message: "Sitemap entries are missing <lastmod>" });
    }
    if (/<urlset\b/i.test(sitemapXml) && !/<changefreq>[^<]+<\/changefreq>/i.test(sitemapXml)) {
      issues.push({ file: "sitemap.xml", message: "Sitemap entries are missing <changefreq>" });
    }
    if (/<urlset\b/i.test(sitemapXml) && !/<priority>[^<]+<\/priority>/i.test(sitemapXml)) {
      issues.push({ file: "sitemap.xml", message: "Sitemap entries are missing <priority>" });
    }
    if (!/https:\/\/exshopi\.com\/sitemaps\/products-\d+\.xml/i.test(sitemapXml)) {
      issues.push({ file: "sitemap.xml", message: "Root sitemap does not reference a product sitemap" });
    }

    for (const routePath of htmlRoutesInDist) {
      const expectedUrl = `https://exshopi.com${routePath === "/" ? "" : routePath}`;
      if (!sitemapLocs.has(expectedUrl)) {
        issues.push({
          file: "sitemap.xml",
          message: `Missing prerendered route in sitemap: ${expectedUrl}`,
        });
      }
    }

    for (const productPath of productPathsInDist) {
      const expectedUrl = `https://exshopi.com${productPath}`;
      if (!productSitemapLocs.has(expectedUrl)) {
        issues.push({
          file: "sitemaps/products-1.xml",
          message: `Missing product URL in product sitemap: ${expectedUrl}`,
        });
      }
    }
  } catch {
    issues.push({ file: "sitemap.xml", message: "Missing sitemap.xml file" });
  }

  if (issues.length) {
    for (const issue of issues) {
      console.error(`[seo-validate] ${issue.file}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("[seo-validate] Route verification report:");
  for (const record of routeValidationRecords.sort((a, b) => a.routePath.localeCompare(b.routePath))) {
    console.log(
      `[seo-validate] ${record.routePath} -> ${record.outputPath} kind=${record.kind} uniqueHtml=${record.uniqueHtml} genericShell=${record.containsGenericShell} valid=${record.valid}`
    );
  }
  console.log(`[seo-validate] Checked ${files.length} HTML files with no blocking issues.`);
}

void main().catch((error) => {
  console.error("[seo-validate] Failed:", error);
  process.exit(1);
});
