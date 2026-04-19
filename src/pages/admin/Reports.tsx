import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Globe2,
  Laptop2,
  MapPin,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const PIE_COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#f59e0b', '#e11d48', '#334155'];

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

function formatSeconds(value: unknown) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return '0s';
  if (numeric >= 60) {
    const minutes = Math.floor(numeric / 60);
    const seconds = Math.round(numeric % 60);
    return `${minutes}m ${seconds}s`;
  }
  return `${Math.round(numeric)}s`;
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
  const ga = analytics?.googleAnalytics || {};
  const storeOps = analytics?.storeOperations || {};
  const gaConnected = Boolean(ga?.connected);

  const trendData = useMemo(() => {
    return (ga?.trend || []).map((entry: any) => ({
      date: String(entry.date || ''),
      users: Number(entry.activeUsers || 0),
      sessions: Number(entry.sessions || 0),
      events: Number(entry.eventCount || 0),
      keyEvents: Number(entry.keyEvents || 0),
    }));
  }, [ga]);

  const devicePieData = useMemo(() => {
    return (ga?.devices?.categories || []).map((entry: any, index: number) => ({
      name: entry.deviceCategory || 'Unknown',
      value: Number(entry.activeUsers || 0),
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [ga]);

  const topCountries = ga?.geography?.countries || [];
  const topCities = ga?.geography?.cities || [];
  const topRegions = ga?.geography?.regions || [];
  const topLandingPages = ga?.content?.topLandingPages || [];
  const topProductPages = ga?.content?.topProductPages || [];
  const topPages = ga?.content?.topPages || [];
  const acquisitionRows = ga?.acquisition?.sourceMedium || [];
  const channelRows = ga?.acquisition?.channels || [];
  const referralRows = ga?.acquisition?.referrals || [];
  const realtimeCountries = ga?.realtime?.countries || [];
  const realtimeCities = ga?.realtime?.cities || [];

  const statCards = [
    {
      label: 'Active Users',
      value: formatMetricNumber(summaryCards.activeUsers),
      helper: gaConnected ? 'Real GA4 active users in range' : 'Waiting for GA4 connection',
      icon: Users,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Last 30 Min',
      value: formatMetricNumber(summaryCards.activeUsersLast30Minutes),
      helper: ga?.realtime?.note || 'Realtime window',
      icon: Activity,
      color: 'text-violet-700 bg-violet-50',
    },
    {
      label: 'New Users',
      value: formatMetricNumber(summaryCards.newUsers),
      helper: 'New traffic in selected range',
      icon: Globe2,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Sessions',
      value: formatMetricNumber(summaryCards.sessions),
      helper: 'GA4 sessions',
      icon: BarChart3,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Engaged Sessions',
      value: formatMetricNumber(summaryCards.engagedSessions),
      helper: 'Meaningful visits',
      icon: Activity,
      color: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Avg Engagement',
      value: formatSeconds(summaryCards.averageEngagementTime),
      helper: 'Average session duration',
      icon: Laptop2,
      color: 'text-cyan-700 bg-cyan-50',
    },
    {
      label: 'Events',
      value: formatMetricNumber(summaryCards.eventCount),
      helper: 'All tracked GA4 events',
      icon: Search,
      color: 'text-rose-700 bg-rose-50',
    },
    {
      label: 'Key Events',
      value: formatMetricNumber(summaryCards.keyEvents),
      helper: summaryCards.conversionRate != null ? `${formatPercent(summaryCards.conversionRate)} conversion rate` : 'No conversion rate yet',
      icon: ShieldAlert,
      color: 'text-indigo-700 bg-indigo-50',
    },
    {
      label: 'Orders Today',
      value: formatMetricNumber(summaryCards.ordersToday),
      helper: 'Real marketplace orders',
      icon: ShoppingBag,
      color: 'text-orange-700 bg-orange-50',
    },
    {
      label: 'Revenue Today',
      value: formatAED(summaryCards.revenueToday || 0),
      helper: 'Internal order revenue',
      icon: Store,
      color: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'Revenue This Month',
      value: formatAED(summaryCards.revenueThisMonth || 0),
      helper: 'Current month turnover',
      icon: ShoppingBag,
      color: 'text-fuchsia-700 bg-fuchsia-50',
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
            Real Google Analytics traffic signals plus live ExShopi marketplace operations in one control layer.
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

      {!gaConnected ? (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-[11px]">Google Analytics Setup Needed</p>
              <p className="mt-2 text-sm font-medium">
                {ga?.configurationIssue || 'The GA4 service account is not configured on the backend yet. Internal ExShopi store metrics are live below, and GA cards will populate automatically once the secure backend credentials are added.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Traffic Trend</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Users, sessions, and event flow over the selected date range.
              </p>
            </div>
          </div>

          {trendData.length ? (
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2.5} fill="url(#usersFill)" />
                  <Area type="monotone" dataKey="sessions" stroke="#7c3aed" strokeWidth={2.5} fill="url(#sessionsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState message="Traffic trend will appear here when real Google Analytics data is available for this range." />
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Realtime Snapshot</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Live users in the last 30 minutes, refreshed automatically.
          </p>
          <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Active Users</p>
            <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
              {formatMetricNumber(ga?.realtime?.activeUsersNow)}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">{ga?.realtime?.note || 'Realtime analytics unavailable.'}</p>
          </div>

          <div className="mt-5 space-y-3">
            {(realtimeCountries || []).slice(0, 5).map((entry: any) => (
              <div key={`rt-country-${entry.country}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-bold text-slate-900">{entry.country || 'Unknown'}</span>
                <span className="text-sm font-black text-blue-600">{formatMetricNumber(entry.activeUsers)}</span>
              </div>
            ))}
            {!realtimeCountries?.length ? <EmptyState message="Realtime country traffic will appear once GA4 realtime data is available." /> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Devices</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Real device mix by active users.</p>
          {devicePieData.length ? (
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devicePieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={4}>
                    {devicePieData.map((entry: any, index: number) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState message="Device analytics will show here when GA4 traffic data is available." />
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(ga?.devices?.categories || []).slice(0, 3).map((entry: any) => (
              <div key={`device-${entry.deviceCategory}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.deviceCategory || 'Unknown'}</p>
                <p className="mt-2 text-lg font-black text-slate-900">{formatMetricNumber(entry.activeUsers)}</p>
              </div>
            ))}
          </div>
        </div>

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
          title="Geographic Reach"
          subtitle={`Dubai users: ${formatMetricNumber(ga?.geography?.uaeBreakdown?.dubaiUsers || 0)} • highest real GA granularity only`}
          columns={['Location', 'Active Users', 'Sessions']}
          rows={topCities.slice(0, 10).map((entry: any) => [
            <div key={`${entry.country}-${entry.city}`} className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin className="h-4 w-4 text-slate-400" />
              {entry.city || 'Unknown city'} <span className="text-slate-400">· {entry.country || 'Unknown country'}</span>
            </div>,
            formatMetricNumber(entry.activeUsers),
            formatMetricNumber(entry.sessions),
          ])}
          emptyMessage="City and regional traffic will appear once real GA4 geography data is available."
        />

        <TableCard
          title="Acquisition"
          subtitle="Real traffic sources and mediums from Google Analytics."
          columns={['Source / Medium', 'Sessions', 'Users']}
          rows={acquisitionRows.slice(0, 10).map((entry: any) => [
            <span key={entry.sessionSourceMedium || entry.firstUserSourceMedium} className="font-bold text-slate-900">
              {entry.sessionSourceMedium || entry.firstUserSourceMedium || 'Unknown'}
            </span>,
            formatMetricNumber(entry.sessions || entry.totalUsers),
            formatMetricNumber(entry.activeUsers || entry.newUsers),
          ])}
          emptyMessage="Traffic source reporting will show here after GA4 traffic data becomes available."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TableCard
          title="Top Landing Pages"
          columns={['Landing Page', 'Sessions', 'Users']}
          rows={topLandingPages.slice(0, 8).map((entry: any) => [
            <span key={entry.landingPage} className="font-bold text-slate-900">{entry.landingPage || '/'}</span>,
            formatMetricNumber(entry.sessions),
            formatMetricNumber(entry.activeUsers),
          ])}
          emptyMessage="Landing page analytics will appear once GA4 pageview traffic is available."
        />

        <TableCard
          title="Top Product Pages"
          subtitle={ga?.content?.inferenceNote}
          columns={['Product Path', 'Views', 'Users']}
          rows={topProductPages.slice(0, 8).map((entry: any) => [
            <span key={entry.path} className="font-bold text-slate-900">{entry.path || '/'}</span>,
            formatMetricNumber(entry.screenPageViews),
            formatMetricNumber(entry.activeUsers),
          ])}
          emptyMessage="Product page rankings will appear once real pageview traffic is available."
        />

        <TableCard
          title="Top Pages"
          columns={['Page', 'Views', 'Users']}
          rows={topPages.slice(0, 8).map((entry: any) => [
            <span key={entry.path} className="font-bold text-slate-900">{entry.path || '/'}</span>,
            formatMetricNumber(entry.screenPageViews),
            formatMetricNumber(entry.activeUsers),
          ])}
          emptyMessage="Page analytics will appear once GA4 content data is available."
        />
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
          <h3 className="text-lg font-black text-slate-900">Demographics</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Only shown when real Google Analytics demographic data is available.
          </p>
          {ga?.demographics?.available ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age Brackets</p>
                <div className="mt-3 space-y-2">
                  {(ga?.demographics?.ageBrackets || []).slice(0, 6).map((entry: any) => (
                    <div key={entry.userAgeBracket} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900">{entry.userAgeBracket || 'Unknown'}</span>
                      <span className="font-black text-blue-600">{formatMetricNumber(entry.activeUsers)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</p>
                <div className="mt-3 space-y-2">
                  {(ga?.demographics?.genders || []).slice(0, 6).map((entry: any) => (
                    <div key={entry.userGender} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900">{entry.userGender || 'Unknown'}</span>
                      <span className="font-black text-violet-600">{formatMetricNumber(entry.activeUsers)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState message={ga?.demographics?.reason || 'Not enough real data available yet.'} />
            </div>
          )}
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

      {(channelRows.length || referralRows.length || topCountries.length || topRegions.length) ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <TableCard
            title="Channels"
            columns={['Channel', 'Sessions', 'Users']}
            rows={channelRows.slice(0, 8).map((entry: any) => [
              <span key={entry.sessionDefaultChannelGroup} className="font-bold text-slate-900">{entry.sessionDefaultChannelGroup || 'Unknown'}</span>,
              formatMetricNumber(entry.sessions),
              formatMetricNumber(entry.activeUsers),
            ])}
            emptyMessage="Channel groups will appear once Google Analytics starts returning channel data."
          />
          <TableCard
            title="Referrals"
            columns={['Referrer', 'Sessions', 'Users']}
            rows={referralRows.slice(0, 8).map((entry: any) => [
              <span key={entry.fullReferrer} className="font-bold text-slate-900">{entry.fullReferrer || 'Direct / none'}</span>,
              formatMetricNumber(entry.sessions),
              formatMetricNumber(entry.activeUsers),
            ])}
            emptyMessage="Referral source analytics will appear once Google Analytics has referral data."
          />
          <TableCard
            title="Countries"
            columns={['Country', 'Users', 'Sessions']}
            rows={topCountries.slice(0, 8).map((entry: any) => [
              <span key={entry.country} className="font-bold text-slate-900">{entry.country || 'Unknown'}</span>,
              formatMetricNumber(entry.activeUsers),
              formatMetricNumber(entry.sessions),
            ])}
            emptyMessage="Country-level analytics will appear once Google Analytics has geography data."
          />
        </div>
      ) : null}
    </div>
  );
}
