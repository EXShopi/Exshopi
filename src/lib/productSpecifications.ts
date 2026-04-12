export type SpecificationFieldType = 'text' | 'textarea' | 'number' | 'select';

export type SpecificationFieldDefinition = {
  key: string;
  label: string;
  type: SpecificationFieldType;
  required: boolean;
  enabled: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
};

export type VariantDimensionKey = 'color' | 'size' | 'storage' | 'ram' | 'processor';

export type SpecificationTemplate = {
  id: string;
  title: string;
  appliesTo: {
    parentSlugs?: string[];
    subcategorySlugs?: string[];
    subcategoryNameIncludes?: string[];
  };
  fields: SpecificationFieldDefinition[];
  variantDimensions: VariantDimensionKey[];
};

export type SpecificationTemplateOverride = {
  id: string;
  title?: string;
  fields?: SpecificationFieldDefinition[];
  variantDimensions?: VariantDimensionKey[];
};

const STORAGE_KEY = 'exshopi:spec-template-overrides:v1';

const mobileTemplate: SpecificationTemplate = {
  id: 'mobiles',
  title: 'Mobiles',
  appliesTo: {
    subcategorySlugs: ['mobiles', 'mobile-phones', 'phones', 'smartphones', 'mobiles-tablets'],
    subcategoryNameIncludes: ['mobile', 'phone', 'smartphone', 'iphone'],
  },
  variantDimensions: ['color', 'storage', 'ram'],
  fields: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, enabled: true, placeholder: 'Apple, Samsung, Xiaomi...' },
    { key: 'model', label: 'Model', type: 'text', required: true, enabled: true, placeholder: 'iPhone 15 Pro Max' },
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      required: true,
      enabled: true,
      options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    },
    { key: 'ram', label: 'RAM', type: 'text', required: true, enabled: true, placeholder: '8GB' },
    { key: 'color', label: 'Color', type: 'text', required: true, enabled: true, placeholder: 'Natural Titanium' },
    { key: 'displaySize', label: 'Display Size', type: 'text', required: false, enabled: true, placeholder: '6.7-inch' },
    { key: 'batteryCapacity', label: 'Battery Capacity', type: 'text', required: false, enabled: true, placeholder: '4422mAh' },
    { key: 'camera', label: 'Camera', type: 'text', required: false, enabled: true, placeholder: '48MP rear / 12MP front' },
    { key: 'operatingSystem', label: 'OS', type: 'text', required: false, enabled: true, placeholder: 'iOS 18' },
  ],
};

const laptopTemplate: SpecificationTemplate = {
  id: 'laptops',
  title: 'Laptops',
  appliesTo: {
    subcategorySlugs: ['laptops', 'laptops-desktops', 'computers', 'desktop-pcs'],
    subcategoryNameIncludes: ['laptop', 'notebook', 'computer', 'desktop', 'macbook'],
  },
  variantDimensions: ['color', 'storage', 'ram', 'processor'],
  fields: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, enabled: true, placeholder: 'Apple, Dell, Lenovo...' },
    { key: 'model', label: 'Model', type: 'text', required: true, enabled: true, placeholder: 'MacBook Air M2' },
    {
      key: 'processor',
      label: 'Processor',
      type: 'select',
      required: true,
      enabled: true,
      options: ['Intel i5', 'Intel i7', 'Intel i9', 'Apple M1', 'Apple M2', 'Apple M3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Other'],
    },
    { key: 'generation', label: 'Generation', type: 'text', required: false, enabled: true, placeholder: '13th Gen, M2...' },
    { key: 'ram', label: 'RAM', type: 'text', required: true, enabled: true, placeholder: '16GB' },
    { key: 'storage', label: 'Storage', type: 'text', required: true, enabled: true, placeholder: '512GB SSD' },
    { key: 'screenSize', label: 'Screen Size', type: 'text', required: false, enabled: true, placeholder: '15.6-inch' },
    { key: 'graphics', label: 'Graphics', type: 'text', required: false, enabled: true, placeholder: 'Intel Iris Xe / RTX 4060' },
    { key: 'operatingSystem', label: 'OS', type: 'text', required: false, enabled: true, placeholder: 'Windows 11 / macOS' },
  ],
};

const fashionTemplate: SpecificationTemplate = {
  id: 'fashion',
  title: 'Fashion',
  appliesTo: {
    parentSlugs: ['fashion'],
    subcategoryNameIncludes: ['fashion', 'shirt', 'dress', 'abaya', 'shoe', 'bag', 'watch', 'accessor'],
  },
  variantDimensions: ['color', 'size'],
  fields: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, enabled: true, placeholder: 'Nike, Zara, H&M...' },
    { key: 'material', label: 'Material', type: 'text', required: true, enabled: true, placeholder: 'Cotton, Leather...' },
    { key: 'size', label: 'Size', type: 'text', required: true, enabled: true, placeholder: 'S, M, L, XL' },
    { key: 'color', label: 'Color', type: 'text', required: true, enabled: true, placeholder: 'Black' },
    { key: 'fitType', label: 'Fit Type', type: 'text', required: false, enabled: true, placeholder: 'Slim Fit, Regular Fit' },
  ],
};

const genericTemplate: SpecificationTemplate = {
  id: 'general',
  title: 'General Listing',
  appliesTo: {},
  variantDimensions: ['color', 'size'],
  fields: [
    { key: 'brand', label: 'Brand', type: 'text', required: true, enabled: true, placeholder: 'Brand name' },
    { key: 'model', label: 'Model', type: 'text', required: false, enabled: true, placeholder: 'Model or series' },
    { key: 'color', label: 'Color', type: 'text', required: false, enabled: true, placeholder: 'Black, White...' },
    { key: 'material', label: 'Material', type: 'text', required: false, enabled: true, placeholder: 'Optional' },
  ],
};

export const DEFAULT_SPECIFICATION_TEMPLATES: SpecificationTemplate[] = [
  mobileTemplate,
  laptopTemplate,
  fashionTemplate,
  genericTemplate,
];

function normalizeSlug(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

export function readSpecificationTemplateOverrides(): Record<string, SpecificationTemplateOverride> {
  const currentWindow = safeWindow();
  if (!currentWindow) return {};

  try {
    const raw = currentWindow.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeSpecificationTemplateOverride(templateId: string, override: SpecificationTemplateOverride) {
  const currentWindow = safeWindow();
  if (!currentWindow) return;

  const next = {
    ...readSpecificationTemplateOverrides(),
    [templateId]: override,
  };
  currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function mergeSpecificationTemplate(template: SpecificationTemplate): SpecificationTemplate {
  const override = readSpecificationTemplateOverrides()[template.id];
  if (!override) return template;

  return {
    ...template,
    title: override.title || template.title,
    fields: Array.isArray(override.fields) ? override.fields : template.fields,
    variantDimensions: Array.isArray(override.variantDimensions)
      ? override.variantDimensions
      : template.variantDimensions,
  };
}

function templateMatches(
  template: SpecificationTemplate,
  parentSlug?: string | null,
  subcategorySlug?: string | null,
  subcategoryName?: string | null
) {
  const normalizedParent = normalizeSlug(parentSlug);
  const normalizedSubcategory = normalizeSlug(subcategorySlug);
  const normalizedSubcategoryName = normalizeSlug(subcategoryName);

  const parentMatch =
    !template.appliesTo.parentSlugs?.length ||
    template.appliesTo.parentSlugs.map(normalizeSlug).includes(normalizedParent);

  const subcategoryMatch =
    !template.appliesTo.subcategorySlugs?.length ||
    template.appliesTo.subcategorySlugs.map(normalizeSlug).includes(normalizedSubcategory);

  const nameIncludesMatch =
    !template.appliesTo.subcategoryNameIncludes?.length ||
    template.appliesTo.subcategoryNameIncludes.some((value) =>
      normalizedSubcategoryName.includes(normalizeSlug(value))
    );

  return parentMatch && (subcategoryMatch || nameIncludesMatch);
}

export function getSpecificationTemplate(
  parentSlug?: string | null,
  subcategorySlug?: string | null,
  subcategoryName?: string | null
) {
  const matched =
    DEFAULT_SPECIFICATION_TEMPLATES.find((template) =>
      template.id !== 'general' && templateMatches(template, parentSlug, subcategorySlug, subcategoryName)
    ) || genericTemplate;

  return mergeSpecificationTemplate(matched);
}

export function getEnabledSpecificationFields(template: SpecificationTemplate) {
  return (template.fields || []).filter((field) => field.enabled !== false);
}

export function normalizeSpecificationValues(
  values: Record<string, unknown>,
  template: SpecificationTemplate
) {
  const allowedKeys = new Set(getEnabledSpecificationFields(template).map((field) => field.key));
  const next: Record<string, string> = {};

  Object.entries(values || {}).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    const normalized = String(value ?? '').trim();
    if (normalized) next[key] = normalized;
  });

  return next;
}

export function getMissingRequiredSpecificationLabels(
  values: Record<string, unknown>,
  template: SpecificationTemplate
) {
  return getEnabledSpecificationFields(template)
    .filter((field) => field.required)
    .filter((field) => !String(values?.[field.key] ?? '').trim())
    .map((field) => field.label);
}

export function buildSpecificationTableRows(
  specifications: Record<string, unknown>,
  template?: SpecificationTemplate | null
) {
  const orderedFields = template ? getEnabledSpecificationFields(template) : [];
  const usedKeys = new Set<string>();
  const rows: Array<{ key: string; label: string; value: string }> = [];

  orderedFields.forEach((field) => {
    const value = String(specifications?.[field.key] ?? '').trim();
    if (!value) return;
    usedKeys.add(field.key);
    rows.push({
      key: field.key,
      label: field.label,
      value,
    });
  });

  Object.entries(specifications || {}).forEach(([key, rawValue]) => {
    if (usedKeys.has(key)) return;
    const value = String(rawValue ?? '').trim();
    if (!value) return;
    rows.push({
      key,
      label: key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      value,
    });
  });

  return rows;
}
