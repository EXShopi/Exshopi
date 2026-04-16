// src/data/homepageCategories.ts
// Canonical homepage category list and image mapping for ExShopi
// --- RESTORED STATIC CATEGORY LIST AND IMAGE PATHS (PREMIUM UI) ---
export const homepageCategories = [
  {
    slug: 'electronics',
    name: 'Electronics',
    image: '/Category Card/electronics.png',
    link: '/category/electronics',
  },
  {
    slug: 'mobiles',
    name: 'Mobiles',
    image: '/Category Card/Mobile.png',
    link: '/category/mobiles',
  },
  {
    slug: 'laptops',
    name: 'Laptops',
    image: '/Category Card/Laptop.png',
    link: '/category/laptops',
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    image: '/Category Card/Gamingpc.png',
    link: '/category/gaming',
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    image: '/Category Card/beauty.png',
    link: '/category/beauty',
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    image: '/Category Card/women fashion.png',
    link: '/category/fashion',
  },
  {
    slug: 'mens-fashion',
    name: "Men's Fashion",
    image: '/Category Card/manfashion.png',
    link: '/category/mens-fashion',
  },
  {
    slug: 'home-appliances',
    name: 'Home Appliances',
    image: '/Category Card/Homeappliances.png',
    link: '/category/home-appliances',
  },
  {
    slug: 'grocery',
    name: 'Grocery',
    image: '/Category Card/Grocery.png',
    link: '/category/grocery',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    image: '/Category Card/computeracessories.png',
    link: '/category/accessories',
  },
  // ...add all other original categories and images as before
];

export function getHomepageCategory(slug: string) {
  return homepageCategories.find((cat) => cat.slug === slug);
}
