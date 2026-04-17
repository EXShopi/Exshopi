import {
  buildDetailedSpecificationGroups,
  buildFlatSpecifications,
  getMissingRequiredSpecificationLabels,
  getSpecificationTemplate,
  humanizeSpecificationValue,
  normalizeSpecificationValues,
  type DetailedSpecificationGroup,
  type SpecificationTemplate,
  type VariantDimensionKey,
} from '../../shared/productSpecifications';
import { resolveCanonicalCategoryAssignment } from '../../src/lib/masterCategories';

type VariantRecord = {
  id?: string;
  color?: string;
  size?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  material?: string;
  style?: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  image?: string;
};

type ProductSpecificationContext = {
  parentCategorySlug?: string | null;
  parentCategoryName?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  subcategorySlug?: string | null;
  subcategoryName?: string | null;
  title?: string | null;
};

function toStringArray(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return String(raw || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHighlights(raw: unknown) {
  return Array.from(new Set(toStringArray(raw))).slice(0, 10);
}

function normalizeAdditionalGroups(raw: unknown) {
  if (!Array.isArray(raw)) return [] as DetailedSpecificationGroup[];

  return raw
    .map((group, index) => {
      const source = group && typeof group === 'object' ? (group as Record<string, any>) : {};
      const items = Array.isArray(source.items)
        ? source.items
            .map((item, itemIndex) => ({
              key: String(item?.key || item?.label || `item-${itemIndex + 1}`).trim(),
              label: String(item?.label || '').trim(),
              value: String(item?.value || '').trim(),
            }))
            .filter((item) => item.label && item.value)
        : [];

      return {
        key: String(source.key || source.title || `group-${index + 1}`).trim(),
        title: String(source.title || source.key || `Additional Group ${index + 1}`).trim(),
        items,
      };
    })
    .filter((group) => group.title && group.items.length);
}

function normalizeVariantDimensions(raw: unknown, template: SpecificationTemplate) {
  const allowed = new Set((template.variantDimensions || []).map((value) => String(value)));

  const source = Array.isArray(raw) ? raw : [];
  const values = source
    .map((item) => String(item || '').trim())
    .filter((item): item is VariantDimensionKey => Boolean(item) && allowed.has(item));

  return values.length ? Array.from(new Set(values)) : template.variantDimensions || [];
}

function normalizeVariants(raw: unknown, variantAttributes: VariantDimensionKey[]) {
  if (!Array.isArray(raw)) return [] as VariantRecord[];

  const allowed = new Set(variantAttributes);

  return raw
    .map((variant, index) => {
      const source = variant && typeof variant === 'object' ? (variant as Record<string, any>) : {};
      const next: VariantRecord = {
        id: String(source.id || `variant-${index + 1}`),
        price:
          source.price === '' || source.price == null ? null : Number.isFinite(Number(source.price)) ? Number(source.price) : null,
        originalPrice:
          source.originalPrice === '' || source.originalPrice == null
            ? null
            : Number.isFinite(Number(source.originalPrice))
            ? Number(source.originalPrice)
            : null,
        stock:
          source.stock === '' || source.stock == null ? null : Number.isFinite(Number(source.stock)) ? Number(source.stock) : null,
        sku: String(source.sku || '').trim(),
        image: String(source.image || '').trim() || undefined,
      };

      (['color', 'size', 'storage', 'ram', 'processor', 'material', 'style'] as VariantDimensionKey[]).forEach((key) => {
        next[key] = allowed.has(key) ? String(source[key] || '').trim() : '';
      });

      return next;
    })
    .filter((variant) => variant.price != null || variant.stock != null || variant.sku || variant.color || variant.size || variant.storage || variant.ram || variant.processor || variant.material || variant.style);
}

export function normalizeProductSpecifications(
  inputSpecs: Record<string, any> | undefined,
  context: ProductSpecificationContext
) {
  const specs = inputSpecs && typeof inputSpecs === 'object' ? inputSpecs : {};
  const canonicalAssignment = resolveCanonicalCategoryAssignment({
    ...specs,
    parentCategorySlug: context.parentCategorySlug || specs.parentCategorySlug || specs.categorySlug || '',
    categorySlug: context.categorySlug || specs.categorySlug || context.parentCategorySlug || '',
    subcategorySlug: context.subcategorySlug || specs.subcategorySlug || specs.templateId || '',
    categoryPath: specs.categoryPath || '',
    title: context.title || '',
  });

  const template = getSpecificationTemplate(
    canonicalAssignment.parentCategorySlug || context.parentCategorySlug || context.categorySlug || '',
    canonicalAssignment.subcategorySlug || context.subcategorySlug || specs.templateId || '',
    canonicalAssignment.subcategoryName || context.subcategoryName || specs.templateName || '',
    canonicalAssignment.categorySlug || context.categorySlug || context.parentCategorySlug || ''
  );

  const sourceValues = {
    ...((specs.specificationValues as Record<string, unknown>) || {}),
    ...((specs.specifications as Record<string, unknown>) || {}),
    ...((specs.attributes as Record<string, unknown>) || {}),
  };

  const specificationValues = normalizeSpecificationValues(sourceValues, template);
  const additionalGroups = normalizeAdditionalGroups(specs.additionalSpecificationGroups || specs.customSpecificationGroups);
  const specificationGroups = buildDetailedSpecificationGroups(specificationValues, template, additionalGroups);
  const flatSpecifications = buildFlatSpecifications(specificationValues, template);
  const briefHighlights = normalizeHighlights(specs.briefHighlights || specs.keyFeatures);
  const whatsInTheBox = normalizeHighlights(specs.whatsInTheBox || specs.boxContents);
  const searchTags = normalizeHighlights(specs.searchTags);
  const variantAttributes = normalizeVariantDimensions(specs.variantAttributes, template);
  const variants = normalizeVariants(specs.variants, variantAttributes);

  return {
    template,
    specs: {
      ...specs,
      templateId: specs.templateId || template.id,
      templateName: specs.templateName || template.title,
      categoryTemplateKey: template.key,
      specificationValues,
      specifications: flatSpecifications,
      specificationGroups,
      additionalSpecificationGroups: additionalGroups,
      briefHighlights,
      keyFeatures: briefHighlights,
      whatsInTheBox,
      searchTags,
      variantAttributes,
      variants,
      attributes: {
        ...flatSpecifications,
        brand:
          String(
            flatSpecifications.brand ||
              humanizeSpecificationValue(specificationValues.brand as any) ||
              specs.attributes?.brand ||
              ''
          ).trim(),
        subcategory: canonicalAssignment.subcategorySlug || context.subcategorySlug || specs.attributes?.subcategory || '',
      },
      parentCategorySlug: canonicalAssignment.parentCategorySlug || context.parentCategorySlug || specs.parentCategorySlug || specs.categorySlug || '',
      categorySlug: canonicalAssignment.categorySlug || context.categorySlug || context.parentCategorySlug || specs.categorySlug || '',
      subcategorySlug: canonicalAssignment.subcategorySlug || context.subcategorySlug || specs.subcategorySlug || '',
      parentCategoryName: canonicalAssignment.parentCategoryName || context.parentCategoryName || specs.parentCategoryName || '',
      categoryName: canonicalAssignment.categoryName || context.categoryName || context.parentCategoryName || specs.categoryName || '',
      subcategoryName: canonicalAssignment.subcategoryName || context.subcategoryName || specs.subcategoryName || '',
      categoryPath:
        canonicalAssignment.categoryPath ||
        specs.categoryPath ||
        [context.parentCategorySlug || context.categorySlug || '', context.subcategorySlug || ''].filter(Boolean).join('/'),
    },
  };
}

export function validateProductSpecificationsForTemplate(
  specs: Record<string, any>,
  template: SpecificationTemplate,
  options: { requireHighlights?: boolean } = {}
) {
  const missingRequired = getMissingRequiredSpecificationLabels(specs.specificationValues || specs.specifications || {}, template);
  if (missingRequired.length) {
    throw new Error(`Missing required specifications: ${missingRequired.join(', ')}`);
  }

  if (options.requireHighlights && (!Array.isArray(specs.briefHighlights) || specs.briefHighlights.length < 3)) {
    throw new Error('Add at least 3 brief highlights before publishing.');
  }
}
