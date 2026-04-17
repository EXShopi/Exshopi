import { MASTER_CATEGORIES } from '../lib/masterCategories';
import { getCategoryPath } from '../lib/seo';

export interface Subcategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
  icon?: string;
  subcategories: Subcategory[];
}

export interface NavItem {
  name: string;
  slug: string;
  route?: string;
  hasMenu?: boolean;
}

// Build a lightweight categoryData view from the canonical MASTER_CATEGORIES
export const categoryData: Category[] = (MASTER_CATEGORIES || []).map((parent) => ({
  name: parent.name,
  slug: parent.slug,
  icon: (parent as any).icon || undefined,
  subcategories: Array.isArray(parent.subcategories)
    ? parent.subcategories.map((s) => ({ name: s.name, slug: s.slug }))
    : [],
}));

// Main navigation items (departments + a few quick links)
export const mainNavItems: NavItem[] = [
  { name: 'Departments', slug: 'departments', hasMenu: true },
  { name: 'Laptops', slug: 'laptops', route: getCategoryPath('laptops') },
  { name: 'Mobiles', slug: 'mobiles', route: getCategoryPath('mobiles') },
  { name: 'Tablets', slug: 'tablets', route: getCategoryPath('tablets') },
  { name: 'Accessories', slug: 'accessories', route: getCategoryPath('accessories') },
  { name: 'Electronics', slug: 'electronics', route: getCategoryPath('electronics') },
  { name: 'Today Deals', slug: 'deals', route: '/deals' },
];
