/**
 * Category Navigation Data Structure
 * Premium ecommerce category system with subcategories
 */

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

/**
 * Complete category hierarchy with all subcategories
 * Used in: Departments mega menu, category pages, sitemap
 */
export const categoryData: Category[] = [
  {
    name: "Electronics",
    slug: "electronics",
    icon: "💻",
    subcategories: [
      { name: "Laptops", slug: "laptops" },
      { name: "Desktop PCs", slug: "desktop-pcs" },
      { name: "Monitors", slug: "monitors" },
      { name: "Printers", slug: "printers" },
      { name: "Hard Drives", slug: "hard-drives" },
      { name: "RAM & Storage", slug: "ram-storage" },
    ],
  },
  {
    name: "Mobiles",
    slug: "mobiles",
    icon: "📱",
    subcategories: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "iPhones", slug: "iphone" },
      { name: "Samsung", slug: "samsung" },
      { name: "AndroidPhones", slug: "android-phones" },
      { name: "Power Banks", slug: "power-banks" },
      { name: "Chargers & Cables", slug: "chargers-cables" },
    ],
  },
  {
    name: "Tablets",
    slug: "tablets",
    icon: "📖",
    subcategories: [
      { name: "iPads", slug: "ipad" },
      { name: "Android Tablets", slug: "android-tablets" },
      { name: "Kids Tablets", slug: "kids-tablets" },
      { name: "Tablet Accessories", slug: "tablet-accessories" },
      { name: "Screen Protectors", slug: "screen-protectors" },
      { name: "Tablet Cases", slug: "tablet-cases" },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: "🎧",
    subcategories: [
      { name: "Chargers", slug: "chargers" },
      { name: "Cables & Adapters", slug: "cables-adapters" },
      { name: "Earbuds & Headphones", slug: "earbuds-headphones" },
      { name: "Speaker", slug: "speakers" },
      { name: "Cases & Covers", slug: "cases-covers" },
      { name: "Protectors", slug: "screen-protectors-acc" },
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "🎮",
    subcategories: [
      { name: "Consoles", slug: "consoles" },
      { name: "Controllers", slug: "controllers" },
      { name: "Gaming Headsets", slug: "gaming-headsets" },
      { name: "Gaming Keyboards", slug: "gaming-keyboards" },
      { name: "Gaming Mice", slug: "gaming-mice" },
      { name: "Gaming Chairs", slug: "gaming-chairs" },
    ],
  },
  {
    name: "Home Products",
    slug: "home-products",
    icon: "🏠",
    subcategories: [
      { name: "Kitchen Essentials", slug: "kitchen" },
      { name: "Small Appliances", slug: "small-appliances" },
      { name: "Home Gadgets", slug: "home-gadgets" },
      { name: "Smart Home", slug: "smart-home" },
      { name: "Personal Care", slug: "personal-care" },
      { name: "Power Tools", slug: "power-tools" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "👔",
    subcategories: [
      { name: "Men Clothing", slug: "men-clothing" },
      { name: "Women Clothing", slug: "women-clothing" },
      { name: "Kids Clothing", slug: "kids-clothing" },
      { name: "Footwear", slug: "footwear" },
      { name: "Accessories", slug: "fashion-accessories" },
      { name: "Watches", slug: "watches" },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    icon: "💄",
    subcategories: [
      { name: "Skincare", slug: "skincare" },
      { name: "Makeup", slug: "makeup" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Perfumes", slug: "perfumes" },
      { name: "Body Care", slug: "body-care" },
      { name: "Grooming", slug: "grooming" },
    ],
  },
];

/**
 * Main navigation items for the header navbar
 * First item (Departments) triggers mega menu
 * Other items are direct links to category/deal pages
 */
export const mainNavItems: NavItem[] = [
  { name: "Departments", slug: "departments", hasMenu: true },
  { name: "Laptops", slug: "laptops", route: "/category/laptops" },
  { name: "Mobiles", slug: "mobiles", route: "/category/mobiles" },
  { name: "Tablets", slug: "tablets", route: "/category/tablets" },
  { name: "Accessories", slug: "accessories", route: "/category/accessories" },
  { name: "Electronics", slug: "electronics", route: "/category/electronics" },
  { name: "Today Deals", slug: "deals", route: "/deals" },
];
