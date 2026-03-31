import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Percent, Receipt, Wallet } from 'lucide-react';
import { adminOpsAPI, dashboardAPI, orderAPI, payoutRequestAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

export function AdminCommissions() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [dashboardData, marketplaceSettings, allOrders, requests] = await Promise.all([
          dashboardAPI.getAdminDashboard(),
          adminOpsAPI.getMarketplaceSettings(),
          orderAPI.getAllOrders(),
          payoutRequestAPI.getAllAdmin(),
        ]);
        setDashboard(dashboardData || null);
        setSettings(marketplaceSettings || null);
        setOrders(Array.isArray(allOrders) ? allOrders : []);
        setPayoutRequests(Array.isArray(requests) ? requests : []);
      } catch (error) {
        console.error('Failed to load commission overview:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const commissionRate = Number(settings?.commissionRate ?? 6);
    const grossSales = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0);
    const commissionEarned = orders.reduce(
      (sum, order) => sum + Number(order.commissionAmount || ((Number(order.totalAmount || order.total || 0) * commissionRate) / 100)),
      0
    );
    const vatCollected = orders.reduce((sum, order) => sum + Number(order.vatAmount || 0), 0);
    const pendingPayout = payoutRequests
      .filter((request) => request.status === 'pending' || request.status === 'approved')
      .reduce((sum, request) => sum + Number(request.amount || 0), 0);

    return {
      commissionRate,
      grossSales,
      commissionEarned,
      vatCollected,
      pendingPayout,
    };
  }, [orders, payoutRequests, settings]);

  const breakdown = [
    {
      label: 'Commission Rate',
      value: `${metrics.commissionRate}%`,
      hint: 'Default marketplace deduction on delivered seller orders',
      icon: Percent,
      tone: 'from-violet-500/15 to-fuchsia-500/10 text-violet-700',
    },
    {
      label: 'Commission Earned',
      value: formatAED(metrics.commissionEarned),
      hint: 'Platform commission currently generated across marketplace orders',
      icon: Wallet,
      tone: 'from-emerald-500/15 to-green-500/10 text-emerald-700',
    },
    {
      label: 'VAT Summary',
      value: formatAED(metrics.vatCollected),
      hint: 'Tracked VAT across current order ledger',
      icon: Receipt,
      tone: 'from-amber-500/15 to-orange-500/10 text-amber-700',
    },
    {
      label: 'Pending Payout Liability',
      value: formatAED(metrics.pendingPayout),
      hint: 'Approved and pending seller payout requests awaiting release',
      icon: Banknote,
      tone: 'from-sky-500/15 to-cyan-500/10 text-sky-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Marketplace Commissions</h2>
        <p className="max-w-3xl text-sm font-medium text-slate-500">
          Monitor ExShopi commission performance, VAT totals, and seller payout exposure from one premium finance view.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${item.tone} p-6 shadow-sm`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
              <item.icon size={22} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{loading ? '...' : item.value}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">Commission Policy Snapshot</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                UAE-first defaults configured from marketplace settings and current finance activity.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Gross Sales</p>
              <p className="mt-1 text-xl font-black">{formatAED(metrics.grossSales)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['Monthly Seller Fee', formatAED(Number(settings?.monthlyFee ?? 99))],
              ['UAE Delivery Base', formatAED(Number(settings?.countryRules?.UAE?.deliveryBase ?? 10))],
              ['GCC Delivery Base', formatAED(Number(settings?.countryRules?.SaudiArabia?.deliveryBase ?? 100))],
              ['Default Country', settings?.defaultCountry || 'UAE'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-black text-slate-900">{loading ? '...' : value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Live Marketplace Signals</h3>
          <div className="mt-5 space-y-4">
            {[
              ['Delivered Orders', dashboard?.metrics?.deliveredOrders ?? 0],
              ['Pending Payout Requests', payoutRequests.filter((request) => request.status === 'pending').length],
              ['Approved Sellers', dashboard?.metrics?.activeSellers ?? 0],
              ['Refund Requests', dashboard?.metrics?.returnRequests ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-bold text-slate-600">{label}</span>
                <span className="text-lg font-black text-slate-900">{loading ? '...' : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
