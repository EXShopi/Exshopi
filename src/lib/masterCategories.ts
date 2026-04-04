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

export function normalizeCategorySlug(value?: string) {
  if (!value) return '';
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Backwards-compatible alias
export const normalizeSlug = normalizeCategorySlug;

function findNodeBySlug(list: CategoryNode[], slug: string): { node?: CategoryNode; parent?: CategoryNode | null } {
  const target = normalizeCategorySlug(slug);
  for (const node of list || []) {
    if (normalizeCategorySlug(node.slug) === target) return { node, parent: null };
    if (Array.isArray(node.subcategories)) {
      for (const sub of node.subcategories) {
        if (normalizeCategorySlug(sub.slug) === target) return { node: sub, parent: node };
        if (Array.isArray(sub.childCategories)) {
          for (const child of sub.childCategories) {
            if (normalizeCategorySlug(child.slug) === target) return { node: child, parent: sub };
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
  const parent = MASTER_CATEGORIES.find((p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(parentSlug));
  return parent?.subcategories || [];
}

export function getChildCategories(parentSlug: string, subSlug: string) {
  const parent = MASTER_CATEGORIES.find((p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(parentSlug));
  if (!parent) return [];
  const sub = parent.subcategories?.find((s) => normalizeCategorySlug(s.slug) === normalizeCategorySlug(subSlug));
  return sub?.childCategories || [];
}

const LEGACY_MAP: Record<string, { category?: string; subcategory?: string }[]> = {
  // Computers / Laptops
  laptop: [{ category: 'computers', subcategory: 'laptops' }],
  laptops: [{ category: 'computers', subcategory: 'laptops' }],
  macbook: [{ category: 'computers', subcategory: 'laptops' }],
  notebook: [{ category: 'computers', subcategory: 'laptops' }],
  ultrabook: [{ category: 'computers', subcategory: 'laptops' }],

  // Desktop / Workstation
  desktop: [{ category: 'computers', subcategory: 'desktop-pcs' }],
  desktops: [{ category: 'computers', subcategory: 'desktop-pcs' }],
  pc: [{ category: 'computers', subcategory: 'desktop-pcs' }],
  tower: [{ category: 'computers', subcategory: 'desktop-pcs' }],
  workstation: [{ category: 'computers', subcategory: 'desktop-pcs' }],
  'all-in-one': [{ category: 'computers', subcategory: 'all-in-one' }],

  // Storage / drives
  ssd: [{ category: 'computers', subcategory: 'storage' }],
  hdd: [{ category: 'computers', subcategory: 'storage' }],
  storage: [{ category: 'computers', subcategory: 'storage' }],
  'hard-drive': [{ category: 'computers', subcategory: 'storage' }],

  // Monitors / Printers
  monitor: [{ category: 'computers', subcategory: 'monitors' }],
  printer: [{ category: 'computers', subcategory: 'printers' }],

  // Mobiles
  phone: [{ category: 'mobiles', subcategory: 'smartphones' }],
  phones: [{ category: 'mobiles', subcategory: 'smartphones' }],
  mobile: [{ category: 'mobiles', subcategory: 'smartphones' }],
  mobiles: [{ category: 'mobiles', subcategory: 'smartphones' }],
  smartphone: [{ category: 'mobiles', subcategory: 'smartphones' }],
  iphone: [{ category: 'mobiles', subcategory: 'smartphones' }],
  android: [{ category: 'mobiles', subcategory: 'smartphones' }],
  tablet: [{ category: 'mobiles', subcategory: 'tablets' }],
  ipad: [{ category: 'mobiles', subcategory: 'tablets' }],

  // Mobile accessories
  charger: [{ category: 'mobiles', subcategory: 'chargers' }],
  chargers: [{ category: 'mobiles', subcategory: 'chargers' }],
  cable: [{ category: 'mobiles', subcategory: 'cables' }],
  cables: [{ category: 'mobiles', subcategory: 'cables' }],
  case: [{ category: 'mobiles', subcategory: 'cases' }],
  'screen-protector': [{ category: 'mobiles', subcategory: 'screen-protectors' }],

  // TV / Video / Projector
  tv: [{ category: 'tv-video', subcategory: 'tvs' }],
  projector: [{ category: 'tv-video', subcategory: 'projectors' }],

  // Cameras
  camera: [{ category: 'cameras', subcategory: 'dslr' }],
  'camera-lens': [{ category: 'cameras', subcategory: 'lenses' }],

  // Gaming
  gaming: [{ category: 'gaming', subcategory: 'consoles' }],

  // Others
  clothing: [{ category: 'fashion' }],
  fashion: [{ category: 'fashion' }],
  kitchen: [{ category: 'home-kitchen' }],
  home: [{ category: 'home-kitchen' }],
  beauty: [{ category: 'beauty-health' }],
  grocery: [{ category: 'grocery' }],
};

export function mapLegacyCategory(value: string) {
  const v = normalizeCategorySlug(value || '');
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
    if (direct.parent) return { category: normalizeCategorySlug(direct.parent.slug), subcategory: normalizeCategorySlug(direct.node.slug) };
    return { category: normalizeCategorySlug(direct.node.slug) };
  }

  return null;
}

export function gatherSlugsUnder(categorySlug: string) {
  const cacheKey = normalizeCategorySlug(categorySlug || '');
  // simple in-memory cache to avoid recomputing the tree walk repeatedly
  if (!gatherSlugsUnder['_cache']) {
    (gatherSlugsUnder as any)['_cache'] = new Map<string, Set<string>>();
  }
  const cache: Map<string, Set<string>> = (gatherSlugsUnder as any)['_cache'];
  if (cache.has(cacheKey)) return new Set(cache.get(cacheKey));

  const set = new Set<string>();
  if (!categorySlug) return set;
  const found = findNodeBySlug(MASTER_CATEGORIES, categorySlug);
  if (!found.node) return set;

  function walk(node: CategoryNode | undefined) {
    if (!node) return;
    set.add(normalizeCategorySlug(node.slug));
    if (Array.isArray(node.subcategories)) {
      for (const s of node.subcategories) walk(s);
    }
    if (Array.isArray(node.childCategories)) {
      for (const c of node.childCategories) walk(c);
    }
  }

  walk(found.node);
  try {
    cache.set(cacheKey, new Set(set));
  } catch (e) {
    // ignore caching errors
  }
  return set;
}

export function filterProductsByCategoryTree(
  products: any[],
  categorySlug?: string | null,
  subcategorySlug?: string | null,
  backendCategories?: any[]
) {
  // strict behavior: if no categorySlug provided, return empty (avoids accidental full-catalog fallbacks)
  if (!categorySlug) return [];

  const normCat = normalizeCategorySlug(categorySlug);
  const normSub = subcategorySlug ? normalizeCategorySlug(subcategorySlug) : null;

  // gather allowed slugs starting from the most specific node
  const allowed = new Set<string>();
  // If a specific subcategory was provided, gather its slugs; otherwise gather from the provided category
  const slugsUnder = gatherSlugsUnder(normSub || normCat);
  for (const s of slugsUnder) allowed.add(s);
  // also include selected node itself
  allowed.add(normSub || normCat);

  // debug counters
  let matchedCount = 0;
  let legacyMappedCount = 0;
  let unmatchedCount = 0;

  const result = (products || []).filter((product) => {
    const values: string[] = [];

    // 1) backend category id -> slug (from backendCategories list)
    const catId = product?.categoryId || product?.specs?.backendCategoryId || null;
    if (catId && backendCategories && Array.isArray(backendCategories)) {
      const byId = backendCategories.find((c) => String(c.id) === String(catId) || String(c.slug) === String(catId));
      if (byId && byId.slug) values.push(normalizeCategorySlug(byId.slug));
    }

    // 2) structured specs fields (preferred)
    if (product?.specs) {
      if (product.specs.parentCategorySlug) values.push(normalizeCategorySlug(product.specs.parentCategorySlug));
      if (product.specs.categorySlug) values.push(normalizeCategorySlug(product.specs.categorySlug));
      if (product.specs.subcategorySlug) values.push(normalizeCategorySlug(product.specs.subcategorySlug));
      if (product.specs.childCategorySlug) values.push(normalizeCategorySlug(product.specs.childCategorySlug));
      // legacy attribute buckets
      if (product.specs.attributes) {
        if (product.specs.attributes.category) values.push(normalizeCategorySlug(String(product.specs.attributes.category)));
        if (product.specs.attributes.subcategory) values.push(normalizeCategorySlug(String(product.specs.attributes.subcategory)));
      }
    }

    // 3) legacy top-level textual fields
    if (product?.category) values.push(normalizeCategorySlug(String(product.category)));
    if (product?.subcategory) values.push(normalizeCategorySlug(String(product.subcategory)));

    // de-duplicate
    const uniq = Array.from(new Set(values.filter(Boolean)));

    // direct match with allowed slugs
    for (const s of uniq) {
      if (allowed.has(s)) {
        matchedCount += 1;
        return true;
      }
    }

    // 4) try safe legacy mapping using mapLegacyCategory on conservative fields
    const legacySource = product?.category || product?.specs?.attributes?.subcategory || product?.specs?.attributes?.category || product?.specs?.backendCategoryId || product?.title || product?.description || '';
    const mapped = mapLegacyCategory(String(legacySource || ''));
    if (mapped && mapped.category) {
      const mappedCat = normalizeCategorySlug(mapped.category);
      const mappedSub = mapped.subcategory ? normalizeCategorySlug(mapped.subcategory) : null;
      if (mappedCat === normCat || (mappedSub && allowed.has(mappedSub))) {
        legacyMappedCount += 1;
        return true;
      }
    }

    unmatchedCount += 1;
    return false;
  });

  // temporary debug output
  try {
    console.debug('[category-filter] requested:', { categorySlug: categorySlug, subcategorySlug: subcategorySlug });
    console.debug('[category-filter] results:', { totalProducts: (products || []).length, matched: result.length, matchedCount, legacyMappedCount, unmatchedCount });
  } catch (e) {
    // ignore logging errors
  }

  return result;
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
