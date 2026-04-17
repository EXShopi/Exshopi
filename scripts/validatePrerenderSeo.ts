import fs from "node:fs/promises";
import path from "node:path";
import { findProductRouteMatch, getProductRouteAliases } from "../src/lib/productRouteResolution";
import { buildProductPath } from "../src/lib/seo";
import { loadPrerenderProducts } from "./lib/prerenderData";

const DIST_DIR = path.join(process.cwd(), "dist");
const TARGETED_CANONICAL_PRODUCT_PATHS = [
  "/electronics/laptops/apple-macbook-pro-a1708-2017",
];
const TARGETED_LEGACY_PRODUCT_PATHS = [
  "/electronics/laptops/apple-macbook-pro-a1708-2017-laptop-with-13-3-inch-display-intel-core-i5-processor-7th-gen-8gb-ram-128gb-ssd-1-5gb-intel",
];

type ValidationIssue = {
  file: string;
  message: string;
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

async function main() {
  const files = await collectHtmlFiles(DIST_DIR);
  const issues: ValidationIssue[] = [];
  const productSnapshots: Array<{ path: string; product: any }> = [];
  const productPathsInDist = new Set<string>();
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
    const routeSnapshot = extractRouteSnapshot(html);
    const pageText = stripHtml(html);

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
      const productTitle = normalizeText(String(routeSnapshot?.product?.title || ""));

      if (/Product Not Found/i.test(html)) {
        issues.push({ file: relative, message: 'Product page contains "Product Not Found"' });
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
  }

  if (issues.length) {
    for (const issue of issues) {
      console.error(`[seo-validate] ${issue.file}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`[seo-validate] Checked ${files.length} HTML files with no blocking issues.`);
}

void main().catch((error) => {
  console.error("[seo-validate] Failed:", error);
  process.exit(1);
});
