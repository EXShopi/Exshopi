import { z } from "zod";
import { normalizeSlugInput } from "../utils/slug";

export const productSeoSchema = z.object({
  slug: z
    .string()
    .max(140)
    .optional()
    .transform((value) => (value ? normalizeSlugInput(value) : undefined)),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  ogTitle: z.string().max(120).optional(),
  ogDescription: z.string().max(220).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
});

export function validateSeoForPublish(input: {
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
}) {
  const slug = String(input.slug || "").trim();
  const metaTitle = String(input.metaTitle || "").trim();
  const metaDescription = String(input.metaDescription || "").trim();

  if (!slug) {
    throw new Error("SEO slug is required before publishing.");
  }

  if (!metaTitle) {
    throw new Error("SEO title is required before publishing.");
  }

  if (!metaDescription) {
    throw new Error("SEO description is required before publishing.");
  }
}
