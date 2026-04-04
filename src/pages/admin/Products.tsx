import React, { useEffect, useMemo, useState } from 'react';
import { adminProductAPI, invalidateProductCaches } from '../../services/api';
import { AlertCircle, CheckCircle2, Copy, Eye, Package2, Pencil, Search, Store, Trash2, XCircle } from 'lucide-react';
import { formatAED } from '../../lib/currency';
import { useNavigate } from 'react-router-dom';
import { OrbitLoader } from '../../components/ui/OrbitLoader';

const statusTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  live: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  archived: 'bg-slate-100 text-slate-700',
};

const getEffectiveStatus = (product: any) => {
  const productStatus = String(product?.productStatus || '');
  const approvalStatus = String(product?.approvalStatus || '');
  const status = String(product?.status || '');

  if (productStatus === 'draft' || status === 'draft') return 'draft';
  if (productStatus === 'rejected' || approvalStatus === 'rejected' || status === 'rejected') return 'rejected';
  if (productStatus === 'archived' || status === 'archived') return 'archived';
  if (productStatus === 'live' || status === 'live') return 'live';
  if (productStatus === 'approved' || approvalStatus === 'approved' || status === 'approved') return 'approved';
  return 'pending';
};

export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkReason, setBulkReason] = useState('');

  useEffect(() => {
    // load initially via the reload helper so params (search/status) are respected
    reloadProducts();
  }, []);

  // Debounce loader to avoid quick flicker on fast responses
  useEffect(() => {
    let t: number | undefined;
    if (loading) {
      t = window.setTimeout(() => setShowLoader(true), 180);
    } else {
      setShowLoader(false);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [loading]);

  const reloadProducts = () => {
    setLoading(true);
    (async () => {
      try {
        const params: any = {};
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (search && String(search).trim()) params.search = String(search).trim();
        const data = await adminProductAPI.getAll(params);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load admin products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  };

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const t = window.setTimeout(() => {
      reloadProducts();
    }, 450);
    return () => window.clearTimeout(t);
  }, [search, statusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [product.title, product.sku, product.brand, product.sellerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const status = getEffectiveStatus(product);
      return matchesSearch && (statusFilter === 'all' || status === statusFilter);
    });
  }, [products, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: products.length,
      draft: products.filter((product) => getEffectiveStatus(product) === 'draft').length,
      pending: products.filter((product) => getEffectiveStatus(product) === 'pending').length,
      live: products.filter((product) => ['approved', 'live'].includes(getEffectiveStatus(product))).length,
      rejected: products.filter((product) => getEffectiveStatus(product) === 'rejected').length,
    };
  }, [products]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const handleModerationAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await adminProductAPI.approve(id, 'Approved from admin moderation center');
      } else {
        await adminProductAPI.reject(id, bulkReason || 'Rejected from admin moderation center');
      }
      reloadProducts();
    } catch (error) {
      console.error(`Failed to ${action} product`, error);
    }
  };

  const handleBulkReview = async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!selectedIds.length) return;
    try {
      await adminProductAPI.bulkReview({
        ids: selectedIds,
        action,
        reason: bulkReason || undefined,
        notes: action === 'approve' ? 'Bulk approved from admin moderation center' : undefined,
      });
      setSelectedIds([]);
      reloadProducts();
    } catch (error) {
      console.error('Failed to complete bulk review', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map((id) => adminProductAPI.delete(id)));
      try { invalidateProductCaches(selectedIds); } catch (e) { console.warn('Failed to invalidate product caches', e); }
      try { localStorage.setItem('exshopi:product-deleted', JSON.stringify({ ids: selectedIds, ts: Date.now() })); } catch (e) { /* ignore */ }
      setSelectedIds([]);
      reloadProducts();
    } catch (error) {
      console.error('Failed to bulk delete products', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Immediate permanent delete on click (no prompt)
    try {
      await adminProductAPI.delete(id);
      try { invalidateProductCaches(id); } catch (e) { console.warn('Failed to invalidate product caches', e); }
      try { localStorage.setItem('exshopi:product-deleted', JSON.stringify({ id, ts: Date.now() })); } catch (e) { /* ignore */ }
      setSelectedIds((current) => current.filter((entry) => entry !== id));
      reloadProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Marketplace Products</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Moderate seller and ExShopi Official listings with approval, visibility, and catalog quality signals.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <button
            onClick={() => navigate('/admin/products/add')}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
          >
            Add Product
          </button>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, seller, or SKU..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total Products', summary.total, Package2, 'bg-blue-50 text-blue-600'],
          ['Drafts', summary.draft, Package2, 'bg-slate-100 text-slate-700'],
          ['Pending Review', summary.pending, AlertCircle, 'bg-amber-50 text-amber-600'],
          ['Live Listings', summary.live, CheckCircle2, 'bg-emerald-50 text-emerald-600'],
          ['Rejected', summary.rejected, XCircle, 'bg-rose-50 text-rose-600'],
        ].map(([label, value, Icon, tone]: any) => (
          <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 inline-flex rounded-2xl p-3 ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {[
              ['all', 'All'],
              ['draft', 'Drafts'],
              ['pending', 'Pending'],
              ['approved', 'Approved'],
              ['live', 'Live'],
              ['rejected', 'Rejected'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
                  statusFilter === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={bulkReason}
              onChange={(event) => setBulkReason(event.target.value)}
              placeholder="Reason / moderation note..."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkReview('approve')}
                disabled={!selectedIds.length}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkReview('reject')}
                disabled={!selectedIds.length}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Bulk Reject
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={!selectedIds.length}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {showLoader ? (
          <div className="flex items-center justify-center py-20">
            <OrbitLoader label="Loading products..." size={26} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.includes(product.id))}
                      onChange={(event) => setSelectedIds(event.target.checked ? filteredProducts.map((product) => product.id) : [])}
                    />
                  </th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Seller</th>
                  <th className="px-4 py-4">Price / Stock</th>
                  <th className="px-4 py-4">Signals</th>
                  <th className="px-4 py-4">Approval</th>
                  <th className="px-4 py-4">Visibility</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const status = getEffectiveStatus(product);
                  const moderationSignals = Array.isArray(product.moderationSignals) ? product.moderationSignals : [];
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Package2 size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="max-w-[240px] text-sm font-black text-slate-900">{product.title}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">{product.sku || product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                          <Store size={14} />
                          {product.sellerName || product.soldByLabel || 'ExShopi Official'}
                        </div>
                        {(product.ownership === 'official' || product.createdByRole === 'admin') && (
                          <div className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                            ExShopi Official
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        <p className="font-black text-slate-900">
                          {formatAED(Number(product.price || 0))}
                        </p>
                        <p className="mt-1">{Number(product.stock || 0)} in stock</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        <p>{Number(product.views || 0).toLocaleString()} views</p>
                        <p className="mt-1">{Number(product.wishlistCount || 0).toLocaleString()} wishlists</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {moderationSignals.slice(0, 3).map((signal: any) => (
                            <span
                              key={signal.key}
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                                signal.status === 'pass'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : signal.status === 'warn'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {signal.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone[status] || statusTone.pending}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                        {product.rejectionReason && <p className="mt-2 max-w-[220px] text-xs font-medium text-rose-600">{product.rejectionReason}</p>}
                        {moderationSignals.length > 0 && (
                          <p className="mt-2 text-xs font-medium text-slate-500">
                            {moderationSignals.filter((signal: any) => signal.status !== 'pass').length} checklist items need review
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                          product.visibilityStatus === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.visibilityStatus || 'hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleModerationAction(product.id, 'approve')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleModerationAction(product.id, 'reject')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/admin/products/add?edit=${product.id}`)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/add?copy=${product.id}`)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                          <button
                            onClick={() => window.open(`/product/${product.slug || product.id}`, '_blank')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
                          >
                            <Eye size={14} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                      No products found for this admin view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
