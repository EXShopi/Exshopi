import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../services/api';
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Loader2,
  Search,
  Star,
  TrendingDown,
  Warehouse,
} from 'lucide-react';
import { getProductLifecycleState } from '../../lib/productLifecycle';
import {
  HOMEPAGE_MERCHANDISING_TARGETS,
  type HomepageMerchandisingTarget,
  isProductSelectedForMerchandising,
  removeMerchandisingSelection,
  upsertMerchandisingSelection,
} from '../../lib/homepageMerchandising';
import { defaultSettings, getSiteSettings, type SiteSettings, updateSiteSettings } from '../../services/settingsService';

const statusTone: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  archived: 'bg-slate-100 text-slate-700',
  out_of_stock: 'bg-orange-100 text-orange-700',
};

export function AdminInventory() {
  const [inventoryRows, setInventoryRows] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingTarget, setSavingTarget] = useState<string>('');
  const [stats, setStats] = useState({
    totalSkus: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError('');
        setSaveError('');

        const [res, settings] = await Promise.all([
          authFetch('/admin/products'),
          getSiteSettings(),
        ]);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Failed to load inventory');
        }

        const adminProducts = Array.isArray(data) ? data : data?.products || data?.items || [];
        const rows = adminProducts.map(mapProductToInventoryRow);

        setInventoryRows(rows);
        setSiteSettings(settings);
        setStats({
          totalSkus: rows.length,
          totalUnits: rows.reduce((sum: number, row: any) => sum + (row.stock ?? 0), 0),
          lowStock: rows.filter((row: any) => (row.stock ?? 0) > 0 && (row.stock ?? 0) <= 5).length,
          outOfStock: rows.filter((row: any) => (row.stock ?? 0) <= 0).length,
        });
      } catch (err: any) {
        console.error('Failed to load inventory:', err);
        setError(err?.message || 'Failed to load inventory');
        setInventoryRows([]);
        setStats({
          totalSkus: 0,
          totalUnits: 0,
          lowStock: 0,
          outOfStock: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadInventory();
  }, []);

  const lowStockThreshold = 5;

  const filteredProducts = useMemo(() => {
    return inventoryRows.filter((product) => {
      const matchesSearch = [product.title, product.sku, product.brand, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const stock = Number(product.stock || 0);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'low' && stock > 0 && stock <= lowStockThreshold) ||
        (filter === 'out' && stock === 0);
      return matchesSearch && matchesFilter;
    });
  }, [filter, inventoryRows, search]);

  const handleMerchandisingToggle = async (product: any, target: HomepageMerchandisingTarget) => {
    const targetKey = `${target}:${String(product.id || product.slug || '')}`;
    const currentSelections = getMerchandisingSelections(siteSettings, target);
    const isSelected = isProductSelectedForMerchandising(currentSelections, product);
    const nextSelections = isSelected
      ? removeMerchandisingSelection(currentSelections, product)
      : upsertMerchandisingSelection(currentSelections, product);

    const nextSettings = applyMerchandisingSelections(siteSettings, target, nextSelections);

    try {
      setSavingTarget(targetKey);
      setSaveError('');
      setSiteSettings(nextSettings);
      await updateSiteSettings(nextSettings);
      dispatchMerchandisingToast(
        `${product.title || 'Product'} ${isSelected ? 'removed from' : 'added to'} ${getMerchandisingLabel(target)}`
      );
    } catch (err: any) {
      console.error('Failed to update homepage merchandising settings:', err);
      setSiteSettings((current) => applyMerchandisingSelections(current, target, currentSelections));
      setSaveError(err?.message || 'Failed to update homepage merchandising');
    } finally {
      setSavingTarget('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Inventory Control Center</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track live stock, low inventory risk, and seller catalog readiness across the marketplace.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SKU, product, or brand..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total SKUs', stats.totalSkus, Boxes, 'text-blue-600 bg-blue-50'],
          ['Total Units', stats.totalUnits, Warehouse, 'text-violet-600 bg-violet-50'],
          ['Low Stock', stats.lowStock, TrendingDown, 'text-amber-600 bg-amber-50'],
          ['Out of Stock', stats.outOfStock, AlertCircle, 'text-rose-600 bg-rose-50'],
        ].map(([label, value, Icon, tone]: any) => (
          <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 inline-flex rounded-2xl p-3 ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {[
            ['all', 'All inventory'],
            ['low', 'Low stock'],
            ['out', 'Out of stock'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value as 'all' | 'low' | 'out')}
              className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
                filter === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {error ? (
          <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
        {saveError ? (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm font-bold text-amber-700">
            {saveError}
          </div>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Brand / Category</th>
                  <th className="px-4 py-4">SKU</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4">Signals</th>
                  <th className="px-4 py-4">Approval</th>
                  <th className="px-4 py-4">Visibility</th>
                  <th className="px-4 py-4">Homepage Sections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock || 0);
                  const stockLabel = stock === 0 ? 'Out of stock' : stock <= lowStockThreshold ? 'Low stock' : 'Healthy';
                  const lifecycle = getProductLifecycleState(product);
                  const isEligibleForHomepage = lifecycle.isCustomerVisible;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Boxes size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="max-w-[240px] text-sm font-black text-slate-900">{product.title}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              Updated {product.updatedAt ? safeDate(product.updatedAt) : 'recently'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        <p className="font-bold text-slate-900">{product.brand || 'Brand not set'}</p>
                        <p className="mt-1">{product.category || 'Marketplace'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{product.sku || 'Not assigned'}</td>
                      <td className="px-4 py-4">
                        <p className="text-lg font-black text-slate-900">{stock}</p>
                        <p className={`mt-1 text-xs font-bold ${stock === 0 ? 'text-rose-600' : stock <= lowStockThreshold ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {stockLabel}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        <p>{Number(product.views || 0).toLocaleString()} views</p>
                        <p className="mt-1">{Number(product.wishlistCount || 0).toLocaleString()} wishlists</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone[product.approvalStatus || product.status || 'pending'] || statusTone.pending}`}>
                          {String(product.approvalStatus || product.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                          product.visibilityStatus === 'live' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.visibilityStatus === 'live' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {product.visibilityStatus || 'hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[280px] space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {HOMEPAGE_MERCHANDISING_TARGETS.map((target) => {
                              const isSelected = isProductSelectedForMerchandising(
                                getMerchandisingSelections(siteSettings, target.key),
                                product
                              );
                              const isSaving = savingTarget === `${target.key}:${String(product.id || product.slug || '')}`;
                              return (
                                <button
                                  key={target.key}
                                  type="button"
                                  disabled={!isEligibleForHomepage || Boolean(savingTarget)}
                                  onClick={() => void handleMerchandisingToggle(product, target.key)}
                                  title={target.description}
                                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                                    isSelected
                                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                                      : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700'
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {isSaving ? 'Saving...' : isSelected ? `${target.label} Added` : `Add to ${target.label}`}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {HOMEPAGE_MERCHANDISING_TARGETS.map((target) => {
                              const isSelected = isProductSelectedForMerchandising(
                                getMerchandisingSelections(siteSettings, target.key),
                                product
                              );
                              if (!isSelected) return null;

                              return (
                                <span
                                  key={`${product.id}-${target.key}-active`}
                                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700"
                                >
                                  <Star size={10} />
                                  {target.label}
                                </span>
                              );
                            })}
                            {!isEligibleForHomepage ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">
                                Needs live + approved + visible status
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                      No inventory rows found for this filter.
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

function mapProductToInventoryRow(product: any) {
  return {
    ...product,
    stock: Number(product?.stock || 0),
  };
}

function getMerchandisingSelections(settings: SiteSettings, target: HomepageMerchandisingTarget) {
  switch (target) {
    case 'campaign':
      return settings.homepage.campaignSection.featuredProductIds || [];
    case 'bestsellers':
      return settings.homepage.featuredSection.bestsellersProductIds || [];
    case 'bestchoice':
      return settings.homepage.featuredSection.bestchoiceProductIds || [];
    case 'onsale':
      return settings.homepage.featuredSection.onsaleProductIds || [];
    case 'mostpopular':
      return settings.homepage.mostPopularSection.featuredProductIds || [];
    default:
      return [];
  }
}

function applyMerchandisingSelections(
  settings: SiteSettings,
  target: HomepageMerchandisingTarget,
  selections: string[]
) {
  switch (target) {
    case 'campaign':
      return {
        ...settings,
        homepage: {
          ...settings.homepage,
          campaignSection: {
            ...settings.homepage.campaignSection,
            featuredProductIds: selections,
          },
        },
      };
    case 'bestsellers':
      return {
        ...settings,
        homepage: {
          ...settings.homepage,
          featuredSection: {
            ...settings.homepage.featuredSection,
            bestsellersProductIds: selections,
          },
        },
      };
    case 'bestchoice':
      return {
        ...settings,
        homepage: {
          ...settings.homepage,
          featuredSection: {
            ...settings.homepage.featuredSection,
            bestchoiceProductIds: selections,
          },
        },
      };
    case 'onsale':
      return {
        ...settings,
        homepage: {
          ...settings.homepage,
          featuredSection: {
            ...settings.homepage.featuredSection,
            onsaleProductIds: selections,
          },
        },
      };
    case 'mostpopular':
      return {
        ...settings,
        homepage: {
          ...settings.homepage,
          mostPopularSection: {
            ...settings.homepage.mostPopularSection,
            featuredProductIds: selections,
          },
        },
      };
    default:
      return settings;
  }
}

function getMerchandisingLabel(target: HomepageMerchandisingTarget) {
  return HOMEPAGE_MERCHANDISING_TARGETS.find((item) => item.key === target)?.label || 'homepage section';
}

function dispatchMerchandisingToast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('exshopi:toast', {
      detail: {
        type: 'success',
        message,
      },
    })
  );
}

function safeDate(value: any) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString('en-AE');
}
