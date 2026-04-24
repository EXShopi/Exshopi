import fs from "node:fs";
import path from "node:path";

type Product = Record<string, any>;
type DbShape = {
  products?: Product[];
};

const dbPath = path.resolve("backend/db.json");
const raw = fs.readFileSync(dbPath, "utf8");
const db = JSON.parse(raw) as DbShape;
const products = db.products || [];

const duplicateTargetId = "prod_1774699869707";
const duplicateReplacementId = "prod_1774699869707_dupfix";
const brokenProductId = "prod_1774978116986";

const slugify = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bcopy\b/g, "")
    .replace(/-copy(?:-\d+)?$/g, "")
    .replace(/copy-\d+$/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "product";

const isLive = (product: Product) =>
  product.status === "live" ||
  product.productStatus === "live" ||
  product.visibilityStatus === "live" ||
  product.published === true;

const existingIds = new Set(products.map((product) => String(product.id || "")));
if (existingIds.has(duplicateReplacementId)) {
  throw new Error(`Replacement id already exists: ${duplicateReplacementId}`);
}

const liveDuplicates = products.filter((product) => product.id === duplicateTargetId && isLive(product));
if (liveDuplicates.length !== 2) {
  throw new Error(`Expected exactly 2 live duplicate records for ${duplicateTargetId}, found ${liveDuplicates.length}`);
}

// Reassign the seller-created duplicate, keep the richer official record unchanged.
const duplicateToRepair = liveDuplicates.find((product) => product.createdByRole === "seller");
if (!duplicateToRepair) {
  throw new Error("Could not find seller-owned duplicate record to repair.");
}
duplicateToRepair.id = duplicateReplacementId;

// Build a slug reservation map before filling the empty slugs.
const slugCounts = new Map<string, number>();
for (const product of products) {
  const slug = String(product.slug || "").trim();
  if (!slug) continue;
  slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
}

const fixedSlugs: Array<{ id: string; slug: string }> = [];
for (const product of products) {
  if (!isLive(product)) continue;
  if (product.id === brokenProductId) continue;
  const currentSlug = String(product.slug || "").trim();
  if (currentSlug) continue;

  const base = slugify(String(product.title || product.specs?.model || product.id || "product"));
  let candidate = base;
  let suffix = 2;
  while ((slugCounts.get(candidate) || 0) > 0) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  product.slug = candidate;
  slugCounts.set(candidate, 1);
  fixedSlugs.push({ id: String(product.id), slug: candidate });
}

const brokenProduct = products.find((product) => product.id === brokenProductId);
if (!brokenProduct) {
  throw new Error(`Could not find broken live product ${brokenProductId}`);
}
brokenProduct.status = "draft";
brokenProduct.productStatus = "draft";
brokenProduct.visibilityStatus = "draft";
brokenProduct.approvalStatus = "pending";
brokenProduct.updatedAt = new Date().toISOString();

const backupPath = path.resolve(
  `backend/db.json.pre-live-blocker-fix-${Date.now()}.bak`
);
fs.writeFileSync(backupPath, raw);
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      backupPath,
      duplicateFix: {
        oldId: duplicateTargetId,
        newId: duplicateReplacementId,
        title: duplicateToRepair.title,
      },
      slugsFixed: fixedSlugs.length,
      brokenProductDrafted: brokenProductId,
    },
    null,
    2
  )
);
