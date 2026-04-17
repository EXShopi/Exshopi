import { buildProductPath } from "./seo";
import { extractProductSeoFacts, cleanSeoSlug } from "./seoMarketplace";

function normalizeValue(value: unknown) {
  return cleanSeoSlug(String(value || ""));
}

function collectSlugCandidates(product: any) {
  const specs = product?.specs || {};
  const attributes = specs?.attributes || {};
  const facts = extractProductSeoFacts(product);

  const candidates = new Set<string>();

  const push = (value: unknown) => {
    const normalized = normalizeValue(value);
    if (normalized) candidates.add(normalized);
  };

  push(product?.id);
  push(product?.slug);
  push(product?.seoSlug);
  push(product?.rawSlug);
  push(specs?.slug);
  push(specs?.seoSlug);
  push(specs?.seo?.slug);
  push(product?.title);

  const verboseLegacyParts = [
    facts.brand,
    attributes.model || facts.model,
    attributes.year || facts.year,
    attributes.laptopType || attributes.deviceType || specs?.templateName,
    attributes.screenSize ? `with ${attributes.screenSize} display` : "",
    attributes.processorFamily || attributes.processor || "",
    attributes.generation ? `${attributes.generation} gen` : "",
    attributes.ram || "",
    [attributes.storage, attributes.storageType].filter(Boolean).join(" "),
    attributes.graphicsMemory || "",
    attributes.graphicsBrand || "",
  ].filter(Boolean);

  if (verboseLegacyParts.length >= 5 && attributes.storage && attributes.ram) {
    push(verboseLegacyParts.join(" "));
  }

  return Array.from(candidates);
}

function collectSubcategoryCandidates(product: any) {
  const specs = product?.specs || {};

  const values = new Set<string>();
  const push = (value: unknown) => {
    const normalized = normalizeValue(value);
    if (normalized) values.add(normalized);
  };

  push(specs?.subcategorySlug);
  push(specs?.categorySlug);
  push(specs?.templateId);
  push(specs?.subcategoryName);
  push(specs?.templateName);
  push(specs?.attributes?.subcategory);

  return Array.from(values);
}

export function getProductCanonicalPath(product: any) {
  return buildProductPath(product);
}

export function getProductRouteAliases(product: any) {
  const canonicalPath = getProductCanonicalPath(product);
  const canonicalSlug = normalizeValue(canonicalPath.split("/").pop() || "");
  const specs = product?.specs || {};
  const parentSlug = normalizeValue(
    specs?.parentCategorySlug || specs?.categorySlug || product?.category || "electronics"
  );
  const subcategoryCandidates = collectSubcategoryCandidates(product);
  const slugCandidates = collectSlugCandidates(product);

  const aliases = new Set<string>();
  aliases.add(canonicalPath);

  for (const slugCandidate of slugCandidates) {
    if (!slugCandidate) continue;
    aliases.add(`/product/${slugCandidate}`);

    for (const subcategory of subcategoryCandidates) {
      if (!parentSlug || !subcategory) continue;
      aliases.add(`/${parentSlug}/${subcategory}/${slugCandidate}`);
    }
  }

  // Keep common copy-suffix variants pointing at the canonical route.
  for (const slugCandidate of slugCandidates) {
    if (!slugCandidate) continue;
    aliases.add(`/product/${slugCandidate}-copy`);
    aliases.add(`/product/${slugCandidate}-copy-2`);

    for (const subcategory of subcategoryCandidates) {
      if (!parentSlug || !subcategory) continue;
      aliases.add(`/${parentSlug}/${subcategory}/${slugCandidate}-copy`);
      aliases.add(`/${parentSlug}/${subcategory}/${slugCandidate}-copy-2`);
    }
  }

  return Array.from(aliases)
    .map((value) => value.replace(/\/+/g, "/"))
    .filter(Boolean);
}

export function findProductRouteMatch(
  products: any[],
  identifier?: string,
  categorySlug?: string,
  subcategorySlug?: string
) {
  const normalizedIdentifier = normalizeValue(identifier);
  const requestedPath = [
    "",
    normalizeValue(categorySlug),
    normalizeValue(subcategorySlug),
    normalizedIdentifier,
  ]
    .filter(Boolean)
    .join("/");

  if (!normalizedIdentifier) {
    return null;
  }

  for (const product of products) {
    const aliases = getProductRouteAliases(product);
    const canonicalPath = getProductCanonicalPath(product);

    const matchedAlias = aliases.find((alias) => {
      const normalizedAlias = alias.replace(/\/+/g, "/");
      const normalizedAliasSlug = normalizeValue(normalizedAlias.split("/").pop() || "");

      if (requestedPath && normalizeValue(normalizedAlias) === normalizeValue(requestedPath)) {
        return true;
      }

      return normalizedAliasSlug === normalizedIdentifier;
    });

    if (matchedAlias) {
      return {
        product,
        matchedAlias,
        canonicalPath,
        isCanonical: normalizeValue(matchedAlias) === normalizeValue(canonicalPath),
      };
    }
  }

  return null;
}
