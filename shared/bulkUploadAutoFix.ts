export type BulkUploadCategoryFixInput = {
  productTitle?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
  brand?: string;
  model?: string;
};

export type BulkUploadCategoryFixResult = {
  parentCategory: string;
  category: string;
  subcategory: string;
  productType: string;
  parentCategorySlug: string;
  categorySlug: string;
  subcategorySlug: string;
  changed: boolean;
};

const DEFAULT_PARENT = { name: 'Electronics', slug: 'electronics' };
const DEFAULT_CATEGORY = { name: 'Laptops', slug: 'laptops' };

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeMatch = (value: unknown) => normalizeText(value).toLowerCase().replace(/\s+/g, ' ');

export function resolveBulkUploadCategoryFix(input: BulkUploadCategoryFixInput): BulkUploadCategoryFixResult | null {
  const corpus = normalizeMatch([
    input.productTitle,
    input.category,
    input.subcategory,
    input.productType,
    input.brand,
    input.model,
  ].join(' '));
  const hasLaptopSignal =
    /\b(laptop|notebook|ultrabook|macbook|elitebook|latitude|thinkpad|surface|business laptop|rog|nitro|msi|gaming|precision|zbook|workstation|chromebook)\b/i.test(
      corpus
    );

  if (!hasLaptopSignal) return null;

  let subcategory = { name: 'Business Laptops', slug: 'business-laptops' };
  if (/\bmac\s*book\b|\bmacbook\b/i.test(corpus)) {
    subcategory = { name: 'Apple Laptops', slug: 'apple-laptops' };
  } else if (/\brog\b|\bnitro\b|\bmsi\b|\bgaming\b/i.test(corpus)) {
    subcategory = { name: 'Gaming Laptops', slug: 'gaming-laptops' };
  } else if (/\bprecision\b|\bzbook\b|\bworkstation\b/i.test(corpus)) {
    subcategory = { name: 'Workstations', slug: 'workstations' };
  } else if (/\bchromebook\b/i.test(corpus)) {
    subcategory = { name: 'Chromebooks', slug: 'chromebooks' };
  }

  return {
    parentCategory: DEFAULT_PARENT.name,
    category: DEFAULT_CATEGORY.name,
    subcategory: subcategory.name,
    productType: normalizeText(input.productType) || 'Laptop',
    parentCategorySlug: DEFAULT_PARENT.slug,
    categorySlug: DEFAULT_CATEGORY.slug,
    subcategorySlug: subcategory.slug,
    changed:
      normalizeMatch(input.category) !== normalizeMatch(DEFAULT_CATEGORY.name) ||
      normalizeMatch(input.subcategory) !== normalizeMatch(subcategory.name),
  };
}
