// src/data/homepageCategories.ts
// Canonical homepage category list and image mapping for ExShopi
import { MASTER_CATEGORIES, CategoryNode } from '../lib/masterCategories';

// Map category slugs to image paths (Category Card/ preferred, fallback to categories/)
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  electronics: '/Category Card/electronics.png',
  mobiles: '/Category Card/Mobile.png',
  laptops: '/Category Card/Laptop.png',
  accessories: '/Category Card/computeracessories.png',
  gaming: '/Category Card/Gamingpc.png',
  'home-kitchen': '/Category Card/home&kitchen.png',
  beauty: '/Category Card/beauty.png',
  fashion: '/Category Card/women fashion.png',
  'mens-fashion': '/Category Card/manfashion.png',
  'womens-fashion': '/Category Card/women fashion.png',
  'home-appliances': '/Category Card/Homeappliances.png',
  'health-nutrition': '/Category Card/healthnutrition.png',
  'gift-cards': '/Category Card/Gift.png',
  'global-store': '/Category Card/electronics.png',
  grocery: '/Category Card/Grocery.png',
  // ...add more as needed, fallback below
};

function getCategoryImage(slug: string): string {
  return CATEGORY_IMAGE_MAP[slug] || `/categories/${slug.charAt(0).toUpperCase() + slug.slice(1)}.png`;
}

// Flatten top-level categories for homepage display
export const homepageCategories = MASTER_CATEGORIES.map((cat) => ({
  slug: cat.slug,
  name: cat.name,
  image: getCategoryImage(cat.slug),
  link: `/category/${cat.slug}`,
}));

export function getHomepageCategory(slug: string) {
  return homepageCategories.find((cat) => cat.slug === slug);
}
