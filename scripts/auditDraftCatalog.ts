import fs from 'node:fs';
import path from 'node:path';

type Product = {
  id?: string;
  title?: string;
  slug?: string;
  brand?: string;
  sku?: string;
  price?: number | string | null;
  priceUae?: number | string | null;
  priceKsa?: number | string | null;
  compareAtPriceUae?: number | string | null;
  compareAtPriceKsa?: number | string | null;
  image?: string;
  images?: string[];
  status?: string;
  productStatus?: string;
  categoryId?: string;
  parentCategorySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  description?: string;
  specs?: {
    shortDescription?: string;
    longDescription?: string;
    parentCategorySlug?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    categoryPath?: string;
    importMeta?: {
      source?: string;
      sourceFile?: string;
      importedAt?: string;
    };
    specificationValues?: Record<string, unknown>;
  };
};

type DraftAuditRow = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  confidence: 'high' | 'medium' | 'low';
  categoryPath: string;
  sku: string;
  importFile: string;
  priceUae: string;
  priceKsa: string;
  compareAtPriceUae: string;
  compareAtPriceKsa: string;
  processor: string;
  ram: string;
  storage: string;
  condition: string;
  imageCount: number;
  blockers: string[];
  notes: string[];
};

type AuditSummary = {
  generatedAt: string;
  totalDrafts: number;
  byBrand: Array<{ brand: string; count: number }>;
  byCategoryPath: Array<{ categoryPath: string; count: number }>;
  byConfidence: Array<{ confidence: string; count: number }>;
  blockerCounts: Array<{ blocker: string; count: number }>;
  placeholderCopyCount: number;
  genericBrandCount: number;
  missingImagesCount: number;
  missingKsaPricingCount: number;
  missingTopLevelCategoryCount: number;
};

const cwd = process.cwd();
const dbPath = path.join(cwd, 'backend', 'db.json');
const outputDir = path.join(cwd, 'backend', 'data');
const jsonOutputPath = path.join(outputDir, 'draftCatalogAudit.json');
const csvOutputPath = path.join(outputDir, 'draftCatalogAudit.csv');

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8')) as { products?: Product[] };
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeMoney(value: unknown) {
  if (value == null || value === '') return '';
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : normalizeText(value);
}

function getDraftProducts(products: Product[]) {
  return products.filter((product) => {
    const raw = normalizeText(product.productStatus || product.status).toLowerCase();
    return raw === 'draft';
  });
}

function countMapEntries(source: string[]) {
  const map = new Map<string, number>();
  for (const item of source) {
    const key = item || 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }));
}

function csvEscape(value: string | number) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function looksAmbiguousTitle(title: string) {
  return /(series|latest|accessory|holder|tracker|charger|case|cable|stand)\b/i.test(title);
}

function hasPlaceholderCopy(text: string) {
  return /(catalog-ready|add your own images|suggested uae pricing|configured for uae marketplace demand|manual admin upload)/i.test(text);
}

function looksSpecificModel(title: string) {
  return /\b([A-Z]?\d{3,4}[A-Z]?)\b/.test(title) || /\b(g\d+|m\d|a\d{4,5}|iphone\s+\d+|ipad|thinkpad|latitude|elitebook|probook|macbook)\b/i.test(title);
}

function pickCategoryPath(product: Product) {
  const parent = normalizeText(product.parentCategorySlug || product.specs?.parentCategorySlug);
  const category = normalizeText(product.categorySlug || product.specs?.categorySlug);
  const subcategory = normalizeText(product.subcategorySlug || product.specs?.subcategorySlug);
  const explicitPath = normalizeText(product.specs?.categoryPath);

  if (explicitPath) return explicitPath;
  return [parent, category, subcategory].filter(Boolean).join('/');
}

function auditProduct(product: Product): DraftAuditRow {
  const title = normalizeText(product.title);
  const brand = normalizeText(product.brand);
  const slug = normalizeText(product.slug);
  const sku = normalizeText(product.sku);
  const specValues = product.specs?.specificationValues || {};
  const descriptionBlob = [product.description, product.specs?.shortDescription, product.specs?.longDescription]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join('\n');
  const imageCount = [normalizeText(product.image), ...(product.images || []).map((image) => normalizeText(image))]
    .filter(Boolean).length;
  const categoryPath = pickCategoryPath(product);

  const processor = normalizeText(specValues.processorModel);
  const ram = normalizeText(specValues.ram);
  const storage = normalizeText(specValues.storage);
  const condition = normalizeText(specValues.condition);

  const blockers: string[] = [];
  const notes: string[] = [];

  if (!imageCount) blockers.push('missing_images');
  if (!normalizeMoney(product.priceKsa)) blockers.push('missing_ksa_price');
  if (!normalizeMoney(product.compareAtPriceKsa)) blockers.push('missing_ksa_compare_at_price');
  if (!normalizeText(product.parentCategorySlug) && !normalizeText(product.categorySlug) && !normalizeText(product.subcategorySlug)) {
    blockers.push('missing_top_level_category_fields');
  }
  if (!categoryPath) blockers.push('missing_category_path');
  if (hasPlaceholderCopy(descriptionBlob)) blockers.push('placeholder_copy');
  if (brand.toLowerCase() === 'generic') blockers.push('generic_brand');
  if (looksAmbiguousTitle(title)) blockers.push('ambiguous_title');
  if (!looksSpecificModel(title)) blockers.push('weak_model_signal');
  if (!processor && /laptop|macbook|thinkpad|elitebook|latitude|probook|notebook/i.test(title)) blockers.push('missing_processor');
  if (!ram && /laptop|macbook|thinkpad|elitebook|latitude|probook|iphone|ipad|galaxy/i.test(title)) blockers.push('missing_ram');
  if (!storage && /laptop|macbook|thinkpad|elitebook|latitude|probook|iphone|ipad|galaxy/i.test(title)) blockers.push('missing_storage');

  if (normalizeMoney(product.priceUae) && !normalizeMoney(product.compareAtPriceUae)) {
    notes.push('uae_compare_at_price_falls_back_or_missing');
  }
  if (normalizeText(product.specs?.importMeta?.sourceFile)) {
    notes.push(`imported_from:${normalizeText(product.specs?.importMeta?.sourceFile)}`);
  }

  let confidence: DraftAuditRow['confidence'] = 'high';
  if (blockers.includes('generic_brand') || blockers.includes('missing_images') || blockers.includes('ambiguous_title')) {
    confidence = 'low';
  } else if (blockers.length >= 3 || blockers.includes('placeholder_copy') || blockers.includes('missing_top_level_category_fields')) {
    confidence = 'medium';
  }

  if (blockers.includes('weak_model_signal') || blockers.includes('missing_processor') || blockers.includes('missing_storage')) {
    confidence = 'low';
  }

  return {
    id: normalizeText(product.id),
    title,
    slug,
    brand,
    confidence,
    categoryPath,
    sku,
    importFile: normalizeText(product.specs?.importMeta?.sourceFile),
    priceUae: normalizeMoney(product.priceUae ?? product.price),
    priceKsa: normalizeMoney(product.priceKsa),
    compareAtPriceUae: normalizeMoney(product.compareAtPriceUae),
    compareAtPriceKsa: normalizeMoney(product.compareAtPriceKsa),
    processor,
    ram,
    storage,
    condition,
    imageCount,
    blockers,
    notes,
  };
}

function buildSummary(rows: DraftAuditRow[]): AuditSummary {
  const blockerCounts = new Map<string, number>();
  for (const row of rows) {
    for (const blocker of row.blockers) {
      blockerCounts.set(blocker, (blockerCounts.get(blocker) || 0) + 1);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalDrafts: rows.length,
    byBrand: countMapEntries(rows.map((row) => row.brand || 'Unknown')).map(({ key, count }) => ({ brand: key, count })),
    byCategoryPath: countMapEntries(rows.map((row) => row.categoryPath || 'missing')).map(({ key, count }) => ({
      categoryPath: key,
      count,
    })),
    byConfidence: countMapEntries(rows.map((row) => row.confidence)).map(({ key, count }) => ({ confidence: key, count })),
    blockerCounts: [...blockerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([blocker, count]) => ({ blocker, count })),
    placeholderCopyCount: rows.filter((row) => row.blockers.includes('placeholder_copy')).length,
    genericBrandCount: rows.filter((row) => row.blockers.includes('generic_brand')).length,
    missingImagesCount: rows.filter((row) => row.blockers.includes('missing_images')).length,
    missingKsaPricingCount: rows.filter((row) => row.blockers.includes('missing_ksa_price')).length,
    missingTopLevelCategoryCount: rows.filter((row) => row.blockers.includes('missing_top_level_category_fields')).length,
  };
}

function writeCsv(rows: DraftAuditRow[]) {
  const header = [
    'id',
    'title',
    'slug',
    'brand',
    'confidence',
    'categoryPath',
    'sku',
    'importFile',
    'priceUae',
    'priceKsa',
    'compareAtPriceUae',
    'compareAtPriceKsa',
    'processor',
    'ram',
    'storage',
    'condition',
    'imageCount',
    'blockers',
    'notes',
  ];

  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.title,
        row.slug,
        row.brand,
        row.confidence,
        row.categoryPath,
        row.sku,
        row.importFile,
        row.priceUae,
        row.priceKsa,
        row.compareAtPriceUae,
        row.compareAtPriceKsa,
        row.processor,
        row.ram,
        row.storage,
        row.condition,
        row.imageCount,
        row.blockers.join('|'),
        row.notes.join('|'),
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  fs.writeFileSync(csvOutputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const db = readDb();
  const products = Array.isArray(db.products) ? db.products : [];
  const draftRows = getDraftProducts(products).map(auditProduct);
  const summary = buildSummary(draftRows);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonOutputPath, JSON.stringify({ summary, products: draftRows }, null, 2));
  writeCsv(draftRows);

  console.log(
    JSON.stringify(
      {
        summary,
        files: {
          json: path.relative(cwd, jsonOutputPath),
          csv: path.relative(cwd, csvOutputPath),
        },
      },
      null,
      2
    )
  );
}

main();
