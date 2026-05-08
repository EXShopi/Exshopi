import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { categoryAPI, adminProductBulkUploadAPI } from '../../services/api';
import { MASTER_CATEGORIES } from '../../lib/masterCategories';
import { uploadImageFile } from '../../lib/uploadClient';
import { resolveBulkUploadCategoryFix } from '../../../shared/bulkUploadAutoFix';

type BulkUploadEditableRow = {
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

type PreviewRow = {
  clientId: string;
  rowNumber: number;
  fields: BulkUploadEditableRow;
  resolved: {
    sellerName: string;
    sellerId: string;
    parentCategoryName: string;
    parentCategorySlug: string;
    categoryName?: string;
    categorySlug?: string;
    subcategoryName: string;
    subcategorySlug: string;
    seoSlug: string;
    status: string;
  };
  errors: string[];
  warnings: string[];
  canImport: boolean;
  approved?: boolean;
  skipped?: boolean;
  sourceCategoryKey?: string;
};

type ImportResult = {
  clientId: string;
  sku?: string;
  title: string;
  success: boolean;
  id?: string;
  error?: string;
};

type ImportSessionProgress = {
  sessionId: string;
  processed: number;
  imported: number;
  failed: number;
  total: number;
  remaining: number;
  done: boolean;
  batchSize?: number;
  batchImported?: number;
  batchFailed?: number;
};

type BulkCategoryLeaf = {
  id: string;
  name: string;
  slug: string;
};

type BulkCategoryBranch = BulkCategoryLeaf & {
  subcategories: BulkCategoryLeaf[];
};

type BulkCategoryTree = BulkCategoryLeaf & {
  categories: BulkCategoryBranch[];
};

type SearchableOption = {
  value: string;
  label: string;
  helper?: string;
};

const TEMPLATE_HEADERS = [
  'product_title',
  'sku',
  'brand',
  'model',
  'parent_category',
  'category',
  'subcategory',
  'product_type',
  'condition',
  'short_description',
  'long_description',
  'product_highlights',
  'seller_notes',
  'buyer_notes',
  'regular_price',
  'sale_price',
  'cost_price',
  'discount_percentage',
  'currency',
  'vat_status',
  'shipping_price',
  'cod_available',
  'tabby_eligible',
  'tamara_eligible',
  'stock_quantity',
  'low_stock_alert',
  'availability',
  'warehouse_location',
  'barcode',
  'serial_number',
  'product_status',
  'visibility_status',
  'approval_status',
  'seller_name',
  'seller_id',
  'seller_type',
  'exshopi_official',
  'vendor_commission',
  'admin_approval_required',
  'seller_store_visibility',
  'main_image_url',
  'image_url_1',
  'image_url_2',
  'image_url_3',
  'image_url_4',
  'image_url_5',
  'image_url_6',
  'image_url_7',
  'thumbnail_image',
  'image_alt_text',
  'color',
  'storage',
  'ram',
  'size',
  'capacity',
  'material',
  'connectivity',
  'compatibility',
  'processor',
  'screen_size',
  'graphics',
  'operating_system',
  'battery_health',
  'camera',
  'refresh_rate',
  'chipset',
  'network',
  'sim_type',
  'warranty',
  'box_contents',
  'dimensions',
  'weight',
  'seo_slug',
  'seo_title',
  'seo_description',
  'meta_keywords',
  'breadcrumb_category_data',
  'delivery_country',
  'uae_delivery_available',
  'saudi_delivery_available',
  'gcc_delivery_available',
  'shipping_time',
  'warranty_policy',
  'return_policy',
  'cod_fee',
  'featured_product',
  'best_seller',
  'most_popular',
  'eid_offer',
  'black_friday_section',
  'deal_timer',
  'flash_sale_price',
  'homepage_section_visibility',
];

const TEMPLATE_SAMPLE_ROWS: Array<Record<string, string>> = [
  {
    product_title: 'Apple MacBook Pro 13-inch (2020) M1 8GB 256GB Silver',
    sku: 'MBP13-M1-8-256-SLV',
    brand: 'Apple',
    model: 'MacBook Pro 13-inch (2020) M1',
    parent_category: 'Electronics',
    category: 'Computers',
    subcategory: 'Laptops',
    product_type: 'Laptop',
    condition: 'Renewed',
    short_description: 'Apple M1 MacBook Pro with 8GB RAM and 256GB SSD.',
    long_description: 'Premium Apple laptop ideal for students, professionals, and creators who want excellent battery life and smooth everyday performance.',
    product_highlights: 'Apple M1 chip | 8GB unified memory | 256GB SSD | Retina display',
    regular_price: '3299',
    sale_price: '3099',
    stock_quantity: '12',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    image_url_1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    color: 'Silver',
    storage: '256GB SSD',
    ram: '8GB',
    processor: 'Apple M1',
    screen_size: '13.3-inch',
    operating_system: 'macOS',
    seo_slug: 'apple-macbook-pro-13-inch-2020-m1-8gb-256gb-silver',
    seo_title: 'MacBook Pro 13-inch M1 Silver UAE',
    seo_description: 'Buy MacBook Pro 13-inch M1 in UAE with premium performance and fast delivery.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'Samsung Galaxy S24 Ultra 256GB Titanium Gray',
    sku: 'SGS24U-256-TG',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    parent_category: 'Electronics',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    product_type: 'Smartphone',
    condition: 'New',
    short_description: 'Samsung flagship smartphone with premium titanium finish.',
    long_description: 'High-end Samsung smartphone with advanced camera system, vivid display, and fast performance built for UAE and Saudi buyers.',
    product_highlights: 'Titanium Gray | 256GB storage | Premium camera | 5G',
    regular_price: '4899',
    stock_quantity: '20',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1200&q=80',
    color: 'Titanium Gray',
    storage: '256GB',
    camera: '200MP',
    network: '5G',
    operating_system: 'Android',
    seo_slug: 'samsung-galaxy-s24-ultra-256gb-titanium-gray',
    seo_title: 'Samsung Galaxy S24 Ultra 256GB UAE',
    seo_description: 'Shop Samsung Galaxy S24 Ultra 256GB in UAE with premium delivery and trusted listing details.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'Apple iPhone 15 Pro 128GB Natural Titanium',
    sku: 'IP15P-128-NT',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    parent_category: 'Electronics',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    product_type: 'Smartphone',
    condition: 'New',
    short_description: 'Premium iPhone with titanium design and advanced camera system.',
    long_description: 'Apple iPhone 15 Pro with strong performance, refined titanium build, and professional camera features for premium buyers.',
    product_highlights: 'Natural Titanium | 128GB | Pro camera | 5G',
    regular_price: '4299',
    stock_quantity: '18',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1696446702331-4adc4b24ca13?auto=format&fit=crop&w=1200&q=80',
    color: 'Natural Titanium',
    storage: '128GB',
    network: '5G',
    operating_system: 'iOS',
    seo_slug: 'apple-iphone-15-pro-128gb-natural-titanium',
    seo_title: 'iPhone 15 Pro 128GB UAE',
    seo_description: 'Buy iPhone 15 Pro 128GB in UAE with trusted premium listing details and fast delivery.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'USB-C 100W Charging Cable 2m Laptop Accessory',
    sku: 'USBC-100W-2M',
    brand: 'Generic',
    model: 'USB-C 100W Cable',
    parent_category: 'Electronics',
    category: 'Accessories',
    subcategory: 'Computer Accessories',
    product_type: 'Accessory',
    condition: 'New',
    short_description: 'USB-C charging cable for laptops, tablets, and phones.',
    long_description: 'Reliable USB-C accessory suitable for laptops, tablets, and mobile devices with high-speed charging support.',
    product_highlights: '100W charging | 2 meters | USB-C to USB-C | Durable build',
    regular_price: '79',
    stock_quantity: '100',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
    color: 'Black',
    compatibility: 'Laptops, Tablets, Smartphones',
    connectivity: 'USB-C',
    material: 'Braided Cable',
    seo_slug: 'usb-c-100w-charging-cable-2m',
    seo_title: 'USB-C 100W Charging Cable UAE',
    seo_description: 'Shop USB-C 100W charging cable in UAE for laptops, tablets, and smartphones.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
];

const PRODUCT_PLACEHOLDER_IMAGE = '/assets/product-placeholder.png';
const LAPTOP_CATEGORY_SLUG = 'laptops';
const LAPTOP_SUBCATEGORY_OPTIONS: BulkCategoryLeaf[] = [
  { id: 'apple-laptops', name: 'Apple Laptops', slug: 'apple-laptops' },
  { id: 'business-laptops', name: 'Business Laptops', slug: 'business-laptops' },
  { id: 'gaming-laptops', name: 'Gaming Laptops', slug: 'gaming-laptops' },
  { id: 'workstations', name: 'Workstations', slug: 'workstations' },
  { id: 'used-windows-laptops', name: 'Used Windows Laptops', slug: 'used-windows-laptops' },
  { id: 'chromebooks', name: 'Chromebooks', slug: 'chromebooks' },
  { id: 'premium-ultrabooks', name: 'Premium Ultrabooks', slug: 'premium-ultrabooks' },
];

const slugifyValue = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeText = (value: unknown) => String(value || '').trim();

const normalizeMatchKey = (value: unknown) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const dedupeList = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeMatchKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const cleanPlainText = (value: unknown) =>
  normalizeText(value)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/[<>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const clampFieldText = (value: unknown, limit: number) => {
  const cleaned = cleanPlainText(value);
  return cleaned.length > limit ? cleaned.slice(0, limit).trim() : cleaned;
};

const sanitizeMetaKeywords = (value: unknown, limit = 450) => {
  const keywords: string[] = [];
  String(value || '')
    .replace(/\r?\n/g, ',')
    .replace(/[|;]+/g, ',')
    .replace(/,+/g, ',')
    .split(',')
    .forEach((item) => {
      const keyword = dedupeList(
        cleanPlainText(item)
          .replace(/[^\p{L}\p{N}\s+\-./#&]/gu, ' ')
          .split(/\s+/)
          .filter(Boolean)
      ).join(' ');
      if (!keyword) return;
      const candidate = [...keywords, keyword].join(', ');
      if (candidate.length <= limit) keywords.push(keyword);
    });
  return dedupeList(keywords).join(', ').slice(0, limit).replace(/,\s*$/g, '').trim();
};

const autoFixBulkRowFields = (fields: BulkUploadEditableRow) => {
  const fixed = {
    ...fields,
    productTitle: clampFieldText(fields.productTitle, 200),
    shortDescription: clampFieldText(fields.shortDescription, 1000),
    longDescription: clampFieldText(fields.longDescription, 20000),
    sellerNotes: clampFieldText(fields.sellerNotes, 2000),
    seoTitle: clampFieldText(fields.seoTitle, 90),
    seoDescription: clampFieldText(fields.seoDescription, 160),
    metaKeywords: sanitizeMetaKeywords(fields.metaKeywords),
    stockQuantity: normalizeText(fields.stockQuantity) || '1',
    regularPrice: normalizeText(fields.regularPrice) || '0',
    salePrice: normalizeText(fields.salePrice || fields.flashSalePrice || fields.regularPrice) || '0',
    productStatus: normalizeMatchKey(fields.productStatus).replace(/\s+/g, '_') || 'draft',
    visibilityStatus: normalizeMatchKey(fields.visibilityStatus).replace(/\s+/g, '_') || 'hidden',
    approvalStatus: normalizeMatchKey(fields.approvalStatus).replace(/\s+/g, '_') || 'pending',
    currency: fields.currency || 'AED',
    condition: fields.condition || 'Refurbished',
  };
  const categoryFix = resolveBulkUploadCategoryFix(fixed);
  if (!categoryFix) return fixed;
  return {
    ...fixed,
    parentCategory: categoryFix.parentCategory,
    category: categoryFix.category,
    subcategory: categoryFix.subcategory,
    productType: categoryFix.productType,
  };
};

const categoryKeyForRow = (fields: BulkUploadEditableRow) =>
  [
    normalizeMatchKey(fields.parentCategory),
    normalizeMatchKey(fields.category),
    normalizeMatchKey(fields.subcategory),
  ].join('::');

const buildCategoryTree = (items: any[]): BulkCategoryTree[] => {
  const canonical = new Map<string, BulkCategoryTree>();

  (MASTER_CATEGORIES || []).forEach((parent: any) => {
    canonical.set(String(parent.slug || ''), {
      id: String(parent.id || parent.slug || parent.name || ''),
      name: String(parent.name || ''),
      slug: String(parent.slug || ''),
      categories: Array.isArray(parent.subcategories)
        ? parent.subcategories.map((category: any) => {
            const childCategories = Array.isArray(category.childCategories)
              ? category.childCategories.map((child: any) => ({
                  id: String(child.id || child.slug || child.name || ''),
                  name: String(child.name || ''),
                  slug: String(child.slug || ''),
                }))
              : [];
            const subcategories =
              normalizeMatchKey(category.slug || category.name) === LAPTOP_CATEGORY_SLUG
                ? (dedupeList([...childCategories.map((child) => child.slug), ...LAPTOP_SUBCATEGORY_OPTIONS.map((child) => child.slug)])
                    .map((slug) => childCategories.find((child) => normalizeMatchKey(child.slug) === normalizeMatchKey(slug)) || LAPTOP_SUBCATEGORY_OPTIONS.find((child) => child.slug === slug))
                    .filter(Boolean) as BulkCategoryLeaf[])
                : childCategories;
            return {
              id: String(category.id || category.slug || category.name || ''),
              name: String(category.name || ''),
              slug: String(category.slug || ''),
              subcategories,
            };
          })
        : [],
    });
  });

  (Array.isArray(items) ? items : []).forEach((entry: any) => {
    const slug = String(entry?.slug || slugifyValue(entry?.name || ''));
    if (!slug) return;
    const existing = canonical.get(slug);
    const mergedCategories = Array.isArray(entry?.subcategories)
      ? entry.subcategories.map((category: any) => ({
          id: String(category?.id || category?.slug || category?.name || ''),
          name: String(category?.name || ''),
          slug: String(category?.slug || slugifyValue(category?.name || '')),
          subcategories: (() => {
            const childCategories = Array.isArray(category?.childCategories)
              ? category.childCategories.map((child: any) => ({
                  id: String(child?.id || child?.slug || child?.name || ''),
                  name: String(child?.name || ''),
                  slug: String(child?.slug || slugifyValue(child?.name || '')),
                }))
              : [];
            if (normalizeMatchKey(category?.slug || category?.name) !== LAPTOP_CATEGORY_SLUG) return childCategories;
            return (dedupeList([...childCategories.map((child) => child.slug), ...LAPTOP_SUBCATEGORY_OPTIONS.map((child) => child.slug)])
              .map((slug) => childCategories.find((child) => normalizeMatchKey(child.slug) === normalizeMatchKey(slug)) || LAPTOP_SUBCATEGORY_OPTIONS.find((child) => child.slug === slug))
              .filter(Boolean) as BulkCategoryLeaf[]);
          })(),
        }))
      : [];

    canonical.set(slug, {
      id: String(entry?.id || existing?.id || slug),
      name: String(entry?.name || existing?.name || ''),
      slug,
      categories: mergedCategories.length ? mergedCategories : existing?.categories || [],
    });
  });

  return Array.from(canonical.values()).filter((entry) => entry.slug && entry.name);
};

const findCategoryOption = (tree: BulkCategoryTree[], parentSlug: string) =>
  tree.find(
    (entry) => normalizeMatchKey(entry.slug) === normalizeMatchKey(parentSlug) || normalizeMatchKey(entry.name) === normalizeMatchKey(parentSlug)
  ) || null;

const findBranchOption = (parent: BulkCategoryTree | null, categorySlug: string) =>
  parent?.categories.find(
    (entry) => normalizeMatchKey(entry.slug) === normalizeMatchKey(categorySlug) || normalizeMatchKey(entry.name) === normalizeMatchKey(categorySlug)
  ) || null;

const findLeafOption = (branch: BulkCategoryBranch | null, subcategorySlug: string) =>
  branch?.subcategories.find(
    (entry) => normalizeMatchKey(entry.slug) === normalizeMatchKey(subcategorySlug) || normalizeMatchKey(entry.name) === normalizeMatchKey(subcategorySlug)
  ) || null;

const buildLaptopSearchCorpus = (fields: BulkUploadEditableRow) =>
  normalizeMatchKey(
    [
      fields.productTitle,
      fields.model,
      fields.brand,
      fields.operatingSystem,
      fields.shortDescription,
      fields.longDescription,
      fields.productHighlights,
      fields.processor,
    ].join(' ')
  );

const inferLaptopLeaf = (fields: BulkUploadEditableRow): BulkCategoryLeaf => {
  const corpus = buildLaptopSearchCorpus(fields);
  const brand = normalizeMatchKey(fields.brand);

  if (corpus.includes('chromebook') || corpus.includes('chrome os')) {
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'chromebooks')!;
  }
  if (corpus.includes('macbook') || corpus.includes('mac book') || (brand === 'apple' && corpus.includes('macos'))) {
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'apple-laptops')!;
  }
  if (
    corpus.includes('surface') ||
    corpus.includes('ultrabook') ||
    corpus.includes('ultra book') ||
    corpus.includes('xps 13') ||
    corpus.includes('x1 carbon')
  ) {
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'business-laptops')!;
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
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'gaming-laptops')!;
  }
  if (
    corpus.includes('latitude') ||
    corpus.includes('elitebook') ||
    corpus.includes('probook') ||
    corpus.includes('thinkpad') ||
    corpus.includes('travelmate') ||
    corpus.includes('lifebook')
  ) {
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'business-laptops')!;
  }
  if (corpus.includes('precision') || corpus.includes('zbook') || corpus.includes('workstation')) {
    return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'workstations')!;
  }
  return LAPTOP_SUBCATEGORY_OPTIONS.find((entry) => entry.slug === 'business-laptops')!;
};

const resolveRowCategorySelection = (fields: BulkUploadEditableRow, categories: BulkCategoryTree[]) => {
  const parent =
    findCategoryOption(categories, fields.parentCategory) ||
    findCategoryOption(categories, fields.category) ||
    null;
  const branch =
    findBranchOption(parent, fields.category) ||
    findBranchOption(parent, fields.subcategory) ||
    null;
  let leaf = findLeafOption(branch, fields.subcategory) || null;

  if (branch && normalizeMatchKey(branch.slug || branch.name) === LAPTOP_CATEGORY_SLUG && !leaf) {
    leaf = inferLaptopLeaf(fields);
  }

  return { parent, branch, leaf };
};

const MANAGED_ERROR_PREFIXES = [
  'Missing product title',
  'Missing stock quantity',
  'Invalid stock quantity',
  'Invalid selling price',
  'Invalid parent/category mapping',
  'Needs category mapping',
  'Needs subcategory mapping',
  'Needs manual edit',
  'Invalid approval status',
  'Duplicate SKU found in upload file',
  'Duplicate slug found in upload file',
];

const MANAGED_WARNING_PREFIXES = [
  'Missing main image URL',
  'Image URL returned',
  'Image URL is not a valid absolute URL',
  'Image URL could not be verified',
  'Auto-mapped laptop subcategory',
  'Category was missing',
  'Meta keywords shortened automatically',
];

const filterManagedMessages = (messages: string[], prefixes: string[]) =>
  messages.filter((message) => !prefixes.some((prefix) => message.startsWith(prefix)));

const buildSeoSlug = (fields: BulkUploadEditableRow) =>
  slugifyValue(fields.seoSlug || fields.productTitle);

const buildSafeDraftSku = (inputSku: string, rowNumber: number) => {
  const base = normalizeText(inputSku)
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${base || 'EXSHOPI-DRAFT'}-DRAFT-${rowNumber}`;
};

const getPreviewRowStatus = (row: PreviewRow) => {
  if (row.errors.length) return { label: 'Needs manual edit', className: 'bg-rose-50 text-rose-700' };
  if (row.warnings.some((warning) => /auto|shortened|placeholder|mapped/i.test(warning))) {
    return { label: 'Fixed automatically', className: 'bg-blue-50 text-blue-700' };
  }
  return { label: 'Ready to import', className: 'bg-emerald-50 text-emerald-700' };
};

const revalidatePreviewRows = (rows: PreviewRow[], categories: BulkCategoryTree[]) => {
  const skuCounts = new Map<string, number>();
  const slugCounts = new Map<string, number>();

  rows.forEach((row) => {
    const sku = normalizeMatchKey(row.fields.sku);
    const slug = normalizeMatchKey(buildSeoSlug(row.fields));
    if (sku) skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
    if (slug) slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  });

  return rows.map((row) => {
    const fixedFields = autoFixBulkRowFields(row.fields);
    const preservedErrors = filterManagedMessages(row.errors, MANAGED_ERROR_PREFIXES);
    const preservedWarnings = filterManagedMessages(row.warnings, MANAGED_WARNING_PREFIXES);
    const errors = [...preservedErrors];
    const warnings = [...preservedWarnings];
    if (fixedFields.metaKeywords !== row.fields.metaKeywords) warnings.push('Meta keywords shortened automatically.');
    if (
      fixedFields.parentCategory !== row.fields.parentCategory ||
      fixedFields.category !== row.fields.category ||
      fixedFields.subcategory !== row.fields.subcategory
    ) {
      warnings.push(
        `Category was missing. We auto-assigned ${fixedFields.parentCategory} > ${fixedFields.category} > ${fixedFields.subcategory}.`
      );
    }
    const { parent, branch, leaf } = resolveRowCategorySelection(fixedFields, categories);
    const isLaptopCategory = normalizeMatchKey(branch?.slug || branch?.name) === LAPTOP_CATEGORY_SLUG;
    const sku = normalizeMatchKey(fixedFields.sku);
    const slug = normalizeMatchKey(buildSeoSlug(fixedFields));
    const price = Number(String(fixedFields.salePrice || fixedFields.regularPrice || '').replace(/[^0-9.\-]/g, ''));
    const stock = Number(String(fixedFields.stockQuantity || '').replace(/[^0-9.\-]/g, ''));
    const approval = normalizeMatchKey(fixedFields.approvalStatus);

    if (!normalizeText(fixedFields.productTitle)) errors.push('Missing product title');
    if (!Number.isFinite(stock) || stock < 0) {
      errors.push('Invalid stock quantity');
    }
    if (!Number.isFinite(price) || price < 0) errors.push('Invalid selling price');
    if (!parent) {
      errors.push('Needs manual edit: category could not be matched to the ExShopi category tree.');
    } else if (normalizeText(fixedFields.category) && !branch) {
      errors.push('Needs manual edit: category could not be matched to the ExShopi category tree.');
    } else if (normalizeText(fixedFields.subcategory) && !leaf && !isLaptopCategory) {
      warnings.push('Needs subcategory mapping');
    }
    if (sku && (skuCounts.get(sku) || 0) > 1) errors.push('Duplicate SKU found in upload file');
    if (slug && (slugCounts.get(slug) || 0) > 1) errors.push('Duplicate slug found in upload file');
    if (approval && !['pending', 'approved', 'rejected'].includes(approval)) errors.push('Invalid approval status');

    if (!normalizeText(row.fields.mainImageUrl)) {
      warnings.push('Missing main image URL. Placeholder will be used unless you upload one.');
    }
    if (isLaptopCategory && leaf) {
      warnings.push(`Auto-mapped laptop subcategory: ${leaf.name}`);
    }
    const duplicateExistingSkuWarning = row.warnings.find((issue) => issue.startsWith('Duplicate SKU already exists.'));
    const nextSku = duplicateExistingSkuWarning ? buildSafeDraftSku(fixedFields.sku, fixedFields.rowNumber) : fixedFields.sku;

    return {
      ...row,
      fields: {
        ...fixedFields,
        sku: nextSku,
        seoSlug: fixedFields.seoSlug || buildSeoSlug(fixedFields),
        subcategory: fixedFields.subcategory || leaf?.name || '',
      },
      resolved: {
        ...row.resolved,
        parentCategoryName: parent?.name || '',
        parentCategorySlug: parent?.slug || '',
        categoryName: branch?.name || fixedFields.category || '',
        categorySlug: branch?.slug || slugifyValue(fixedFields.category),
        subcategoryName: leaf?.name || fixedFields.subcategory || '',
        subcategorySlug: leaf?.slug || slugifyValue(fixedFields.subcategory),
      },
      warnings,
      errors,
      canImport: errors.length === 0,
    };
  });
};

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value) || null;
  const filtered = useMemo(() => {
    const normalized = normalizeMatchKey(query);
    if (!normalized) return options;
    return options.filter(
      (option) =>
        normalizeMatchKey(option.label).includes(normalized) ||
        normalizeMatchKey(option.helper).includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="text-sm font-bold text-slate-800">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
            setQuery('');
          }
        }}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span>{selected?.label || placeholder}</span>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {disabled ? 'Locked' : 'Select'}
        </span>
      </button>
      {open ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-100 p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {filtered.length ? (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left transition ${
                    option.value === value ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold">{option.label}</div>
                  {option.helper ? <div className="text-xs font-medium text-slate-500">{option.helper}</div> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm font-medium text-slate-500">No matching options.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function csvEscape(value: unknown) {
  const content = String(value ?? '');
  return /[",\n]/.test(content) ? `"${content.replace(/"/g, '""')}"` : content;
}

function createTemplateCsv() {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...TEMPLATE_SAMPLE_ROWS.map((row) => TEMPLATE_HEADERS.map((header) => csvEscape(row[header] || '')).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

function downloadBlob(fileName: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] || '' : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function buildErrorReportCsv(rows: PreviewRow[]) {
  const headers = ['row_number', 'title', 'sku', 'errors', 'warnings'];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.rowNumber,
        csvEscape(row.fields.productTitle),
        csvEscape(row.fields.sku),
        csvEscape(row.errors.join(' | ')),
        csvEscape(row.warnings.join(' | ')),
      ].join(',')
    ),
  ];
  return `${lines.join('\n')}\n`;
}

function buildImportResultsCsv(rows: ImportResult[]) {
  const headers = ['client_id', 'sku', 'title', 'status', 'product_id', 'error'];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        csvEscape(row.clientId),
        csvEscape(row.sku || ''),
        csvEscape(row.title),
        row.success ? 'success' : 'failed',
        csvEscape(row.id || ''),
        csvEscape(row.error || ''),
      ].join(',')
    ),
  ];
  return `${lines.join('\n')}\n`;
}

function buildFixedRowsCsv(rows: PreviewRow[]) {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...rows.map((row) => {
      const imageColumns = Array.from({ length: 7 }, (_, index) => row.fields.galleryImageUrls[index] || '');
      const values: Record<string, unknown> = {
        product_title: row.fields.productTitle,
        sku: row.fields.sku,
        brand: row.fields.brand,
        model: row.fields.model,
        parent_category: row.fields.parentCategory,
        category: row.fields.category,
        subcategory: row.fields.subcategory,
        product_type: row.fields.productType,
        condition: row.fields.condition,
        short_description: row.fields.shortDescription,
        long_description: row.fields.longDescription,
        product_highlights: row.fields.productHighlights,
        seller_notes: row.fields.sellerNotes,
        buyer_notes: row.fields.buyerNotes,
        regular_price: row.fields.regularPrice,
        sale_price: row.fields.salePrice,
        cost_price: row.fields.costPrice,
        discount_percentage: row.fields.discountPercentage,
        currency: row.fields.currency,
        vat_status: row.fields.vatStatus,
        shipping_price: row.fields.shippingPrice,
        cod_available: row.fields.codAvailable,
        tabby_eligible: row.fields.tabbyEligible,
        tamara_eligible: row.fields.tamaraEligible,
        stock_quantity: row.fields.stockQuantity,
        low_stock_alert: row.fields.lowStockAlert,
        availability: row.fields.availability,
        warehouse_location: row.fields.warehouseLocation,
        barcode: row.fields.barcode,
        serial_number: row.fields.serialNumber,
        product_status: row.fields.productStatus,
        visibility_status: row.fields.visibilityStatus,
        approval_status: row.fields.approvalStatus,
        seller_name: row.fields.sellerName,
        seller_id: row.fields.sellerId,
        seller_type: row.fields.sellerType,
        exshopi_official: row.fields.exshopiOfficial,
        vendor_commission: row.fields.vendorCommission,
        admin_approval_required: row.fields.adminApprovalRequired,
        seller_store_visibility: row.fields.sellerStoreVisibility,
        main_image_url: row.fields.mainImageUrl,
        image_url_1: imageColumns[0],
        image_url_2: imageColumns[1],
        image_url_3: imageColumns[2],
        image_url_4: imageColumns[3],
        image_url_5: imageColumns[4],
        image_url_6: imageColumns[5],
        image_url_7: imageColumns[6],
        thumbnail_image: row.fields.thumbnailUrl,
        image_alt_text: row.fields.imageAltText,
        color: row.fields.color,
        storage: row.fields.storage,
        ram: row.fields.ram,
        size: row.fields.size,
        capacity: row.fields.capacity,
        material: row.fields.material,
        connectivity: row.fields.connectivity,
        compatibility: row.fields.compatibility,
        processor: row.fields.processor,
        screen_size: row.fields.screenSize,
        graphics: row.fields.graphics,
        operating_system: row.fields.operatingSystem,
        battery_health: row.fields.batteryHealth,
        camera: row.fields.camera,
        refresh_rate: row.fields.refreshRate,
        chipset: row.fields.chipset,
        network: row.fields.network,
        sim_type: row.fields.simType,
        warranty: row.fields.warranty,
        box_contents: row.fields.boxContents,
        dimensions: row.fields.dimensions,
        weight: row.fields.weight,
        seo_slug: row.fields.seoSlug,
        seo_title: row.fields.seoTitle,
        seo_description: row.fields.seoDescription,
        meta_keywords: row.fields.metaKeywords,
        breadcrumb_category_data: row.fields.breadcrumbCategoryData,
        delivery_country: row.fields.deliveryCountry,
        uae_delivery_available: row.fields.uaeDeliveryAvailable,
        saudi_delivery_available: row.fields.saudiDeliveryAvailable,
        gcc_delivery_available: row.fields.gccDeliveryAvailable,
        shipping_time: row.fields.shippingTime,
        warranty_policy: row.fields.warrantyPolicy,
        return_policy: row.fields.returnPolicy,
        cod_fee: row.fields.codFee,
        featured_product: row.fields.featuredProduct,
        best_seller: row.fields.bestSeller,
        most_popular: row.fields.mostPopular,
        eid_offer: row.fields.eidOffer,
        black_friday_section: row.fields.blackFridaySection,
        deal_timer: row.fields.dealTimer,
        flash_sale_price: row.fields.flashSalePrice,
        homepage_section_visibility: row.fields.homepageSectionVisibility,
      };
      return TEMPLATE_HEADERS.map((header) => csvEscape(values[header] || '')).join(',');
    }),
  ];
  return `${lines.join('\n')}\n`;
}

type Props = {
  onImported?: () => void;
  mode?: 'admin' | 'seller';
};

export default function BulkProductUploadModal({ onImported, mode = 'admin' }: Props) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BulkCategoryTree[]>(() => buildCategoryTree([]));
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number; warnings: number } | null>(null);
  const [error, setError] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [applyCategoryToSimilar, setApplyCategoryToSimilar] = useState(false);
  const [imageUploadState, setImageUploadState] = useState<{ target: 'main' | 'gallery' | null; busy: boolean; error: string }>({
    target: null,
    busy: false,
    error: '',
  });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [lastBatchSize, setLastBatchSize] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);

  const editingRow = useMemo(
    () => previewRows.find((row) => row.clientId === editingRowId) || null,
    [editingRowId, previewRows]
  );

  const previewStats = useMemo(() => {
    const approvedRows = previewRows.filter((row) => row.approved !== false && !row.skipped);
    return {
      approved: approvedRows.length,
      ready: approvedRows.filter((row) => row.canImport).length,
      skipped: previewRows.filter((row) => row.skipped).length,
      invalid: previewRows.filter((row) => !row.canImport).length,
    };
  }, [previewRows]);

  const importBatchInfo = useMemo(() => {
    const batchSize = lastBatchSize || 10;
    const totalBatches = importProgress.total ? Math.max(1, Math.ceil(importProgress.total / batchSize)) : 0;
    const currentBatch = importProgress.current ? Math.min(totalBatches, Math.ceil(importProgress.current / batchSize)) : 0;
    return { batchSize, totalBatches, currentBatch };
  }, [importProgress.current, importProgress.total, lastBatchSize]);

  const editingCategorySelection = useMemo(
    () => (editingRow ? resolveRowCategorySelection(editingRow.fields, categories) : { parent: null, branch: null, leaf: null }),
    [categories, editingRow]
  );

  const availableParentOptions = useMemo<SearchableOption[]>(
    () =>
      categories.map((entry) => ({
        value: entry.slug,
        label: entry.name,
        helper: entry.slug,
      })),
    [categories]
  );

  const availableCategoryOptions = useMemo<SearchableOption[]>(
    () =>
      (editingCategorySelection.parent?.categories || []).map((entry) => ({
        value: entry.slug,
        label: entry.name,
        helper: entry.slug,
      })),
    [editingCategorySelection.parent]
  );

  const availableSubcategoryOptions = useMemo<SearchableOption[]>(
    () =>
      (editingCategorySelection.branch?.subcategories || []).map((entry) => ({
        value: entry.slug,
        label: entry.name,
        helper: entry.slug,
      })),
    [editingCategorySelection.branch]
  );

  useEffect(() => {
    if (!open) return;
    let active = true;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const apiCategories = await categoryAPI.getAll().catch(() => []);
        if (!active) return;
        setCategories(buildCategoryTree(apiCategories || []));
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!previewRows.length) return;
    setPreviewRows((current) => revalidatePreviewRows(current, categories));
  }, [categories]);

  const handleTemplateDownload = () => {
    downloadBlob('exshopi-full-product-template.csv', createTemplateCsv(), 'text/csv;charset=utf-8;');
  };

  const openFilePicker = () => inputRef.current?.click();

  const resetState = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setSummary(null);
    setError('');
    setEditingRowId(null);
    setImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setImportResults([]);
    setImportSessionId(null);
    setLastBatchSize(0);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
    setApplyCategoryToSimilar(false);
    setImageUploadState({ target: null, busy: false, error: '' });
  };

  const handleFileChosen = async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setLoadingPreview(true);
    setError('');
    setImportResults([]);
    setImportSessionId(null);
    setImportProgress({ current: 0, total: 0 });
    setLastBatchSize(0);
    try {
      const fileDataBase64 = await fileToBase64(file);
      const preview = await adminProductBulkUploadAPI.preview({
        fileName: file.name,
        fileDataBase64,
        mode,
      });
      const nextRows = revalidatePreviewRows(
        (preview.rows || []).map((row: PreviewRow) => ({
          ...row,
          approved: row.canImport,
          skipped: false,
          sourceCategoryKey: categoryKeyForRow(row.fields),
        })),
        categories
      );
      setPreviewRows(nextRows);
      setSummary(preview.summary || null);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Failed to preview file');
      setPreviewRows([]);
      setSummary(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const updateRows = (updater: (rows: PreviewRow[]) => PreviewRow[]) => {
    setPreviewRows((current) => revalidatePreviewRows(updater(current), categories));
  };

  const updateRow = (clientId: string, updater: (row: PreviewRow) => PreviewRow) => {
    updateRows((current) => current.map((row) => (row.clientId === clientId ? updater(row) : row)));
  };

  const applyCategorySelection = (
    row: PreviewRow,
    nextSelection: {
      parent?: BulkCategoryTree | null;
      branch?: BulkCategoryBranch | null;
      leaf?: BulkCategoryLeaf | null;
    }
  ) => {
    updateRows((current) =>
      current.map((entry) => {
        const shouldApply =
          entry.clientId === row.clientId ||
          (applyCategoryToSimilar && entry.sourceCategoryKey && row.sourceCategoryKey && entry.sourceCategoryKey === row.sourceCategoryKey);

        if (!shouldApply) return entry;

        return {
          ...entry,
          fields: {
            ...entry.fields,
            parentCategory: nextSelection.parent?.name || '',
            category: nextSelection.branch?.name || '',
            subcategory: nextSelection.leaf?.name || '',
          },
        };
      })
    );
  };

  const handleMainImageUpload = async (file: File | null) => {
    if (!editingRow || !file) return;
    setImageUploadState({ target: 'main', busy: true, error: '' });
    try {
      const uploadedUrl = await uploadImageFile(file, {
        folder: 'products/bulk-upload',
        fileName: file.name,
      });

      updateRow(editingRow.clientId, (current) => {
        const nextGallery = current.fields.galleryImageUrls.filter((url) => url && url !== current.fields.mainImageUrl);
        return {
          ...current,
          fields: {
            ...current.fields,
            mainImageUrl: uploadedUrl,
            thumbnailUrl: uploadedUrl,
            galleryImageUrls: dedupeList(nextGallery).slice(0, 7),
          },
        };
      });
      setImageUploadState({ target: null, busy: false, error: '' });
    } catch (uploadError) {
      setImageUploadState({
        target: null,
        busy: false,
        error: uploadError instanceof Error ? uploadError.message : 'Failed to upload main image.',
      });
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!editingRow || !files?.length) return;
    setImageUploadState({ target: 'gallery', busy: true, error: '' });
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadImageFile(file, {
            folder: 'products/bulk-upload',
            fileName: file.name,
          })
        )
      );

      updateRow(editingRow.clientId, (current) => ({
        ...current,
        fields: {
          ...current.fields,
          galleryImageUrls: dedupeList([...current.fields.galleryImageUrls, ...uploaded]).slice(0, 7),
        },
      }));
      setImageUploadState({ target: null, busy: false, error: '' });
    } catch (uploadError) {
      setImageUploadState({
        target: null,
        busy: false,
        error: uploadError instanceof Error ? uploadError.message : 'Failed to upload gallery images.',
      });
    }
  };

  const handleImport = async () => {
    const candidates = previewRows.filter((row) => row.approved !== false && !row.skipped && row.canImport);
    if (!candidates.length) {
      setError('There are no valid approved rows ready to import.');
      return;
    }

    setImporting(true);
    setError('');
    const batchSize = 100;
    let activeSessionId = importSessionId;
    setLastBatchSize(batchSize);

    try {
      let currentResults = importResults;

      if (!activeSessionId) {
        setImportResults([]);
        setImportProgress({ current: 0, total: candidates.length });
        const session = await adminProductBulkUploadAPI.createImportSession({
          mode,
          rows: candidates.map((row) => ({ clientId: row.clientId, fields: row.fields })),
        });
        activeSessionId = String(session.sessionId || '');
        if (!activeSessionId) {
          throw new Error('Bulk import session could not be created.');
        }
        setImportSessionId(activeSessionId);
        setImportProgress({ current: Number(session.processed || 0), total: Number(session.total || candidates.length) });
      } else {
        const session = await adminProductBulkUploadAPI.getImportSession(activeSessionId);
        currentResults = Array.isArray(session.results) ? session.results : currentResults;
        setImportResults(currentResults);
        setImportProgress({ current: Number(session.processed || 0), total: Number(session.total || candidates.length) });
      }

      if (!activeSessionId) {
        throw new Error('Bulk import session is missing.');
      }

      while (true) {
        const response: ImportSessionProgress & { results?: ImportResult[] } = await adminProductBulkUploadAPI.importBatch({
          sessionId: activeSessionId,
          batchSize,
        });
        currentResults = [...currentResults, ...((response.results || []) as ImportResult[])];
        setImportResults([...currentResults]);
        setImportProgress({ current: Number(response.processed || 0), total: Number(response.total || candidates.length) });

        if (response.done) {
          setImportSessionId(null);
          break;
        }
      }

      if (currentResults.some((item) => item.success) && onImported) {
        onImported();
      }
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'Bulk import failed';
      if (activeSessionId) {
        try {
          const session = await adminProductBulkUploadAPI.getImportSession(activeSessionId);
          setImportResults(Array.isArray(session.results) ? session.results : []);
          setImportProgress({ current: Number(session.processed || 0), total: Number(session.total || candidates.length) });
          setImportSessionId(session.done ? null : activeSessionId);
        } catch {
          setImportSessionId(activeSessionId);
        }
        setError(`${message} You can resume the existing import session.`);
      } else {
        setError(message);
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorReport = () => {
    downloadBlob(
      'exshopi-bulk-upload-errors.csv',
      buildErrorReportCsv(previewRows.filter((row) => row.errors.length || row.warnings.length)),
      'text/csv;charset=utf-8;'
    );
  };

  const handleAutoFixAllRows = () => {
    updateRows((current) =>
      current.map((row) => ({
        ...row,
        fields: autoFixBulkRowFields(row.fields),
        skipped: false,
      }))
    );
  };

  const handleApproveFixedRows = () => {
    setPreviewRows((current) =>
      revalidatePreviewRows(current, categories).map((row) => ({
        ...row,
        approved: row.canImport,
        skipped: !row.canImport,
      }))
    );
  };

  const downloadFixedCsv = () => {
    downloadBlob(
      'exshopi-bulk-upload-fixed.csv',
      buildFixedRowsCsv(revalidatePreviewRows(previewRows, categories)),
      'text/csv;charset=utf-8;'
    );
  };

  const downloadImportResults = () => {
    downloadBlob(
      'exshopi-bulk-upload-import-results.csv',
      buildImportResultsCsv(importResults),
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
      >
        Bulk Upload Products
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.97))] shadow-[0_40px_100px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Bulk Upload
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Bulk Product Upload</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Upload CSV or Excel, validate catalog rows, preview issues, edit, approve, and import in chunks.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Step 1</p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">Upload CSV / Excel</h3>
                    </div>
                    <button
                      onClick={handleTemplateDownload}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                      type="button"
                    >
                      <Download className="h-4 w-4" />
                      Download Full Product Template
                    </button>
                  </div>

                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      void handleFileChosen(event.dataTransfer.files?.[0] || null);
                    }}
                    className={`mt-5 rounded-[1.75rem] border-2 border-dashed p-8 text-center transition ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-900">Drop CSV or Excel here</h4>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Supports `.csv` and `.xlsx` with full product-field coverage.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-600"
                      >
                        Choose File
                      </button>
                      {selectedFile ? (
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          {selectedFile.name}
                        </div>
                      ) : null}
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(event) => void handleFileChosen(event.target.files?.[0] || null)}
                    />
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  {loadingPreview ? (
                    <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-8">
                      <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Reading file, validating rows, and preparing preview...
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Workflow</p>
                  <div className="mt-4 space-y-4">
                    {[
                      '1. Upload CSV or Excel file',
                      '2. Validate SKU, slug, category, seller, stock, price, and image URL',
                      '3. Preview rows and edit before import',
                      '4. Approve valid rows or skip weak rows',
                      '5. Import in safe chunks with success and error reporting',
                    ].map((step) => (
                      <div key={step} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {step}
                      </div>
                    ))}
                  </div>

                  {summary ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Rows', summary.total, 'bg-slate-100 text-slate-700'],
                        ['Valid', summary.valid, 'bg-emerald-100 text-emerald-700'],
                        ['Invalid', summary.invalid, 'bg-rose-100 text-rose-700'],
                        ['Warnings', summary.warnings, 'bg-amber-100 text-amber-700'],
                      ].map(([label, value, tone]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
                            {label}
                          </div>
                          <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {previewRows.length ? (
                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Step 2</p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">Preview, Edit, Approve</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleAutoFixAllRows}
                        className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-blue-700"
                      >
                        Auto Fix All Rows
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveFixedRows}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      >
                        Import Valid Rows
                      </button>
                      <button
                        type="button"
                        onClick={downloadFixedCsv}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      >
                        Download Fixed CSV
                      </button>
                      <button
                        type="button"
                        onClick={downloadErrorReport}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      >
                        Download Error Report
                      </button>
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || previewStats.ready === 0}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {importSessionId ? 'Resume Import' : 'Import All Fixed Rows'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    {[
                      ['Approved', previewStats.approved, 'bg-blue-50 text-blue-700'],
                      ['Ready', previewStats.ready, 'bg-emerald-50 text-emerald-700'],
                      ['Skipped', previewStats.skipped, 'bg-slate-100 text-slate-700'],
                      ['Need Fix', previewStats.invalid, 'bg-rose-50 text-rose-700'],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone}`}>
                          {label}
                        </div>
                        <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {importing ? (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing approved products in safe chunks
                        </div>
                        <div className="text-sm font-black text-blue-700">
                          {importProgress.current}/{importProgress.total}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-blue-700">
                        <span>Batch {importBatchInfo.currentBatch || 1}/{importBatchInfo.totalBatches || 1}</span>
                        <span>Batch size {importBatchInfo.batchSize}</span>
                        <span>Success {importResults.filter((item) => item.success).length}</span>
                        <span>Failed {importResults.filter((item) => !item.success).length}</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {importResults.length ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3">
                          <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                            Successful: {importResults.filter((item) => item.success).length}
                          </div>
                          <div className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">
                            Failed: {importResults.filter((item) => !item.success).length}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={downloadImportResults}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                        >
                          Download Import Report
                        </button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full min-w-[760px] divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50">
                              <tr className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Product ID</th>
                                <th className="px-4 py-3">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importResults.map((item) => (
                                <tr key={`${item.clientId}-${item.title}-${item.id || item.error || 'result'}`}>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                                        item.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                      }`}
                                    >
                                      {item.success ? 'Success' : 'Failed'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-semibold text-slate-500">{item.sku || 'No SKU'}</td>
                                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.title}</td>
                                  <td className="px-4 py-3 text-xs font-medium text-slate-500">{item.id || 'Not created'}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-600">
                                    {item.success ? 'Imported successfully' : item.error || 'Unknown import error'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1280px] divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                          <tr className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <th className="px-4 py-4">Use</th>
                            <th className="px-4 py-4">Image</th>
                            <th className="px-4 py-4">Title / SKU</th>
                            <th className="px-4 py-4">Category</th>
                            <th className="px-4 py-4">Price / Stock</th>
                            <th className="px-4 py-4">Seller / Status</th>
                            <th className="px-4 py-4">Errors / Warnings</th>
                            <th className="px-4 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {previewRows.map((row) => {
                            const rowStatus = getPreviewRowStatus(row);
                            return (
                            <tr key={row.clientId} className="align-top hover:bg-slate-50/70">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={row.approved !== false}
                                  onChange={(event) =>
                                    updateRow(row.clientId, (current) => ({ ...current, approved: event.target.checked, skipped: !event.target.checked }))
                                  }
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                  {row.fields.mainImageUrl ? (
                                    <img src={row.fields.mainImageUrl} alt={row.fields.productTitle} className="h-full w-full object-cover" />
                                  ) : (
                                    <img src={PRODUCT_PLACEHOLDER_IMAGE} alt="Product placeholder" className="h-full w-full object-cover" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="max-w-[260px] text-sm font-black text-slate-900">{row.fields.productTitle || 'Untitled row'}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{row.fields.sku || 'No SKU'}</p>
                                <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${rowStatus.className}`}>
                                  {rowStatus.label}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                <p>{row.resolved.parentCategoryName || row.fields.parentCategory || 'Unknown'}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {row.resolved.categoryName || row.fields.category || 'No category selected'}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-400">
                                  {row.resolved.subcategoryName || row.fields.subcategory || 'No subcategory'}
                                </p>
                                {row.errors.some((issue) => issue.includes('category mapping') || issue.includes('subcategory mapping')) ? (
                                  <div className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                                    Needs category mapping
                                  </div>
                                ) : (
                                  <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                                    Category mapped
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                <p>{row.fields.salePrice || row.fields.regularPrice || '0'}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{row.fields.stockQuantity || '0'} stock</p>
                              </td>
                              <td className="px-4 py-4">
                                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                  {row.resolved.sellerName || row.fields.sellerName || 'No seller'}
                                </div>
                                <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                                  {row.resolved.status}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {row.errors.length ? (
                                  <div className="space-y-2">
                                    {row.errors.slice(0, 3).map((issue) => (
                                      <div key={issue} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                        {issue}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                                    Ready to import
                                  </div>
                                )}
                                {row.warnings.length ? (
                                  <div className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                    {row.warnings[0]}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRowId(row.clientId)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit Row
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRow(row.clientId, (current) => ({ ...current, skipped: !current.skipped, approved: current.skipped }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                                  >
                                    {row.skipped ? 'Unskip' : 'Skip'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {editingRow ? (
            <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.26)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Edit Preview Row</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{editingRow.fields.productTitle || 'Untitled row'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRowId(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category Mapping</p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Categories are locked to the existing Exshopi category tree. Choose the correct path instead of typing free text.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                      <input
                        type="checkbox"
                        checked={applyCategoryToSimilar}
                        onChange={(event) => setApplyCategoryToSimilar(event.target.checked)}
                      />
                      Apply this category mapping to similar rows
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <SearchableSelect
                      label="Parent Category"
                      value={editingCategorySelection.parent?.slug || ''}
                      options={availableParentOptions}
                      placeholder={categoriesLoading ? 'Loading categories...' : 'Select a parent category'}
                      disabled={categoriesLoading}
                      onChange={(nextValue) => {
                        const parent = categories.find((entry) => entry.slug === nextValue) || null;
                        const branch = parent?.categories[0] || null;
                        const leaf = branch?.subcategories[0] || null;
                        applyCategorySelection(editingRow, { parent, branch, leaf });
                      }}
                    />
                    <SearchableSelect
                      label="Category"
                      value={editingCategorySelection.branch?.slug || ''}
                      options={availableCategoryOptions}
                      placeholder={
                        editingCategorySelection.parent
                          ? 'Select a category'
                          : 'Choose parent category first'
                      }
                      disabled={!editingCategorySelection.parent || categoriesLoading}
                      onChange={(nextValue) => {
                        const branch =
                          editingCategorySelection.parent?.categories.find((entry) => entry.slug === nextValue) || null;
                        const leaf = branch?.subcategories[0] || null;
                        applyCategorySelection(editingRow, {
                          parent: editingCategorySelection.parent,
                          branch,
                          leaf,
                        });
                      }}
                    />
                    <SearchableSelect
                      label="Subcategory"
                      value={editingCategorySelection.leaf?.slug || ''}
                      options={availableSubcategoryOptions}
                      placeholder={
                        editingCategorySelection.branch?.subcategories.length
                          ? 'Select a subcategory'
                          : 'No subcategory required'
                      }
                      disabled={!editingCategorySelection.branch || availableSubcategoryOptions.length === 0 || categoriesLoading}
                      onChange={(nextValue) => {
                        const leaf =
                          editingCategorySelection.branch?.subcategories.find((entry) => entry.slug === nextValue) || null;
                        applyCategorySelection(editingRow, {
                          parent: editingCategorySelection.parent,
                          branch: editingCategorySelection.branch,
                          leaf,
                        });
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                      {editingCategorySelection.parent?.name || 'Parent not mapped'}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                      {editingCategorySelection.branch?.name || 'Category not mapped'}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                      {editingCategorySelection.leaf?.name || 'No child subcategory'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    ['productTitle', 'Product Title'],
                    ['sku', 'SKU'],
                    ['brand', 'Brand'],
                    ['model', 'Model'],
                    ['sellerName', 'Seller Name'],
                    ['regularPrice', 'Regular Price'],
                    ['salePrice', 'Sale Price'],
                    ['stockQuantity', 'Stock Quantity'],
                    ['seoSlug', 'SEO Slug'],
                    ['mainImageUrl', 'Main Image URL'],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">{label}</label>
                      <input
                        value={(editingRow.fields as any)[key] || ''}
                        onChange={(event) =>
                          updateRow(editingRow.clientId, (current) => ({
                            ...current,
                            fields: {
                              ...current.fields,
                              [key]: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Image Repair</p>
                        <h4 className="mt-2 text-lg font-black text-slate-950">Main image and gallery</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => mainImageInputRef.current?.click()}
                          disabled={imageUploadState.busy}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {imageUploadState.busy && imageUploadState.target === 'main' ? 'Uploading Main...' : 'Upload Main Image'}
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryImageInputRef.current?.click()}
                          disabled={imageUploadState.busy}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {imageUploadState.busy && imageUploadState.target === 'gallery' ? 'Uploading Gallery...' : 'Upload Gallery Images'}
                        </button>
                      </div>
                    </div>

                    <input
                      ref={mainImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleMainImageUpload(event.target.files?.[0] || null);
                        event.currentTarget.value = '';
                      }}
                    />
                    <input
                      ref={galleryImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void handleGalleryUpload(event.target.files);
                        event.currentTarget.value = '';
                      }}
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
                          <img
                            src={editingRow.fields.mainImageUrl || PRODUCT_PLACEHOLDER_IMAGE}
                            alt={editingRow.fields.productTitle || 'Main image preview'}
                            className="h-52 w-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(editingRow.clientId, (current) => ({
                                ...current,
                                fields: {
                                  ...current.fields,
                                  mainImageUrl: '',
                                  thumbnailUrl: '',
                                },
                              }))
                            }
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                          >
                            Remove Main
                          </button>
                          <button
                            type="button"
                            onClick={() => mainImageInputRef.current?.click()}
                            className="flex-1 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white"
                          >
                            Replace
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                          Broken image URLs remain warnings only. You can keep the URL, upload a replacement, or let the importer use the placeholder.
                        </div>
                        {imageUploadState.error ? (
                          <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                            {imageUploadState.error}
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-2">
                          <label className="text-sm font-bold text-slate-800">Gallery Image URLs</label>
                          <textarea
                            value={editingRow.fields.galleryImageUrls.join('\n')}
                            onChange={(event) =>
                              updateRow(editingRow.clientId, (current) => ({
                                ...current,
                                fields: {
                                  ...current.fields,
                                  galleryImageUrls: dedupeList(
                                    event.target.value
                                      .split('\n')
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                  ).slice(0, 7),
                                },
                              }))
                            }
                            rows={4}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            placeholder="One gallery image URL per line"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {editingRow.fields.galleryImageUrls.length ? (
                            editingRow.fields.galleryImageUrls.map((url, index) => (
                              <div key={`${url}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRow(editingRow.clientId, (current) => ({
                                      ...current,
                                      fields: {
                                        ...current.fields,
                                        galleryImageUrls: current.fields.galleryImageUrls.filter((entry) => entry !== url),
                                      },
                                    }))
                                  }
                                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm font-medium text-slate-500">
                              No gallery images yet. Upload from your computer or keep URLs from the file.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">Short Description</label>
                    <textarea
                      value={editingRow.fields.shortDescription}
                      onChange={(event) =>
                        updateRow(editingRow.clientId, (current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            shortDescription: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">Long Description</label>
                    <textarea
                      value={editingRow.fields.longDescription}
                      onChange={(event) =>
                        updateRow(editingRow.clientId, (current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            longDescription: event.target.value,
                          },
                        }))
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRowId(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
