import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  RefreshCcw,
  Search,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom';

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

function formatMetricNumber(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0';
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
  if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
  return numeric.toFixed(0);
}

function formatPercent(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return '0%';
  return `${numeric.toFixed(1)}%`;
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}

function TableCard({
  title,
  subtitle,
  columns,
  rows,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
      {rows.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {columns.map((column) => (
                  <th key={column} className="pb-3">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${rowIndex}-${cellIndex}`} className="py-4 text-sm font-semibold text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState message={emptyMessage} />
        </div>
      )}
    </div>
  );
}

export function AdminReports() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingRealtime, setRefreshingRealtime] = useState(false);
  const [range, setRange] = useState<RangeKey>('30d');
  const [customFrom, setCustomFrom] = useState(formatDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [customTo, setCustomTo] = useState(formatDateInput(new Date()));

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async (mode: 'initial' | 'realtime' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshingRealtime(true);
        }

        const data = await dashboardAPI.getAdminAnalytics({
          range,
          from: range === 'custom' ? customFrom : undefined,
          to: range === 'custom' ? customTo : undefined,
        });

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to load admin analytics', error);
        if (!cancelled) {
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshingRealtime(false);
        }
      }
    };

    loadAnalytics('initial');

    const interval = window.setInterval(() => {
      loadAnalytics('realtime');
    }, 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [range, customFrom, customTo]);

  const summaryCards = analytics?.summaryCards || {};
  const storeOps = analytics?.storeOperations || {};

  const statCards = [
    {
      label: 'Total Orders',
      value: formatMetricNumber(summaryCards.totalOrders),
      helper: 'Internal marketplace orders',
      icon: Users,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Orders Today',
      value: formatMetricNumber(summaryCards.ordersToday),
      helper: 'Orders placed today',
      icon: ShoppingBag,
      color: 'text-violet-700 bg-violet-50',
    },
    {
      label: 'Customers',
      value: formatMetricNumber(summaryCards.totalUsers),
      helper: 'Internal user count',
      icon: Users,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Sellers',
      value: formatMetricNumber(summaryCards.totalSellers),
      helper: 'Active seller count',
      icon: Store,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Products',
      value: formatMetricNumber(summaryCards.totalProducts),
      helper: 'Catalog items in range',
      icon: ShoppingBag,
      color: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Revenue Today',
      value: formatAED(summaryCards.revenueToday || 0),
      helper: 'Internal order revenue',
      icon: Store,
      color: 'text-cyan-700 bg-cyan-50',
    },
    {
      label: 'Revenue This Month',
      value: formatAED(summaryCards.revenueThisMonth || 0),
      helper: 'Current month turnover',
      icon: ShoppingBag,
      color: 'text-rose-700 bg-rose-50',
    },
    {
      label: 'Searches',
      value: formatMetricNumber(analytics?.totalSearches || 0),
      helper: 'Internal site searches',
      icon: Search,
      color: 'text-indigo-700 bg-indigo-50',
    },
  ];

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center font-bold text-slate-500">
        Loading premium analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Analytics & Operations</h2>
          <p className="text-slate-500 font-medium">
            Live ExShopi marketplace operations in one control layer, powered entirely by internal platform metrics.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                  range === option.value
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {range === 'custom' ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500"
              />
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500"
              />
            </div>
          ) : null}
          <button
            onClick={() => {
              setRefreshingRealtime(true);
              dashboardAPI
                .getAdminAnalytics({
                  range,
                  from: range === 'custom' ? customFrom : undefined,
                  to: range === 'custom' ? customTo : undefined,
                })
                .then((data) => setAnalytics(data))
                .catch((error) => console.error('Failed to refresh admin analytics', error))
                .finally(() => setRefreshingRealtime(false));
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshingRealtime ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm">
        <div className="flex items-start gap-3">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <p className="font-black uppercase tracking-[0.18em] text-[11px] text-slate-500">Advanced Analytics</p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Advanced analytics coming soon.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Store Operations</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Real order and payout workload from ExShopi data.</p>
          {(storeOps?.orderStatusBreakdown || []).length ? (
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeOps.orderStatusBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState message="Operational analytics will populate here when marketplace orders are available." />
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payout Due</p>
              <p className="mt-2 text-lg font-black text-slate-900">{formatAED(storeOps?.payoutSummary?.payoutDue || 0)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Requests</p>
              <p className="mt-2 text-lg font-black text-slate-900">{formatMetricNumber(storeOps?.payoutSummary?.pendingRequests || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableCard
          title="Top Selling Products"
          subtitle="Real order-driven winners from the selected range."
          columns={['Product', 'Units', 'Revenue']}
          rows={(storeOps?.topSellingProducts || []).slice(0, 10).map((entry: any) => [
            <span key={entry.productId} className="font-bold text-slate-900">{entry.title}</span>,
            formatMetricNumber(entry.unitsSold),
            formatAED(entry.revenue || 0),
          ])}
          emptyMessage="Top products will appear once the marketplace has order volume in this range."
        />

        <TableCard
          title="Seller Performance"
          subtitle="Real internal marketplace performance, separate from GA traffic."
          columns={['Seller', 'Orders', 'Gross Sales', 'Return Rate']}
          rows={(storeOps?.sellerPerformance || []).slice(0, 10).map((entry: any) => [
            <span key={entry.sellerId} className="font-bold text-slate-900">{entry.sellerName}</span>,
            formatMetricNumber(entry.totalOrders),
            formatAED(entry.grossSales || 0),
            formatPercent((entry.returnRate || 0) * 100),
          ])}
          emptyMessage="Seller performance will appear here when real order data is available."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableCard
          title="Low Stock Products"
          subtitle="Products that need merchandising or replenishment action."
          columns={['Product', 'Stock', 'Price']}
          rows={(storeOps?.lowStockProducts || []).slice(0, 10).map((entry: any) => [
            <span key={entry.id} className="font-bold text-slate-900">{entry.title}</span>,
            <span className="font-black text-rose-600">{formatMetricNumber(entry.stock)}</span>,
            formatAED(entry.price || 0),
          ])}
          emptyMessage="Low stock alerts will appear here once products and inventory are available."
        />

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Advanced Analytics</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            External traffic analytics have been disabled for now.
          </p>
          <div className="mt-5">
            <EmptyState message="Advanced analytics coming soon" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TableCard
          title="Top Searches"
          columns={['Keyword', 'Count']}
          rows={(analytics?.topSearches || []).slice(0, 8).map((entry: any) => [
            <span key={entry.query} className="font-bold text-slate-900">{entry.query || 'Unknown'}</span>,
            formatMetricNumber(entry.count),
          ])}
          emptyMessage="Internal search analytics will appear after customers generate marketplace search activity."
        />

        <TableCard
          title="Most Viewed Products"
          columns={['Product', 'Views']}
          rows={(analytics?.mostViewedProducts || []).slice(0, 8).map((entry: any) => [
            <span key={entry.productId} className="font-bold text-slate-900">{entry.product?.title || entry.productId}</span>,
            formatMetricNumber(entry.views),
          ])}
          emptyMessage="Internal product view analytics will appear after customers browse the catalog."
        />

        <TableCard
          title="Most Wishlisted Products"
          columns={['Product', 'Wishlists']}
          rows={(analytics?.mostWishlistedProducts || []).slice(0, 8).map((entry: any) => [
            <span key={entry.productId} className="font-bold text-slate-900">{entry.product?.title || entry.productId}</span>,
            formatMetricNumber(entry.count),
          ])}
          emptyMessage="Wishlist analytics will appear once customers save products."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableCard
          title="Banner Performance"
          columns={['Banner', 'Clicks', 'Link']}
          rows={(storeOps?.legacyReports?.bannerPerformance || analytics?.bannerPerformance || []).slice(0, 8).map((entry: any) => [
            <span key={entry.id || entry.title} className="font-bold text-slate-900">{entry.title}</span>,
            formatMetricNumber(entry.clicks),
            <span className="truncate">{entry.link || '/'}</span>,
          ])}
          emptyMessage="Banner performance will appear here once internal click activity is available."
        />

        <TableCard
          title="Operational Channels"
          subtitle="Internal acquisition inferred from marketplace activity."
          columns={['Channel', 'Count']}
          rows={(storeOps?.acquisitionChannels || []).slice(0, 8).map((entry: any) => [
            <span key={entry.channel} className="font-bold text-slate-900">{entry.channel || 'direct'}</span>,
            formatMetricNumber(entry.count),
          ])}
          emptyMessage="Internal channel insights will appear here once enough marketplace events are available."
        />
      </div>
    </div>
  );
}
