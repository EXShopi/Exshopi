export type CategoryNode = {
  slug: string;
  name: string;
  description?: string;
  subcategories?: CategoryNode[];
  childCategories?: CategoryNode[];
};

export const MASTER_CATEGORIES: CategoryNode[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Computers, mobiles, TV & more',
    subcategories: [
      {
        slug: 'computers',
        name: 'Computers',
        subcategories: [
          { slug: 'laptops', name: 'Laptops' },
          { slug: 'desktop-pcs', name: 'Desktop PCs' },
          { slug: 'all-in-one', name: 'All-in-One PCs' },
          { slug: 'monitors', name: 'Monitors' },
          { slug: 'printers', name: 'Printers' },
          { slug: 'storage', name: 'Storage / SSD / HDD' },
          { slug: 'computer-accessories', name: 'Computer Accessories' },
        ],
      },
      {
        slug: 'mobiles',
        name: 'Mobiles & Tablets',
        subcategories: [
          { slug: 'smartphones', name: 'Smartphones' },
          { slug: 'refurbished-phones', name: 'Refurbished Phones' },
          { slug: 'feature-phones', name: 'Feature Phones' },
          { slug: 'tablets', name: 'Tablets' },
          { slug: 'ipads', name: 'iPads' },
          { slug: 'mobile-accessories', name: 'Mobile Accessories' },
          { slug: 'cases', name: 'Cases' },
          { slug: 'screen-protectors', name: 'Screen Protectors' },
          { slug: 'chargers', name: 'Chargers' },
          { slug: 'cables', name: 'Cables' },
          { slug: 'power-banks', name: 'Power Banks' },
          { slug: 'earbuds', name: 'Earbuds / Mobile Audio' },
        ],
      },
      {
        slug: 'tv-video',
        name: 'TV & Video',
        subcategories: [
          { slug: 'tvs', name: 'TVs' },
          { slug: 'smart-tvs', name: 'Smart TVs' },
          { slug: 'tv-accessories', name: 'TV Accessories' },
          { slug: 'streaming-devices', name: 'Streaming Devices' },
          { slug: 'projectors', name: 'Projectors' },
          { slug: 'home-theater', name: 'Home Theater' },
        ],
      },
      {
        slug: 'cameras',
        name: 'Cameras & Photo',
        subcategories: [
          { slug: 'dslr', name: 'DSLR' },
          { slug: 'mirrorless', name: 'Mirrorless' },
          { slug: 'action-cameras', name: 'Action Cameras' },
          { slug: 'drones', name: 'Drones' },
          { slug: 'security-cameras', name: 'Security Cameras' },
          { slug: 'lenses', name: 'Camera Lenses' },
          { slug: 'tripods', name: 'Tripods' },
        ],
      },
      {
        slug: 'audio',
        name: 'Audio',
        subcategories: [
          { slug: 'headphones', name: 'Headphones' },
          { slug: 'earbuds', name: 'Earbuds' },
          { slug: 'bluetooth-speakers', name: 'Bluetooth Speakers' },
          { slug: 'soundbars', name: 'Soundbars' },
          { slug: 'microphones', name: 'Microphones' },
        ],
      },
      {
        slug: 'gaming',
        name: 'Gaming',
        subcategories: [
          { slug: 'consoles', name: 'Consoles' },
          { slug: 'controllers', name: 'Controllers' },
          { slug: 'gaming-headsets', name: 'Gaming Headsets' },
          { slug: 'gaming-keyboards', name: 'Gaming Keyboards' },
          { slug: 'gaming-mice', name: 'Gaming Mice' },
          { slug: 'gaming-chairs', name: 'Gaming Chairs' },
        ],
      },
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    subcategories: [
      { slug: 'men', name: "Men's" },
      { slug: 'women', name: "Women's" },
      { slug: 'kids', name: "Kids" },
      { slug: 'shoes', name: 'Shoes' },
      { slug: 'bags', name: 'Bags' },
      { slug: 'watches', name: 'Watches' },
      { slug: 'fashion-accessories', name: 'Accessories' },
    ],
  },
  {
    slug: 'home-kitchen',
    name: 'Home / Kitchen / Appliances',
    subcategories: [
      { slug: 'kitchen-appliances', name: 'Kitchen Appliances' },
      { slug: 'home-appliances', name: 'Home Appliances' },
      { slug: 'furniture', name: 'Furniture' },
      { slug: 'decor', name: 'Decor' },
      { slug: 'cleaning', name: 'Cleaning' },
      { slug: 'storage', name: 'Storage & Organization' },
    ],
  },
  {
    slug: 'beauty-health',
    name: 'Beauty / Health',
    subcategories: [
      { slug: 'makeup', name: 'Makeup' },
      { slug: 'skincare', name: 'Skincare' },
      { slug: 'haircare', name: 'Haircare' },
      { slug: 'grooming', name: 'Grooming' },
      { slug: 'perfumes', name: 'Perfumes' },
    ],
  },
  {
    slug: 'grocery',
    name: 'Grocery / Daily Use',
    subcategories: [
      { slug: 'snacks', name: 'Snacks' },
      { slug: 'beverages', name: 'Beverages' },
      { slug: 'household-essentials', name: 'Household essentials' },
    ],
  },
  {
    slug: 'baby-toys',
    name: 'Baby / Toys',
    subcategories: [
      { slug: 'baby-products', name: 'Baby products' },
      { slug: 'kids-products', name: 'Kids products' },
      { slug: 'toys', name: 'Toys' },
    ],
  },
  {
    slug: 'sports-outdoors',
    name: 'Sports / Outdoors',
    subcategories: [
      { slug: 'fitness', name: 'Fitness' },
      { slug: 'outdoor-gear', name: 'Outdoor gear' },
      { slug: 'sports-accessories', name: 'Sports accessories' },
    ],
  },
  {
    slug: 'automotive-tools',
    name: 'Automotive / Tools',
    subcategories: [
      { slug: 'car-accessories', name: 'Car accessories' },
      { slug: 'tools', name: 'Tools' },
      { slug: 'diy', name: 'DIY' },
    ],
  },
];

function normalizeSlug(value?: string) {
  if (!value) return '';
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function findNodeBySlug(list: CategoryNode[], slug: string): { node?: CategoryNode; parent?: CategoryNode | null } {
  const target = normalizeSlug(slug);
  for (const node of list || []) {
    if (normalizeSlug(node.slug) === target) return { node, parent: null };
    if (Array.isArray(node.subcategories)) {
      for (const sub of node.subcategories) {
        if (normalizeSlug(sub.slug) === target) return { node: sub, parent: node };
        if (Array.isArray(sub.childCategories)) {
          for (const child of sub.childCategories) {
            if (normalizeSlug(child.slug) === target) return { node: child, parent: sub };
          }
        }
      }
    }
  }
  return {};
}

export function getCategoryBySlug(slug: string) {
  if (!slug) return null;
  const found = findNodeBySlug(MASTER_CATEGORIES, slug);
  if (!found.node) return null;
  const node = found.node;
  const parent = found.parent || null;
  return { node, parent };
}

export function getSubcategories(parentSlug: string) {
  const parent = MASTER_CATEGORIES.find((p) => normalizeSlug(p.slug) === normalizeSlug(parentSlug));
  return parent?.subcategories || [];
}

export function getChildCategories(parentSlug: string, subSlug: string) {
  const parent = MASTER_CATEGORIES.find((p) => normalizeSlug(p.slug) === normalizeSlug(parentSlug));
  if (!parent) return [];
  const sub = parent.subcategories?.find((s) => normalizeSlug(s.slug) === normalizeSlug(subSlug));
  return sub?.childCategories || [];
}

const LEGACY_MAP: Record<string, { category?: string; subcategory?: string }[]> = {
  laptop: [{ category: 'electronics', subcategory: 'laptops' }],
  laptopss: [{ category: 'electronics', subcategory: 'laptops' }],
  macbook: [{ category: 'electronics', subcategory: 'laptops' }],
  desktop: [{ category: 'electronics', subcategory: 'computers' }],
  computer: [{ category: 'electronics', subcategory: 'computers' }],
  phone: [{ category: 'electronics', subcategory: 'mobiles' }],
  mobile: [{ category: 'electronics', subcategory: 'mobiles' }],
  smartphone: [{ category: 'electronics', subcategory: 'mobiles' }],
  tablet: [{ category: 'electronics', subcategory: 'mobiles' }],
  ipad: [{ category: 'electronics', subcategory: 'mobiles' }],
  tv: [{ category: 'electronics', subcategory: 'tv-video' }],
  projector: [{ category: 'electronics', subcategory: 'tv-video' }],
  camera: [{ category: 'electronics', subcategory: 'cameras' }],
  'camera-lens': [{ category: 'electronics', subcategory: 'cameras' }],
  gaming: [{ category: 'electronics', subcategory: 'gaming' }],
  clothing: [{ category: 'fashion' }],
  fashion: [{ category: 'fashion' }],
  kitchen: [{ category: 'home-kitchen' }],
  home: [{ category: 'home-kitchen' }],
  beauty: [{ category: 'beauty-health' }],
  grocery: [{ category: 'grocery' }],
};

export function mapLegacyCategory(value: string) {
  const v = normalizeSlug(value || '');
  if (!v) return null;

  // exact map
  if (LEGACY_MAP[v]) return LEGACY_MAP[v][0] || null;

  // tokenise and try tokens
  const tokens = v.split(/[-_\s]+/).filter(Boolean);
  for (const t of tokens) {
    if (LEGACY_MAP[t]) return LEGACY_MAP[t][0] || null;
  }

  // fallback: if matches any category/subcategory slug directly
  const direct = findNodeBySlug(MASTER_CATEGORIES, v);
  if (direct.node) {
    if (direct.parent) return { category: normalizeSlug(direct.parent.slug), subcategory: normalizeSlug(direct.node.slug) };
    return { category: normalizeSlug(direct.node.slug) };
  }

  return null;
}

export function gatherSlugsUnder(categorySlug: string) {
  const set = new Set<string>();
  const parent = MASTER_CATEGORIES.find((p) => normalizeSlug(p.slug) === normalizeSlug(categorySlug));
  if (!parent) return set;
  set.add(normalizeSlug(parent.slug));
  for (const sub of parent.subcategories || []) {
    set.add(normalizeSlug(sub.slug));
    for (const child of sub.childCategories || []) set.add(normalizeSlug(child.slug));
  }
  return set;
}

export function filterProductsByCategoryTree(
  products: any[],
  categorySlug?: string | null,
  subcategorySlug?: string | null,
  backendCategories?: any[]
) {
  if (!categorySlug) return products;
  const wanted = new Set<string>();
  const normCat = normalizeSlug(categorySlug);
  if (subcategorySlug) {
    wanted.add(normalizeSlug(subcategorySlug));
  }

  // include all slugs under parent if category matches a parent
  const slugsUnder = gatherSlugsUnder(normCat);
  if (slugsUnder.size) {
    for (const s of slugsUnder) wanted.add(s);
  }

  // include full parent slug too
  wanted.add(normCat);

  return (products || []).filter((product) => {
    // 1) if product has categoryId and backendCategories provided, try to map id -> slug
    const catId = product?.categoryId || product?.specs?.backendCategoryId || null;
    if (catId && backendCategories && Array.isArray(backendCategories)) {
      const byId = backendCategories.find((c) => String(c.id) === String(catId) || c.slug === String(catId));
      if (byId && wanted.has(normalizeSlug(byId.slug))) return true;
    }

    // 2) check textual category fields
    const textual = [product?.category, product?.specs?.attributes?.subcategory, product?.specs?.attributes?.category, product?.specs?.backendCategoryId]
      .filter(Boolean)
      .map((t: any) => normalizeSlug(String(t)));
    for (const t of textual) {
      if (wanted.has(t)) return true;
    }

    // 3) check title/keywords fallback
    const hay = (String(product?.title || '') + ' ' + String(product?.description || '') + ' ' + String(product?.specs?.brand || ''))
      .toLowerCase();
    for (const s of Array.from(wanted)) {
      if (s && hay.includes(s.replace(/-/g, ' '))) return true;
    }

    return false;
  });
}

export default {
  MASTER_CATEGORIES,
  normalizeSlug,
  getCategoryBySlug,
  getSubcategories,
  getChildCategories,
  mapLegacyCategory,
  filterProductsByCategoryTree,
};
