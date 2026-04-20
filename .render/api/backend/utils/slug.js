export const normalizeSlugInput = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bcopy\b/g, "")
    .replace(/-copy(?:-\d+)?$/g, "")
    .replace(/copy-\d+$/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
export const slugifyProduct = (value) => normalizeSlugInput(value) || "product";
export async function ensureUniqueSlug(desiredValue, options) {
    const baseSlug = slugifyProduct(desiredValue);
    let candidate = baseSlug;
    let counter = 2;
    while (await options.exists(candidate)) {
        if (options.currentId) {
            const currentMatch = await options.exists(candidate);
            if (!currentMatch)
                break;
        }
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
    }
    return candidate;
}
