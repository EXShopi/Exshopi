import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquareMore,
  Phone,
  Search,
  Store,
  Trash2,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { adminSellerApplicationAPI, sellerAPI } from '../../services/api';
import AdminDangerConfirmModal from '../../components/admin/AdminDangerConfirmModal';

type SellerApplicationRow = {
  id: string;
  userId: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  commissionRate?: number;
  monthlyFeeAed?: number;
  seller?: any;
  user?: any;
  businessAddress?: string;
  documents: string[];
};

type SellerRow = {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  ownerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  status: string;
  createdAt: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  commissionRate?: number;
  monthlyFeeAed?: number;
  internalNotes?: string;
};

const formatDateSafe = (value?: string, fallback = 'Not available') => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString('en-AE');
};

const normalizeApplication = (row: any): SellerApplicationRow => ({
  id: String(row?.id || ''),
  userId: String(row?.userId || row?.user?.id || ''),
  ownerName: String(row?.ownerName || row?.user?.name || row?.user?.fullName || 'Seller applicant'),
  businessName: String(row?.businessName || row?.seller?.storeName || 'New seller application'),
  email: String(row?.businessEmail || row?.user?.email || ''),
  phone: String(row?.phone || row?.user?.phone || ''),
  country: String(row?.country || row?.user?.country || 'AE'),
  city: String(row?.city || ''),
  status: String(row?.status || 'pending_review'),
  submittedAt: String(row?.submittedAt || row?.createdAt || ''),
  reviewedAt: String(row?.reviewedAt || ''),
  adminNotes: String(row?.adminNotes || ''),
  rejectionReason: String(row?.rejectionReason || ''),
  commissionRate: Number(row?.commissionRate || 0),
  monthlyFeeAed: Number(row?.monthlyFeeAed || 0),
  seller: row?.seller || null,
  user: row?.user || null,
  businessAddress: String(row?.businessAddress || ''),
  documents: Array.isArray(row?.documents)
    ? row.documents
        .map((doc: any) => String(doc?.url || doc?.name || doc || '').trim())
        .filter(Boolean)
    : [],
});

const normalizeSeller = (row: any): SellerRow => ({
  id: String(row?.id || ''),
  userId: String(row?.userId || ''),
  storeName: String(row?.storeName || row?.businessName || 'ExShopi Seller'),
  storeSlug: String(row?.storeSlug || ''),
  ownerName: String(row?.ownerName || row?.fullName || row?.name || 'Seller owner'),
  email: String(row?.businessEmail || row?.email || ''),
  phone: String(row?.phone || ''),
  country: String(row?.country || 'AE'),
  city: String(row?.city || ''),
  status: String(row?.status || 'approved'),
  createdAt: String(row?.createdAt || ''),
  totalProducts: Number(row?.totalProducts || 0),
  totalOrders: Number(row?.totalOrders || 0),
  totalRevenue: Number(row?.totalRevenue || 0),
  commissionRate: Number(row?.commissionRate || 0),
  monthlyFeeAed: Number(row?.monthlyFeeAed || 0),
  internalNotes: String(row?.internalNotes || ''),
});

const statusTone = (status: string) => {
  switch (status) {
    case 'approved':
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
    case 'suspended':
      return 'bg-rose-100 text-rose-700';
    case 'needs_more_info':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

export function AdminVendors() {
  const [applications, setApplications] = useState<SellerApplicationRow[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'sellers'>('applications');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<SellerApplicationRow | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerRow | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SellerRow | null>(null);

  const loadVendorOps = async () => {
    setLoading(true);
    try {
      const [applicationRows, sellerRows] = await Promise.all([
        adminSellerApplicationAPI.getAll(),
        sellerAPI.getAll(),
      ]);

      setApplications(
        (Array.isArray(applicationRows) ? applicationRows : [])
          .map(normalizeApplication)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      );
      setSellers(
        (Array.isArray(sellerRows) ? sellerRows : [])
          .map(normalizeSeller)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch (error) {
      console.error('Failed to load vendor operations data:', error);
      setApplications([]);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorOps();
  }, []);

  useEffect(() => {
    if (selectedApplication) {
      setAdminNoteDraft(selectedApplication.adminNotes || '');
      return;
    }
    if (selectedSeller) {
      setAdminNoteDraft(selectedSeller.internalNotes || '');
      return;
    }
    setAdminNoteDraft('');
  }, [selectedApplication, selectedSeller]);

  const applicationSummary = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((item) => ['pending_review', 'needs_more_info'].includes(item.status)).length,
      approved: applications.filter((item) => item.status === 'approved').length,
      rejected: applications.filter((item) => item.status === 'rejected').length,
    }),
    [applications]
  );

  const sellerSummary = useMemo(
    () => ({
      total: sellers.length,
      active: sellers.filter((item) => item.status === 'approved' || item.status === 'active').length,
      suspended: sellers.filter((item) => item.status === 'suspended').length,
      products: sellers.reduce((sum, item) => sum + item.totalProducts, 0),
    }),
    [sellers]
  );

  const filteredApplications = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
      const matchesSearch =
        !needle ||
        [
          application.ownerName,
          application.businessName,
          application.email,
          application.phone,
          application.country,
          application.city,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const filteredSellers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sellers.filter((seller) => {
      const matchesStatus = statusFilter === 'all' || seller.status === statusFilter;
      const matchesSearch =
        !needle ||
        [
          seller.storeName,
          seller.ownerName,
          seller.email,
          seller.phone,
          seller.country,
          seller.city,
          seller.storeSlug,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [search, sellers, statusFilter]);

  const handleApplicationAction = async (
    applicationId: string,
    action: 'approve' | 'reject' | 'request',
    note: string
  ) => {
    setActionLoading(`${action}:${applicationId}`);
    try {
      if (action === 'approve') {
        await adminSellerApplicationAPI.approve(applicationId, note);
      } else if (action === 'reject') {
        await adminSellerApplicationAPI.reject(applicationId, note || 'Application rejected');
      } else {
        await adminSellerApplicationAPI.requestInfo(
          applicationId,
          note || 'Please review the requested compliance fields and update your application.'
        );
      }
      await loadVendorOps();
      setSelectedApplication(null);
    } catch (error) {
      console.error(`Failed to ${action} seller application:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSellerNoteSave = async (sellerId: string) => {
    setActionLoading(`note:${sellerId}`);
    try {
      await sellerAPI.update(sellerId, { internalNotes: adminNoteDraft });
      await loadVendorOps();
      setSelectedSeller(null);
    } catch (error) {
      console.error('Failed to save seller internal note:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const emitToast = (type: 'success' | 'error', message: string) => {
    window.dispatchEvent(new CustomEvent('exshopi:toast', { detail: { type, message } }));
  };

  const handleDeleteSeller = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete:${deleteTarget.id}`);
    try {
      await sellerAPI.delete(deleteTarget.id);
      await loadVendorOps();
      window.dispatchEvent(new CustomEvent('exshopi:vendor-updated', { detail: { id: deleteTarget.id, action: 'deleted' } }));
      emitToast('success', 'Vendor deleted successfully.');
      setSelectedSeller(null);
      setDeleteTarget(null);
    } catch (error: any) {
      console.error('Failed to delete vendor:', error);
      emitToast('error', error?.message || 'Unable to delete vendor right now.');
    } finally {
      setActionLoading(null);
    }
  };

  const activeRows = activeTab === 'applications' ? filteredApplications : filteredSellers;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#081324] via-[#1d4ed8] to-[#38bdf8] p-8 text-white shadow-2xl shadow-blue-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
              <Store size={14} />
              Vendor Operations
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Seller onboarding and vendor health</h1>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Review real seller applications, approve or reject onboarding, and audit live vendor accounts without leaving the admin workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Pending applications', applicationSummary.pending, Clock3],
            ['Approved vendors', sellerSummary.active, CheckCircle2],
            ['Rejected applications', applicationSummary.rejected, XCircle],
            ['Live catalog owners', sellerSummary.products, Building2],
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Vendor control center</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Applications come from real seller onboarding. Approved stores are shown from the live seller database.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex gap-2">
              {[
                ['applications', `Applications (${applicationSummary.total})`],
                ['sellers', `Vendors (${sellerSummary.total})`],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab as 'applications' | 'sellers');
                    setSelectedApplication(null);
                    setSelectedSeller(null);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                    activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeTab === 'applications' ? 'Search applications...' : 'Search vendors...'}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:w-72"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="needs_more_info">Needs info</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Loading vendor operations</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-4 py-4">{activeTab === 'applications' ? 'Seller application' : 'Vendor'}</th>
                      <th className="px-4 py-4">Contact</th>
                      <th className="px-4 py-4">{activeTab === 'applications' ? 'Submission' : 'Store metrics'}</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeRows.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-4 align-top">
                          <p className="font-black text-slate-900">
                            {activeTab === 'applications' ? row.businessName : row.storeName}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {activeTab === 'applications' ? row.ownerName : row.ownerName}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {activeTab === 'applications' ? `Application ${row.id}` : `Seller ${row.id}`}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              <span className="font-medium">{row.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-slate-400" />
                              <span className="font-medium">{row.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-slate-400" />
                              <span className="font-medium">
                                {[row.city, row.country].filter(Boolean).join(', ') || 'UAE'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {activeTab === 'applications' ? (
                            <div className="space-y-2 text-sm text-slate-600">
                              <p className="font-semibold text-slate-900">{formatDateSafe(row.submittedAt)}</p>
                              <p>Documents: <span className="font-black text-slate-900">{row.documents.length}</span></p>
                              <p>Commission: <span className="font-black text-slate-900">{row.commissionRate || 0}%</span></p>
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm text-slate-600">
                              <p>Products: <span className="font-black text-slate-900">{row.totalProducts}</span></p>
                              <p>Orders: <span className="font-black text-slate-900">{row.totalOrders}</span></p>
                              <p>Created: <span className="font-black text-slate-900">{formatDateSafe(row.createdAt)}</span></p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(row.status)}`}>
                            {String(row.status).replace(/_/g, ' ')}
                          </span>
                          {activeTab === 'applications' && row.rejectionReason ? (
                            <p className="mt-2 text-xs font-medium text-rose-600">{row.rejectionReason}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex min-w-[140px] flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (activeTab === 'applications') {
                                  setSelectedSeller(null);
                                  setSelectedApplication(row);
                                } else {
                                  setSelectedApplication(null);
                                  setSelectedSeller(row);
                                }
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-slate-700"
                            >
                              Review
                            </button>
                            {activeTab === 'sellers' && row.storeSlug ? (
                              <Link
                                to={`/vendor/${row.storeSlug}`}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-xs font-black uppercase tracking-[0.18em] text-white"
                              >
                                Storefront
                              </Link>
                            ) : null}
                            {activeTab === 'sellers' ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {activeRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <Store className="mx-auto h-10 w-10 text-slate-300" />
                          <p className="mt-4 text-lg font-black text-slate-900">
                            {activeTab === 'applications' ? 'No seller applications in this view' : 'No vendor records in this view'}
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-500">
                            {activeTab === 'applications'
                              ? 'New seller applications will appear here automatically when merchants apply.'
                              : 'Approved sellers will appear here once onboarding is completed.'}
                          </p>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              {selectedApplication ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Application review</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{selectedApplication.businessName}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Submitted by {selectedApplication.ownerName} on {formatDateSafe(selectedApplication.submittedAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedApplication.email || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedApplication.phone || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Country</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedApplication.country || 'AE'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedApplication.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Business address</p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      {selectedApplication.businessAddress || 'No business address was submitted.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Admin note / review note</p>
                    </div>
                    <textarea
                      value={adminNoteDraft}
                      onChange={(event) => setAdminNoteDraft(event.target.value)}
                      rows={5}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Add approval notes, rejection reason, or request-for-info guidance."
                    />
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => handleApplicationAction(selectedApplication.id, 'approve', adminNoteDraft)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {actionLoading === `approve:${selectedApplication.id}` ? 'Approving...' : 'Approve vendor'}
                    </button>
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => handleApplicationAction(selectedApplication.id, 'request', adminNoteDraft)}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {actionLoading === `request:${selectedApplication.id}` ? 'Saving...' : 'Request more info'}
                    </button>
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => handleApplicationAction(selectedApplication.id, 'reject', adminNoteDraft)}
                      className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {actionLoading === `reject:${selectedApplication.id}` ? 'Rejecting...' : 'Reject vendor'}
                    </button>
                  </div>

                  {selectedApplication.seller?.storeSlug ? (
                    <Link
                      to={`/vendor/${selectedApplication.seller.storeSlug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"
                    >
                      View linked storefront
                      <ExternalLink size={14} />
                    </Link>
                  ) : null}
                </div>
              ) : selectedSeller ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Vendor profile</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{selectedSeller.storeName}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Owned by {selectedSeller.ownerName} • Joined {formatDateSafe(selectedSeller.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedSeller.email || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedSeller.phone || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Products</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedSeller.totalProducts}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Orders</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{selectedSeller.totalOrders}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquareMore size={16} className="text-slate-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Internal admin note</p>
                    </div>
                    <textarea
                      value={adminNoteDraft}
                      onChange={(event) => setAdminNoteDraft(event.target.value)}
                      rows={5}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Record internal vendor operations notes for future audits."
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => handleSellerNoteSave(selectedSeller.id)}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    {actionLoading === `note:${selectedSeller.id}` ? 'Saving note...' : 'Save internal note'}
                  </button>

                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => setDeleteTarget(selectedSeller)}
                    className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    {actionLoading === `delete:${selectedSeller.id}` ? 'Deleting vendor...' : 'Delete vendor'}
                  </button>

                  {selectedSeller.storeSlug ? (
                    <Link
                      to={`/vendor/${selectedSeller.storeSlug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"
                    >
                      View storefront details
                      <ExternalLink size={14} />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                  <UserCircle2 className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-lg font-black text-slate-900">Select a vendor row</p>
                  <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                    Review seller applications, approve or reject onboarding, add notes, and open storefront details from this panel.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      <AdminDangerConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Vendor"
        itemLabel={deleteTarget ? `${deleteTarget.storeName} • ${deleteTarget.ownerName}` : ''}
        message="Are you sure you want to delete this vendor? This action cannot be undone. Active vendor orders will block deletion, and vendor products will be hidden safely."
        loading={Boolean(deleteTarget && actionLoading === `delete:${deleteTarget.id}`)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSeller}
      />
    </div>
  );
}
