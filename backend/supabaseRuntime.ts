import { createClient } from '@supabase/supabase-js';

import { db, Product } from './database';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const enabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let supabase: any = null;
if (enabled) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

const mapRowToProduct = (row: any): Product => {
  if (!row) return row;
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId || row.sellerId,
    categoryId: row.categoryId || row.category || '',
    title: row.title || '',
    description: row.description || '',
    price: Number(row.price || 0),
    originalPrice: Number(row.originalPrice || row.salePrice || row.price || 0),
    salePrice: row.salePrice != null ? Number(row.salePrice) : undefined,
    image: row.image || (Array.isArray(row.images) && row.images[0]) || '',
    images: Array.isArray(row.images) ? row.images : [],
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    sku: row.sku || '',
    brand: row.brand || '',
    specs: row.specs || row.specsJson || {},
    status: row.status || 'pending',
    approvalStatus: row.approvalStatus || 'pending',
    productStatus: row.productStatus || 'pending_approval',
    visibilityStatus: row.visibilityStatus || 'hidden',
    ownership: row.ownership || 'seller',
    createdByRole: row.createdByRole || 'seller',
    approvalNotes: row.approvalNotes || '',
    rejectionReason: row.rejectionReason || '',
    approvalRequestedAt: row.approvalRequestedAt || '',
    approvedAt: row.approvedAt || '',
    rejectedAt: row.rejectedAt || '',
    views: Number(row.views || 0),
    wishlistCount: Number(row.wishlistCount || 0),
    badges: Array.isArray(row.badges) ? row.badges : [],
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
  } as Product;
};

export const supabaseRuntime = {
  enabled,

  async createProduct(input: any) {
    if (!enabled) return null;
    const now = new Date().toISOString();
    const id = input.id || `prod_${Date.now()}`;
    const row = {
      id,
      sellerId: input.sellerId,
      storeId: input.storeId || input.sellerId,
      categoryId: input.categoryId || input.category || '',
      title: input.title || '',
      description: input.description || '',
      price: input.price || 0,
      originalPrice: input.originalPrice || input.price || 0,
      salePrice: input.salePrice || input.price || 0,
      image: input.image || (Array.isArray(input.images) && input.images[0]) || '',
      images: Array.isArray(input.images) ? input.images : [],
      stock: input.stock != null ? Number(input.stock) : 0,
      rating: input.rating || 0,
      reviews: input.reviews || 0,
      sku: input.sku || '',
      brand: input.brand || (input.specs && input.specs.attributes && input.specs.attributes.brand) || '',
      specs: input.specs || {},
      status: input.status || (input.productStatus === 'live' ? 'live' : 'pending'),
      approvalStatus: input.approvalStatus || (input.status === 'live' ? 'approved' : 'pending'),
      productStatus: input.productStatus || (Number(input.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval'),
      visibilityStatus: input.visibilityStatus || 'hidden',
      ownership: input.ownership || 'seller',
      createdByRole: input.createdByRole || 'seller',
      approvalRequestedAt: input.approvalRequestedAt || (input.status === 'draft' ? '' : now),
      approvedAt: input.approvedAt || '',
      rejectedAt: input.rejectedAt || '',
      approvalNotes: input.approvalNotes || '',
      rejectionReason: input.rejectionReason || '',
      views: input.views || 0,
      wishlistCount: input.wishlistCount || 0,
      badges: Array.isArray(input.badges) ? input.badges : [],
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase.from('products').insert([row]).select().single();
    if (error) throw error;
    return mapRowToProduct(data);
  },

  async getProduct(id: string) {
    if (!enabled) return null;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRowToProduct(data) : null;
  },

  async getProductBySlug(slug: string) {
    if (!enabled) return null;
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? mapRowToProduct(data) : null;
  },

  async getAllProducts() {
    if (!enabled) return [];
    const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    const rows = data || [];
    // Keep parity with db.getAllProducts which returns live products
    const filtered = rows.filter((r: any) => r.status === 'live' || r.approvalStatus === 'approved' || r.visibilityStatus === 'live');
    return filtered.map(mapRowToProduct);
  },

  async getProductsByCategorySlugs(parentSlug?: string | null, categorySlug?: string | null, subcategorySlug?: string | null) {
    if (!enabled) return [];
    const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    const all = (data || []).map(mapRowToProduct);
    return all.filter((product: any) => {
      const specs = product.specs || {};
      const pParent = String(specs.parentCategorySlug || specs.parentCategory || '');
      const pCategory = String(specs.categorySlug || specs.category || '');
      const pSub = String(specs.subcategorySlug || specs.subcategory || '');

      if (categorySlug && !parentSlug && !subcategorySlug) {
        return pParent === categorySlug || pCategory === categorySlug || pSub === categorySlug;
      }
      if (parentSlug && !categorySlug && !subcategorySlug) {
        return pParent === parentSlug;
      }
      if (categorySlug && subcategorySlug) {
        return pCategory === categorySlug && pSub === subcategorySlug;
      }
      if (categorySlug) {
        return pCategory === categorySlug || pParent === categorySlug;
      }
      if (subcategorySlug) {
        return pSub === subcategorySlug || pCategory === subcategorySlug || pParent === subcategorySlug;
      }
      return false;
    });
  },

  async getSellerProducts(sellerId: string) {
    if (!enabled) return [];
    const { data, error } = await supabase.from('products').select('*').eq('sellerId', sellerId).order('createdAt', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRowToProduct);
  },

  async getAllProductsForAdmin() {
    if (!enabled) return [];
    const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRowToProduct);
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    if (!enabled) return null;
    const now = new Date().toISOString();
    const rowUpdates: any = { ...updates, updatedAt: now };
    if ((updates as any).specs) rowUpdates.specs = (updates as any).specs;
    if ((updates as any).images) rowUpdates.images = (updates as any).images;
    const { data, error } = await supabase.from('products').update(rowUpdates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data ? mapRowToProduct(data) : null;
  },

  async deleteProduct(id: string) {
    if (!enabled) return false;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

export default supabaseRuntime;
