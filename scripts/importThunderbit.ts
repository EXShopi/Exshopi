import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";

type ThunderbitRecord = {
  "Product Name"?: string;
  "Product URL"?: string;
  "Product Image"?: string;
  "Product Category"?: string;
  "Product Description"?: string;
  "Key Features"?: string;
  "Price (AED)"?: string;
  "Rating (Max 5)"?: string;
  "Number of Ratings"?: string;
  Brand?: string;
  Material?: string;
  Color?: string;
  Model?: string;
  "Compatible Systems"?: string;
  "Interface Type"?: string;
  "Cable Length (m)"?: string;
  "Weight (g)"?: string;
  "Dimension (mm)"?: string;
  "Sensitivity (dB)"?: string;
  "Speaker Size (mm)"?: string;
  "Frequency Response (Hz)"?: string;
  "Microphone Type"?: string;
  "Mic Unit Diameter (mm)"?: string;
  "Mic Sensitivity (dB)"?: string;
  "Product Dimensions"?: string;
  "Special Features"?: string;
  "About This Item"?: string;
  "Date First Available"?: string;
  ASIN?: string;
};

const prisma = new PrismaClient();

const OFFICIAL_STORE_ID = "cmnd5poe70006c9lr8afb0xpv";
const OFFICIAL_USER_ID = "cmnd5pnjm0004c9lr7es1anet";

const CATEGORY_SLUGS = {
  accessories: "cmnd5psjh000fc9lrxk217w23",
  beauty: "cmnd5pu91000ic9lrmz9ixy50",
  dailyUse: "cmnd5pw9f000kc9lrvx6zq7ld",
  electronics: "cmnd5pp800007c9lrhh02cmrd",
  footwear: "cmnh8k7at0004c9kwrah4om7i",
  gifts: "cmnd5pv24000jc9lreb5kljr4",
  laptops: "cmnd5pq2v0009c9lr57i3qcsv",
  menClothing: "cmnh8k5oa0002c9kwoz7c8f5b",
  mobiles: "cmnd5pqvr000bc9lr5e72qdxh",
  tablets: "cmnd5prnj000dc9lrmitv6ipy",
  refurbished: "cmnd5ptho000hc9lr4rcaq0pf",
} as const;

function parseJsonFile(filePath: string): ThunderbitRecord[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Thunderbit JSON must contain an array of products.");
  }
  return parsed;
}

function parseCsvFile(filePath: string): ThunderbitRecord[] {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      current = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) => {
    const record: ThunderbitRecord = {};
    headers.forEach((header, headerIndex) => {
      record[header as keyof ThunderbitRecord] = (cells[headerIndex] || "").trim();
    });
    return record;
  });
}

function parseInputFile(filePath: string): ThunderbitRecord[] {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".json") return parseJsonFile(filePath);
  if (extension === ".csv") return parseCsvFile(filePath);
  throw new Error(`Unsupported Thunderbit file type: ${extension}. Use .json or .csv`);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function truncate(input: string, max: number) {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trim()}…`;
}

function splitBullets(input?: string) {
  if (!input) return [] as string[];
  return input
    .split(/\\n|\n|•|▪|–|- /g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitImageUrls(input?: string) {
  if (!input) return [] as string[];
  return input
    .split(/\r?\n|,/g)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part));
}

function sentenceCase(input: string) {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function improveTitle(item: ThunderbitRecord) {
  const base = (item["Product Name"] || item.Model || "ExShopi Product").trim();
  const category = (item["Product Category"] || "").trim();
  const inferredBrand =
    (item.Brand || "").trim() ||
    ((item["Product URL"] || "").includes("meetion.com") ? "Meetion" : "");
  const brand = inferredBrand.trim();

  let title = base
    .replace(/\s*[-|–]\s*Change in Seconds.*$/i, "")
    .replace(/\s*for Men and Women$/i, "")
    .replace(/\s*for Women Men Kids$/i, "")
    .replace(/\s*Waterproof Mini Travel Folding Umbrella.*$/i, " Umbrella")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (category && !new RegExp(category, "i").test(title)) {
    title = `${title} ${category}`.trim();
  }

  if (brand && !title.toLowerCase().startsWith(brand.toLowerCase())) {
    title = `${brand} ${title}`;
  }

  return truncate(sentenceCase(title), 120);
}

function buildShortDescription(item: ThunderbitRecord) {
  const description = (item["Product Description"] || "").replace(/\\n/g, "\n").trim();
  if (description) return truncate(description, 220);

  const featureBullets = splitBullets(item["Key Features"]);
  if (featureBullets.length > 0) {
    return truncate(featureBullets[0], 220);
  }

  const bullets = splitBullets(item["About This Item"]);
  if (bullets.length > 0) {
    return truncate(bullets[0], 220);
  }
  return truncate(`${item.Brand || "ExShopi"} ${item["Product Name"] || "product"} available on ExShopi Official.`, 220);
}

function buildLongDescription(item: ThunderbitRecord) {
  const description = (item["Product Description"] || "").replace(/\\n/g, "\n").trim();
  const intro = buildShortDescription(item);
  const csvFeatures = splitBullets(item["Key Features"]).slice(0, 10);
  const features = splitBullets(item["About This Item"]).slice(0, 6);
  const specials = splitBullets(item["Special Features"]);

  return [intro, description, ...csvFeatures, ...specials, ...features]
    .filter(Boolean)
    .join("\n\n");
}

function parsePrice(value?: string) {
  const numeric = Number.parseFloat((value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseRating(value?: string) {
  const numeric = Number.parseFloat((value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseCount(value?: string) {
  const numeric = Number.parseInt((value || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function mapCategory(item: ThunderbitRecord) {
  const category = (item["Product Category"] || "").toLowerCase();
  const title = `${item["Product Name"] || ""} ${item["Product Description"] || ""} ${item["About This Item"] || ""}`.toLowerCase();

  if (/(mouse|keyboard|combo|headset|speaker|camera|accessories)/.test(category)) {
    return CATEGORY_SLUGS.accessories;
  }
  if (/furniture/.test(category)) {
    return CATEGORY_SLUGS.dailyUse;
  }

  if (/(t-?shirt|shirt|polo|hoodie|jacket|jeans|trouser|pants|shorts|vest|undershirt|clothing|apparel)/.test(title)) {
    return CATEGORY_SLUGS.menClothing;
  }
  if (/(shoe|sneaker|loafer|sandal|slipper|boot|heel|clog)/.test(title)) {
    return CATEGORY_SLUGS.footwear;
  }
  if (/(macbook|laptop|notebook|ultrabook|chromebook)/.test(title)) {
    return CATEGORY_SLUGS.laptops;
  }
  if (/(iphone|smartphone|mobile phone|mobile|cell phone|galaxy)/.test(title)) {
    return CATEGORY_SLUGS.mobiles;
  }
  if (/(tablet|ipad)/.test(title)) {
    return CATEGORY_SLUGS.tablets;
  }
  if (/(beauty|makeup|skincare|perfume|fragrance|cosmetic)/.test(title)) {
    return CATEGORY_SLUGS.beauty;
  }
  if (/(gift|novelty|present)/.test(title)) {
    return CATEGORY_SLUGS.gifts;
  }
  if (/(coffee|kettle|mixer|blender|toaster|appliance|kitchen)/.test(title)) {
    return CATEGORY_SLUGS.dailyUse;
  }
  if (/(packing cube|luggage|travel|umbrella|wallet|bag|backpack|scale|watch|jewelry|sunglass|organizer)/.test(title)) {
    return CATEGORY_SLUGS.accessories;
  }

  return CATEGORY_SLUGS.accessories;
}

function buildSpecs(item: ThunderbitRecord, categoryId: string) {
  const aboutBullets = splitBullets(item["About This Item"]).slice(0, 8);
  const csvBullets = splitBullets(item["Key Features"]).slice(0, 10);
  const specialBullets = splitBullets(item["Special Features"]).slice(0, 4);
  const importedAt = new Date().toISOString();

  const attributes: Record<string, string> = {};
  if (item.Brand || item["Product URL"]?.includes("meetion.com")) attributes.brand = item.Brand || "Meetion";
  if (item.Color) attributes.color = item.Color;
  if (item.Material) attributes.material = item.Material;
  if (item.Model) attributes.model = item.Model;
  if (item["Product Category"]) attributes.productCategory = item["Product Category"];
  if (item["Compatible Systems"]) attributes.compatibleSystems = item["Compatible Systems"];
  if (item["Interface Type"]) attributes.interfaceType = item["Interface Type"];
  if (item["Cable Length (m)"]) attributes.cableLength = item["Cable Length (m)"];
  if (item["Weight (g)"]) attributes.weight = item["Weight (g)"];
  if (item["Dimension (mm)"]) attributes.dimensions = item["Dimension (mm)"];
  if (item["Sensitivity (dB)"]) attributes.sensitivity = item["Sensitivity (dB)"];
  if (item["Speaker Size (mm)"]) attributes.speakerSize = item["Speaker Size (mm)"];
  if (item["Frequency Response (Hz)"]) attributes.frequencyResponse = item["Frequency Response (Hz)"];
  if (item["Microphone Type"]) attributes.microphoneType = item["Microphone Type"];
  if (item["Mic Unit Diameter (mm)"]) attributes.micUnitDiameter = item["Mic Unit Diameter (mm)"];
  if (item["Mic Sensitivity (dB)"]) attributes.micSensitivity = item["Mic Sensitivity (dB)"];
  if (item["Product Dimensions"]) attributes.dimensions = item["Product Dimensions"];
  if (item["Date First Available"]) attributes.firstAvailable = item["Date First Available"];
  if (item.ASIN) attributes.asin = item.ASIN;

  const templateId =
    categoryId === CATEGORY_SLUGS.menClothing
      ? "clothing"
      : categoryId === CATEGORY_SLUGS.footwear
        ? "shoes"
        : categoryId === CATEGORY_SLUGS.laptops
          ? "laptops"
          : categoryId === CATEGORY_SLUGS.mobiles
            ? "mobiles"
            : categoryId === CATEGORY_SLUGS.tablets
              ? "tablets"
              : categoryId === CATEGORY_SLUGS.beauty
                ? "beauty"
                : "accessories";

  return {
    templateId,
    templateName: sentenceCase(templateId.replace(/-/g, " ")),
    shortDescription: buildShortDescription(item),
    longDescription: buildLongDescription(item),
    attributes,
    keyFeatures: [...csvBullets, ...specialBullets, ...aboutBullets].slice(0, 12),
    importMeta: {
      source: "Thunderbit",
      asin: item.ASIN || null,
      productUrl: item["Product URL"] || null,
      importedAt,
      sourceFile: path.basename(process.argv[2] || ""),
    },
  };
}

function buildBadges(item: ThunderbitRecord, price: number) {
  const badges = ["ExShopi Official"];
  if (parseRating(item["Rating (Max 5)"]) >= 4.5) badges.push("Top Rated");
  if (price > 0 && price < 50) badges.push("Best Value");
  return badges;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error("Usage: npx tsx scripts/importThunderbit.ts /absolute/path/to/file.json|csv");
  }

  const filePath = path.resolve(inputPath);
  const records = parseInputFile(filePath);
  const existing = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      specsJson: true,
    },
  });

  const existingByAsin = new Map<string, { id: string; title: string }>();
  const existingBySourceUrl = new Map<string, { id: string; title: string }>();
  const usedSlugs = new Set(existing.map((product) => product.slug));

  for (const product of existing) {
    const specs = (product.specsJson || {}) as Record<string, any>;
    const importMeta = specs.importMeta || {};
    if (importMeta.source === "Thunderbit") {
      if (typeof importMeta.asin === "string" && importMeta.asin) {
        existingByAsin.set(importMeta.asin, { id: product.id, title: product.title });
      }
      if (typeof importMeta.productUrl === "string" && importMeta.productUrl) {
        existingBySourceUrl.set(importMeta.productUrl, { id: product.id, title: product.title });
      }
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of records) {
    const price = parsePrice(item["Price (AED)"]);
    const title = improveTitle(item);
    const categoryId = mapCategory(item);
    const shortDescription = buildShortDescription(item);
    const description = buildLongDescription(item);
    const rating = parseRating(item["Rating (Max 5)"]);
    const reviewsCount = parseCount(item["Number of Ratings"]);
    const sourceUrl = item["Product URL"] || "";
    const sourceAsin = item.ASIN || "";
    const imageUrls = splitImageUrls(item["Product Image"]);
    const imageUrl = imageUrls[0] || "";
    const specsJson = buildSpecs(item, categoryId);
    const badgesJson = buildBadges(item, price);
    const originalPrice = price > 0 ? Math.round(price * 1.18 * 100) / 100 : 0;

    const existingImport =
      (sourceAsin && existingByAsin.get(sourceAsin)) ||
      (sourceUrl && existingBySourceUrl.get(sourceUrl)) ||
      null;

    const baseSlug = slugify(title) || `product-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (!existingImport && usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const payload = {
      storeId: OFFICIAL_STORE_ID,
      sellerUserId: OFFICIAL_USER_ID,
      categoryId,
      title,
      slug: existingImport ? undefined : slug,
      shortDescription,
      description,
      price: new Prisma.Decimal(price || 19.99),
      originalPrice: new Prisma.Decimal(originalPrice || price || 19.99),
      salePrice: new Prisma.Decimal(price || 19.99),
      stock: 15,
      rating: rating || 4.3,
      reviewsCount,
      sku: sourceAsin || slugify(title).toUpperCase().slice(0, 24),
      brand: item.Brand || "ExShopi",
      specsJson,
      badgesJson,
      ownership: "official" as const,
      createdByRole: "admin",
      approvalStatus: "approved" as const,
      status: "live" as const,
      visibilityStatus: "live" as const,
      approvedAt: new Date(),
      approvalRequestedAt: new Date(),
    };

    if (existingImport) {
      await prisma.product.update({
        where: { id: existingImport.id },
        data: {
          ...payload,
          slug: undefined,
          updatedAt: new Date(),
          images: imageUrls.length
            ? {
                deleteMany: {},
                create: imageUrls.map((url, index) => ({
                  imageUrl: url,
                  isPrimary: index === 0,
                  sortOrder: index,
                })),
              }
            : undefined,
        },
      });
      updated += 1;
      continue;
    }

    if (!title || !categoryId || !imageUrl || price <= 0) {
      skipped += 1;
      continue;
    }

    await prisma.product.create({
      data: {
        ...payload,
        slug,
        images: {
          create: imageUrls.map((url, index) => ({
            imageUrl: url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
      },
    });
    usedSlugs.add(slug);
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceFile: filePath,
        totalRows: records.length,
        created,
        updated,
        skipped,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
