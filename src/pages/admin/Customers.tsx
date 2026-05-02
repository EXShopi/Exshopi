import React, { useEffect, useMemo, useState } from 'react';
import { customerAPI } from '../../services/api';
import { Search, User, Heart, Activity, Sparkles, ShieldCheck, TrendingUp, RotateCcw, MapPin, Trash2 } from 'lucide-react';
import { formatAED } from '../../lib/currency';
import { TableSkeleton } from '../../components/ui/TableSkeleton';
import AdminDangerConfirmModal from '../../components/admin/AdminDangerConfirmModal';

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  createdAt: string;
  lastLoginAt?: string | null;
  ordersCount: number;
  totalSpent: number;
  wishlistAdds: number;
  productViews: number;
  searches: number;
  returnRequests: number;
  status: string;
};

const formatDateSafe = (value?: string | null) => {
  if (!value) return 'No recent login';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'No recent login' : parsed.toLocaleDateString('en-AE');
};

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    customerAPI
      .getAllAdmin()
      .then((data) => {
        const nextCustomers = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.customers)
          ? (data as any).customers
          : [];
        if (mounted) setCustomers(nextCustomers);
      })
      .catch((error) => {
        console.error('Error loading customers:', error);
        if (mounted) setLoadError('Customer intelligence is temporarily unavailable. You can still review accounts once data sync resumes.');
        if (mounted) setCustomers([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.country]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [customers, search]);

  const summary = useMemo(() => {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((customer) => customer.lastLoginAt).length,
      totalSpent: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
      totalWishlistAdds: customers.reduce((sum, customer) => sum + customer.wishlistAdds, 0),
      totalViews: customers.reduce((sum, customer) => sum + customer.productViews, 0),
      repeatSignals: customers.filter((customer) => customer.ordersCount >= 2).length,
    };
  }, [customers]);

  const emitToast = (type: 'success' | 'error', message: string) => {
    window.dispatchEvent(new CustomEvent('exshopi:toast', { detail: { type, message } }));
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await customerAPI.delete(deleteTarget.id);
      setCustomers((prev) => prev.filter((customer) => customer.id !== deleteTarget.id));
      window.dispatchEvent(new CustomEvent('exshopi:customer-updated', { detail: { id: deleteTarget.id, action: 'deleted' } }));
      emitToast('success', 'Customer deleted successfully.');
      setDeleteTarget(null);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      emitToast('error', error?.message || 'Unable to delete customer right now.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#38bdf8] p-8 text-white shadow-2xl shadow-blue-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
              <Sparkles size={14} />
              Customer Intelligence
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-tight">Customer Management Center</h2>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Track engagement, spending, retention, wishlist activity, and return behavior across the ExShopi marketplace with a premium UAE-first admin view.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Product Views', summary.totalViews, Activity, 'bg-blue-50 text-blue-600'],
            ['Repeat Buyers', summary.repeatSignals, ShieldCheck, 'bg-emerald-50 text-emerald-600'],
            ['Wishlist Adds', summary.totalWishlistAdds, Heart, 'bg-rose-50 text-rose-600'],
            ['Customer Spend', formatAED(summary.totalSpent), TrendingUp, 'bg-violet-50 text-violet-600'],
          ].map(([label, value, Icon, tone]: any) => (
            <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-4 inline-flex rounded-2xl p-3 ${tone}`}>
                <Icon size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Management</h2>
          <p className="text-slate-500 font-medium">View customer engagement, spending, search activity, and return behavior.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Customers</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{summary.totalCustomers}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Active Logins</p>
          <p className="mt-3 text-3xl font-black text-emerald-600">{summary.activeCustomers}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Spend</p>
          <p className="mt-3 text-3xl font-black text-violet-600">{formatAED(summary.totalSpent)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Wishlist Adds</p>
          <p className="mt-3 text-3xl font-black text-rose-600">{summary.totalWishlistAdds}</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : loadError ? (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-10 shadow-sm">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
              <Sparkles className="h-4 w-4" />
              Customer Data Sync
            </div>
            <h3 className="mt-5 text-2xl font-black text-slate-900">Customer workspace is loading marketplace data</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{loadError}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">What this page shows</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Customer spend, engagement, wishlist behavior, repeat buyers, and return signals.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Suggested action</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Refresh after the backend sync stabilizes or verify admin session access.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Orders & Spend</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Returns</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Login</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{customer.name}</p>
                          <p className="text-sm font-medium text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1 text-sm">
                        <p className="font-bold text-slate-900">{customer.ordersCount} orders</p>
                        <p className="font-semibold text-violet-600">{formatAED(customer.totalSpent)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="rounded-2xl bg-slate-50 p-3 text-center">
                          <Heart className="mx-auto mb-1 h-4 w-4 text-rose-500" />
                          <p className="font-black text-slate-900">{customer.wishlistAdds}</p>
                          <p className="font-medium text-slate-400">Wishlist</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-center">
                          <Activity className="mx-auto mb-1 h-4 w-4 text-blue-500" />
                          <p className="font-black text-slate-900">{customer.productViews}</p>
                          <p className="font-medium text-slate-400">Views</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-center">
                          <Search className="mx-auto mb-1 h-4 w-4 text-amber-500" />
                          <p className="font-black text-slate-900">{customer.searches}</p>
                          <p className="font-medium text-slate-400">Searches</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">
                        <RotateCcw className="h-4 w-4" />
                        {customer.returnRequests}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1 text-sm">
                        <p className="font-bold text-slate-900">{formatDateSafe(customer.lastLoginAt)}</p>
                        <p className="font-medium text-slate-500 inline-flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {customer.country || 'AE'} • {customer.status}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(customer)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminDangerConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Customer"
        itemLabel={deleteTarget ? `${deleteTarget.name} • ${deleteTarget.email}` : ''}
        message="Are you sure you want to delete this customer? This action cannot be undone. Existing order history will be preserved, and the account will be soft-deleted from active customer lists."
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCustomer}
      />
    </div>
  );
}
