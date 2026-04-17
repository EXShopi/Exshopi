export type CategoryNode = {
  slug: string;
  name: string;
  description?: string;
  subcategories?: CategoryNode[];
  childCategories?: CategoryNode[];
};

export type CanonicalCategoryAssignment = {
  parentCategorySlug: string;
  categorySlug: string;
  subcategorySlug: string;
  parentCategoryName: string;
  categoryName: string;
  subcategoryName: string;
  categoryPath: string;
  depth: 0 | 1 | 2 | 3;
  matchedBy: string[];
};

export const MASTER_CATEGORIES: CategoryNode[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Computers, mobiles, TV, cameras, audio and gaming',
    subcategories: [
      {
        slug: 'computers',
        name: 'Computers',
        childCategories: [
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
        slug: 'mobiles-tablets',
        name: 'Mobiles & Tablets',
        childCategories: [
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
          { slug: 'earbuds-mobile-audio', name: 'Earbuds / Mobile Audio' },
        ],
      },
      {
        slug: 'tv-video',
        name: 'TV & Video',
        childCategories: [
          { slug: 'tvs', name: 'TVs' },
          { slug: 'smart-tvs', name: 'Smart TVs' },
          { slug: 'tv-accessories', name: 'TV Accessories' },
          { slug: 'streaming-devices', name: 'Streaming Devices' },
          { slug: 'projectors', name: 'Projectors' },
          { slug: 'home-theater', name: 'Home Theater' },
        ],
      },
      {
        slug: 'cameras-photo',
        name: 'Cameras & Photo',
        childCategories: [
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
        childCategories: [
          { slug: 'headphones', name: 'Headphones' },
          { slug: 'earbuds-audio', name: 'Earbuds' },
          { slug: 'bluetooth-speakers', name: 'Bluetooth Speakers' },
          { slug: 'soundbars', name: 'Soundbars' },
          { slug: 'microphones', name: 'Microphones' },
        ],
      },
      {
        slug: 'gaming',
        name: 'Gaming',
        childCategories: [
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
    description: 'Clothing, footwear, bags, watches and accessories',
    subcategories: [
      {
        slug: 'mens-fashion',
        name: "Men's Fashion",
        childCategories: [
          { slug: 'mens-clothing', name: "Men's Clothing" },
          { slug: 'mens-shoes', name: "Men's Shoes" },
          { slug: 'mens-accessories', name: "Men's Accessories" },
        ],
      },
      {
        slug: 'womens-fashion',
        name: "Women's Fashion",
        childCategories: [
          { slug: 'womens-clothing', name: "Women's Clothing" },
          { slug: 'womens-shoes', name: "Women's Shoes" },
          { slug: 'womens-bags', name: "Women's Bags" },
          { slug: 'womens-accessories', name: "Women's Accessories" },
        ],
      },
      {
        slug: 'kids-fashion',
        name: 'Kids Fashion',
        childCategories: [
          { slug: 'kids-clothing', name: 'Kids Clothing' },
          { slug: 'kids-shoes', name: 'Kids Shoes' },
        ],
      },
      {
        slug: 'watches',
        name: 'Watches',
        childCategories: [
          { slug: 'mens-watches', name: "Men's Watches" },
          { slug: 'womens-watches', name: "Women's Watches" },
          { slug: 'smart-watches', name: 'Smart Watches' },
        ],
      },
      {
        slug: 'fashion-accessories',
        name: 'Fashion Accessories',
        childCategories: [
          { slug: 'bags', name: 'Bags' },
          { slug: 'belts', name: 'Belts' },
          { slug: 'sunglasses', name: 'Sunglasses' },
        ],
      },
    ],
  },
  {
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Furniture, appliances, décor and home essentials',
    subcategories: [
      {
        slug: 'kitchen-dining',
        name: 'Kitchen & Dining',
        childCategories: [
          { slug: 'kitchen-appliances', name: 'Kitchen Appliances' },
          { slug: 'cookware', name: 'Cookware' },
          { slug: 'tableware', name: 'Tableware' },
        ],
      },
      {
        slug: 'home-appliances',
        name: 'Home Appliances',
        childCategories: [
          { slug: 'large-appliances', name: 'Large Appliances' },
          { slug: 'small-appliances', name: 'Small Appliances' },
        ],
      },
      {
        slug: 'furniture-decor',
        name: 'Furniture & Decor',
        childCategories: [
          { slug: 'furniture', name: 'Furniture' },
          { slug: 'decor', name: 'Decor' },
          { slug: 'lighting', name: 'Lighting' },
        ],
      },
      {
        slug: 'storage-cleaning',
        name: 'Storage & Cleaning',
        childCategories: [
          { slug: 'storage-organization', name: 'Storage & Organization' },
          { slug: 'cleaning-supplies', name: 'Cleaning Supplies' },
        ],
      },
    ],
  },
  {
    slug: 'beauty-health',
    name: 'Beauty & Personal Care',
    description: 'Beauty, grooming, wellness and personal care',
    subcategories: [
      {
        slug: 'makeup',
        name: 'Makeup',
        childCategories: [
          { slug: 'face-makeup', name: 'Face Makeup' },
          { slug: 'eye-makeup', name: 'Eye Makeup' },
          { slug: 'lip-makeup', name: 'Lip Makeup' },
        ],
      },
      {
        slug: 'skincare',
        name: 'Skincare',
        childCategories: [
          { slug: 'cleansers', name: 'Cleansers' },
          { slug: 'moisturizers', name: 'Moisturizers' },
          { slug: 'serums', name: 'Serums' },
        ],
      },
      {
        slug: 'haircare',
        name: 'Haircare',
        childCategories: [
          { slug: 'shampoo', name: 'Shampoo' },
          { slug: 'conditioner', name: 'Conditioner' },
          { slug: 'hair-styling', name: 'Hair Styling' },
        ],
      },
      {
        slug: 'grooming',
        name: 'Grooming',
        childCategories: [
          { slug: 'mens-grooming', name: "Men's Grooming" },
          { slug: 'personal-care-devices', name: 'Personal Care Devices' },
        ],
      },
      {
        slug: 'fragrance-wellness',
        name: 'Fragrance & Wellness',
        childCategories: [
          { slug: 'perfumes', name: 'Perfumes' },
          { slug: 'wellness', name: 'Wellness' },
        ],
      },
    ],
  },
  {
    slug: 'grocery',
    name: 'Grocery & Daily Essentials',
    description: 'Food, beverages and daily household essentials',
    subcategories: [
      {
        slug: 'food-beverages',
        name: 'Food & Beverages',
        childCategories: [
          { slug: 'snacks', name: 'Snacks' },
          { slug: 'beverages', name: 'Beverages' },
          { slug: 'packaged-food', name: 'Packaged Food' },
        ],
      },
      {
        slug: 'household-essentials',
        name: 'Household Essentials',
        childCategories: [
          { slug: 'cleaning-household', name: 'Cleaning & Household' },
          { slug: 'paper-products', name: 'Paper Products' },
        ],
      },
    ],
  },
  {
    slug: 'baby-toys',
    name: 'Baby & Toys',
    description: 'Baby care, kids products and toys',
    subcategories: [
      {
        slug: 'baby-care',
        name: 'Baby Care',
        childCategories: [
          { slug: 'baby-feeding', name: 'Baby Feeding' },
          { slug: 'diapering', name: 'Diapering' },
          { slug: 'baby-gear', name: 'Baby Gear' },
        ],
      },
      {
        slug: 'kids-products',
        name: 'Kids Products',
        childCategories: [
          { slug: 'school-supplies', name: 'School Supplies' },
          { slug: 'kids-accessories', name: 'Kids Accessories' },
        ],
      },
      {
        slug: 'toys-games',
        name: 'Toys & Games',
        childCategories: [
          { slug: 'educational-toys', name: 'Educational Toys' },
          { slug: 'outdoor-toys', name: 'Outdoor Toys' },
          { slug: 'action-figures', name: 'Action Figures' },
        ],
      },
    ],
  },
  {
    slug: 'sports-outdoors',
    name: 'Sports & Outdoors',
    description: 'Fitness, outdoor gear and sports accessories',
    subcategories: [
      {
        slug: 'fitness',
        name: 'Fitness',
        childCategories: [
          { slug: 'exercise-equipment', name: 'Exercise Equipment' },
          { slug: 'fitness-accessories', name: 'Fitness Accessories' },
        ],
      },
      {
        slug: 'outdoor-gear',
        name: 'Outdoor Gear',
        childCategories: [
          { slug: 'camping-hiking', name: 'Camping & Hiking' },
          { slug: 'travel-outdoor-gear', name: 'Travel Outdoor Gear' },
        ],
      },
      {
        slug: 'sports-accessories',
        name: 'Sports Accessories',
        childCategories: [
          { slug: 'team-sports', name: 'Team Sports' },
          { slug: 'individual-sports', name: 'Individual Sports' },
        ],
      },
    ],
  },
  {
    slug: 'automotive-tools',
    name: 'Automotive & Tools',
    description: 'Car accessories, DIY and workshop tools',
    subcategories: [
      {
        slug: 'automotive',
        name: 'Automotive',
        childCategories: [
          { slug: 'car-accessories', name: 'Car Accessories' },
          { slug: 'car-care', name: 'Car Care' },
          { slug: 'interior-accessories', name: 'Interior Accessories' },
        ],
      },
      {
        slug: 'tools-diy',
        name: 'Tools & DIY',
        childCategories: [
          { slug: 'hand-tools', name: 'Hand Tools' },
          { slug: 'power-tools', name: 'Power Tools' },
          { slug: 'diy-accessories', name: 'DIY Accessories' },
        ],
      },
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

function findNodeBySlug(
  list: CategoryNode[],
  slug: string
): { node?: CategoryNode; parent?: CategoryNode | null } {
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
  const parent = MASTER_CATEGORIES.find(
    (p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(parentSlug)
  );
  return parent?.subcategories || [];
}

export function getChildCategories(parentSlug: string, subSlug: string) {
  const parent = MASTER_CATEGORIES.find(
    (p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(parentSlug)
  );
  if (!parent) return [];
  const sub = parent.subcategories?.find(
    (s) => normalizeCategorySlug(s.slug) === normalizeCategorySlug(subSlug)
  );
  return sub?.childCategories || [];
}

function buildAssignmentFromPath(
  parent?: CategoryNode | null,
  category?: CategoryNode | null,
  subcategory?: CategoryNode | null,
  matchedBy: string[] = []
): CanonicalCategoryAssignment | null {
  if (!parent && !category && !subcategory) return null;

  const resolvedParent = parent || (category && !subcategory ? category : null) || null;
  const resolvedCategory = category || null;
  const resolvedSubcategory = subcategory || null;

  const depth = resolvedSubcategory ? 3 : resolvedCategory ? (resolvedParent && resolvedCategory !== resolvedParent ? 2 : 1) : resolvedParent ? 1 : 0;
  const categoryPathParts = [
    resolvedParent?.slug || "",
    resolvedCategory && resolvedCategory !== resolvedParent ? resolvedCategory.slug : "",
    resolvedSubcategory?.slug || "",
  ].filter(Boolean);

  return {
    parentCategorySlug: normalizeCategorySlug(resolvedParent?.slug || ""),
    categorySlug: normalizeCategorySlug(
      (resolvedCategory && resolvedCategory !== resolvedParent ? resolvedCategory.slug : resolvedParent?.slug) || ""
    ),
    subcategorySlug: normalizeCategorySlug(resolvedSubcategory?.slug || ""),
    parentCategoryName: String(resolvedParent?.name || ""),
    categoryName: String(
      (resolvedCategory && resolvedCategory !== resolvedParent ? resolvedCategory.name : resolvedParent?.name) || ""
    ),
    subcategoryName: String(resolvedSubcategory?.name || ""),
    categoryPath: categoryPathParts.map((value) => normalizeCategorySlug(value)).join("/"),
    depth: depth as 0 | 1 | 2 | 3,
    matchedBy: Array.from(new Set(matchedBy.filter(Boolean))),
  };
}

function findCanonicalPathBySlug(value?: string | null) {
  const target = normalizeCategorySlug(value || "");
  if (!target) return null;

  for (const parent of MASTER_CATEGORIES) {
    if (normalizeCategorySlug(parent.slug) === target) {
      return buildAssignmentFromPath(parent, parent, null, [`direct:${target}`]);
    }

    for (const category of parent.subcategories || []) {
      if (normalizeCategorySlug(category.slug) === target) {
        return buildAssignmentFromPath(parent, category, null, [`direct:${target}`]);
      }

      for (const subcategory of category.childCategories || []) {
        if (normalizeCategorySlug(subcategory.slug) === target) {
          return buildAssignmentFromPath(parent, category, subcategory, [`direct:${target}`]);
        }
      }
    }
  }

  return null;
}

function findCanonicalPathByLegacyValue(value?: string | null) {
  const normalized = normalizeCategorySlug(value || "");
  if (!normalized) return null;

  const mapped = mapLegacyCategory(normalized);
  if (!mapped) return null;

  if (mapped.subcategory) {
    const subPath = findCanonicalPathBySlug(mapped.subcategory);
    if (subPath) {
      return {
        ...subPath,
        matchedBy: Array.from(new Set([...subPath.matchedBy, `legacy:${normalized}`])),
      };
    }
  }

  if (mapped.category) {
    const categoryPath = findCanonicalPathBySlug(mapped.category);
    if (categoryPath) {
      return {
        ...categoryPath,
        matchedBy: Array.from(new Set([...categoryPath.matchedBy, `legacy:${normalized}`])),
      };
    }
  }

  return null;
}

function shouldDebugCategoryLogs() {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) return true;
  } catch {
    // ignore import.meta access in non-browser runtimes
  }

  return (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV !== "production" &&
    /^(1|true|yes|on)$/i.test(String(process.env.EXSHOPI_DEBUG_CATEGORY || ""))
  );
}

export function debugCategoryAssignment(label: string, payload: Record<string, unknown>) {
  if (!shouldDebugCategoryLogs()) return;
  try {
    console.debug(`[category-debug] ${label}`, payload);
  } catch {
    // ignore logging errors
  }
}

export function resolveCanonicalCategoryAssignment(input: Record<string, any> | null | undefined) {
  const source = input && typeof input === "object" ? input : {};
  const specs = source.specs && typeof source.specs === "object" ? source.specs : {};
  const attributes = specs.attributes && typeof specs.attributes === "object" ? specs.attributes : {};
  const rawCategoryPath = String(source.categoryPath || specs.categoryPath || "").trim();
  const categoryPathParts = rawCategoryPath
    .split("/")
    .map((part) => normalizeCategorySlug(part))
    .filter(Boolean);

  const parentInput = source.parentCategorySlug || specs.parentCategorySlug || source.parentSlug || "";
  const categoryInput = source.categorySlug || specs.categorySlug || source.category || specs.category || "";
  const subcategoryInput =
    source.subcategorySlug ||
    specs.subcategorySlug ||
    source.subcategory ||
    specs.subcategory ||
    attributes.subcategory ||
    "";
  const templateInput = source.templateId || specs.templateId || "";

  const candidates = [
    { value: subcategoryInput, label: "subcategory" },
    { value: templateInput, label: "template" },
    { value: categoryPathParts[2], label: "path-subcategory" },
    { value: categoryInput, label: "category" },
    { value: categoryPathParts[1], label: "path-category" },
    { value: parentInput, label: "parent" },
    { value: categoryPathParts[0], label: "path-parent" },
    { value: attributes.subcategory, label: "attribute-subcategory" },
    { value: source.title || specs.templateName || "", label: "title" },
  ].filter((entry) => normalizeCategorySlug(entry.value));

  const resolvedCandidates = candidates
    .map((entry) => {
      const direct = findCanonicalPathBySlug(entry.value);
      if (direct) {
        return {
          ...direct,
          matchedBy: Array.from(new Set([...direct.matchedBy, entry.label])),
        };
      }

      const legacy = findCanonicalPathByLegacyValue(entry.value);
      if (legacy) {
        return {
          ...legacy,
          matchedBy: Array.from(new Set([...legacy.matchedBy, entry.label])),
        };
      }

      return null;
    })
    .filter(Boolean) as CanonicalCategoryAssignment[];

  const ranked = resolvedCandidates.sort((left, right) => {
    if (right.depth !== left.depth) return right.depth - left.depth;
    return right.matchedBy.length - left.matchedBy.length;
  });

  const best = ranked[0] || null;
  const explicitParent = findCanonicalPathBySlug(parentInput) || findCanonicalPathByLegacyValue(parentInput);
  const explicitCategory = findCanonicalPathBySlug(categoryInput) || findCanonicalPathByLegacyValue(categoryInput);

  const parentCategorySlug = normalizeCategorySlug(
    explicitParent?.parentCategorySlug ||
      explicitParent?.categorySlug ||
      best?.parentCategorySlug ||
      best?.categorySlug ||
      categoryPathParts[0] ||
      ""
  );

  const categorySlug = normalizeCategorySlug(
    (explicitCategory && explicitCategory.depth >= 2 ? explicitCategory.categorySlug : "") ||
      (best && best.depth >= 2 ? best.categorySlug : "") ||
      (explicitCategory?.depth === 1 ? explicitCategory.parentCategorySlug : "") ||
      parentCategorySlug
  );

  const subcategorySlug = normalizeCategorySlug(
    (best && best.depth >= 3 ? best.subcategorySlug : "") ||
      categoryPathParts[2] ||
      (normalizeCategorySlug(subcategoryInput) !== categorySlug ? subcategoryInput : "")
  );

  const canonicalSubPath = subcategorySlug ? findCanonicalPathBySlug(subcategorySlug) : null;
  const canonicalCategoryPath = categorySlug ? findCanonicalPathBySlug(categorySlug) : null;
  const canonicalParentPath = parentCategorySlug ? findCanonicalPathBySlug(parentCategorySlug) : null;

  const finalParent = canonicalSubPath?.parentCategoryName || canonicalCategoryPath?.parentCategoryName || canonicalParentPath?.parentCategoryName || "";
  const finalCategory =
    canonicalSubPath?.categoryName ||
    (canonicalCategoryPath?.depth >= 2 ? canonicalCategoryPath.categoryName : "") ||
    canonicalParentPath?.parentCategoryName ||
    "";
  const finalSubcategory = canonicalSubPath?.subcategoryName || "";
  const finalPath = [
    canonicalSubPath?.parentCategorySlug || canonicalCategoryPath?.parentCategorySlug || canonicalParentPath?.parentCategorySlug || parentCategorySlug,
    canonicalSubPath?.categorySlug || (canonicalCategoryPath?.depth >= 2 ? canonicalCategoryPath.categorySlug : categorySlug),
    canonicalSubPath?.subcategorySlug || subcategorySlug,
  ]
    .filter(Boolean)
    .join("/");

  return {
    parentCategorySlug,
    categorySlug,
    subcategorySlug,
    parentCategoryName: finalParent,
    categoryName: finalCategory,
    subcategoryName: finalSubcategory,
    categoryPath: finalPath,
    depth: canonicalSubPath ? 3 : canonicalCategoryPath?.depth === 2 ? 2 : parentCategorySlug ? 1 : 0,
    matchedBy: Array.from(new Set(ranked.flatMap((item) => item.matchedBy))),
  };
}

export function productMatchesCategoryAssignment(
  product: any,
  categorySlug?: string | null,
  subcategorySlug?: string | null,
  parentSlug?: string | null
) {
  const requestedCategory = normalizeCategorySlug(categorySlug || "");
  const requestedSubcategory = normalizeCategorySlug(subcategorySlug || "");
  const requestedParent = normalizeCategorySlug(parentSlug || "");

  const assignment = resolveCanonicalCategoryAssignment(product);
  if (!assignment.parentCategorySlug && !assignment.categorySlug && !assignment.subcategorySlug) {
    return false;
  }

  if (requestedParent && assignment.parentCategorySlug !== requestedParent) {
    return false;
  }

  const pivot = requestedSubcategory || requestedCategory || requestedParent;
  if (!pivot) return false;

  const allowed = gatherSlugsUnder(pivot);
  allowed.add(pivot);

  const values = [
    assignment.parentCategorySlug,
    assignment.categorySlug,
    assignment.subcategorySlug,
  ].filter(Boolean);

  return values.some((value) => allowed.has(value));
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
  monitors: [{ category: 'computers', subcategory: 'monitors' }],
  printer: [{ category: 'computers', subcategory: 'printers' }],
  printers: [{ category: 'computers', subcategory: 'printers' }],

  // Mobiles & tablets
  phone: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  phones: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  mobile: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  mobiles: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  smartphone: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  smartphones: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  iphone: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  android: [{ category: 'mobiles-tablets', subcategory: 'smartphones' }],
  tablet: [{ category: 'mobiles-tablets', subcategory: 'tablets' }],
  tablets: [{ category: 'mobiles-tablets', subcategory: 'tablets' }],
  ipad: [{ category: 'mobiles-tablets', subcategory: 'ipads' }],
  ipads: [{ category: 'mobiles-tablets', subcategory: 'ipads' }],

  // Mobile accessories
  charger: [{ category: 'mobiles-tablets', subcategory: 'chargers' }],
  chargers: [{ category: 'mobiles-tablets', subcategory: 'chargers' }],
  cable: [{ category: 'mobiles-tablets', subcategory: 'cables' }],
  cables: [{ category: 'mobiles-tablets', subcategory: 'cables' }],
  case: [{ category: 'mobiles-tablets', subcategory: 'cases' }],
  cases: [{ category: 'mobiles-tablets', subcategory: 'cases' }],
  'screen-protector': [{ category: 'mobiles-tablets', subcategory: 'screen-protectors' }],
  'screen-protectors': [{ category: 'mobiles-tablets', subcategory: 'screen-protectors' }],
  'power-bank': [{ category: 'mobiles-tablets', subcategory: 'power-banks' }],
  'power-banks': [{ category: 'mobiles-tablets', subcategory: 'power-banks' }],

  // TV / Video / Projector
  tv: [{ category: 'tv-video', subcategory: 'tvs' }],
  tvs: [{ category: 'tv-video', subcategory: 'tvs' }],
  'smart-tv': [{ category: 'tv-video', subcategory: 'smart-tvs' }],
  'smart-tvs': [{ category: 'tv-video', subcategory: 'smart-tvs' }],
  projector: [{ category: 'tv-video', subcategory: 'projectors' }],
  projectors: [{ category: 'tv-video', subcategory: 'projectors' }],

  // Cameras
  camera: [{ category: 'cameras-photo', subcategory: 'dslr' }],
  cameras: [{ category: 'cameras-photo', subcategory: 'dslr' }],
  dslr: [{ category: 'cameras-photo', subcategory: 'dslr' }],
  mirrorless: [{ category: 'cameras-photo', subcategory: 'mirrorless' }],
  drone: [{ category: 'cameras-photo', subcategory: 'drones' }],
  drones: [{ category: 'cameras-photo', subcategory: 'drones' }],
  'camera-lens': [{ category: 'cameras-photo', subcategory: 'lenses' }],
  lenses: [{ category: 'cameras-photo', subcategory: 'lenses' }],

  // Audio
  headphone: [{ category: 'audio', subcategory: 'headphones' }],
  headphones: [{ category: 'audio', subcategory: 'headphones' }],
  earbuds: [{ category: 'audio', subcategory: 'earbuds-audio' }],
  speaker: [{ category: 'audio', subcategory: 'bluetooth-speakers' }],
  speakers: [{ category: 'audio', subcategory: 'bluetooth-speakers' }],
  soundbar: [{ category: 'audio', subcategory: 'soundbars' }],
  soundbars: [{ category: 'audio', subcategory: 'soundbars' }],

  // Gaming
  gaming: [{ category: 'gaming', subcategory: 'consoles' }],
  console: [{ category: 'gaming', subcategory: 'consoles' }],
  consoles: [{ category: 'gaming', subcategory: 'consoles' }],
  controller: [{ category: 'gaming', subcategory: 'controllers' }],
  controllers: [{ category: 'gaming', subcategory: 'controllers' }],

  // Fashion
  clothing: [{ category: 'fashion' }],
  fashion: [{ category: 'fashion' }],
  shoes: [{ category: 'fashion' }],
  bags: [{ category: 'fashion' }],
  watches: [{ category: 'fashion', subcategory: 'watches' }],

  // Home
  kitchen: [{ category: 'home-kitchen' }],
  home: [{ category: 'home-kitchen' }],
  furniture: [{ category: 'home-kitchen' }],
  decor: [{ category: 'home-kitchen' }],
  appliance: [{ category: 'home-kitchen' }],
  appliances: [{ category: 'home-kitchen' }],

  // Beauty
  beauty: [{ category: 'beauty-health' }],
  makeup: [{ category: 'beauty-health', subcategory: 'makeup' }],
  skincare: [{ category: 'beauty-health', subcategory: 'skincare' }],
  haircare: [{ category: 'beauty-health', subcategory: 'haircare' }],
  grooming: [{ category: 'beauty-health', subcategory: 'grooming' }],
  perfume: [{ category: 'beauty-health', subcategory: 'fragrance-wellness' }],
  perfumes: [{ category: 'beauty-health', subcategory: 'fragrance-wellness' }],

  // Grocery
  grocery: [{ category: 'grocery' }],
  groceries: [{ category: 'grocery' }],
  snacks: [{ category: 'grocery', subcategory: 'food-beverages' }],
  beverages: [{ category: 'grocery', subcategory: 'food-beverages' }],

  // Baby / Toys
  baby: [{ category: 'baby-toys' }],
  toys: [{ category: 'baby-toys', subcategory: 'toys-games' }],
  kids: [{ category: 'baby-toys' }],

  // Sports
  sports: [{ category: 'sports-outdoors' }],
  fitness: [{ category: 'sports-outdoors', subcategory: 'fitness' }],
  outdoor: [{ category: 'sports-outdoors', subcategory: 'outdoor-gear' }],

  // Automotive / tools
  automotive: [{ category: 'automotive-tools', subcategory: 'automotive' }],
  tools: [{ category: 'automotive-tools', subcategory: 'tools-diy' }],
  diy: [{ category: 'automotive-tools', subcategory: 'tools-diy' }],
};

export function mapLegacyCategory(value: string) {
  const v = normalizeCategorySlug(value || '');
  if (!v) return null;

  if (LEGACY_MAP[v]) return LEGACY_MAP[v][0] || null;

  const tokens = v.split(/[-_\s]+/).filter(Boolean);
  for (const t of tokens) {
    if (LEGACY_MAP[t]) return LEGACY_MAP[t][0] || null;
  }

  const direct = findNodeBySlug(MASTER_CATEGORIES, v);
  if (direct.node) {
    if (direct.parent) {
      return {
        category: normalizeCategorySlug(direct.parent.slug),
        subcategory: normalizeCategorySlug(direct.node.slug),
      };
    }
    return { category: normalizeCategorySlug(direct.node.slug) };
  }

  return null;
}

export function gatherSlugsUnder(categorySlug: string) {
  const cacheKey = normalizeCategorySlug(categorySlug || '');

  if (!(gatherSlugsUnder as any)._cache) {
    (gatherSlugsUnder as any)._cache = new Map<string, Set<string>>();
  }

  const cache: Map<string, Set<string>> = (gatherSlugsUnder as any)._cache;
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
  } catch {
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
  if (!categorySlug) return [];

  const normCat = normalizeCategorySlug(categorySlug);
  const normSub = subcategorySlug ? normalizeCategorySlug(subcategorySlug) : null;

  const allowed = new Set<string>();
  const slugsUnder = gatherSlugsUnder(normSub || normCat);

  for (const s of slugsUnder) allowed.add(s);
  allowed.add(normSub || normCat);

  let matchedCount = 0;
  let legacyMappedCount = 0;
  let unmatchedCount = 0;

  const result = (products || []).filter((product) => {
    const values: string[] = [];
    const resolvedAssignment = resolveCanonicalCategoryAssignment(product);

    const catId = product?.categoryId || product?.specs?.backendCategoryId || null;
    if (catId && backendCategories && Array.isArray(backendCategories)) {
      const byId = backendCategories.find(
        (c) => String(c.id) === String(catId) || String(c.slug) === String(catId)
      );
      if (byId?.slug) values.push(normalizeCategorySlug(byId.slug));
    }

    if (product?.specs) {
      if (product.specs.parentCategorySlug) values.push(normalizeCategorySlug(product.specs.parentCategorySlug));
      if (product.specs.categorySlug) values.push(normalizeCategorySlug(product.specs.categorySlug));
      if (product.specs.subcategorySlug) values.push(normalizeCategorySlug(product.specs.subcategorySlug));
      if (product.specs.childCategorySlug) values.push(normalizeCategorySlug(product.specs.childCategorySlug));

      if (product.specs.templateId) values.push(normalizeCategorySlug(String(product.specs.templateId)));
      if (product.specs.parentCategoryName) values.push(normalizeCategorySlug(String(product.specs.parentCategoryName)));
      if (product.specs.categoryName) values.push(normalizeCategorySlug(String(product.specs.categoryName)));
      if (product.specs.categoryPath) {
        values.push(
          ...String(product.specs.categoryPath || '')
            .split('/')
            .map((s: any) => normalizeCategorySlug(String(s)))
        );
      }
      if (product.specs.parentCategory) values.push(normalizeCategorySlug(String(product.specs.parentCategory)));

      if (product.specs.attributes) {
        if (product.specs.attributes.category) {
          values.push(normalizeCategorySlug(String(product.specs.attributes.category)));
        }
        if (product.specs.attributes.subcategory) {
          values.push(normalizeCategorySlug(String(product.specs.attributes.subcategory)));
        }
      }
    }

    if (product?.category) values.push(normalizeCategorySlug(String(product.category)));
    if (product?.subcategory) values.push(normalizeCategorySlug(String(product.subcategory)));
    if (product?.brand) values.push(normalizeCategorySlug(String(product.brand)));

    if (product?.tags && Array.isArray(product.tags)) {
      for (const t of product.tags) values.push(normalizeCategorySlug(String(t)));
    }

    if (product?.labels && Array.isArray(product.labels)) {
      for (const l of product.labels) values.push(normalizeCategorySlug(String(l)));
    }

    const uniq = Array.from(new Set(values.filter(Boolean)));

    for (const assignmentValue of [
      resolvedAssignment.parentCategorySlug,
      resolvedAssignment.categorySlug,
      resolvedAssignment.subcategorySlug,
    ]) {
      if (assignmentValue) uniq.push(assignmentValue);
    }

    for (const s of uniq) {
      if (allowed.has(s)) {
        matchedCount += 1;
        return true;
      }
    }

    const legacySource =
      product?.category ||
      product?.specs?.attributes?.subcategory ||
      product?.specs?.attributes?.category ||
      product?.specs?.backendCategoryId ||
      product?.title ||
      product?.description ||
      '';

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
    debugCategoryAssignment("excluded-product", {
      productId: product?.id || product?.slug || product?.title || "unknown-product",
      requestedCategory: categorySlug,
      requestedSubcategory: subcategorySlug,
      availableValues: uniq,
      resolvedAssignment,
      status: product?.status || product?.productStatus || "",
      approvalStatus: product?.approvalStatus || product?.approval_status || "",
      visibilityStatus: product?.visibilityStatus || product?.visibility_status || "",
    });
    return false;
  });

  debugCategoryAssignment("filter-results", {
    categorySlug,
    subcategorySlug,
    totalProducts: (products || []).length,
    matched: result.length,
    matchedCount,
    legacyMappedCount,
    unmatchedCount,
  });

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
