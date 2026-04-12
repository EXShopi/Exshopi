import {
  DEFAULT_SPECIFICATION_TEMPLATES,
  buildDetailedSpecificationGroups,
  buildFlatSpecifications,
  buildSpecificationTableRows,
  getEnabledSpecificationFields,
  getMissingRequiredSpecificationLabels,
  getSpecificationTemplate as getSharedSpecificationTemplate,
  getTemplateFieldMap,
  getTemplateVariantFields,
  humanizeSpecificationValue,
  normalizeSpecificationValue,
  normalizeSpecificationValues,
  preserveMatchingSpecificationValues,
  type DetailedSpecificationGroup,
  type DetailedSpecificationItem,
  type SpecificationFieldDefinition,
  type SpecificationFieldType,
  type SpecificationTemplate,
  type VariantDimensionKey,
  type SpecificationValue,
} from '../../shared/productSpecifications';

export {
  DEFAULT_SPECIFICATION_TEMPLATES,
  buildDetailedSpecificationGroups,
  buildFlatSpecifications,
  buildSpecificationTableRows,
  getEnabledSpecificationFields,
  getMissingRequiredSpecificationLabels,
  getTemplateFieldMap,
  getTemplateVariantFields,
  humanizeSpecificationValue,
  normalizeSpecificationValue,
  normalizeSpecificationValues,
  preserveMatchingSpecificationValues,
  type DetailedSpecificationGroup,
  type DetailedSpecificationItem,
  type SpecificationFieldDefinition,
  type SpecificationFieldType,
  type SpecificationTemplate,
  type SpecificationValue,
  type VariantDimensionKey,
};

export type SpecificationTemplateOverride = {
  id: string;
  title?: string;
  fields?: SpecificationFieldDefinition[];
  variantDimensions?: VariantDimensionKey[];
};

const STORAGE_KEY = 'exshopi:spec-template-overrides:v1';

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function cloneTemplate(template: SpecificationTemplate): SpecificationTemplate {
  return {
    ...template,
    appliesTo: {
      ...(template.appliesTo || {}),
    },
    sections: [...(template.sections || [])],
    variantDimensions: [...(template.variantDimensions || [])],
    highlightSuggestions: [...(template.highlightSuggestions || [])],
    fields: (template.fields || []).map((field) => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    })),
  };
}

function findTemplateById(templateId: string) {
  return DEFAULT_SPECIFICATION_TEMPLATES.find((template) => template.id === templateId) || null;
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
    [templateId]: {
      ...override,
      id: templateId,
    },
  };

  currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function mergeSpecificationTemplate(template: SpecificationTemplate): SpecificationTemplate {
  const override = readSpecificationTemplateOverrides()[template.id];
  const baseTemplate = cloneTemplate(template);

  if (!override) return baseTemplate;

  return {
    ...baseTemplate,
    title: override.title || baseTemplate.title,
    fields: Array.isArray(override.fields)
      ? override.fields.map((field) => ({
          ...field,
          options: field.options ? [...field.options] : undefined,
        }))
      : baseTemplate.fields,
    variantDimensions: Array.isArray(override.variantDimensions)
      ? [...override.variantDimensions]
      : baseTemplate.variantDimensions,
  };
}

export function getSpecificationTemplate(
  parentSlug?: string | null,
  subcategorySlug?: string | null,
  subcategoryName?: string | null,
  categorySlug?: string | null
) {
  const baseTemplate = getSharedSpecificationTemplate(parentSlug, categorySlug, subcategorySlug, subcategoryName);
  return mergeSpecificationTemplate(baseTemplate);
}

export function getSpecificationTemplateById(templateId: string) {
  const template = findTemplateById(templateId);
  return template ? mergeSpecificationTemplate(template) : null;
}
