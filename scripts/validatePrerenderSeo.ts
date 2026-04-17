import fs from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.join(process.cwd(), "dist");

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

async function main() {
  const files = await collectHtmlFiles(DIST_DIR);
  const issues: ValidationIssue[] = [];

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
      const expectedPath = routeSnapshot?.path || `/${relative.replace(/\/index\.html$/, "").replace(/^index\.html$/, "")}`;
      const expectedCanonical = `https://exshopi.com${expectedPath === "/" ? "" : expectedPath}`;
      const productTitle = String(routeSnapshot?.product?.title || "").trim();

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
      } else if (!pageText.includes(productTitle)) {
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
