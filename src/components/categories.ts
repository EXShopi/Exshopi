import { MASTER_CATEGORIES } from '../lib/masterCategories';

export type SubCategoryGroup = {
  title: string;
  items: string[];
};

export type MainCategory = {
  id: string;
  name: string;
  description: string;
  groups: SubCategoryGroup[];
};

// Derive a marketplace-friendly groups structure from MASTER_CATEGORIES
export const marketplaceCategories: MainCategory[] = (MASTER_CATEGORIES || []).map((parent) => {
  const leftovers: string[] = [];
  const groups: SubCategoryGroup[] = [];

  (parent.subcategories || []).forEach((sub: any) => {
    if (Array.isArray(sub.subcategories) && sub.subcategories.length > 0) {
      groups.push({ title: sub.name, items: sub.subcategories.map((c: any) => c.name) });
    } else if (Array.isArray(sub.childCategories) && sub.childCategories.length > 0) {
      groups.push({ title: sub.name, items: sub.childCategories.map((c: any) => c.name) });
    } else {
      leftovers.push(sub.name);
    }
  });

  if (leftovers.length) groups.push({ title: 'More', items: leftovers });

  return {
    id: String(parent.slug),
    name: parent.name,
    description: parent.description || '',
    groups,
  };
});