#!/usr/bin/env tsx
/*
  Import a Thunderbit CSV/JSON into local backend/db.json (dev-only).
  Usage: npx tsx scripts/importToDbJson.ts /absolute/path/to/file.csv
  Creates a backup of backend/db.json before writing.
*/
import fs from 'node:fs';
import path from 'node:path';

type ThunderbitRecord = Record<string, string>;

function parseCsvFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      current = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (rows.length === 0) return [] as ThunderbitRecord[];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj: ThunderbitRecord = {};
    headers.forEach((header, i) => {
      obj[header] = (cells[i] || '').trim();
    });
    return obj;
  });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function improveTitle(item: ThunderbitRecord) {
  const base = (item['Product Name'] || item.Model || 'ExShopi Product').trim();
  const category = (item['Product Category'] || '').trim();
  let title = base.replace(/\s{2,}/g, ' ').trim();
  if (category && !new RegExp(category, 'i').test(title)) title = `${title} ${category}`.trim();
  return title.slice(0, 120);
}

function parsePrice(value?: string) {
  const numeric = Number.parseFloat((value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function splitImageUrls(input?: string) {
  if (!input) return [] as string[];
  return input
    .split(/\r?\n|,/g)
    .map((p) => p.trim())
    .filter((p) => /^https?:\/\//i.test(p));
}

function buildShortDescription(item: ThunderbitRecord) {
  const desc = (item['Product Description'] || '').replace(/\\n/g, '\n').trim();
  if (desc) return desc.slice(0, 220);
  const bullets = (item['Key Features'] || '').split(/\n|•|–|-/g).map((s) => s.trim()).filter(Boolean);
  if (bullets.length) return bullets[0].slice(0, 220);
  return `${item.Brand || 'ExShopi'} ${item['Product Name'] || 'product'}`.slice(0, 220);
}

function mapCategoryToLocal(categories: any[], item: ThunderbitRecord) {
  const cat = (item['Product Category'] || '').toLowerCase();
  const title = `${item['Product Name'] || ''} ${item['Product Description'] || ''}`.toLowerCase();

  // try exact slug/name match
  const bySlug = categories.find((c: any) => c.slug === cat || (c.name && c.name.toLowerCase() === cat));
  if (bySlug) return bySlug.id;

  // keyword heuristics
  if (/(mouse|keyboard|headset|speaker|camera|accessories)/.test(cat) || /(mouse|keyboard|headset|speaker|camera|charger|cable)/.test(title)) {
    const match = categories.find((c: any) => c.slug === 'electronics' || c.slug === 'accessories');
    return match ? match.id : categories[0]?.id;
  }

  if (/(laptop|macbook|notebook)/.test(title)) {
    const match = categories.find((c: any) => c.slug === 'electronics');
    return match ? match.id : categories[0]?.id;
  }

  if (/(kitchen|furniture|home|storage|household)/.test(title)) {
    const match = categories.find((c: any) => c.slug === 'home-kitchen');
    return match ? match.id : categories[0]?.id;
  }

  if (/(shirt|jeans|dress|clothing|t-shirt|polo)/.test(title)) {
    const match = categories.find((c: any) => c.slug === 'fashion');
    return match ? match.id : categories[0]?.id;
  }

  // fallback to first category
  return categories[0]?.id || null;
}

function makeId() {
  return `prod_${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function backupDb(dbPath: string) {
  const bak = `${dbPath}.bak-${Date.now()}`;
  fs.copyFileSync(dbPath, bak);
  return bak;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npx tsx scripts/importToDbJson.ts /absolute/path/to/file.csv');
    process.exit(1);
  }

  const filePath = path.resolve(input);
  if (!fs.existsSync(filePath)) {
    console.error('Input file not found:', filePath);
    process.exit(1);
  }

  const dbPath = path.resolve(process.cwd(), 'backend', 'db.json');
  const rawDb = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawDb);

  const categories = db.categories || [];
  const records = parseCsvFile(filePath);

  const existingTitles = new Set((db.products || []).map((p: any) => String(p.title || '').trim().toLowerCase()));
  const usedSlugs = new Set((db.products || []).map((p: any) => String(p.slug || '').trim()));

  const created: any[] = [];
  for (const item of records) {
    const title = improveTitle(item);
    if (!title) continue;
    if (existingTitles.has(title.toLowerCase())) {
      console.log('Skipping existing title:', title);
      continue;
    }

    const imageUrls = splitImageUrls(item['Product Image']);
    const image = imageUrls[0] || '';
    const price = parsePrice(item['Price (AED)'] || item['Price'] || item['price']);
    const categoryId = mapCategoryToLocal(categories, item) || (categories[0] && categories[0].id);

    const baseSlug = slugify(title) || `product-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const prod = {
      id: makeId(),
      sellerId: 'exshopi_official',
      storeId: 'exshopi_official',
      categoryId,
      title,
      description: (item['Product Description'] || '').slice(0, 4000),
      price: price || 19.99,
      originalPrice: price || 19.99,
      salePrice: price || 19.99,
      image: image || '',
      images: imageUrls,
      stock: 20,
      rating: 0,
      reviews: 0,
      sku: (item.ASIN || slug.toUpperCase().slice(0, 24)),
      brand: item.Brand || '',
      specs: {
        templateId: '',
        templateName: '',
        shortDescription: buildShortDescription(item),
        longDescription: (item['Product Description'] || '').slice(0, 8000),
        attributes: {
          brand: item.Brand || '',
          model: item.Model || '',
          color: item.Color || '',
        },
        importMeta: {
          source: 'Thunderbit',
          sourceFile: path.basename(filePath),
        },
      },
      status: 'live',
      approvalStatus: 'approved',
      productStatus: 'live',
      visibilityStatus: 'live',
      ownership: 'official',
      createdByRole: 'admin',
      approvalRequestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      views: 0,
      wishlistCount: 0,
      badges: ['Imported'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug,
    };

    (db.products = db.products || []).push(prod);
    usedSlugs.add(slug);
    existingTitles.add(title.toLowerCase());
    created.push({ id: prod.id, title: prod.title, categoryId: prod.categoryId });
  }

  if (created.length === 0) {
    console.log('No new products imported. Exiting.');
    return;
  }

  const bak = backupDb(dbPath);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Imported', created.length, 'products. Backup created at', bak);
  console.log(JSON.stringify(created, null, 2));
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
