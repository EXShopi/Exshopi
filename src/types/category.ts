export interface LiveCategory {
  id: string;
  name: string;
  slug: string;
  subcategories?: Array<{
    name: string;
    slug: string;
  }>;
}

export type CategoryRef = { parentId: string; subSlug?: string };
