#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

type CsvRow = Record<string, string>;

const root = process.cwd();
const dbPath = path.join(root, 'backend', 'db.json');
const snapshotPath = path.join(root, 'backend', 'data', 'importedDraftProducts.json');

function parseCsvFile(filePath: string): CsvRow[] {
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
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) => {
    const rowObject: CsvRow = {};
    headers.forEach((header, index) => {
      rowObject[header] = (cells[index] || '').trim();
    });
    return rowObject;
  });
}

function slugify(input: string) {
  return String(input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitFeatures(input: string) {
  return String(input || '')
    .split(/\r?\n|•|\|/g)
    .map((item) => item.replace(/^[\-\s]+/, '').trim())
    .filter(Boolean);
}

function backupDb() {
  const backupPath = `${dbPath}.pre-draft-replace-${Date.now()}.bak`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

function mapTopLevelCategoryId(categories: any[], parentCategory: string) {
  const normalized = slugify(parentCategory);
  return (
    categories.find((category) => slugify(category.slug || category.name || '') === normalized)?.id ||
    categories.find((category) => slugify(category.slug || category.name || '') === 'electronics')?.id ||
    categories[0]?.id ||
    null
  );
}

function buildCanonicalUrl(parentSlug: string, categorySlug: string, subcategorySlug: string, productSlug: string) {
  const parts = ['https://exshopi.com', parentSlug, categorySlug, subcategorySlug, productSlug].filter(Boolean);
  return parts.join('/');
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npx tsx scripts/replaceDraftsFromCsv.ts /absolute/path/to/file.csv');
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInputPath)) {
    console.error('CSV file not found:', resolvedInputPath);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const products = Array.isArray(db.products) ? db.products : [];
  const categories = Array.isArray(db.categories) ? db.categories : [];
  const rows = parseCsvFile(resolvedInputPath);

  if (rows.length === 0) {
    console.error('CSV file has no rows:', resolvedInputPath);
    process.exit(1);
  }

  const liveProducts = products.filter((product: any) => String(product.status || '').toLowerCase() === 'live');
  const nonLiveNonDraft = products.filter((product: any) => {
    const status = String(product.status || '').toLowerCase();
    return status !== 'live' && status !== 'draft';
  });

  const usedLiveSlugs = new Set(liveProducts.map((product: any) => String(product.slug || '').trim()).filter(Boolean));
  const usedLiveIds = new Set(liveProducts.map((product: any) => String(product.id || '').trim()).filter(Boolean));
  const usedLiveSkus = new Set(liveProducts.map((product: any) => String(product.sku || '').trim()).filter(Boolean));

  const importedDrafts = rows.map((row, index) => {
    const title = row.title || row.model || row.sku || `Imported Draft ${index + 1}`;
    const brand = row.brand || '';
    const model = row.model || '';
    const parentCategoryName = row.parentCategory || 'Electronics';
    const categoryName = row.category || '';
    const subcategoryName = row.subcategory || '';
    const parentCategorySlug = slugify(parentCategoryName);
    const categorySlug = slugify(categoryName);
    const subcategorySlug = slugify(subcategoryName);
    const productSlug = row.slug || slugify(title) || `draft-product-${index + 1}`;
    const image = row.image || '';
    const priceUae = parseNumber(row.priceUae, parseNumber(row.priceKsa, 0));
    const priceKsa = parseNumber(row.priceKsa, priceUae);
    const stock = Math.max(0, Math.trunc(parseNumber(row.stock, 0)));
    const keyFeatures = splitFeatures(row.keyFeatures);
    const categoryId = mapTopLevelCategoryId(categories, parentCategoryName);
    const sellerName = row.sellerName || 'ExShopi Official';
    const status = 'draft';
    const approvalStatus = row.approvalStatus || 'pending';
    const visibilityStatus = row.visibilityStatus || 'hidden';

    if (usedLiveIds.has(row.id || '')) {
      throw new Error(`CSV row id collides with a live product: ${row.id}`);
    }
    if (usedLiveSlugs.has(productSlug)) {
      throw new Error(`CSV row slug collides with a live product: ${productSlug}`);
    }
    if (row.sku && usedLiveSkus.has(row.sku)) {
      throw new Error(`CSV row SKU collides with a live product: ${row.sku}`);
    }

    return {
      id: row.id || `draft_import_${Date.now()}_${index + 1}`,
      sellerId: 'exshopi_official',
      storeId: 'exshopi_official',
      categoryId,
      title,
      slug: productSlug,
      description: row.description || row.longDescription || row.shortDescription || '',
      price: priceUae,
      originalPrice: priceUae,
      salePrice: priceUae,
      priceUae,
      priceKsa,
      compareAtPriceUae: priceUae,
      compareAtPriceKsa: priceKsa,
      image,
      images: image ? [image] : [],
      stock,
      rating: 0,
      reviews: 0,
      sku: row.sku || productSlug.toUpperCase().slice(0, 32),
      brand,
      model,
      sellerName,
      soldByLabel: sellerName,
      metaTitle: row.metaTitle || title,
      metaDescription: row.metaDescription || row.shortDescription || '',
      canonicalUrl: buildCanonicalUrl(parentCategorySlug, categorySlug, subcategorySlug, productSlug),
      ogTitle: row.metaTitle || title,
      ogDescription: row.metaDescription || row.shortDescription || '',
      status,
      approvalStatus,
      productStatus: status,
      visibilityStatus,
      visibility: false,
      ownership: 'official',
      createdByRole: 'admin',
      approvalNotes: '',
      rejectionReason: '',
      approvalRequestedAt: row.createdAt || new Date().toISOString(),
      approvedAt: '',
      rejectedAt: '',
      views: 0,
      wishlistCount: 0,
      badges: [],
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
      parentCategory: parentCategoryName,
      category: categoryName,
      subcategory: subcategoryName,
      specs: {
        templateId: subcategorySlug || categorySlug || 'product',
        templateName: subcategoryName || categoryName || 'Product',
        categoryTemplateKey: subcategorySlug || categorySlug || 'product',
        shortDescription: row.shortDescription || '',
        longDescription: row.longDescription || row.description || '',
        keyFeatures,
        sellerNotes: row.sellerNotes || '',
        buyerNotes: row.buyerNotes || '',
        specificationValues: {
          brand,
          model,
          category: parentCategoryName,
          subcategory: subcategoryName || categoryName,
        },
        attributes: {
          brand,
          model,
          category: categoryName,
          subcategory: subcategoryName,
        },
        searchTags: [brand, model, categoryName, subcategoryName].filter(Boolean).map((entry) => String(entry).toLowerCase()),
        metaTitle: row.metaTitle || title,
        metaDescription: row.metaDescription || row.shortDescription || '',
        metaKeywords: [brand, model, subcategoryName, 'exshopi'].filter(Boolean).join(', '),
        canonicalUrl: buildCanonicalUrl(parentCategorySlug, categorySlug, subcategorySlug, productSlug),
        ogTitle: row.metaTitle || title,
        ogDescription: row.metaDescription || row.shortDescription || '',
        ogImage: image,
        parentCategorySlug,
        categorySlug,
        subcategorySlug,
        parentCategoryName,
        categoryName,
        subcategoryName,
        categoryPath: [parentCategorySlug, categorySlug, subcategorySlug].filter(Boolean).join('/'),
        approvalStatus,
        productStatus: status,
        visibilityStatus,
        ownership: 'official',
        createdByRole: 'admin',
        model,
        importMeta: {
          source: 'csv-replace',
          sourceFile: path.basename(resolvedInputPath),
          importedAt: new Date().toISOString(),
        },
      },
    };
  });

  const backupPath = backupDb();
  const nextProducts = [...liveProducts, ...nonLiveNonDraft, ...importedDrafts];
  fs.writeFileSync(dbPath, `${JSON.stringify({ ...db, products: nextProducts }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(snapshotPath, `${JSON.stringify(importedDrafts, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        backupPath,
        previous: {
          total: products.length,
          drafts: products.filter((product: any) => String(product.status || '').toLowerCase() === 'draft').length,
          live: liveProducts.length,
        },
        replacement: {
          importedDrafts: importedDrafts.length,
          preservedLive: liveProducts.length,
          preservedOtherNonLive: nonLiveNonDraft.length,
        },
        next: {
          total: nextProducts.length,
          drafts: importedDrafts.length,
          live: liveProducts.length,
        },
      },
      null,
      2
    )
  );
}

main();
