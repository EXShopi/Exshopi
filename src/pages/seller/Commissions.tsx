import React, { useEffect, useMemo, useState } from 'react';
import { Percent, TrendingDown, Wallet } from 'lucide-react';
import { dashboardAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { formatAED } from '../../lib/currency';

export default function Commissions() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || user.uid || '');
        if (!seller?.id) return;
        const [dashboardData, analyticsData] = await Promise.all([
          dashboardAPI.getSellerDashboard(seller.id),
          dashboardAPI.getSellerAnalytics(seller.id),
        ]);
        setDashboard(dashboardData || null);
        setAnalytics(analyticsData || null);
      } catch (error) {
        console.error('Failed to load seller commissions:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const metrics = useMemo(() => {
    const grossSales = Number(dashboard?.totalSales || 0);
    const totalCommission = Number(dashboard?.totalCommission || 0);
    const payoutDue = Number(dashboard?.payoutDue || 0);
    const effectiveRate = grossSales > 0 ? (totalCommission / grossSales) * 100 : 6;
    return { grossSales, totalCommission, payoutDue, effectiveRate };
  }, [dashboard]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Commission Management</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Understand ExShopi’s marketplace deduction, how it impacts your payout, and where your net earnings stand right now.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            label: 'Effective Commission Rate',
            value: `${metrics.effectiveRate.toFixed(1)}%`,
            hint: 'Based on your live sales and current commission deductions',
            icon: Percent,
            tone: 'from-blue-500/15 to-violet-500/10 text-blue-700',
          },
          {
            label: 'Commission Deducted',
            value: formatAED(metrics.totalCommission / 100),
            hint: 'Total amount retained by ExShopi across your marketplace orders',
            icon: TrendingDown,
            tone: 'from-rose-500/15 to-amber-500/10 text-rose-700',
          },
          {
            label: 'Payout After Deductions',
            value: formatAED(metrics.payoutDue / 100),
            hint: 'Current net amount forecast before finance release',
            icon: Wallet,
            tone: 'from-emerald-500/15 to-teal-500/10 text-emerald-700',
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-[30px] border border-slate-200 bg-gradient-to-br ${item.tone} p-6 shadow-sm`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
              <item.icon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{loading ? '...' : item.value}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Commission Policy</h3>
          <div className="mt-5 space-y-4">
            {[
              'Standard marketplace commission is applied after successful order completion.',
              'Rejected, cancelled, or refunded orders can reduce net payout depending on final outcome.',
              'Your payouts page reflects deductions after commission and release review.',
              'Low-performing or rejected listings do not generate commission until they sell successfully.',
            ].map((point) => (
              <div key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Performance Context</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['Gross Sales', formatAED(metrics.grossSales / 100)],
              ['Total Orders', dashboard?.totalOrders ?? 0],
              ['Product Views', analytics?.metrics?.productViews ?? 0],
              ['Wishlist Adds', analytics?.metrics?.wishlistAdds ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-black text-slate-900">{loading ? '...' : value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
