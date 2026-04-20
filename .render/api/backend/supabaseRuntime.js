import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const enabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
let supabase = null;
if (enabled) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });
}
const mapRowToProduct = (row) => {
    if (!row)
        return row;
    const specs = row.specs || row.specsJson || {};
    const deletionMeta = specs.__deletion || {};
    return {
        id: row.id,
        slug: row.slug || '',
        metaTitle: row.metaTitle || row.meta_title || specs.metaTitle || '',
        metaDescription: row.metaDescription || row.meta_description || specs.metaDescription || '',
        metaKeywords: row.metaKeywords || row.meta_keywords || specs.metaKeywords || '',
        canonicalUrl: row.canonicalUrl || row.canonical_url || specs.canonicalUrl || '',
        ogTitle: row.ogTitle || row.og_title || specs.ogTitle || '',
        ogDescription: row.ogDescription || row.og_description || specs.ogDescription || '',
        ogImage: row.ogImage || row.og_image || specs.ogImage || '',
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
        specs,
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
        isDeleted: Boolean(row.isDeleted || deletionMeta.isDeleted),
        deletedAt: row.deletedAt || deletionMeta.deletedAt || '',
        badges: Array.isArray(row.badges) ? row.badges : [],
        createdAt: row.createdAt || row.created_at || new Date().toISOString(),
        updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
    };
};
const isSoftDeletedProduct = (product) => Boolean(product?.isDeleted ||
    product?.deletedAt ||
    product?.specs?.__deletion?.isDeleted ||
    product?.specs?.__deletion?.deletedAt);
const withDeletionMeta = (specs, nextMeta) => ({
    ...(specs || {}),
    __deletion: {
        ...((specs || {}).__deletion || {}),
        ...nextMeta,
    },
});
export const supabaseRuntime = {
    enabled,
    async createProduct(input) {
        if (!enabled)
            return null;
        const now = new Date().toISOString();
        const id = input.id || `prod_${Date.now()}`;
        const row = {
            id,
            sellerId: input.sellerId,
            storeId: input.storeId || input.sellerId,
            categoryId: input.categoryId || input.category || '',
            slug: input.slug || '',
            meta_title: input.metaTitle || input.specs?.metaTitle || '',
            meta_description: input.metaDescription || input.specs?.metaDescription || '',
            meta_keywords: input.metaKeywords || input.specs?.metaKeywords || '',
            canonical_url: input.canonicalUrl || input.specs?.canonicalUrl || '',
            og_title: input.ogTitle || input.specs?.ogTitle || '',
            og_description: input.ogDescription || input.specs?.ogDescription || '',
            og_image: input.ogImage || input.specs?.ogImage || '',
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
            isDeleted: Boolean(input.isDeleted),
            deletedAt: input.deletedAt || '',
            badges: Array.isArray(input.badges) ? input.badges : [],
            createdAt: now,
            updatedAt: now,
        };
        const { data, error } = await supabase.from('products').insert([row]).select().single();
        if (error)
            throw error;
        return mapRowToProduct(data);
    },
    async getProduct(id) {
        if (!enabled)
            return null;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? mapRowToProduct(data) : null;
    },
    async getProductBySlug(slug) {
        if (!enabled)
            return null;
        const raw = String(slug || '').trim();
        const last = raw.split('/').filter(Boolean).pop() || raw;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('slug', last)
                .eq('status', 'live')
                .eq('approval_status', 'approved')
                .eq('visibility_status', 'live')
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                const mapped = mapRowToProduct(data);
                return isSoftDeletedProduct(mapped) ? null : mapped;
            }
        }
        catch (err) {
            console.warn('[supabaseRuntime] primary slug lookup failed', err);
        }
        // Fallback: fetch a limited recent set and scan client-side for normalized matches
        try {
            const { data: rows, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'live')
                .eq('approval_status', 'approved')
                .eq('visibility_status', 'live')
                .order('createdAt', { ascending: false })
                .limit(2000);
            if (error)
                throw error;
            const normalize = (v) => String(v || '')
                .toLowerCase()
                .trim()
                .replace(/&/g, ' and ')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 120);
            const target = normalize(last);
            const mappedRows = (rows || []).map(mapRowToProduct);
            const found = mappedRows.find((p) => {
                const specs = p.specs || {};
                const candidates = [p.slug, specs.slug, specs.seoSlug, specs?.seo?.slug, p.title].filter(Boolean);
                return candidates.map(normalize).includes(target);
            });
            return found && !isSoftDeletedProduct(found) ? found : null;
        }
        catch (err) {
            console.warn('[supabaseRuntime] fallback scan failed', err);
            return null;
        }
    },
    async getAllProducts() {
        if (!enabled)
            return [];
        try {
            // Prefer server-side strict filtering on canonical column names
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'live')
                .eq('approval_status', 'approved')
                .eq('visibility_status', 'live')
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            const rows = data || [];
            console.log('[supabaseRuntime] getAllProducts fetched', rows.length);
            return rows.map(mapRowToProduct).filter((product) => !isSoftDeletedProduct(product));
        }
        catch (err) {
            // Fallback: query unfiltered then apply strict AND filter client-side (handle camelCase columns)
            console.warn('[supabaseRuntime] filtered query failed, falling back to client-side filter', err);
            const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
            if (error)
                throw error;
            const rows = data || [];
            const filtered = rows.filter((r) => {
                const status = r.status || r.productStatus || r.status;
                const approval = r.approval_status || r.approvalStatus || r.approvalStatus;
                const visibility = r.visibility_status || r.visibilityStatus || r.visibilityStatus;
                return String(status) === 'live' && String(approval) === 'approved' && String(visibility) === 'live';
            });
            return filtered.map(mapRowToProduct).filter((product) => !isSoftDeletedProduct(product));
        }
    },
    async getProductsByCategorySlugs(parentSlug, categorySlug, subcategorySlug) {
        if (!enabled)
            return [];
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'live')
                .eq('approval_status', 'approved')
                .eq('visibility_status', 'live')
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            const all = (data || []).map(mapRowToProduct);
            return all.filter((product) => {
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
            }).filter((product) => !isSoftDeletedProduct(product));
        }
        catch (err) {
            console.warn('[supabaseRuntime] filtered category query failed, falling back to client-side filter', err);
            const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
            if (error)
                throw error;
            const all = (data || []).map(mapRowToProduct);
            return all.filter((product) => {
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
            }).filter((product) => !isSoftDeletedProduct(product));
        }
    },
    async getSellerProducts(sellerId) {
        if (!enabled)
            return [];
        const { data, error } = await supabase.from('products').select('*').eq('sellerId', sellerId).order('createdAt', { ascending: false });
        if (error)
            throw error;
        return (data || []).map(mapRowToProduct).filter((product) => !isSoftDeletedProduct(product));
    },
    async getAllProductsForAdmin() {
        if (!enabled)
            return [];
        const { data, error } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
        if (error)
            throw error;
        return (data || []).map(mapRowToProduct);
    },
    async updateProduct(id, updates) {
        if (!enabled)
            return null;
        const now = new Date().toISOString();
        const rowUpdates = { ...updates, updatedAt: now };
        if (updates.metaTitle !== undefined)
            rowUpdates.meta_title = updates.metaTitle;
        if (updates.metaDescription !== undefined)
            rowUpdates.meta_description = updates.metaDescription;
        if (updates.metaKeywords !== undefined)
            rowUpdates.meta_keywords = updates.metaKeywords;
        if (updates.canonicalUrl !== undefined)
            rowUpdates.canonical_url = updates.canonicalUrl;
        if (updates.ogTitle !== undefined)
            rowUpdates.og_title = updates.ogTitle;
        if (updates.ogDescription !== undefined)
            rowUpdates.og_description = updates.ogDescription;
        if (updates.ogImage !== undefined)
            rowUpdates.og_image = updates.ogImage;
        delete rowUpdates.metaTitle;
        delete rowUpdates.metaDescription;
        delete rowUpdates.metaKeywords;
        delete rowUpdates.canonicalUrl;
        delete rowUpdates.ogTitle;
        delete rowUpdates.ogDescription;
        delete rowUpdates.ogImage;
        if (updates.specs || updates.isDeleted !== undefined || updates.deletedAt !== undefined) {
            const { data: existing, error: fetchError } = await supabase.from('products').select('specs').eq('id', id).maybeSingle();
            if (fetchError)
                throw fetchError;
            rowUpdates.specs = withDeletionMeta({ ...(existing?.specs || {}), ...(updates.specs || {}) }, {
                isDeleted: updates.isDeleted ?? Boolean(existing?.specs?.__deletion?.isDeleted),
                deletedAt: updates.deletedAt ?? existing?.specs?.__deletion?.deletedAt ?? '',
            });
        }
        if (updates.images)
            rowUpdates.images = updates.images;
        const { data, error } = await supabase.from('products').update(rowUpdates).eq('id', id).select().maybeSingle();
        if (error)
            throw error;
        return data ? mapRowToProduct(data) : null;
    },
    async deleteProduct(id) {
        if (!enabled)
            return false;
        const { data: existing, error: fetchError } = await supabase.from('products').select('specs').eq('id', id).maybeSingle();
        if (fetchError)
            throw fetchError;
        if (!existing)
            return false;
        const deletedAt = new Date().toISOString();
        const { error } = await supabase
            .from('products')
            .update({
            status: 'archived',
            productStatus: 'archived',
            visibilityStatus: 'hidden',
            isDeleted: true,
            deletedAt,
            specs: withDeletionMeta(existing.specs || {}, {
                isDeleted: true,
                deletedAt,
            }),
            updatedAt: deletedAt,
        })
            .eq('id', id);
        if (error)
            throw error;
        return true;
    },
};
export default supabaseRuntime;
