import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeProductSpecifications, validateProductSpecificationsForTemplate } from './validators/productSpecifications';

type GenericRecord = Record<string, any>;

export type BulkUploadMode = 'admin' | 'seller';

export type BulkUploadEditableRow = {
  clientId: string;
  rowNumber: number;
  productTitle: string;
  sku: string;
  brand: string;
  model: string;
  parentCategory: string;
  category: string;
  subcategory: string;
  productType: string;
  condition: string;
  shortDescription: string;
  longDescription: string;
  productHighlights: string;
  sellerNotes: string;
  buyerNotes: string;
  regularPrice: string;
  salePrice: string;
  costPrice: string;
  discountPercentage: string;
  currency: string;
  vatStatus: string;
  shippingPrice: string;
  codAvailable: string;
  tabbyEligible: string;
  tamaraEligible: string;
  stockQuantity: string;
  lowStockAlert: string;
  availability: string;
  warehouseLocation: string;
  barcode: string;
  serialNumber: string;
  productStatus: string;
  visibilityStatus: string;
  approvalStatus: string;
  mainImageUrl: string;
  galleryImageUrls: string[];
  thumbnailUrl: string;
  imageAltText: string;
  color: string;
  storage: string;
  ram: string;
  size: string;
  capacity: string;
  material: string;
  connectivity: string;
  compatibility: string;
  processor: string;
  screenSize: string;
  graphics: string;
  operatingSystem: string;
  batteryHealth: string;
  camera: string;
  refreshRate: string;
  chipset: string;
  network: string;
  simType: string;
  warranty: string;
  boxContents: string;
  dimensions: string;
  weight: string;
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  metaKeywords: string;
  breadcrumbCategoryData: string;
  sellerName: string;
  sellerId: string;
  sellerType: string;
  exshopiOfficial: string;
  vendorCommission: string;
  adminApprovalRequired: string;
  sellerStoreVisibility: string;
  deliveryCountry: string;
  uaeDeliveryAvailable: string;
  saudiDeliveryAvailable: string;
  gccDeliveryAvailable: string;
  shippingTime: string;
  warrantyPolicy: string;
  returnPolicy: string;
  codFee: string;
  featuredProduct: string;
  bestSeller: string;
  mostPopular: string;
  eidOffer: string;
  blackFridaySection: string;
  dealTimer: string;
  flashSalePrice: string;
  homepageSectionVisibility: string;
};

export type BulkUploadPreviewRow = {
  clientId: string;
  rowNumber: number;
  fields: BulkUploadEditableRow;
  resolved: {
    sellerName: string;
    sellerId: string;
    parentCategoryName: string;
    parentCategorySlug: string;
    categoryName: string;
    categorySlug: string;
    subcategoryName: string;
    subcategorySlug: string;
    seoSlug: string;
    status: string;
  };
  errors: string[];
  warnings: string[];
  canImport: boolean;
};

function text(value: unknown) {
  return value == null ? '' : String(value).trim();
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function slugify(value: unknown) {
  return text(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNumberString(value: unknown) {
  const raw = text(value);
  if (!raw) return '';
  const normalized = raw.replace(/[^0-9.\-]/g, '');
  return normalized && !Number.isNaN(Number(normalized)) ? normalized : raw;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function intValue(value: unknown, fallback = 0) {
  return Math.max(0, Math.round(numberValue(value, fallback)));
}

function boolString(value: unknown) {
  const normalized = lower(value);
  if (!normalized) return '';
  if (['1', 'true', 'yes', 'y', 'enabled', 'available', 'live'].includes(normalized)) return 'yes';
  if (['0', 'false', 'no', 'n', 'disabled', 'hidden'].includes(normalized)) return 'no';
  return text(value);
}

function splitList(value: unknown) {
  return text(value)
    .split(/\r?\n|[,|;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  return values.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSafeDraftSku(inputSku: string, rowNumber: number) {
  const base = text(inputSku)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${base || 'EXSHOPI-DRAFT'}-DRAFT-${rowNumber}`;
}

const PRODUCT_PLACEHOLDER_IMAGE = '/assets/product-placeholder.png';
const LAPTOP_CATEGORY_SLUG = 'laptops';
const LAPTOP_SUBCATEGORY_OPTIONS = [
  { id: 'macbooks', name: 'MacBooks', slug: 'macbooks' },
  { id: 'business-laptops', name: 'Business Laptops', slug: 'business-laptops' },
  { id: 'gaming-laptops', name: 'Gaming Laptops', slug: 'gaming-laptops' },
  { id: 'used-windows-laptops', name: 'Used Windows Laptops', slug: 'used-windows-laptops' },
  { id: 'chromebooks', name: 'Chromebooks', slug: 'chromebooks' },
  { id: 'premium-ultrabooks', name: 'Premium Ultrabooks', slug: 'premium-ultrabooks' },
] as const;

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function normalizeHeaderKey(value: string) {
  return slugify(value).replace(/-/g, '_');
}

function parseCsvContent(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((cell) => text(cell));
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = text(cells[index] ?? '');
    });
    return record;
  });
}

async function writeTempFile(fileName: string, dataBase64: string) {
  const extension = path.extname(fileName || '').toLowerCase() || '.tmp';
  const tempPath = path.join(os.tmpdir(), `exshopi-bulk-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  await fs.writeFile(tempPath, Buffer.from(dataBase64, 'base64'));
  return tempPath;
}

function readZipText(filePath: string, innerPath: string) {
  return execFileSync('unzip', ['-p', filePath, innerPath], { encoding: 'utf8' });
}

function parseSharedStrings(filePath: string) {
  try {
    const xml = readZipText(filePath, 'xl/sharedStrings.xml');
    return [...xml.matchAll(/<si[\s\S]*?>([\s\S]*?)<\/si>/g)].map((match) => {
      const segment = match[1] || '';
      return [...segment.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((entry) => decodeXml(entry[1] || ''))
        .join('');
    });
  } catch {
    return [] as string[];
  }
}

function columnIndexToLetters(index: number) {
  let current = index;
  let result = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function parseXlsxRows(filePath: string): Record<string, string>[] {
  const sharedStrings = parseSharedStrings(filePath);
  const xml = readZipText(filePath, 'xl/worksheets/sheet1.xml');
  const rowMatches = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  if (!rowMatches.length) return [];

  const parseCell = (cellXml: string) => {
    const typeMatch = cellXml.match(/\bt="([^"]+)"/);
    const type = typeMatch?.[1] || '';

    if (type === 'inlineStr') {
      return [...cellXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((entry) => decodeXml(entry[1] || ''))
        .join('');
    }

    const valueMatch = cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/);
    const rawValue = valueMatch?.[1] || '';
    if (type === 's') {
      return sharedStrings[Number(rawValue)] || '';
    }
    return decodeXml(rawValue);
  };

  const readRow = (rowXml: string) => {
    const cells = [...rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)];
    const byColumn = new Map<string, string>();

    for (const [, attributes, cellBody] of cells) {
      const refMatch = attributes.match(/\br="([A-Z]+)\d+"/);
      const columnRef = refMatch?.[1];
      if (!columnRef) continue;
      byColumn.set(columnRef, parseCell(`<c ${attributes}>${cellBody}</c>`));
    }

    return byColumn;
  };

  const headersByColumn = readRow(rowMatches[0][1] || '');
  const headerColumns = [...headersByColumn.keys()].sort((a, b) => a.localeCompare(b));
  const headers = headerColumns.map((column) => headersByColumn.get(column) || '');
  const rows: Record<string, string>[] = [];

  for (const match of rowMatches.slice(1)) {
    const row = readRow(match[1] || '');
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      result[header] = row.get(columnIndexToLetters(index + 1)) || '';
    });
    rows.push(result);
  }

  return rows;
}

export async function parseBulkUploadFile(fileName: string, fileDataBase64: string) {
  const extension = path.extname(fileName || '').toLowerCase();

  if (extension === '.csv') {
    return parseCsvContent(Buffer.from(fileDataBase64, 'base64').toString('utf8'));
  }

  if (extension === '.xlsx') {
    const tempPath = await writeTempFile(fileName, fileDataBase64);
    try {
      return parseXlsxRows(tempPath);
    } finally {
      await fs.unlink(tempPath).catch(() => undefined);
    }
  }

  throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');
}

function toNormalizedMap(record: Record<string, string>) {
  const mapped: Record<string, string> = {};
  Object.entries(record || {}).forEach(([key, value]) => {
    mapped[normalizeHeaderKey(key)] = text(value);
  });
  return mapped;
}

function pick(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return '';
}

function collectImageUrls(record: Record<string, string>) {
  const list = [
    pick(record, ['main_image_url', 'main_image', 'image', 'image_url', 'thumbnail_image']),
    ...Array.from({ length: 10 }, (_, index) => pick(record, [`image_url_${index + 1}`, `gallery_image_${index + 1}`])),
    ...splitList(pick(record, ['gallery_image_urls', 'gallery_images', 'images', 'product_images'])),
  ]
    .map((value) => text(value))
    .filter(Boolean);

  return dedupe(list);
}

function resolveFieldRow(record: Record<string, string>, rowNumber: number): BulkUploadEditableRow {
  const images = collectImageUrls(record);
  const mainImageUrl = images[0] || '';
  const galleryImageUrls = images.slice(1, 8);

  return {
    clientId: `bulk-row-${Date.now()}-${rowNumber}-${Math.random().toString(36).slice(2, 8)}`,
    rowNumber,
    productTitle: pick(record, ['product_title', 'title', 'name']),
    sku: pick(record, ['sku', 'product_sku']),
    brand: pick(record, ['brand']),
    model: pick(record, ['model']),
    parentCategory: pick(record, ['parent_category', 'parentcategory', 'parent']),
    category: pick(record, ['category']),
    subcategory: pick(record, ['subcategory', 'sub_category']),
    productType: pick(record, ['product_type', 'type']),
    condition: pick(record, ['condition']),
    shortDescription: pick(record, ['short_description', 'description_short']),
    longDescription: pick(record, ['long_description', 'description', 'full_description']),
    productHighlights: pick(record, ['product_highlights', 'highlights', 'key_features']),
    sellerNotes: pick(record, ['seller_notes', 'seller_note']),
    buyerNotes: pick(record, ['buyer_notes', 'buyer_note']),
    regularPrice: toNumberString(pick(record, ['regular_price', 'price', 'price_uae'])),
    salePrice: toNumberString(pick(record, ['sale_price', 'flash_sale_price', 'selling_price'])),
    costPrice: toNumberString(pick(record, ['cost_price'])),
    discountPercentage: toNumberString(pick(record, ['discount_percentage', 'discount_percent'])),
    currency: pick(record, ['currency']),
    vatStatus: pick(record, ['vat_status']),
    shippingPrice: toNumberString(pick(record, ['shipping_price'])),
    codAvailable: boolString(pick(record, ['cod_available'])),
    tabbyEligible: boolString(pick(record, ['tabby_eligible'])),
    tamaraEligible: boolString(pick(record, ['tamara_eligible'])),
    stockQuantity: toNumberString(pick(record, ['stock_quantity', 'stock', 'qty'])),
    lowStockAlert: toNumberString(pick(record, ['low_stock_alert'])),
    availability: pick(record, ['availability']),
    warehouseLocation: pick(record, ['warehouse_location', 'warehouse']),
    barcode: pick(record, ['barcode']),
    serialNumber: pick(record, ['serial_number']),
    productStatus: pick(record, ['product_status', 'status']),
    visibilityStatus: pick(record, ['visibility_status']),
    approvalStatus: pick(record, ['approval_status']),
    mainImageUrl,
    galleryImageUrls,
    thumbnailUrl: pick(record, ['thumbnail_image', 'thumbnail_url']) || mainImageUrl,
    imageAltText: pick(record, ['image_alt_text', 'alt_text']),
    color: pick(record, ['color', 'colours', 'colors']),
    storage: pick(record, ['storage']),
    ram: pick(record, ['ram']),
    size: pick(record, ['size']),
    capacity: pick(record, ['capacity']),
    material: pick(record, ['material']),
    connectivity: pick(record, ['connectivity']),
    compatibility: pick(record, ['compatibility']),
    processor: pick(record, ['processor', 'cpu']),
    screenSize: pick(record, ['screen_size', 'display_size']),
    graphics: pick(record, ['graphics', 'gpu']),
    operatingSystem: pick(record, ['operating_system', 'os']),
    batteryHealth: pick(record, ['battery_health']),
    camera: pick(record, ['camera']),
    refreshRate: pick(record, ['refresh_rate']),
    chipset: pick(record, ['chipset']),
    network: pick(record, ['network']),
    simType: pick(record, ['sim_type']),
    warranty: pick(record, ['warranty']),
    boxContents: pick(record, ['box_contents', 'whats_in_the_box']),
    dimensions: pick(record, ['dimensions']),
    weight: pick(record, ['weight']),
    seoTitle: pick(record, ['seo_title', 'meta_title']),
    seoDescription: pick(record, ['seo_description', 'meta_description']),
    seoSlug: pick(record, ['seo_slug', 'slug']),
    metaKeywords: pick(record, ['meta_keywords', 'seo_keywords']),
    breadcrumbCategoryData: pick(record, ['breadcrumb_category_data']),
    sellerName: pick(record, ['seller_name', 'vendor_name']),
    sellerId: pick(record, ['seller_id', 'vendor_id']),
    sellerType: pick(record, ['seller_type']),
    exshopiOfficial: boolString(pick(record, ['exshopi_official'])),
    vendorCommission: toNumberString(pick(record, ['vendor_commission', 'commission_rate'])),
    adminApprovalRequired: boolString(pick(record, ['admin_approval_required'])),
    sellerStoreVisibility: pick(record, ['seller_store_visibility']),
    deliveryCountry: pick(record, ['delivery_country', 'country']),
    uaeDeliveryAvailable: boolString(pick(record, ['uae_delivery_available'])),
    saudiDeliveryAvailable: boolString(pick(record, ['saudi_delivery_available', 'ksa_delivery_available'])),
    gccDeliveryAvailable: boolString(pick(record, ['gcc_delivery_available'])),
    shippingTime: pick(record, ['shipping_time']),
    warrantyPolicy: pick(record, ['warranty_policy']),
    returnPolicy: pick(record, ['return_policy']),
    codFee: toNumberString(pick(record, ['cod_fee'])),
    featuredProduct: boolString(pick(record, ['featured_product'])),
    bestSeller: boolString(pick(record, ['best_seller'])),
    mostPopular: boolString(pick(record, ['most_popular'])),
    eidOffer: boolString(pick(record, ['eid_offer'])),
    blackFridaySection: boolString(pick(record, ['black_friday_section'])),
    dealTimer: pick(record, ['deal_timer']),
    flashSalePrice: toNumberString(pick(record, ['flash_sale_price'])),
    homepageSectionVisibility: pick(record, ['homepage_section_visibility']),
  };
}

function normalizeCategories(categories: GenericRecord[]) {
  return (categories || [])
    .map((category) => ({
      id: text(category.id),
      name: text(category.name),
      slug: text(category.slug),
      categories: Array.isArray(category.subcategories)
        ? category.subcategories.map((entry: any) => ({
            id: text(entry.id),
            name: text(entry.name),
            slug: text(entry.slug),
          subcategories: Array.isArray(entry.childCategories)
              ? entry.childCategories.map((child: any) => ({
                  id: text(child.id),
                  name: text(child.name),
                  slug: text(child.slug),
                }))
              : lower(entry.slug) === LAPTOP_CATEGORY_SLUG || lower(entry.name) === LAPTOP_CATEGORY_SLUG
              ? [...LAPTOP_SUBCATEGORY_OPTIONS]
              : [],
          }))
        : [],
    }))
    .filter((entry) => entry.id && entry.slug);
}

function buildLaptopSearchCorpus(fieldRow: BulkUploadEditableRow) {
  return lower(
    [
      fieldRow.productTitle,
      fieldRow.model,
      fieldRow.brand,
      fieldRow.operatingSystem,
      fieldRow.shortDescription,
      fieldRow.longDescription,
      fieldRow.productHighlights,
      fieldRow.processor,
    ].join(' ')
  );
}

function inferLaptopSubcategory(fieldRow: BulkUploadEditableRow) {
  const corpus = buildLaptopSearchCorpus(fieldRow);
  const brand = lower(fieldRow.brand);

  if (!corpus) {
    return { slug: 'used-windows-laptops', name: 'Used Windows Laptops', reason: 'fallback' as const };
  }

  if (corpus.includes('chromebook') || corpus.includes('chrome os')) {
    return { slug: 'chromebooks', name: 'Chromebooks', reason: 'keyword' as const };
  }

  if (
    corpus.includes('macbook') ||
    corpus.includes('mac book') ||
    (brand === 'apple' && corpus.includes('macos'))
  ) {
    return { slug: 'macbooks', name: 'MacBooks', reason: 'keyword' as const };
  }

  if (
    corpus.includes('surface') ||
    corpus.includes('ultrabook') ||
    corpus.includes('ultra book') ||
    corpus.includes('xps 13') ||
    corpus.includes('x1 carbon')
  ) {
    return { slug: 'premium-ultrabooks', name: 'Premium Ultrabooks', reason: 'keyword' as const };
  }

  if (
    corpus.includes('rog') ||
    corpus.includes('legion') ||
    corpus.includes('predator') ||
    corpus.includes('msi') ||
    corpus.includes('gaming') ||
    corpus.includes('tuf') ||
    corpus.includes('omen')
  ) {
    return { slug: 'gaming-laptops', name: 'Gaming Laptops', reason: 'keyword' as const };
  }

  if (
    corpus.includes('latitude') ||
    corpus.includes('elitebook') ||
    corpus.includes('probook') ||
    corpus.includes('thinkpad') ||
    corpus.includes('travelmate') ||
    corpus.includes('lifebook')
  ) {
    return { slug: 'business-laptops', name: 'Business Laptops', reason: 'keyword' as const };
  }

  if (
    ['dell', 'hp', 'lenovo', 'acer', 'asus', 'toshiba', 'fujitsu'].includes(brand) ||
    corpus.includes('windows') ||
    corpus.includes('intel') ||
    corpus.includes('amd')
  ) {
    return { slug: 'used-windows-laptops', name: 'Used Windows Laptops', reason: 'fallback' as const };
  }

  return { slug: 'used-windows-laptops', name: 'Used Windows Laptops', reason: 'fallback' as const };
}

function inferProcessorBrand(fieldRow: BulkUploadEditableRow) {
  const processorText = lower(`${fieldRow.processor} ${fieldRow.productTitle} ${fieldRow.model}`);
  if (processorText.includes('ryzen') || processorText.includes('athlon') || processorText.includes('amd')) {
    return 'AMD';
  }
  if (processorText.includes('snapdragon') || processorText.includes('qualcomm')) {
    return 'Qualcomm';
  }
  if (
    processorText.includes('m1') ||
    processorText.includes('m2') ||
    processorText.includes('m3') ||
    processorText.includes('apple silicon')
  ) {
    return 'Apple';
  }
  return 'Intel';
}

function buildDefaultHighlights(fieldRow: BulkUploadEditableRow) {
  const candidates = [
    fieldRow.productHighlights,
    fieldRow.shortDescription,
    fieldRow.processor ? `Processor: ${fieldRow.processor}` : '',
    fieldRow.ram ? `RAM: ${fieldRow.ram}` : '',
    fieldRow.storage ? `Storage: ${fieldRow.storage}` : '',
    fieldRow.screenSize ? `Display: ${fieldRow.screenSize}` : '',
    fieldRow.operatingSystem ? `OS: ${fieldRow.operatingSystem}` : '',
    fieldRow.condition ? `Condition: ${fieldRow.condition}` : '',
  ];

  const flattened = dedupe(
    candidates
      .flatMap((item) => splitList(item))
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const fallbacks = [
    fieldRow.brand && fieldRow.model ? `${fieldRow.brand} ${fieldRow.model}` : fieldRow.productTitle,
    fieldRow.storage ? `${fieldRow.storage} storage` : 'Catalog-ready product',
    fieldRow.condition ? `${fieldRow.condition} condition` : 'Ready for marketplace listing',
  ]
    .map((item) => text(item))
    .filter(Boolean);

  return dedupe([...flattened, ...fallbacks]).slice(0, 10);
}

function resolveCategoryMatch(
  categories: ReturnType<typeof normalizeCategories>,
  fieldRow: BulkUploadEditableRow
) {
  const parentCandidates = [
    fieldRow.parentCategory,
    fieldRow.category,
  ]
    .map((value) => lower(value))
    .filter(Boolean);

  const parent =
    categories.find((entry) => parentCandidates.includes(lower(entry.slug)) || parentCandidates.includes(lower(entry.name))) ||
    null;

  if (!parent) {
    return { parent: null, subcategory: null };
  }

  const categoryCandidates = [fieldRow.category, fieldRow.productType]
    .map((value) => lower(value))
    .filter(Boolean);

  const category =
    parent.categories.find((entry) => categoryCandidates.includes(lower(entry.slug)) || categoryCandidates.includes(lower(entry.name))) ||
    null;

  const subCandidates = [fieldRow.subcategory]
    .map((value) => lower(value))
    .filter(Boolean);

  let subcategory =
    category?.subcategories.find(
      (entry) => subCandidates.includes(lower(entry.slug)) || subCandidates.includes(lower(entry.name))
    ) || null;

  if (
    category &&
    (lower(category.slug) === LAPTOP_CATEGORY_SLUG || lower(category.name) === LAPTOP_CATEGORY_SLUG) &&
    !subcategory
  ) {
    const inferred = inferLaptopSubcategory(fieldRow);
    subcategory = category.subcategories.find((entry) => lower(entry.slug) === inferred.slug) || {
      id: inferred.slug,
      slug: inferred.slug,
      name: inferred.name,
    };
  }

  return { parent, category, subcategory };
}

function normalizeSellers(sellers: GenericRecord[]) {
  return (sellers || []).map((seller) => ({
    id: text(seller.id),
    userId: text(seller.userId),
    storeName: text(seller.storeName),
    storeSlug: text(seller.storeSlug),
    email: text(seller.email),
    isOfficial: Boolean(seller.isOfficial),
    commissionRate: Number(seller.commissionRate || 0),
    status: text(seller.status),
  }));
}

function resolveSellerMatch(
  sellers: ReturnType<typeof normalizeSellers>,
  fieldRow: BulkUploadEditableRow,
  mode: BulkUploadMode,
  uploaderSeller: { id?: string; storeName?: string } | null
) {
  if (mode === 'seller' && uploaderSeller?.id) {
    const seller = sellers.find((entry) => entry.id === uploaderSeller.id) || null;
    return seller;
  }

  if (fieldRow.sellerId) {
    const direct = sellers.find((entry) => entry.id === fieldRow.sellerId);
    if (direct) return direct;
  }

  const sellerName = lower(fieldRow.sellerName);
  if (sellerName) {
    const byName = sellers.find(
      (entry) => sellerName === lower(entry.storeName) || sellerName === lower(entry.storeSlug) || sellerName === lower(entry.email)
    );
    if (byName) return byName;
  }

  if (fieldRow.exshopiOfficial === 'yes' || lower(fieldRow.sellerType) === 'exshopi official' || mode === 'admin') {
    return sellers.find((entry) => entry.isOfficial) || null;
  }

  return null;
}

async function verifyImageUrl(url: string) {
  if (!url) return { ok: false, message: 'Missing image URL' };

  try {
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return { ok: false, message: 'Image URL must use http or https' };
    }
  } catch {
    return { ok: false, message: 'Image URL is not a valid absolute URL' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    }).catch(async () =>
      fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      })
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, message: `Image URL returned ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !contentType.startsWith('image/')) {
      return { ok: false, message: `Image URL returned non-image content (${contentType})` };
    }
    return { ok: true, message: '' };
  } catch {
    return { ok: false, message: 'Image URL could not be verified' };
  }
}

function resolveLifecycle(fieldRow: BulkUploadEditableRow, mode: BulkUploadMode) {
  const approvalStatus = lower(fieldRow.approvalStatus);
  const visibilityStatus = lower(fieldRow.visibilityStatus);
  const requestedStatus = lower(fieldRow.productStatus);

  if (mode === 'seller') {
    return {
      status: 'pending',
      approvalStatus: 'pending',
      visibilityStatus: 'hidden',
    };
  }

  if (requestedStatus === 'draft' || visibilityStatus === 'hidden') {
    return {
      status: 'draft',
      approvalStatus: 'pending',
      visibilityStatus: 'hidden',
    };
  }

  if (approvalStatus === 'pending' || requestedStatus === 'pending') {
    return {
      status: 'pending',
      approvalStatus: 'pending',
      visibilityStatus: 'hidden',
    };
  }

  if (approvalStatus === 'rejected' || requestedStatus === 'rejected') {
    return {
      status: 'rejected',
      approvalStatus: 'rejected',
      visibilityStatus: 'hidden',
    };
  }

  return {
    status: 'approved',
    approvalStatus: 'approved',
    visibilityStatus: 'live',
  };
}

function normalizeSlugTitle(fieldRow: BulkUploadEditableRow) {
  return slugify(fieldRow.seoSlug || fieldRow.productTitle);
}

export async function buildBulkUploadPreviewRows(input: {
  parsedRows: Record<string, string>[];
  existingProducts: GenericRecord[];
  categories: GenericRecord[];
  sellers: GenericRecord[];
  mode: BulkUploadMode;
  uploaderSeller?: { id?: string; storeName?: string } | null;
}) {
  const categories = normalizeCategories(input.categories);
  const sellers = normalizeSellers(input.sellers);
  const existingSkuSet = new Set(
    (input.existingProducts || []).map((product) => lower(product.sku)).filter(Boolean)
  );
  const existingSlugSet = new Set(
    (input.existingProducts || []).map((product) => lower(product.slug || product.title)).filter(Boolean)
  );
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  const rows = await Promise.all(
    input.parsedRows.map(async (rawRow, index) => {
      const normalizedRecord = toNormalizedMap(rawRow);
      const fieldRow = resolveFieldRow(normalizedRecord, index + 2);
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!fieldRow.productTitle) {
        errors.push('Missing product title');
      }

      const currentSlug = normalizeSlugTitle(fieldRow);
      if (!currentSlug) {
        errors.push('Missing or invalid SEO slug');
      }

      if (!fieldRow.stockQuantity) {
        errors.push('Missing stock quantity');
      } else if (intValue(fieldRow.stockQuantity, -1) < 0) {
        errors.push('Invalid stock quantity');
      }

      const sellingPrice = numberValue(fieldRow.salePrice || fieldRow.regularPrice, NaN);
      if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
        errors.push('Invalid selling price');
      }

      const categoryMatch = resolveCategoryMatch(categories, fieldRow);
      const isLaptopCategory =
        lower(categoryMatch.category?.slug || categoryMatch.category?.name || '') === LAPTOP_CATEGORY_SLUG;

      if (!categoryMatch.parent) {
        errors.push('Invalid parent/category mapping');
      } else if (fieldRow.category && !categoryMatch.category) {
        errors.push('Needs category mapping');
      } else if (fieldRow.subcategory && !categoryMatch.subcategory && !isLaptopCategory) {
        warnings.push('Needs subcategory mapping');
      } else if (!fieldRow.subcategory && isLaptopCategory && categoryMatch.subcategory) {
        warnings.push(`Auto-mapped laptop subcategory: ${categoryMatch.subcategory.name}`);
      } else if (fieldRow.subcategory && isLaptopCategory && categoryMatch.subcategory) {
        warnings.push(`Smart-mapped laptop subcategory: ${categoryMatch.subcategory.name}`);
      }

      const sellerMatch = resolveSellerMatch(sellers, fieldRow, input.mode, input.uploaderSeller || null);
      if (input.mode === 'admin' && !sellerMatch) {
        errors.push('Invalid seller');
      }

      const normalizedSku = lower(fieldRow.sku);
      const resolvedSku = normalizedSku && existingSkuSet.has(normalizedSku)
        ? buildSafeDraftSku(fieldRow.sku, fieldRow.rowNumber)
        : fieldRow.sku;
      if (normalizedSku) {
        if (seenSkus.has(normalizedSku)) errors.push('Duplicate SKU found in upload file');
        seenSkus.add(normalizedSku);
        if (existingSkuSet.has(normalizedSku)) {
          warnings.push(`Duplicate SKU already exists. Draft SKU will be changed to ${resolvedSku}`);
        }
      }

      const normalizedSlug = lower(currentSlug);
      if (normalizedSlug) {
        if (existingSlugSet.has(normalizedSlug)) errors.push('Duplicate product slug already exists');
        if (seenSlugs.has(normalizedSlug)) errors.push('Duplicate slug found in upload file');
        seenSlugs.add(normalizedSlug);
      }

      if (!fieldRow.mainImageUrl) {
        warnings.push('Missing main image URL. Placeholder will be used unless you upload one.');
      } else {
        const imageCheck = await verifyImageUrl(fieldRow.mainImageUrl);
        if (!imageCheck.ok) {
          warnings.push(imageCheck.message);
        }
      }

      if (fieldRow.approvalStatus && !['pending', 'approved', 'rejected'].includes(lower(fieldRow.approvalStatus))) {
        errors.push('Invalid approval status');
      }

      const lifecycle = resolveLifecycle(fieldRow, input.mode);

      if (errors.length === 0) {
        try {
          const previewPayload = buildBulkImportPayload({
            row: fieldRow,
            mode: input.mode,
            categories: input.categories,
            sellers: input.sellers,
            uploaderSeller: input.uploaderSeller || null,
          });
          const normalizedPreviewSpecs = normalizeProductSpecifications(previewPayload.specs || {}, {
            parentCategorySlug: previewPayload.specs?.parentCategorySlug || '',
            parentCategoryName: previewPayload.specs?.parentCategoryName || '',
            categorySlug: previewPayload.specs?.categorySlug || '',
            categoryName: previewPayload.specs?.categoryName || '',
            subcategorySlug: previewPayload.specs?.subcategorySlug || '',
            subcategoryName: previewPayload.specs?.subcategoryName || '',
            title: previewPayload.title || fieldRow.productTitle,
          });

          if (lifecycle.status !== 'draft') {
            validateProductSpecificationsForTemplate(normalizedPreviewSpecs.specs, normalizedPreviewSpecs.template, {
              requireHighlights: true,
            });
          }
        } catch (validationError) {
          errors.push(String(validationError instanceof Error ? validationError.message : validationError));
        }
      }

      return {
        clientId: fieldRow.clientId,
        rowNumber: fieldRow.rowNumber,
        fields: {
          ...fieldRow,
          sku: resolvedSku,
          seoSlug: fieldRow.seoSlug || currentSlug,
          sellerId: sellerMatch?.id || fieldRow.sellerId,
          sellerName: sellerMatch?.storeName || fieldRow.sellerName,
          approvalStatus: fieldRow.approvalStatus || lifecycle.approvalStatus,
          visibilityStatus: fieldRow.visibilityStatus || lifecycle.visibilityStatus,
          productStatus: fieldRow.productStatus || lifecycle.status,
        },
        resolved: {
          sellerName: sellerMatch?.storeName || fieldRow.sellerName || (input.mode === 'seller' ? input.uploaderSeller?.storeName || '' : 'ExShopi Official'),
          sellerId: sellerMatch?.id || fieldRow.sellerId || '',
          parentCategoryName: categoryMatch.parent?.name || '',
          parentCategorySlug: categoryMatch.parent?.slug || '',
          categoryName: categoryMatch.category?.name || fieldRow.category || '',
          categorySlug: categoryMatch.category?.slug || slugify(fieldRow.category),
          subcategoryName: categoryMatch.subcategory?.name || fieldRow.subcategory || '',
          subcategorySlug: categoryMatch.subcategory?.slug || slugify(fieldRow.subcategory),
          seoSlug: currentSlug,
          status: lifecycle.status,
        },
        errors,
        warnings,
        canImport: errors.length === 0,
      } satisfies BulkUploadPreviewRow;
    })
  );

  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((row) => row.canImport).length,
      invalid: rows.filter((row) => !row.canImport).length,
      warnings: rows.reduce((sum, row) => sum + row.warnings.length, 0),
    },
  };
}

export function buildBulkImportPayload(input: {
  row: BulkUploadEditableRow;
  mode: BulkUploadMode;
  categories: GenericRecord[];
  sellers: GenericRecord[];
  uploaderSeller?: { id?: string; storeName?: string } | null;
}) {
  const fieldRow = input.row;
  const categories = normalizeCategories(input.categories);
  const sellers = normalizeSellers(input.sellers);
  const categoryMatch = resolveCategoryMatch(categories, fieldRow);
  const sellerMatch = resolveSellerMatch(sellers, fieldRow, input.mode, input.uploaderSeller || null);
  const lifecycle = resolveLifecycle(fieldRow, input.mode);

  if (!fieldRow.productTitle) throw new Error('Product title is required.');
  if (!categoryMatch.parent) throw new Error('Valid parent category is required.');
  if (fieldRow.category && !categoryMatch.category) throw new Error('Valid category is required.');
  if (!sellerMatch) throw new Error('Valid seller is required.');

  const allImages = dedupe([fieldRow.mainImageUrl || PRODUCT_PLACEHOLDER_IMAGE, ...fieldRow.galleryImageUrls].filter(Boolean)).slice(0, 8);
  const regularPrice = numberValue(fieldRow.regularPrice, 0);
  const salePrice = numberValue(fieldRow.salePrice || fieldRow.flashSalePrice, regularPrice || 0);
  const finalPrice = salePrice > 0 ? salePrice : regularPrice;
  const compareAt = regularPrice > finalPrice ? regularPrice : finalPrice;
  const highlights = buildDefaultHighlights(fieldRow);
  const boxContents = dedupe(splitList(fieldRow.boxContents)).slice(0, 12);
  const badges = [
    fieldRow.featuredProduct === 'yes' ? 'Featured' : '',
    fieldRow.bestSeller === 'yes' ? 'Best Seller' : '',
    fieldRow.mostPopular === 'yes' ? 'Most Popular' : '',
    fieldRow.eidOffer === 'yes' ? 'Eid Offer' : '',
    fieldRow.blackFridaySection === 'yes' ? 'Black Friday' : '',
  ].filter(Boolean);

  const processorBrand = inferProcessorBrand(fieldRow);
  const specificationValues = {
    brand: fieldRow.brand,
    model: fieldRow.model || fieldRow.productTitle,
    series: fieldRow.model,
    product_type: fieldRow.productType,
    condition: fieldRow.condition || 'Refurbished',
    color: fieldRow.color,
    storage: fieldRow.storage,
    ram: fieldRow.ram,
    size: fieldRow.size,
    capacity: fieldRow.capacity,
    material: fieldRow.material,
    connectivity: fieldRow.connectivity,
    compatibility: fieldRow.compatibility,
    processorBrand,
    processor: fieldRow.processor,
    generation: '',
    screenSize: fieldRow.screenSize,
    screenResolution: '',
    graphics: fieldRow.graphics,
    operatingSystem: fieldRow.operatingSystem,
    batteryHealth: fieldRow.batteryHealth,
    rearCamera: fieldRow.camera,
    frontCamera: '',
    camera: fieldRow.camera,
    refreshRate: fieldRow.refreshRate,
    chipset: fieldRow.chipset,
    network: fieldRow.network,
    simType: fieldRow.simType,
    warranty: fieldRow.warranty,
    boxContents: boxContents,
    dimensions: fieldRow.dimensions,
    weight: fieldRow.weight,
    warrantyPolicy: fieldRow.warrantyPolicy,
    returnPolicy: fieldRow.returnPolicy,
    shippingWeight: fieldRow.weight,
    packageSize: fieldRow.dimensions,
    stock_location: fieldRow.warehouseLocation,
    barcode: fieldRow.barcode,
    serial_number: fieldRow.serialNumber,
    delivery_country: fieldRow.deliveryCountry,
    uae_delivery_available: fieldRow.uaeDeliveryAvailable,
    saudi_delivery_available: fieldRow.saudiDeliveryAvailable,
    gcc_delivery_available: fieldRow.gccDeliveryAvailable,
    shipping_time: fieldRow.shippingTime,
    shipping_price: fieldRow.shippingPrice,
    cod_available: fieldRow.codAvailable,
    cod_fee: fieldRow.codFee,
    tabby_eligible: fieldRow.tabbyEligible,
    tamara_eligible: fieldRow.tamaraEligible,
    currency: fieldRow.currency,
    vat_status: fieldRow.vatStatus,
    seller_type: fieldRow.sellerType,
    vendor_commission: fieldRow.vendorCommission,
    seller_store_visibility: fieldRow.sellerStoreVisibility,
    breadcrumb_category_data: fieldRow.breadcrumbCategoryData,
    homepage_section_visibility: fieldRow.homepageSectionVisibility,
    deal_timer: fieldRow.dealTimer,
  } as Record<string, any>;

  return {
    sellerId: sellerMatch.id,
    categoryId: categoryMatch.parent.id,
    title: fieldRow.productTitle,
    slug: fieldRow.seoSlug || slugify(fieldRow.productTitle),
    metaTitle: fieldRow.seoTitle || fieldRow.productTitle.slice(0, 60),
    metaDescription: fieldRow.seoDescription || fieldRow.shortDescription || fieldRow.longDescription.slice(0, 160),
    metaKeywords: fieldRow.metaKeywords || '',
    canonicalUrl: '',
    ogTitle: fieldRow.seoTitle || fieldRow.productTitle,
    ogDescription: fieldRow.seoDescription || fieldRow.shortDescription || fieldRow.longDescription.slice(0, 220),
    ogImage: fieldRow.mainImageUrl,
    description: fieldRow.longDescription || fieldRow.shortDescription || fieldRow.productTitle,
    price: finalPrice,
    priceUae: numberValue(fieldRow.regularPrice, finalPrice) ? finalPrice : finalPrice,
    priceKsa: numberValue(fieldRow.shippingPrice, 0) ? undefined : undefined,
    originalPrice: compareAt,
    compareAtPriceUae: compareAt,
    salePrice: finalPrice,
    image: allImages[0],
    images: allImages,
    stock: intValue(fieldRow.stockQuantity, 0),
    sku: fieldRow.sku || buildSafeDraftSku(fieldRow.productTitle || fieldRow.model || 'EXSHOPI', fieldRow.rowNumber),
    brand: fieldRow.brand,
    status: lifecycle.status as any,
    approvalStatus: lifecycle.approvalStatus as any,
    visibilityStatus: lifecycle.visibilityStatus as any,
    ownership: sellerMatch.isOfficial ? 'official' : 'seller',
    createdByRole: input.mode === 'admin' ? 'admin' : 'seller',
    badges,
    specs: {
      shortDescription: fieldRow.shortDescription,
      longDescription: fieldRow.longDescription || fieldRow.shortDescription,
      metaTitle: fieldRow.seoTitle || fieldRow.productTitle.slice(0, 60),
      metaDescription: fieldRow.seoDescription || fieldRow.shortDescription || fieldRow.longDescription.slice(0, 160),
      metaKeywords: fieldRow.metaKeywords || '',
      canonicalUrl: '',
      ogTitle: fieldRow.seoTitle || fieldRow.productTitle,
      ogDescription: fieldRow.seoDescription || fieldRow.shortDescription || fieldRow.longDescription.slice(0, 220),
      ogImage: fieldRow.mainImageUrl,
      briefHighlights: highlights.length >= 3 ? highlights : buildDefaultHighlights(fieldRow),
      keyFeatures: highlights.length >= 3 ? highlights : buildDefaultHighlights(fieldRow),
      whatsInTheBox: boxContents,
      sellerNotes: fieldRow.sellerNotes,
      buyerNotes: fieldRow.buyerNotes,
      shippingWeight: fieldRow.weight,
      packageSize: fieldRow.dimensions,
      returnPolicy: fieldRow.returnPolicy,
      warrantyPolicy: fieldRow.warrantyPolicy || fieldRow.warranty,
      searchTags: dedupe(splitList(fieldRow.metaKeywords)).slice(0, 12),
      parentCategorySlug: categoryMatch.parent.slug,
      parentCategoryName: categoryMatch.parent.name,
      categorySlug: categoryMatch.category?.slug || categoryMatch.parent.slug,
      categoryName: categoryMatch.category?.name || categoryMatch.parent.name,
      subcategorySlug: categoryMatch.subcategory?.slug || '',
      subcategoryName: categoryMatch.subcategory?.name || '',
      categoryPath: [categoryMatch.parent.slug, categoryMatch.category?.slug, categoryMatch.subcategory?.slug].filter(Boolean).join('/'),
      templateId: categoryMatch.subcategory?.slug || categoryMatch.category?.slug || categoryMatch.parent.slug,
      templateName: categoryMatch.subcategory?.name || categoryMatch.category?.name || categoryMatch.parent.name,
      ownership: {
        sellerId: sellerMatch.id,
        sellerName: sellerMatch.storeName,
        isOfficialStore: sellerMatch.isOfficial,
      },
      importMeta: {
        source: 'bulk-upload',
        rowNumber: fieldRow.rowNumber,
      },
      specificationValues,
      specifications: specificationValues,
      attributes: {
        brand: fieldRow.brand,
        subcategory: categoryMatch.subcategory?.slug || categoryMatch.category?.slug || '',
      },
    },
  };
}
