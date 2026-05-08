import { normalizeCategorySlug } from "./masterCategories";

export type SmartSearchResult<T> = {
  item: T;
  score: number;
  matchedTerms: string[];
};

const SEARCH_SYNONYMS: Record<string, string[]> = {
  macbook: ["mackbook", "mac book", "apple laptop", "mac"],
  elitebook: ["elitebok", "elite book", "hp business laptop"],
  thinkpad: ["think pad", "lenovo business laptop"],
  laptop: ["laptops", "notebook", "ultrabook", "computer", "pc"],
  laptops: ["laptop", "notebook", "ultrabook", "computer", "pc"],
  gaming: ["gameing", "gamer", "gaming laptop", "gaming laptops"],
  mobile: ["mobiles", "phone", "phones", "smartphone", "iphone", "android"],
  mobiles: ["mobile", "phone", "phones", "smartphone", "iphone", "android"],
  camera: ["cameras", "dslr", "mirrorless", "action camera"],
  cameras: ["camera", "dslr", "mirrorless", "action camera"],
  touchscreen: ["touch", "touch screen"],
  refurbished: ["renewed", "used", "pre owned", "pre-owned"],
};

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenValue(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenValue(item));
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap((item) => flattenValue(item));
  return [String(value)];
}

export function buildSearchDocument(product: any) {
  const raw = product?.raw || product || {};
  const specs = raw?.specs || {};
  const attributes = specs?.attributes || {};
  const fields = [
    product?.title,
    product?.category,
    product?.seller,
    product?.sku,
    raw?.title,
    raw?.sku,
    raw?.brand,
    raw?.model,
    raw?.category,
    raw?.subcategory,
    raw?.description,
    raw?.shortDescription,
    raw?.longDescription,
    raw?.metaKeywords,
    specs?.metaKeywords,
    specs?.searchTags,
    specs?.keyFeatures,
    specs?.briefHighlights,
    specs?.categoryName,
    specs?.subcategoryName,
    specs?.parentCategoryName,
    specs?.categorySlug,
    specs?.subcategorySlug,
    specs?.parentCategorySlug,
    specs?.templateId,
    specs?.templateName,
    attributes,
    specs?.specifications,
    specs?.specificationValues,
  ].flatMap((value) => flattenValue(value));

  return normalizeSearchText(fields.join(" "));
}

function levenshteinDistance(a: string, b: string, maxDistance = 2) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function expandQueryTerms(query: string) {
  const normalized = normalizeSearchText(query);
  const baseTerms = normalized.split(" ").filter(Boolean);
  const expanded = new Set<string>([normalized, ...baseTerms]);

  for (const term of baseTerms) {
    const slug = normalizeCategorySlug(term);
    if (SEARCH_SYNONYMS[term]) SEARCH_SYNONYMS[term].forEach((value) => expanded.add(normalizeSearchText(value)));
    if (SEARCH_SYNONYMS[slug]) SEARCH_SYNONYMS[slug].forEach((value) => expanded.add(normalizeSearchText(value)));
    for (const [canonical, aliases] of Object.entries(SEARCH_SYNONYMS)) {
      if (aliases.map((value) => normalizeSearchText(value)).includes(term)) expanded.add(canonical);
    }
  }

  return Array.from(expanded).filter(Boolean);
}

export function getSearchCorrection(query: string) {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  const corrected = terms.map((term) => {
    for (const [canonical, aliases] of Object.entries(SEARCH_SYNONYMS)) {
      if (canonical === term || aliases.map((value) => normalizeSearchText(value)).includes(term)) return canonical;
      if (levenshteinDistance(term, canonical, 2) <= 2) return canonical;
    }
    return term;
  });

  const suggestion = corrected.join(" ").trim();
  return suggestion && suggestion !== normalizeSearchText(query) ? suggestion : "";
}

export function smartSearchProducts<T>(products: T[], query: string, limit?: number): SmartSearchResult<T>[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return products.map((item) => ({ item, score: 0, matchedTerms: [] }));

  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  const expandedTerms = expandQueryTerms(normalizedQuery);

  const results = (products || [])
    .map((item) => {
      const document = buildSearchDocument(item);
      const documentTerms = document.split(" ").filter(Boolean);
      let score = 0;
      const matchedTerms = new Set<string>();

      if (document.includes(normalizedQuery)) {
        score += 120;
        matchedTerms.add(normalizedQuery);
      }

      for (const term of expandedTerms) {
        if (term.length < 2) continue;
        if (document.includes(term)) {
          score += term.includes(" ") ? 60 : 35;
          matchedTerms.add(term);
          continue;
        }

        const fuzzyMatch = documentTerms.some((candidate) => {
          if (candidate.length < 4 || term.length < 4) return false;
          return candidate.includes(term) || term.includes(candidate) || levenshteinDistance(term, candidate, 2) <= 2;
        });

        if (fuzzyMatch) {
          score += 18;
          matchedTerms.add(term);
        }
      }

      const allQueryTermsCovered = queryTerms.every((term) =>
        document.includes(term) ||
        documentTerms.some((candidate) => candidate.length >= 3 && levenshteinDistance(term, candidate, 2) <= 2)
      );
      if (allQueryTermsCovered) score += 50;

      return { item, score, matchedTerms: Array.from(matchedTerms) };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score);

  return typeof limit === "number" ? results.slice(0, limit) : results;
}

export function getTrendingSearches() {
  return ["MacBook", "EliteBook", "Dell i7", "Gaming laptop", "HP touch", "iPhone", "DSLR camera"];
}
