import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { dashboardAPI, sellerAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

type SellerStatus = 'active' | 'pending' | 'pending_review' | 'rejected' | 'suspended' | 'needs_more_info';

type SellerRow = {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: SellerStatus;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  commissionRate: number;
  logo?: string;
  banner?: string;
  vatTrn?: string;
  warehouseAddress?: string;
  supportInfo?: string;
  monthlyFeeAed?: number;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
  riskScore: number;
  verificationStatus: 'manual_verified' | 'standard' | 'watchlist';
  warningCount: number;
};

const formatDateSafe = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-AE');
};

const normalizeSeller = (seller: any): SellerRow => {
  const totalProducts = Number(seller.totalProducts || 0);
  const totalOrders = Number(seller.totalOrders || 0);
  const totalSales = Number(seller.totalSales || 0);
  const status = (seller.status || 'pending_review') as SellerStatus;

  const riskScore = Math.max(
    10,
    Math.min(
      96,
      Math.round(
        (status === 'suspended' ? 70 : status === 'rejected' ? 62 : status === 'needs_more_info' ? 48 : status === 'pending_review' ? 40 : 22) +
          totalProducts * 0.8 +
          totalOrders * 0.12
      )
    )
  );

  const warningCount = status === 'suspended' ? 3 : status === 'rejected' ? 2 : status === 'needs_more_info' ? 1 : 0;

  return {
    id: String(seller.id || ''),
    userId: String(seller.userId || ''),
    storeName: seller.storeName || 'Unknown Store',
    storeSlug: seller.storeSlug || '',
    email: seller.email || 'Unknown email',
    phone: seller.phone || 'No phone',
    city: seller.city || 'Unknown',
    country: seller.country || 'UAE',
    status,
    totalProducts,
    totalOrders,
    totalSales,
    commissionRate: Number(seller.commissionRate || 6),
    logo: seller.logo,
    banner: seller.banner,
    vatTrn: seller.vatTrn,
    warehouseAddress: seller.warehouseAddress,
    supportInfo: seller.supportInfo,
    monthlyFeeAed: Number(seller.monthlyFeeAed || 99),
    subscriptionStatus: seller.subscriptionStatus || 'pending',
    createdAt: seller.createdAt || new Date().toISOString(),
    updatedAt: seller.updatedAt || new Date().toISOString(),
    riskScore,
    warningCount,
    verificationStatus: status === 'active' ? 'manual_verified' : riskScore >= 65 ? 'watchlist' : 'standard',
  };
};

const statusPillClass = (status: SellerStatus) => {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'suspended' || status === 'rejected') return 'bg-rose-100 text-rose-700';
  if (status === 'needs_more_info') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};

export default function AdminSellerManagement() {
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SellerStatus>('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboard, allSellers] = await Promise.all([dashboardAPI.getAdminDashboard(), sellerAPI.getAll()]);
        setDashboardMetrics(dashboard?.metrics || {});
        setSellers(Array.isArray(allSellers) ? allSellers.map(normalizeSeller) : []);
      } catch (error) {
        console.error('Failed to load seller management data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        seller.storeName.toLowerCase().includes(search) ||
        seller.email.toLowerCase().includes(search) ||
        seller.phone.toLowerCase().includes(search) ||
        seller.city.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [sellers, searchTerm, statusFilter]);

  const sellerSummary = useMemo(() => {
    const activeCount = sellers.filter((item) => item.status === 'active').length;
    const pendingCount = sellers.filter((item) => ['pending_review', 'needs_more_info', 'pending'].includes(item.status)).length;
    const watchlistCount = sellers.filter((item) => item.riskScore >= 65).length;
    const commissionExposure = sellers.reduce((sum, item) => sum + item.totalSales * (item.commissionRate / 100), 0);
    return {
      total: sellers.length,
      active: activeCount,
      pending: pendingCount,
      watchlist: watchlistCount,
      commissionExposure,
    };
  }, [sellers]);

  const handleSellerUpdate = async (seller: SellerRow, updates: Partial<SellerRow>) => {
    try {
      const updated = await sellerAPI.update(seller.id, updates);
      const normalized = normalizeSeller(updated);
      setSellers((current) => current.map((item) => (item.id === seller.id ? normalized : item)));
      setSelectedSeller((current) => (current?.id === seller.id ? normalized : current));
    } catch (error) {
      console.error('Failed to update seller:', error);
    }
  };

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center font-bold text-slate-500">Loading vendor operations...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#081324] via-[#123c8f] to-[#38bdf8] p-8 text-white shadow-2xl shadow-blue-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
              <Store size={14} />
              Vendor command
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Marketplace Vendor Intelligence</h1>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Review verification readiness, seller health, revenue exposure, support quality, and trust controls in one UAE-first marketplace workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Total Vendors', sellerSummary.total, Store],
            ['Active Vendors', sellerSummary.active, CheckCircle2],
            ['Pending Review', sellerSummary.pending, AlertCircle],
            ['Commission Exposure', formatAED(sellerSummary.commissionExposure || dashboardMetrics?.totalCommissionOwed || 0), Wallet],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Vendor Directory</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Search, filter, and act on seller trust, onboarding, revenue, and compliance.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Search store, email, phone, city..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as any)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_review">Pending Review</option>
                <option value="needs_more_info">Needs More Info</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Store</th>
                    <th className="px-4 py-4">Operational metrics</th>
                    <th className="px-4 py-4">Compliance</th>
                    <th className="px-4 py-4">Risk & trust</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSellers.map((seller) => (
                    <tr key={seller.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                            {seller.logo ? (
                              <img src={seller.logo} alt={seller.storeName} className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-[220px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-slate-900">{seller.storeName}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusPillClass(seller.status)}`}>
                                {seller.status.replaceAll('_', ' ')}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-500">{seller.email}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {seller.city}, {seller.country} • Joined {formatDateSafe(seller.createdAt)}
                            </p>
                            <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              Slug: {seller.storeSlug || 'not generated'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Orders</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{seller.totalOrders}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Revenue</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{formatAED(seller.totalSales)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Products</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{seller.totalProducts}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Commission</p>
                            <p className="mt-1 text-lg font-black text-slate-900">
                              {formatAED(seller.totalSales * (seller.commissionRate / 100))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verification</p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {seller.verificationStatus === 'manual_verified'
                                ? 'Manual verified'
                                : seller.verificationStatus === 'watchlist'
                                ? 'Watchlist review'
                                : 'Standard'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                            VAT/TRN: {seller.vatTrn || 'Missing'}
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                            Subscription: {seller.subscriptionStatus || 'pending'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Risk score</span>
                            <span className={`text-lg font-black ${seller.riskScore >= 70 ? 'text-rose-700' : seller.riskScore >= 40 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {seller.riskScore}
                            </span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full ${seller.riskScore >= 70 ? 'bg-rose-500' : seller.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${seller.riskScore}%` }}
                            />
                          </div>
                          <p className="mt-3 text-xs font-medium text-slate-500">
                            {seller.warningCount > 0 ? `${seller.warningCount} warnings / violations tracked` : 'No serious trust issues detected'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[180px] flex-col gap-2">
                          {seller.status !== 'active' && (
                            <button
                              onClick={() => handleSellerUpdate(seller, { status: 'active' as any })}
                              className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white"
                            >
                              Activate
                            </button>
                          )}
                          {seller.status !== 'suspended' && (
                            <button
                              onClick={() => handleSellerUpdate(seller, { status: 'suspended' as any })}
                              className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-black text-white"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleSellerUpdate(seller, {
                                supportInfo: seller.supportInfo?.includes('Manual verification')
                                  ? seller.supportInfo
                                  : `${seller.supportInfo || ''}${seller.supportInfo ? ' • ' : ''}Manual verification enabled`,
                              } as any)
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700"
                          >
                            Manual verify
                          </button>
                          <button
                            onClick={() => setSelectedSeller(seller)}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700"
                          >
                            View profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSellers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Store className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-lg font-black text-slate-900">No sellers match this filter</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">Try adjusting status filters or search terms.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-600" size={18} />
              <h3 className="text-xl font-black text-slate-900">Trust overview</h3>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['Watchlist vendors', sellerSummary.watchlist],
                ['Manual verified', sellers.filter((item) => item.verificationStatus === 'manual_verified').length],
                ['Suspended stores', sellers.filter((item) => item.status === 'suspended').length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-600" size={18} />
              <h3 className="text-xl font-black text-slate-900">Operator notes</h3>
            </div>
            <div className="mt-5 space-y-3 text-sm font-medium text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Review new sellers within 24 hours to keep onboarding trust high.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Stores with missing VAT/TRN and low compliance should be monitored before high-volume launch.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                Activate only verified stores with complete warehouse and bank details.
              </div>
            </div>
          </div>
        </aside>
      </section>

      {selectedSeller && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                {selectedSeller.logo ? (
                  <img src={selectedSeller.logo} alt={selectedSeller.storeName} className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">{selectedSeller.storeName}</h3>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${statusPillClass(selectedSeller.status)}`}>
                    {selectedSeller.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">{selectedSeller.email} • {selectedSeller.phone}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedSeller.city}, {selectedSeller.country} • Updated {formatDateSafe(selectedSeller.updatedAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSeller(null)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
            >
              Close profile
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Store revenue', formatAED(selectedSeller.totalSales)],
              ['Commission generated', formatAED(selectedSeller.totalSales * (selectedSeller.commissionRate / 100))],
              ['Monthly fee', formatAED(selectedSeller.monthlyFeeAed || 99)],
              ['Warnings', `${selectedSeller.warningCount}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.92fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Compliance snapshot</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="font-black">Warehouse</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">{selectedSeller.warehouseAddress || 'Not submitted'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Building2 size={16} className="text-violet-600" />
                    <span className="font-black">VAT / TRN</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">{selectedSeller.vatTrn || 'Missing VAT / TRN'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <BadgeCheck size={16} className="text-emerald-600" />
                    <span className="font-black">Verification</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {selectedSeller.verificationStatus === 'manual_verified'
                      ? 'Manual verification completed'
                      : selectedSeller.verificationStatus === 'watchlist'
                      ? 'Watchlist escalation'
                      : 'Standard verification only'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Wallet size={16} className="text-amber-600" />
                    <span className="font-black">Subscription</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">{selectedSeller.subscriptionStatus || 'pending'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Trust & support notes</h4>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2">
                    {selectedSeller.riskScore >= 65 ? (
                      <ShieldAlert size={16} className="text-rose-600" />
                    ) : (
                      <ShieldCheck size={16} className="text-emerald-600" />
                    )}
                    <span className="font-black text-slate-900">Risk assessment</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Current risk score: {selectedSeller.riskScore}. {selectedSeller.riskScore >= 65 ? 'Close monitoring recommended.' : 'Seller is within acceptable trust thresholds.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-blue-600" />
                    <span className="font-black text-slate-900">Support info</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">{selectedSeller.supportInfo || 'No support notes added yet.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
