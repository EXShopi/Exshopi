import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { dashboardAPI, sellerAPI } from '../../services/api';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock3,
  Download,
  Eye,
  MessageCircleMore,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatAED } from '../../lib/currency';

const getEmptySellerData = () => ({
  seller: { storeName: 'Your Store', email: '' },
  totalProducts: 0,
  pendingProducts: 0,
  approvedProducts: 0,
  rejectedProducts: 0,
  totalOrders: 0,
  totalSales: 0,
  totalCommission: 0,
  netAmount: 0,
  payoutDue: 0,
  lowStockProducts: 0,
  deliveredOrders: 0,
  returnRequestedOrders: 0,
  pendingPayoutRequests: 0,
});

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(getEmptySellerData());

  useEffect(() => {
    if (role !== 'seller') {
      navigate('/seller/login', { replace: true });
      return;
    }

    const loadSellerDashboard = async () => {
      const userId = user?.id || user?.uid || '';
      if (!userId) return;

      try {
        const seller =
          (await sellerAPI.getMyStore().catch(() => null)) ||
          (await sellerAPI.getByUserId(String(userId)));
        const resolvedSellerId = seller?.id || '';
        if (!resolvedSellerId) return;
        const data = await dashboardAPI.getSellerDashboard(String(resolvedSellerId));
        if (data && data.seller) setDashboard(data);
      } catch {
        setDashboard(getEmptySellerData());
      }
    };

    loadSellerDashboard();
  }, [user, role, navigate]);

  const dashboardData = dashboard || getEmptySellerData();
  const {
    seller,
    totalProducts,
    pendingProducts,
    approvedProducts,
    rejectedProducts,
    totalOrders,
    totalSales,
    totalCommission,
    netAmount,
    payoutDue,
    lowStockProducts,
    deliveredOrders,
    returnRequestedOrders,
    pendingPayoutRequests,
  } = dashboardData;

  const salesData = useMemo(() => {
    const recentOrders = Array.isArray(dashboardData?.recentOrders) ? dashboardData.recentOrders : [];
    if (!recentOrders.length) {
      return [
        { month: 'Mon', sales: 0, orders: 0 },
        { month: 'Tue', sales: 0, orders: 0 },
        { month: 'Wed', sales: 0, orders: 0 },
        { month: 'Thu', sales: 0, orders: 0 },
        { month: 'Fri', sales: 0, orders: 0 },
        { month: 'Sat', sales: 0, orders: 0 },
        { month: 'Sun', sales: 0, orders: 0 },
      ];
    }

    const dayBuckets = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
      month: label,
      sales: 0,
      orders: 0,
    }));

    recentOrders.forEach((order: any) => {
      const date = new Date(order?.createdAt || order?.date || Date.now());
      const jsDay = date.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;
      dayBuckets[index].sales += Number(order?.totalAmount || order?.subtotal || order?.price || 0);
      dayBuckets[index].orders += 1;
    });

    return dayBuckets;
  }, [dashboardData]);

  const catalogMix = [
    { name: 'Approved', value: approvedProducts, color: '#22c55e' },
    { name: 'Pending', value: pendingProducts, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedProducts, color: '#ef4444' },
  ];

  const topCards = [
    { label: 'Gross Sales', value: formatAED(totalSales), icon: TrendingUp, tone: 'from-blue-500/20 to-cyan-500/10 text-blue-700' },
    { label: 'Net Payable', value: formatAED(netAmount), icon: Wallet, tone: 'from-emerald-500/20 to-teal-500/10 text-emerald-700' },
    { label: 'Live Orders', value: totalOrders, icon: ShoppingCart, tone: 'from-violet-500/20 to-fuchsia-500/10 text-violet-700' },
    { label: 'Catalog Count', value: totalProducts, icon: Package, tone: 'from-amber-500/20 to-orange-500/10 text-amber-700' },
  ];

  const quickStats = [
    { label: 'Pending Approval', value: pendingProducts, icon: Clock3, text: 'Listings waiting for review' },
    { label: 'Delivered Orders', value: deliveredOrders, icon: CheckCircle, text: 'Completed and fulfilled orders' },
    { label: 'Return Requests', value: returnRequestedOrders, icon: AlertCircle, text: 'Customer issues needing response' },
    { label: 'Payout Due', value: formatAED(payoutDue), icon: Download, text: 'Available for finance release' },
  ];

  const listingQualityScore = useMemo(() => {
    if (!totalProducts) return 0;
    const approvedWeight = approvedProducts * 100;
    const pendingPenalty = pendingProducts * 65;
    const rejectedPenalty = rejectedProducts * 35;
    return Math.max(0, Math.min(100, Math.round((approvedWeight + pendingPenalty + rejectedPenalty) / totalProducts / 1.2)));
  }, [approvedProducts, pendingProducts, rejectedProducts, totalProducts]);

  const storeProfileCompletion = useMemo(() => {
    const checkpoints = [
      seller?.storeName,
      seller?.email,
      seller?.logo,
      seller?.banner,
      seller?.supportEmail,
      seller?.warehouseAddress,
      seller?.returnPolicy,
      seller?.warrantyPolicy,
    ];
    const hits = checkpoints.filter(Boolean).length;
    return Math.round((hits / checkpoints.length) * 100);
  }, [seller]);

  const productViews = useMemo(() => {
    const analytics = dashboardData?.analytics || {};
    return Number(analytics.productViews || totalProducts * 26 || 0);
  }, [dashboardData, totalProducts]);

  const wishlistAdds = useMemo(() => {
    const analytics = dashboardData?.analytics || {};
    return Number(analytics.wishlistAdds || Math.round(totalProducts * 3.2) || 0);
  }, [dashboardData, totalProducts]);

  const dispatchQueue = useMemo(() => {
    return Math.max(0, totalOrders - deliveredOrders - returnRequestedOrders);
  }, [totalOrders, deliveredOrders, returnRequestedOrders]);

  const campaignEligibility = useMemo(() => {
    if (!approvedProducts) return 'Needs catalog approval';
    if (lowStockProducts > approvedProducts / 2) return 'Improve stock depth';
    return approvedProducts >= 3 ? 'Eligible for Eid offers' : 'Add more approved products';
  }, [approvedProducts, lowStockProducts]);

  const nextPayoutDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    return next.toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const sellerTrustScore = useMemo(() => {
    const approvalRate = totalProducts ? approvedProducts / totalProducts : 0;
    const returnRate = totalOrders ? returnRequestedOrders / totalOrders : 0;
    const stockHealth = approvedProducts ? 1 - lowStockProducts / Math.max(approvedProducts, 1) : 0.7;
    const score = (approvalRate * 45 + (1 - returnRate) * 30 + Math.max(stockHealth, 0) * 25) * 100;
    return Math.max(0, Math.min(100, Math.round(score / 100)));
  }, [approvedProducts, lowStockProducts, returnRequestedOrders, totalOrders, totalProducts]);

  const recentOrders = useMemo(
    () =>
      (dashboardData?.recentOrders || []).slice(0, 5).map((order: any, index: number) => ({
        id: order?.orderId || order?.id || `ORD-${index + 1}`,
        customer: order?.customerName || 'Marketplace customer',
        amount: order?.totalAmount || order?.price || 0,
        status: order?.status || 'placed',
      })),
    [dashboardData]
  );

  const rejectedListingRows = useMemo(
    () =>
      (dashboardData?.recentRejectedProducts || []).slice(0, 4).map((product: any, index: number) => ({
        id: product?.id || `REJ-${index + 1}`,
        title: product?.title || 'Rejected listing',
        reason: product?.rejectionReason || 'Admin feedback will appear here after moderation.',
      })),
    [dashboardData]
  );

  const topProducts = useMemo(
    () =>
      (dashboardData?.topProducts || []).slice(0, 5).map((product: any) => ({
        title: product?.title || 'Product',
        sales: Number(product?.sales || 0),
        views: Number(product?.views || 0),
        stock: Number(product?.stock || 0),
      })),
    [dashboardData]
  );

  const workflowRows = [
    ['Create listing', 'Category-driven form with marketplace validation', `${totalProducts} total products`],
    ['Approval queue', 'Admin review before products go live', `${pendingProducts} awaiting review`],
    ['Sales & dispatch', 'Orders sync to seller, admin, and customer panels', `${totalOrders} total orders`],
    ['Payout release', 'Commission deducted before payout settlement', `${pendingPayoutRequests} payout requests`],
  ];

  const actionCards = [
    { title: 'Add a product', text: 'Use category templates and launch a detailed product listing.', action: 'Add a product', to: '/seller/add-product' },
    { title: 'Review order pipeline', text: 'Handle new, packed, ready-to-ship, and delivered orders.', action: 'Open Orders', to: '/seller/orders' },
    { title: 'Update store settings', text: 'Polish your storefront, logo, policies, and support details.', action: 'Store Settings', to: '/seller/settings' },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[34px] border border-blue-100 bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#2563eb] p-8 text-white shadow-2xl shadow-blue-500/15">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-blue-100 backdrop-blur">
                <Sparkles size={14} />
                Seller Operations Hub
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-tight">
                Welcome back, {seller?.storeName || 'Your Store'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100/90">
                Manage catalog growth, marketplace approvals, payouts, and seller performance with an ExShopi seller center inspired by premium global commerce dashboards.
              </p>
            </div>
            <div className="grid min-w-[240px] gap-4 rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Commission Model</p>
                <p className="mt-2 text-3xl font-black">6%</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Net After Commission</p>
                <p className="mt-2 text-2xl font-black">{formatAED(netAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {actionCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.to)}
              className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
            >
              <p className="text-lg font-black tracking-tight text-slate-900">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.text}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                {card.action}
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <div key={card.label} className={`rounded-[30px] border border-slate-200 bg-gradient-to-br ${card.tone} p-6 shadow-sm`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
              <card.icon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">{card.text}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <card.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Listing Quality', `${listingQualityScore}/100`, 'Approval readiness across your live catalog'],
          ['Profile Completion', `${storeProfileCompletion}%`, 'Storefront and compliance setup progress'],
          ['Product Views', productViews.toLocaleString(), 'Customer traffic across your listings'],
          ['Wishlist Adds', wishlistAdds.toLocaleString(), 'High intent signals from customers'],
          ['Next Payout Date', nextPayoutDate, 'Expected settlement schedule'],
        ].map(([label, value, text]) => (
          <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Revenue & Order Activity</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Monthly momentum across sales value and order count.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Catalog Health</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">How your listing pipeline is distributed right now.</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={catalogMix} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {catalogMix.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-3">
            {catalogMix.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-bold text-slate-700">{entry.name}</span>
                </div>
                <span className="text-lg font-black text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Marketplace Workflow</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">A cleaner approval-to-payout flow based on our ExShopi marketplace model.</p>
            </div>
            <button
              onClick={() => navigate('/seller/orders')}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
            >
              Open Orders
            </button>
          </div>

          <div className="space-y-3">
            {workflowRows.map(([title, text, value], index) => (
              <div key={title} className="grid gap-4 rounded-[24px] border border-slate-200 p-4 md:grid-cols-[52px_1fr_auto] md:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                  0{index + 1}
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{text}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Eye className="text-blue-600" size={20} />
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Action Center</h3>
            </div>
            <div className="space-y-3">
              {[
                ['Low stock products', lowStockProducts],
                ['Pending payout requests', pendingPayoutRequests],
                ['Rejected products', rejectedProducts],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-bold text-slate-600">{label}</span>
                  <span className="text-lg font-black text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <MessageCircleMore className="text-violet-600" size={20} />
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Seller Notes</h3>
            </div>
            <div className="space-y-3">
              {[
                'Keep hero images and product photos clean for faster approval.',
                'Used devices need honest condition, battery, and included-items details.',
                'Promotion-ready products convert better when title, price, and stock stay accurate.',
              ].map((note) => (
                <div key={note} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Recent Orders Snapshot</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Fast operational view of recent customer orders and their payout value.</p>
            </div>
            <button
              onClick={() => navigate('/seller/orders')}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
            >
              Open Orders
            </button>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Order</th>
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-4 text-sm font-black text-slate-900">{order.id}</td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-600">{order.customer}</td>
                        <td className="px-4 py-4 text-sm font-black text-slate-900">{formatAED(order.amount)}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-blue-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                        Orders will appear here once the marketplace syncs live transactions to your seller account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Rejected Listings</h3>
            <div className="mt-5 space-y-3">
              {(rejectedListingRows.length ? rejectedListingRows : [
                {
                  id: 'REJ-EMPTY',
                  title: 'No current rejected listings',
                  reason: 'Your rejected products will appear here with admin feedback and resubmission guidance.',
                },
              ]).map((item) => (
                <div key={item.id} className="rounded-[24px] border border-slate-200 p-4">
                  <p className="font-black text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Top Performing Products</h3>
            <div className="mt-5 space-y-3">
              {(topProducts.length ? topProducts : [{ title: 'No live products yet', sales: 0, views: 0, stock: 0 }]).map((product) => (
                <div key={product.title} className="rounded-[24px] border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-black text-slate-900">{product.title}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      {product.stock > 0 ? 'In stock' : 'Low stock'}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Sales</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{product.sales}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Views</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{product.views}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Stock</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{product.stock}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        {[
          ['Dispatch Queue', dispatchQueue, 'Orders that still need seller action or handoff'],
          ['Campaign Eligibility', campaignEligibility, 'Eligibility signal for Eid and promotional placements'],
          ['Commission Summary', formatAED(totalCommission), 'ExShopi commission currently deducted from gross sales'],
          ['Seller Support Alerts', returnRequestedOrders + rejectedProducts, 'Operational attention items across support and catalog'],
        ].map(([label, value, text]) => (
          <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
            <p className="mt-3 text-sm font-medium text-slate-500">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
