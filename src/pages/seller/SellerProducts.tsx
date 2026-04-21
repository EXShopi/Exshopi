import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, sellerAPI } from '../../services/api';
import { AlertCircle, Archive, CheckCircle, Clock3, Copy, Edit, Eye, PackageSearch, Search, Trash2, XCircle } from 'lucide-react';
import { buildProductPath } from '../../lib/seo';
import { useAuthStore } from '../../store/auth';
import { formatCurrencyForCountry } from '../../lib/currency';

type SellerProduct = {
  id: string;
  title: string;
  price: number;
  priceUae?: number;
  priceKsa?: number;
  originalPrice?: number;
  compareAtPriceUae?: number;
  compareAtPriceKsa?: number;
  stock?: number;
  image?: string;
  sku?: string;
  categoryId?: string;
  category?: string;
  specs?: any;
  status?: string;
  rejectionReason?: string;
  createdAt?: string;
  views?: number;
  wishlistCount?: number;
  imageCount?: number;
  seoScore?: number;
  qualityScore?: number;
};

const statusTone: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  out_of_stock: 'bg-orange-50 text-orange-700 border-orange-200',
  archived: 'bg-slate-100 text-slate-700 border-slate-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
};

const statusIcon = (status?: string) => {
  if (status === 'live' || status === 'published' || status === 'approved') return <CheckCircle className="h-4 w-4" />;
  if (status === 'pending' || status === 'pending_approval') return <Clock3 className="h-4 w-4" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4" />;
  return <AlertCircle className="h-4 w-4" />;
};

export default function SellerProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending', label: 'Pending Approval' },
    { key: 'live', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'out_of_stock', label: 'Out of Stock' },
    { key: 'archived', label: 'Archived' },
  ];

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      if (!user) return;
      try {
        const userId = user.id || (user as any).uid || '';
        const seller = (await sellerAPI.getMyStore().catch(() => null)) || (await sellerAPI.getByUserId(userId));
        const resolvedSellerId = seller?.id || '';
        if (!resolvedSellerId) {
          if (mounted) setProducts([]);
          return;
        }
        const sellerProducts = await productAPI.getSellerProducts(resolvedSellerId);
        if (mounted) {
          setProducts(Array.isArray(sellerProducts) ? sellerProducts : []);
        }
      } catch (error) {
        console.error('Failed to load seller products:', error);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [user]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        [product.title, product.sku, (product as any).specs?.categoryName || (product as any).specs?.parentCategoryName || product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const currentStatus = (product as any).productStatus || (product as any).approvalStatus || product.status || 'draft';
      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const productSummary = useMemo(() => {
    return {
      total: products.length,
      pending: products.filter((product) => ((product as any).productStatus || (product as any).approvalStatus || product.status) === 'pending').length,
      approved: products.filter((product) => ['approved', 'live', 'published'].includes(String((product as any).productStatus || (product as any).approvalStatus || product.status))).length,
      rejected: products.filter((product) => ((product as any).productStatus || (product as any).approvalStatus || product.status) === 'rejected').length,
    };
  }, [products]);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const clearSelection = () => setSelectedIds([]);

  const applyLocalUpdate = (updated: SellerProduct[]) => {
    setProducts(updated);
    setSelectedIds([]);
  };

  const handleArchiveSelected = async () => {
    const updates = await Promise.all(
      selectedIds.map((id) =>
        productAPI.update(id, {
          productStatus: 'archived',
          approvalStatus: 'approved',
          visibilityStatus: 'hidden',
        })
      )
    );
    applyLocalUpdate(products.map((product) => updates.find((item) => item.id === product.id) || product));
  };

  const handleResubmitSelected = async () => {
    const updates = await Promise.all(
      selectedIds.map((id) =>
        productAPI.update(id, {
          approvalStatus: 'pending',
          productStatus: 'pending',
          visibilityStatus: 'hidden',
        })
      )
    );
    applyLocalUpdate(products.map((product) => updates.find((item) => item.id === product.id) || product));
  };

  const handleDeleteSelected = async () => {
    await Promise.all(selectedIds.map((id) => productAPI.delete(id)));
    applyLocalUpdate(products.filter((product) => !selectedIds.includes(product.id)));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">My Products</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Review your catalog, monitor approval status, and edit any listing from one place.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Listings</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{productSummary.total}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Approval</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{productSummary.pending}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, SKU, or category..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">All statuses</option>
            <option value="live">Live</option>
            <option value="pending">Pending approval</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Selected {selectedIds.length}
          </div>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={handleResubmitSelected}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-700 disabled:opacity-40"
          >
            Bulk resubmit
          </button>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={handleArchiveSelected}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 disabled:opacity-40"
          >
            Bulk archive
          </button>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={handleDeleteSelected}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-rose-700 disabled:opacity-40"
          >
            Bulk delete
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.includes(product.id))}
                    onChange={(event) =>
                      setSelectedIds(event.target.checked ? filteredProducts.map((product) => product.id) : [])
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Product</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Category</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Price</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Signals</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Stock</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                    Loading your products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16">
                    <div className="mx-auto max-w-md text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                        <PackageSearch className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-black text-slate-900">No products to show</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Products added from the dashboard will appear here after save, review, and approval updates.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const currentStatus = (product as any).productStatus || (product as any).approvalStatus || product.status || 'draft';
                  const tone = statusTone[currentStatus] || statusTone.draft;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <PackageSearch className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-black text-slate-900">{product.title}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{product.sku || `ID: ${product.id.slice(0, 8)}`}</p>
                            {product.createdAt && (
                              <p className="mt-1 text-[11px] font-medium text-slate-400">
                                Added {new Date(product.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">{(product as any).specs?.categoryName || (product as any).specs?.parentCategoryName || product.category || product.categoryId || 'Marketplace'}</td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900">
                            {formatCurrencyForCountry(Number(product.priceUae ?? product.price ?? 0), 'AE')}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {product.priceKsa != null
                              ? formatCurrencyForCountry(Number(product.priceKsa || 0), 'SA')
                              : 'KSA fallback to UAE price'}
                          </p>
                          {Number((product as any).compareAtPriceUae ?? (product as any).originalPrice ?? 0) >
                            Number(product.priceUae ?? product.price ?? 0) && (
                            <p className="text-xs font-semibold text-slate-400 line-through">
                              {formatCurrencyForCountry(
                                Number((product as any).compareAtPriceUae ?? (product as any).originalPrice ?? 0),
                                'AE'
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                          <div className="grid gap-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            {Number((product as any).views || 0).toLocaleString()} views
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            {Number((product as any).wishlistCount || 0).toLocaleString()} wishlists
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            {Number((product as any).imageCount || ((product as any).gallery || []).length || ((product as any).images || []).length || 1)} images
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">{product.stock ?? 0}</td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] ${tone}`}>
                          {statusIcon(currentStatus)}
                          {String(currentStatus).replace(/_/g, ' ')}
                        </div>
                        {product.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs font-medium text-rose-600">{product.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(buildProductPath(product))}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/seller/add-product?edit=${product.id}`)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/seller/add-product?edit=${product.id}`)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const updated = await productAPI.update(product.id, {
                                productStatus: 'archived',
                                visibilityStatus: 'hidden',
                              });
                              setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await productAPI.delete(product.id);
                              setProducts((current) => current.filter((item) => item.id !== product.id));
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
