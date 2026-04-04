import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function loadLocalDb() {
  const dbPath = path.join(process.cwd(), 'backend', 'db.json');
  const raw = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(raw);
}

async function migrate() {
  const local = await loadLocalDb();
  const products = Array.isArray(local.products) ? local.products : [];
  console.log(`Found ${products.length} products in local db.json`);

  for (const p of products) {
    const row = {
      id: p.id,
      sellerId: p.sellerId,
      storeId: p.storeId || p.sellerId,
      categoryId: p.categoryId,
      title: p.title,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      image: p.image,
      images: p.images || [],
      stock: p.stock || 0,
      rating: p.rating || 0,
      reviews: p.reviews || 0,
      sku: p.sku || '',
      brand: p.brand || '',
      specs: p.specs || {},
      status: p.status || 'pending',
      approvalStatus: p.approvalStatus || 'pending',
      productStatus: p.productStatus || 'pending_approval',
      visibilityStatus: p.visibilityStatus || 'hidden',
      ownership: p.ownership || 'seller',
      createdByRole: p.createdByRole || 'seller',
      approvalNotes: p.approvalNotes || '',
      rejectionReason: p.rejectionReason || '',
      approvalRequestedAt: p.approvalRequestedAt || '',
      approvedAt: p.approvedAt || '',
      rejectedAt: p.rejectedAt || '',
      views: p.views || 0,
      wishlistCount: p.wishlistCount || 0,
      badges: p.badges || [],
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('products').upsert(row, { onConflict: 'id' }).select().maybeSingle();
      if (error) {
        console.error('Failed to upsert product', p.id, error.message || error);
      } else {
        console.log('Upserted', data?.id || p.id);
      }
    } catch (e) {
      console.error('Error upserting product', p.id, e.message || e);
    }
  }

  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
