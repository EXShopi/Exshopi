import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";

type LegacyProduct = {
  id: string;
  sellerId?: string;
  storeId?: string;
  categoryId?: string;
  title?: string;
  description?: string;
  price?: number | string;
  originalPrice?: number | string;
  salePrice?: number | string;
  image?: string;
  images?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
  sku?: string;
  brand?: string;
  specs?: Record<string, any>;
  status?: string;
  approvalStatus?: string;
  visibilityStatus?: string;
  ownership?: string;
  createdByRole?: string;
  badges?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type LegacyDb = {
  products?: LegacyProduct[];
};

const prisma = new PrismaClient();
const dbPath = path.resolve(process.cwd(), "backend", "db.json");

function decimal(input: unknown, fallback = 0) {
  if (typeof input === "number") return new Prisma.Decimal(input);
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    if (Number.isFinite(parsed)) return new Prisma.Decimal(parsed);
  }
  return new Prisma.Decimal(fallback);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function uniqueSlug(base: string) {
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

async function getOfficialStore() {
  const store = await prisma.store.findFirst({
    where: { isOfficial: true },
    select: { id: true, sellerUserId: true, storeName: true },
  });

  if (!store) {
    throw new Error("Official ExShopi store not found in Prisma database.");
  }

  return store;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, parentId: true },
  });
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  return { categories, bySlug };
}

function extractCategorySlugs(product: LegacyProduct) {
  const specs = product.specs || {};
  return {
    parent: specs.parentCategorySlug || null,
    category: specs.categorySlug || null,
    subcategory: specs.subcategorySlug || null,
    templateId: specs.templateId || null,
  };
}

function inferCategorySlug(product: LegacyProduct) {
  const { parent, category, subcategory, templateId } = extractCategorySlugs(product);

  return (
    subcategory ||
    category ||
    parent ||
    (templateId === "laptops" ? "laptops" : null) ||
    (templateId === "mobiles" ? "mobiles" : null) ||
    (templateId === "tablets" ? "tablets" : null) ||
    (templateId === "accessories" ? "accessories" : null) ||
    (templateId === "clothing" ? "men-clothing" : null) ||
    (templateId === "shoes" ? "footwear" : null) ||
    null
  );
}

function normalizeImages(product: LegacyProduct) {
  const raw = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
    .filter((value): value is string => Boolean(value && typeof value === "string"));
  return Array.from(new Set(raw));
}

async function importLegacyProducts() {
  const dbRaw = fs.readFileSync(dbPath, "utf8");
  const db = JSON.parse(dbRaw) as LegacyDb;
  const legacyProducts = db.products || [];

  const officialStore = await getOfficialStore();
  const { bySlug } = await getCategories();

  let created = 0;
  let skipped = 0;

  for (const product of legacyProducts) {
    const title = String(product.title || "").trim();
    if (!title) {
      skipped += 1;
      continue;
    }

    const existingByTitle = await prisma.product.findFirst({
      where: { title },
      select: { id: true, title: true },
    });
    if (existingByTitle) {
      skipped += 1;
      continue;
    }

    const existingBySku =
      product.sku
        ? await prisma.product.findFirst({
            where: { sku: product.sku },
            select: { id: true },
          })
        : null;

    if (existingBySku) {
      skipped += 1;
      continue;
    }

    const categorySlug = inferCategorySlug(product);
    const mappedCategory = categorySlug ? bySlug.get(categorySlug) : null;

    if (!mappedCategory) {
      skipped += 1;
      console.warn(`Skipping "${title}" because no real Prisma category mapping was found.`);
      continue;
    }

    const specs = { ...(product.specs || {}) };
    specs.backendCategoryId = mappedCategory.id;

    const parentCategory =
      specs.parentCategorySlug && bySlug.get(specs.parentCategorySlug)
        ? bySlug.get(specs.parentCategorySlug)
        : mappedCategory.parentId
          ? Array.from(bySlug.values()).find((category) => category.id === mappedCategory.parentId)
          : null;

    const images = normalizeImages(product);
    const baseSlug = slugify(title) || `legacy-product-${Date.now()}`;
    const slug = await uniqueSlug(baseSlug);

    await prisma.product.create({
      data: {
        storeId: officialStore.id,
        sellerUserId: officialStore.sellerUserId,
        categoryId: mappedCategory.id,
        title,
        slug,
        shortDescription: specs.shortDescription || String(product.description || "").slice(0, 220) || null,
        description: product.description || null,
        sku: product.sku || null,
        brand: product.brand || specs.attributes?.brand || null,
        price: decimal(product.price),
        originalPrice: product.originalPrice != null ? decimal(product.originalPrice) : null,
        salePrice: product.salePrice != null ? decimal(product.salePrice) : null,
        stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
        rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0,
        reviewsCount: Number.isFinite(Number(product.reviews)) ? Number(product.reviews) : 0,
        specsJson: specs as Prisma.InputJsonValue,
        parentCategorySlug: specs.parentCategorySlug || parentCategory?.slug || null,
        categorySlug: specs.categorySlug || mappedCategory.slug || null,
        subcategorySlug: specs.subcategorySlug || null,
        categoryPathJson: Array.isArray(specs.categoryPath) ? specs.categoryPath : null,
        badgesJson: (Array.isArray(product.badges) ? product.badges : []) as Prisma.InputJsonValue,
        ownership: product.ownership || "official",
        createdByRole: product.createdByRole || "admin",
        approvalRequestedAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        approvalStatus: "approved",
        status: "live",
        visibilityStatus: "live",
        approvedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        createdAt: product.createdAt ? new Date(product.createdAt) : undefined,
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : undefined,
        images: images.length
          ? {
              create: images.map((imageUrl, index) => ({
                imageUrl,
                isPrimary: index === 0,
                sortOrder: index,
              })),
            }
          : undefined,
      },
    });

    created += 1;
  }

  console.log(JSON.stringify({ created, skipped, total: legacyProducts.length }, null, 2));
}

importLegacyProducts()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
