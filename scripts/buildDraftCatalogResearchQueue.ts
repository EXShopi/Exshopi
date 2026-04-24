import fs from 'node:fs';
import path from 'node:path';

type AuditProduct = {
  id?: string;
  title?: string;
  slug?: string;
  brand?: string;
  categoryPath?: string;
  priceUae?: string;
  priceKsa?: string;
  compareAtPriceUae?: string;
  compareAtPriceKsa?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  condition?: string;
  blockers?: string[];
};

type AuditFile = {
  summary?: Record<string, unknown>;
  products?: AuditProduct[];
};

type Product = {
  id?: string;
  title?: string;
  slug?: string;
  brand?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  image?: string;
  images?: string[];
  status?: string;
  productStatus?: string;
  sku?: string;
  specs?: {
    shortDescription?: string;
    longDescription?: string;
    sellerNotes?: string;
    importMeta?: {
      sourceFile?: string;
    };
    specificationValues?: Record<string, unknown>;
    parentCategorySlug?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    categoryPath?: string;
  };
};

type ConfidenceLevel = 'high' | 'medium' | 'low';

type ResearchRow = {
  productId: string;
  currentTitle: string;
  detectedBrand: string;
  detectedModel: string;
  currentSpecsSummary: string;
  missingFields: string;
  confidenceLevel: ConfidenceLevel;
  researchRequired: string;
  recommendedAction: string;
  imageSearchQuery: string;
  uaePriceSearchQuery: string;
  ksaPriceSearchQuery: string;
  seoKeywordTarget: string;
};

type SuggestedUpdate = {
  productId: string;
  currentTitle: string;
  confidenceLevel: 'high';
  approvedForApply: false;
  improvedTitle: string;
  shortDescription: string;
  fullDescription: string;
  keySpecifications: string[];
  seoSlug: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  sellerNote: string;
  preserveExistingFields: string[];
  updateFields: string[];
};

type SuggestedUpdatesFile = {
  generatedAt: string;
  totalHighConfidenceProducts: number;
  updates: SuggestedUpdate[];
};

const cwd = process.cwd();
const auditPath = path.join(cwd, 'backend', 'data', 'draftCatalogAudit.json');
const dbPath = path.join(cwd, 'backend', 'db.json');
const outputDir = path.join(cwd, 'backend', 'data');

const highCsvPath = path.join(outputDir, 'draftCatalogResearchQueue.high.csv');
const mediumCsvPath = path.join(outputDir, 'draftCatalogResearchQueue.medium.csv');
const lowCsvPath = path.join(outputDir, 'draftCatalogResearchQueue.low.csv');
const templateCsvPath = path.join(outputDir, 'draftCatalogEnrichmentTemplate.csv');
const suggestedUpdatesPath = path.join(outputDir, 'draftCatalogSuggestedUpdates.high.json');

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function csvEscape(value: string | number): string {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function detectCategory(product: Product, auditProduct?: AuditProduct): string {
  return normalizeText(product.specs?.categoryPath || auditProduct?.categoryPath);
}

function getDraftProducts(products: Product[]): Product[] {
  return products.filter((product) => {
    const raw = normalizeText(product.productStatus || product.status).toLowerCase();
    return raw === 'draft';
  });
}

function isPhoneCategory(categoryPath: string): boolean {
  return categoryPath.includes('smartphones');
}

function isTabletCategory(categoryPath: string): boolean {
  return categoryPath.includes('tablets');
}

function isLaptopCategory(categoryPath: string): boolean {
  return categoryPath.includes('laptops');
}

function detectModel(product: Product): string {
  const specModel = normalizeText(product.specs?.specificationValues?.model);
  if (specModel) return specModel;

  const title = normalizeText(product.title)
    .replace(/\bLaptop\b/gi, '')
    .replace(/\bSmartphone\b/gi, '')
    .replace(/\bTablet\b/gi, '')
    .replace(/\s+\(Refurbished\)\s*$/i, '')
    .replace(/\s+\(Renewed\)\s*$/i, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();

  const brand = normalizeText(product.brand);
  if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) {
    return title.slice(brand.length).trim();
  }
  return title;
}

function buildSpecsSummary(product: Product): string {
  const specValues = product.specs?.specificationValues || {};
  const parts = [
    normalizeText(specValues.processorModel),
    normalizeText(specValues.ram),
    normalizeText(specValues.storage),
    normalizeText(specValues.screenSize),
    normalizeText(specValues.graphics),
    normalizeText(specValues.operatingSystem),
    normalizeText(specValues.condition),
  ].filter(Boolean);

  return parts.join(' | ');
}

function getMissingFields(product: Product, categoryPath: string): string[] {
  const specValues = product.specs?.specificationValues || {};
  const missing: string[] = [];
  const require = (field: string, label: string) => {
    if (!normalizeText(specValues[field])) missing.push(label);
  };

  if (!normalizeText(product.brand)) missing.push('brand');
  if (!detectModel(product)) missing.push('model');

  if (isLaptopCategory(categoryPath)) {
    require('processorModel', 'processor');
    require('ram', 'ram');
    require('storage', 'storage');
    require('screenSize', 'screen size');
    require('operatingSystem', 'operating system');
    require('condition', 'condition');
  } else if (isPhoneCategory(categoryPath) || isTabletCategory(categoryPath)) {
    require('storage', 'storage');
    require('condition', 'condition');
    require('screenSize', 'screen size');
    require('processorModel', 'processor');
  }

  return Array.from(new Set(missing));
}

function hasPlaceholderCopy(product: Product): boolean {
  const text = [
    normalizeText(product.description),
    normalizeText(product.specs?.shortDescription),
    normalizeText(product.specs?.longDescription),
  ]
    .filter(Boolean)
    .join('\n');

  return /(catalog-ready|add your own images|suggested uae pricing|configured for uae marketplace demand|manual admin upload)/i.test(
    text
  );
}

function hasWeakModelSignal(product: Product, model: string): boolean {
  const title = normalizeText(product.title);
  if (/generic/i.test(normalizeText(product.brand))) return true;
  if (!model) return true;
  if (/\b(series|latest|accessory|holder|tracker|charger|case|cable|stand)\b/i.test(title)) return true;
  return false;
}

function classifyConfidence(product: Product, auditProduct: AuditProduct | undefined): ConfidenceLevel {
  const brand = normalizeText(product.brand);
  const model = detectModel(product);
  const categoryPath = detectCategory(product, auditProduct);
  const missingFields = getMissingFields(product, categoryPath);
  const placeholderCopy = hasPlaceholderCopy(product);
  const weakModelSignal = hasWeakModelSignal(product, model);
  const blockers = new Set(auditProduct?.blockers || []);

  if (
    brand.toLowerCase() === 'generic' ||
    weakModelSignal ||
    placeholderCopy ||
    blockers.has('generic_brand') ||
    blockers.has('ambiguous_title') ||
    blockers.has('weak_model_signal') ||
    missingFields.length >= 3
  ) {
    return 'low';
  }

  const specValues = product.specs?.specificationValues || {};
  const hasBrand = Boolean(brand);
  const hasModel = Boolean(model);
  const hasProcessor = Boolean(normalizeText(specValues.processorModel));
  const hasRam = Boolean(normalizeText(specValues.ram));
  const hasStorage = Boolean(normalizeText(specValues.storage));
  const hasScreen = Boolean(normalizeText(specValues.screenSize));

  if (isLaptopCategory(categoryPath) && hasBrand && hasModel && hasProcessor && hasRam && hasStorage && hasScreen) {
    return 'high';
  }

  if ((isPhoneCategory(categoryPath) || isTabletCategory(categoryPath)) && hasBrand && hasModel && hasStorage && hasProcessor) {
    return 'high';
  }

  return 'medium';
}

function recommendedActionFor(confidence: ConfidenceLevel, product: Product, categoryPath: string): string {
  if (confidence === 'high') {
    return 'Prepare content update only. Hold for manual image and UAE/KSA price verification before approval.';
  }
  if (confidence === 'medium') {
    return 'Manual model/spec review required before drafting content. Verify storage, color, variant, and exact market match.';
  }
  if (isPhoneCategory(categoryPath) || isTabletCategory(categoryPath)) {
    return 'Do not enrich yet. Resolve exact variant, storage, color, and condition from source data first.';
  }
  return 'Do not enrich yet. Resolve exact brand/model/specs from source documents before any catalog update.';
}

function researchRequiredFor(confidence: ConfidenceLevel, missingFields: string[], product: Product): string {
  const tasks: string[] = [];
  if (confidence !== 'high') tasks.push('model verification');
  if (missingFields.length) tasks.push(`${missingFields.join(', ')} verification`);
  tasks.push('image verification');
  tasks.push('UAE price verification');
  tasks.push('KSA price verification');
  if (hasPlaceholderCopy(product)) tasks.push('content rewrite');
  return Array.from(new Set(tasks)).join('; ');
}

function buildImageSearchQuery(product: Product, model: string): string {
  const brand = normalizeText(product.brand);
  const categoryHint = normalizeText(product.specs?.specificationValues?.series || '');
  return [brand, model, categoryHint, 'official product image white background']
    .filter(Boolean)
    .join(' ');
}

function buildPriceSearchQuery(product: Product, market: 'UAE' | 'KSA'): string {
  const title = normalizeText(product.title);
  const marketTerms = market === 'UAE' ? 'UAE price refurbished' : 'Saudi Arabia price refurbished';
  return `${title} ${marketTerms}`.trim();
}

function buildSeoKeywordTarget(product: Product, model: string, categoryPath: string): string {
  const brand = normalizeText(product.brand);
  if (isLaptopCategory(categoryPath)) return `${brand} ${model} refurbished laptop UAE`;
  if (isPhoneCategory(categoryPath)) return `${brand} ${model} UAE`;
  if (isTabletCategory(categoryPath)) return `${brand} ${model} tablet UAE`;
  return `${brand} ${model} UAE`;
}

function buildResearchRow(product: Product, auditProduct: AuditProduct | undefined): ResearchRow {
  const categoryPath = detectCategory(product, auditProduct);
  const model = detectModel(product);
  const missingFields = getMissingFields(product, categoryPath);
  const confidenceLevel = classifyConfidence(product, auditProduct);

  return {
    productId: normalizeText(product.id),
    currentTitle: normalizeText(product.title),
    detectedBrand: normalizeText(product.brand),
    detectedModel: model,
    currentSpecsSummary: buildSpecsSummary(product),
    missingFields: missingFields.join('; '),
    confidenceLevel,
    researchRequired: researchRequiredFor(confidenceLevel, missingFields, product),
    recommendedAction: recommendedActionFor(confidenceLevel, product, categoryPath),
    imageSearchQuery: buildImageSearchQuery(product, model),
    uaePriceSearchQuery: buildPriceSearchQuery(product, 'UAE'),
    ksaPriceSearchQuery: buildPriceSearchQuery(product, 'KSA'),
    seoKeywordTarget: buildSeoKeywordTarget(product, model, categoryPath),
  };
}

function smartJoin(parts: Array<string | undefined>): string {
  return parts.map((part) => normalizeText(part)).filter(Boolean).join(' | ');
}

function trimToLength(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function buildImprovedTitle(product: Product, model: string, categoryPath: string): string {
  const brand = normalizeText(product.brand);
  const specValues = product.specs?.specificationValues || {};
  const condition = normalizeText(specValues.condition);
  const processor = normalizeText(specValues.processorModel);
  const ram = normalizeText(specValues.ram);
  const storage = normalizeText(specValues.storage);
  const screen = normalizeText(specValues.screenSize);
  const os = normalizeText(specValues.operatingSystem);

  if (isLaptopCategory(categoryPath)) {
    return `${brand} ${model} ${condition} Laptop – ${smartJoin([processor, ram, storage, screen, os])}`.trim();
  }

  if (isPhoneCategory(categoryPath)) {
    return `${brand} ${model} ${storage} ${condition} Smartphone – UAE`;
  }

  if (isTabletCategory(categoryPath)) {
    return `${brand} ${model} ${storage} ${condition} Tablet – UAE`;
  }

  return normalizeText(product.title);
}

function buildShortDescription(product: Product, model: string, categoryPath: string): string {
  const specValues = product.specs?.specificationValues || {};
  const processor = normalizeText(specValues.processorModel);
  const ram = normalizeText(specValues.ram);
  const storage = normalizeText(specValues.storage);
  const screen = normalizeText(specValues.screenSize);
  const condition = normalizeText(specValues.condition);
  const brand = normalizeText(product.brand);

  if (isLaptopCategory(categoryPath)) {
    return `${brand} ${model} ${condition.toLowerCase()} laptop with ${processor}, ${ram}, ${storage}, and ${screen} display for work, study, and daily productivity.`;
  }

  if (isPhoneCategory(categoryPath)) {
    return `${brand} ${model} ${condition.toLowerCase()} smartphone with ${storage} storage and verified draft specs for shoppers looking for dependable value in the UAE.`;
  }

  if (isTabletCategory(categoryPath)) {
    return `${brand} ${model} ${condition.toLowerCase()} tablet with ${storage} storage and clear model identification for study, streaming, and everyday use.`;
  }

  return normalizeText(product.description);
}

function buildFullDescription(product: Product, model: string, categoryPath: string): string {
  const specValues = product.specs?.specificationValues || {};
  const brand = normalizeText(product.brand);
  const processor = normalizeText(specValues.processorModel);
  const ram = normalizeText(specValues.ram);
  const storage = normalizeText(specValues.storage);
  const screen = normalizeText(specValues.screenSize);
  const graphics = normalizeText(specValues.graphics);
  const operatingSystem = normalizeText(specValues.operatingSystem);
  const condition = normalizeText(specValues.condition).toLowerCase();

  if (isLaptopCategory(categoryPath)) {
    return `${brand} ${model} is a ${condition} business-class laptop configured with ${processor}, ${ram}, ${storage}, ${screen} display, ${graphics}, and ${operatingSystem}. This draft update keeps the listing factual and model-led while improving readability for UAE shoppers who need a dependable laptop for office work, remote tasks, study, and everyday productivity.\n\nThe goal of this content pass is to make the product easier to trust before image and price verification. It highlights the exact device identity, the current known hardware configuration, and the practical fit for professional and student use without adding unverified claims. Final approval should still wait for exact model image matching, UAE/KSA pricing validation, and any missing physical-condition notes.`;
  }

  if (isPhoneCategory(categoryPath)) {
    return `${brand} ${model} is a ${condition} smartphone draft with ${storage} storage and the currently recorded chipset and display details preserved from the existing catalog data. This content update is intentionally conservative: it improves clarity for UAE shoppers while avoiding claims that are not already supported by the draft record.\n\nBefore this product can move forward, the final workflow should verify exact variant matching, real product images for the same model, current UAE and KSA resale pricing, and any condition-specific notes such as battery status or cosmetic grade.`;
  }

  if (isTabletCategory(categoryPath)) {
    return `${brand} ${model} is a ${condition} tablet draft with the currently available storage and hardware information preserved from the existing product record. This version improves the listing structure for marketplace readiness while staying within the limits of the verified draft data.\n\nIt should still remain unpublished until the team confirms exact variant details, correct model imagery, and current UAE/KSA market pricing for the same device and condition.`;
  }

  return normalizeText(product.description);
}

function buildKeySpecifications(product: Product): string[] {
  const specValues = product.specs?.specificationValues || {};
  const pairs: Array<[string, string]> = [
    ['Brand', normalizeText(product.brand)],
    ['Model', detectModel(product)],
    ['Processor', normalizeText(specValues.processorModel)],
    ['RAM', normalizeText(specValues.ram)],
    ['Storage', normalizeText(specValues.storage)],
    ['Display', normalizeText(specValues.screenSize)],
    ['Graphics', normalizeText(specValues.graphics)],
    ['Operating System', normalizeText(specValues.operatingSystem)],
    ['Condition', normalizeText(specValues.condition)],
  ];

  return pairs.filter(([, value]) => Boolean(value)).map(([label, value]) => `${label}: ${value}`);
}

function buildSeoTitle(product: Product, model: string, categoryPath: string): string {
  const brand = normalizeText(product.brand);
  const base = isLaptopCategory(categoryPath)
    ? `${brand} ${model} Refurbished Laptop UAE`
    : isPhoneCategory(categoryPath)
    ? `${brand} ${model} Refurbished UAE`
    : `${brand} ${model} UAE`;
  return trimToLength(base, 60);
}

function buildSeoDescription(product: Product, model: string, categoryPath: string): string {
  const specValues = product.specs?.specificationValues || {};
  const storage = normalizeText(specValues.storage);
  const ram = normalizeText(specValues.ram);
  const processor = normalizeText(specValues.processorModel);
  const brand = normalizeText(product.brand);

  const base = isLaptopCategory(categoryPath)
    ? `Shop ${brand} ${model} with ${processor}, ${ram}, and ${storage}. Draft listing prepared for verified UAE marketplace enrichment.`
    : `Shop ${brand} ${model}${storage ? ` ${storage}` : ''}. Draft listing prepared for verified UAE marketplace enrichment.`;

  return trimToLength(base, 160);
}

function buildCanonicalUrl(slug: string): string {
  return `https://exshopi.com/products/${slug}`;
}

function buildSuggestedUpdate(product: Product, row: ResearchRow): SuggestedUpdate {
  const categoryPath = detectCategory(product, undefined);
  const improvedTitle = buildImprovedTitle(product, row.detectedModel, categoryPath);
  const seoSlug = normalizeText(product.slug) || normalizeSlug(improvedTitle);
  const seoTitle = buildSeoTitle(product, row.detectedModel, categoryPath);
  const seoDescription = buildSeoDescription(product, row.detectedModel, categoryPath);

  return {
    productId: row.productId,
    currentTitle: row.currentTitle,
    confidenceLevel: 'high',
    approvedForApply: false,
    improvedTitle,
    shortDescription: buildShortDescription(product, row.detectedModel, categoryPath),
    fullDescription: buildFullDescription(product, row.detectedModel, categoryPath),
    keySpecifications: buildKeySpecifications(product),
    seoSlug,
    seoTitle,
    seoDescription,
    canonicalUrl: buildCanonicalUrl(seoSlug),
    ogTitle: seoTitle,
    ogDescription: trimToLength(seoDescription, 220),
    sellerNote:
      'Safe high-confidence content suggestion only. Apply after manual approval plus exact image and UAE/KSA price verification.',
    preserveExistingFields: ['images', 'image', 'price', 'priceUae', 'priceKsa', 'compareAtPriceUae', 'compareAtPriceKsa'],
    updateFields: [
      'title',
      'description',
      'specs.shortDescription',
      'specs.longDescription',
      'specs.keyFeatures',
      'slug',
      'metaTitle',
      'metaDescription',
      'canonicalUrl',
      'ogTitle',
      'ogDescription',
      'specs.sellerNotes',
    ],
  };
}

function writeResearchCsv(filePath: string, rows: ResearchRow[]): void {
  const headers = [
    'productId',
    'currentTitle',
    'detectedBrand',
    'detectedModel',
    'currentSpecsSummary',
    'missingFields',
    'confidenceLevel',
    'researchRequired',
    'recommendedAction',
    'imageSearchQuery',
    'uaePriceSearchQuery',
    'ksaPriceSearchQuery',
    'seoKeywordTarget',
  ];

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header as keyof ResearchRow] || ''))
        .join(',')
    ),
  ];

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function writeTemplateCsv(filePath: string, rows: ResearchRow[]): void {
  const headers = [
    'productId',
    'currentTitle',
    'detectedBrand',
    'detectedModel',
    'currentSpecsSummary',
    'missingFields',
    'confidenceLevel',
    'researchRequired',
    'recommendedAction',
    'imageSearchQuery',
    'uaePriceSearchQuery',
    'ksaPriceSearchQuery',
    'seoKeywordTarget',
    'verifiedImageUrl1',
    'verifiedImageUrl2',
    'verifiedUaePrice',
    'verifiedKsaPrice',
    'approvedForApply',
    'manualReviewerNotes',
  ];

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.productId,
        row.currentTitle,
        row.detectedBrand,
        row.detectedModel,
        row.currentSpecsSummary,
        row.missingFields,
        row.confidenceLevel,
        row.researchRequired,
        row.recommendedAction,
        row.imageSearchQuery,
        row.uaePriceSearchQuery,
        row.ksaPriceSearchQuery,
        row.seoKeywordTarget,
        '',
        '',
        '',
        '',
        'false',
        '',
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function main(): void {
  const audit = readJsonFile<AuditFile>(auditPath);
  const db = readJsonFile<{ products?: Product[] }>(dbPath);
  const auditById = new Map<string, AuditProduct>();
  for (const item of audit.products || []) {
    const id = normalizeText(item.id);
    if (id) auditById.set(id, item);
  }

  const drafts = getDraftProducts(Array.isArray(db.products) ? db.products : []);
  const rows = drafts.map((product) => buildResearchRow(product, auditById.get(normalizeText(product.id))));

  const highRows = rows.filter((row) => row.confidenceLevel === 'high');
  const mediumRows = rows.filter((row) => row.confidenceLevel === 'medium');
  const lowRows = rows.filter((row) => row.confidenceLevel === 'low');

  const productById = new Map<string, Product>();
  for (const product of drafts) {
    const id = normalizeText(product.id);
    if (id) productById.set(id, product);
  }

  const suggestedUpdates: SuggestedUpdatesFile = {
    generatedAt: new Date().toISOString(),
    totalHighConfidenceProducts: highRows.length,
    updates: highRows
      .map((row) => {
        const product = productById.get(row.productId);
        return product ? buildSuggestedUpdate(product, row) : null;
      })
      .filter((item): item is SuggestedUpdate => Boolean(item)),
  };

  fs.mkdirSync(outputDir, { recursive: true });
  writeResearchCsv(highCsvPath, highRows);
  writeResearchCsv(mediumCsvPath, mediumRows);
  writeResearchCsv(lowCsvPath, lowRows);
  writeTemplateCsv(templateCsvPath, rows);
  fs.writeFileSync(suggestedUpdatesPath, `${JSON.stringify(suggestedUpdates, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        totals: {
          all: rows.length,
          high: highRows.length,
          medium: mediumRows.length,
          low: lowRows.length,
        },
        files: {
          high: path.relative(cwd, highCsvPath),
          medium: path.relative(cwd, mediumCsvPath),
          low: path.relative(cwd, lowCsvPath),
          template: path.relative(cwd, templateCsvPath),
          suggestedUpdates: path.relative(cwd, suggestedUpdatesPath),
        },
      },
      null,
      2
    )
  );
}

main();
