export type HomepageMerchandisingTarget =
  | "campaign"
  | "bestsellers"
  | "bestchoice"
  | "onsale"
  | "mostpopular";

export type MerchandisingProductLike = {
  id?: string | number | null;
  slug?: string | null;
};

export function normalizeMerchandisingSelectionValue(value: unknown) {
  const normalized = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) return "";
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export const HOMEPAGE_MERCHANDISING_TARGETS: Array<{
  key: HomepageMerchandisingTarget;
  label: string;
  description: string;
}> = [
  {
    key: "campaign",
    label: "Black Friday",
    description: "Homepage campaign / Black Friday slider",
  },
  {
    key: "bestsellers",
    label: "Best Sellers",
    description: "Featured Products best sellers tab",
  },
  {
    key: "bestchoice",
    label: "Top Picks",
    description: "Featured Products top picks tab",
  },
  {
    key: "onsale",
    label: "Deals",
    description: "Featured Products deals tab",
  },
  {
    key: "mostpopular",
    label: "Most Popular",
    description: "Most popular this month section",
  },
];

export function getMerchandisingProductTokens(product: MerchandisingProductLike) {
  return [product?.id, product?.slug]
    .map((value) => normalizeMerchandisingSelectionValue(value))
    .filter(Boolean);
}

export function pickPreferredMerchandisingToken(product: MerchandisingProductLike) {
  const id = normalizeMerchandisingSelectionValue(product?.id);
  if (id) return id;
  return normalizeMerchandisingSelectionValue(product?.slug);
}

export function isProductSelectedForMerchandising(
  selections: string[] | undefined,
  product: MerchandisingProductLike
) {
  const normalizedSelections = new Set(
    (selections || []).map((value) => normalizeMerchandisingSelectionValue(value)).filter(Boolean)
  );
  return getMerchandisingProductTokens(product).some((token) => normalizedSelections.has(token));
}

export function upsertMerchandisingSelection(
  selections: string[] | undefined,
  product: MerchandisingProductLike
) {
  const preferredToken = pickPreferredMerchandisingToken(product);
  if (!preferredToken) {
    return (selections || []).map((value) => normalizeMerchandisingSelectionValue(value)).filter(Boolean);
  }

  const productTokens = new Set(getMerchandisingProductTokens(product));
  const nextSelections = (selections || [])
    .map((value) => normalizeMerchandisingSelectionValue(value))
    .filter((value) => value && !productTokens.has(value));

  return [...nextSelections, preferredToken];
}

export function removeMerchandisingSelection(
  selections: string[] | undefined,
  product: MerchandisingProductLike
) {
  const productTokens = new Set(getMerchandisingProductTokens(product));
  return (selections || [])
    .map((value) => normalizeMerchandisingSelectionValue(value))
    .filter((value) => value && !productTokens.has(value));
}
