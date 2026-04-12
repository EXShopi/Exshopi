export const normalizeSlugInput = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

export const slugifyProduct = (value: string) => normalizeSlugInput(value) || "product";

export async function ensureUniqueSlug(
  desiredValue: string,
  options: {
    currentId?: string;
    exists: (slug: string) => Promise<boolean>;
  }
) {
  const baseSlug = slugifyProduct(desiredValue);
  let candidate = baseSlug;
  let counter = 2;

  while (await options.exists(candidate)) {
    if (options.currentId) {
      const currentMatch = await options.exists(candidate);
      if (!currentMatch) break;
    }
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}
