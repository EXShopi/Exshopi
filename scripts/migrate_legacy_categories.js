#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'backend', 'db.json');
const BACKUP_PATH = `${DB_PATH}.pre-migrate-legacy-${Date.now()}.bak`;

function normalize(value) {
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

// Minimal legacy map (keeps in sync with src/lib/masterCategories.ts)
const LEGACY_MAP = {
  laptop: { category: 'computers', subcategory: 'laptops' },
  laptops: { category: 'computers', subcategory: 'laptops' },
  macbook: { category: 'computers', subcategory: 'laptops' },
  notebook: { category: 'computers', subcategory: 'laptops' },
  ultrabook: { category: 'computers', subcategory: 'laptops' },

  desktop: { category: 'computers', subcategory: 'desktop-pcs' },
  desktops: { category: 'computers', subcategory: 'desktop-pcs' },
  pc: { category: 'computers', subcategory: 'desktop-pcs' },
  tower: { category: 'computers', subcategory: 'desktop-pcs' },
  workstation: { category: 'computers', subcategory: 'desktop-pcs' },
  'all-in-one': { category: 'computers', subcategory: 'all-in-one' },

  ssd: { category: 'computers', subcategory: 'storage' },
  hdd: { category: 'computers', subcategory: 'storage' },
  storage: { category: 'computers', subcategory: 'storage' },
  'hard-drive': { category: 'computers', subcategory: 'storage' },

  monitor: { category: 'computers', subcategory: 'monitors' },
  printer: { category: 'computers', subcategory: 'printers' },

  phone: { category: 'mobiles', subcategory: 'smartphones' },
  phones: { category: 'mobiles', subcategory: 'smartphones' },
  mobile: { category: 'mobiles', subcategory: 'smartphones' },
  mobiles: { category: 'mobiles', subcategory: 'smartphones' },
  smartphone: { category: 'mobiles', subcategory: 'smartphones' },
  iphone: { category: 'mobiles', subcategory: 'smartphones' },
  android: { category: 'mobiles', subcategory: 'smartphones' },
  tablet: { category: 'mobiles', subcategory: 'tablets' },
  ipad: { category: 'mobiles', subcategory: 'tablets' },

  charger: { category: 'mobiles', subcategory: 'chargers' },
  chargers: { category: 'mobiles', subcategory: 'chargers' },
  cable: { category: 'mobiles', subcategory: 'cables' },
  cables: { category: 'mobiles', subcategory: 'cables' },
  case: { category: 'mobiles', subcategory: 'cases' },
  'screen-protector': { category: 'mobiles', subcategory: 'screen-protectors' },
};

// map category slug to parent (simple resolver)
const CATEGORY_PARENT = {
  computers: 'electronics',
  mobiles: 'electronics',
  'tv-video': 'electronics',
  cameras: 'electronics',
  audio: 'electronics',
  gaming: 'electronics',
  fashion: 'fashion',
  'home-kitchen': 'home-kitchen',
  'beauty-health': 'beauty-health',
  grocery: 'grocery',
  'baby-toys': 'baby-toys',
};

function mapLegacy(value) {
  if (!value) return null;
  const v = normalize(value);
  if (!v) return null;
  if (LEGACY_MAP[v]) return LEGACY_MAP[v];
  const tokens = v.split(/[-_\s]+/).filter(Boolean);
  for (const t of tokens) {
    if (LEGACY_MAP[t]) return LEGACY_MAP[t];
  }
  return null;
}

function inferFromProduct(product) {
  // sources to try
  const src = [];
  if (product.specs && product.specs.attributes) {
    if (product.specs.attributes.subcategory) src.push(product.specs.attributes.subcategory);
    if (product.specs.attributes.category) src.push(product.specs.attributes.category);
  }
  if (product.category) src.push(product.category);
  if (product.specs && product.specs.backendCategoryId) src.push(product.specs.backendCategoryId);
  if (product.title) src.push(product.title);
  if (product.description) src.push(product.description);

  for (const s of src) {
    const m = mapLegacy(String(s || ''));
    if (m && m.category) return m;
  }
  return null;
}

function run(dryRun = true) {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found:', DB_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  const products = Array.isArray(db.products) ? db.products : [];

  let changed = 0;
  let scanned = 0;

  for (const p of products) {
    scanned += 1;
    p.specs = p.specs || {};
    const alreadyHasCategory = p.specs.parentCategorySlug || p.specs.categorySlug;
    if (alreadyHasCategory) continue; // do not override existing canonical fields

    const mapped = inferFromProduct(p);
    if (mapped && mapped.category) {
      const categorySlug = mapped.category;
      const sub = mapped.subcategory || null;
      const parent = CATEGORY_PARENT[categorySlug] || (categorySlug === 'fashion' ? 'fashion' : null) || null;

      p.specs.parentCategorySlug = parent || undefined;
      p.specs.categorySlug = categorySlug || undefined;
      if (sub) p.specs.subcategorySlug = sub;

      // also add readable names if not present
      if (!p.specs.parentCategoryName && parent) p.specs.parentCategoryName = parent;
      if (!p.specs.categoryName) p.specs.categoryName = categorySlug;
      if (sub && !p.specs.subcategoryName) p.specs.subcategoryName = sub;

      changed += 1;
    }
  }

  console.log(`Scanned ${scanned} products, would update ${changed} products (dryRun=${dryRun}).`);

  if (!dryRun && changed > 0) {
    // backup
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log('Backup created at', BACKUP_PATH);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('Database updated with canonical category slugs.');
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const dry = !(args.includes('--apply') || args.includes('--yes'));
  run(dry);
}

module.exports = { run, mapLegacy };
