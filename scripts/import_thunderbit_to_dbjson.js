#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const thunderPath = process.argv[2] || path.join(process.env.HOME || '.', 'Downloads', 'Thunderbit_346a54_20260402_125721.json');
const dbPath = path.resolve(process.cwd(), 'backend', 'db.json');

function safeString(v) {
  if (v == null) return '';
  return String(v).trim();
}

try {
  if (!fs.existsSync(thunderPath)) {
    console.error('Thunderbit file not found:', thunderPath);
    process.exit(2);
  }

  const raw = fs.readFileSync(thunderPath, 'utf8');
  let items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    console.error('Expected JSON array in Thunderbit file');
    process.exit(3);
  }

  const dbRaw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbRaw);
  const backupPath = dbPath + '.pre-import-thunderbit-' + Date.now() + '.bak';
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2));
  console.log('Backup created at', backupPath);

  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.sellers)) db.sellers = [];

  const existingAsins = new Set((db.products || []).map(p => {
    const asin = p && p.specs && p.specs.importMeta && p.specs.importMeta.asin;
    return (asin || p.sku || '').toString().trim().toLowerCase();
  }).filter(Boolean));

  const sellerId = 'exshopi_official';
  let seller = db.sellers.find(s => s.id === sellerId);
  if (!seller) seller = db.sellers[0] || null;
  if (!seller) {
    console.error('No seller found to assign imported products to. Aborting.');
    process.exit(4);
  }

  let appended = 0;
  const now = new Date().toISOString();
  const startStamp = Date.now();

  items.forEach((item, idx) => {
    const asin = safeString(item['ASIN'] || item.ASIN || item['ASIN '] || '');
    const title = safeString(item['Product Name'] || item['Product name'] || item.title || item['Product Title']);
    if (!title) return; // skip if no title

    if (asin && existingAsins.has(asin.toLowerCase())) {
      return; // skip duplicate by ASIN
    }

    const priceRaw = safeString(item['Price (AED)'] || item['Price'] || item.price || '');
    const price = Number(String(priceRaw).replace(/[^0-9.]/g, '')) || 0;
    const image = safeString(item['Product Image'] || item.image || '');

    const id = `prod_import_${startStamp}_${idx}`;
    const product = {
      sellerId: seller.id,
      storeId: seller.id,
      categoryId: 'cat1',
      title,
      description: safeString(item['About This Item'] || item.description || ''),
      price,
      originalPrice: price,
      salePrice: price,
      image: image || '',
      images: image ? [image] : [],
      stock: 100,
      rating: 0,
      reviews: 0,
      sku: asin || `IMP-${startStamp}-${idx}`,
      specs: {
        importMeta: {
          source: 'thunderbit',
          asin: asin || '',
        },
        attributes: {
          brand: safeString(item['Brand'] || item.brand || ''),
        },
        raw: item,
      },
      status: 'live',
      id,
      createdAt: now,
      updatedAt: now,
      approvalNotes: '',
      salePrice: price,
      approvalStatus: 'approved',
      productStatus: 'live',
      visibilityStatus: 'live',
      ownership: 'official',
      createdByRole: 'admin',
      approvalRequestedAt: now,
      approvedAt: now,
      rejectedAt: '',
      views: 0,
      wishlistCount: 0,
      brand: safeString(item['Brand'] || item.brand || ''),
    };

    db.products.push(product);
    appended += 1;
    if (asin) existingAsins.add(asin.toLowerCase());
  });

  // update seller totalProducts
  seller.totalProducts = (Number(seller.totalProducts) || 0) + appended;

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log(`Appended ${appended} products to ${dbPath}`);
  process.exit(0);
} catch (err) {
  console.error('Import failed:', err && err.stack ? err.stack : String(err));
  process.exit(1);
}
