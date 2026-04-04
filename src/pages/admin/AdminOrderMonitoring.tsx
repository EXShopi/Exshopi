import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, TrendingUp, Clock, AlertCircle, CheckCircle, MapPin, Package, Calendar, CreditCard, ShieldAlert, Truck, Wallet } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customPhone: string;
  sellerId: string;
  sellerName: string;
  products: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  commission: number;
  sellerAmount: number;
  status: 'placed' | 'packed' | 'pickup_scheduled' | 'handed_to_partner' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  shippingAddress: string;
  trackingCode: string;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  refundStatus?: string;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
  deliveredAt?: string;
}

const normalizeOrder = (order: any): Order => ({
  id: String(order.id || ''),
  customerId: String(order.customerId || ''),
  customerName: order.customerName || 'Customer',
  customerEmail: order.customerEmail || '',
  customPhone: order.customPhone || '',
  sellerId: String(order.sellerId || ''),
  sellerName: order.sellerName || 'ExShopi Official',
  products:
    Array.isArray(order.products) && order.products.length
      ? order.products
      : [
          {
            id: String(order.productId || order.id || ''),
            title: order.productTitle || 'Marketplace Product',
            quantity: order.quantity || 1,
            price: Number(order.unitPrice || order.subtotal || 0),
          },
        ],
  subtotal: Number(order.subtotal || 0),
  commission: Number(order.commission || 0),
  sellerAmount: Number(order.sellerAmount || Math.max(Number(order.subtotal || 0) - Number(order.commission || 0), 0)),
  status: order.status || 'placed',
  shippingAddress: order.shippingAddress || order.address || '',
  trackingCode: order.trackingCode || `TRK-${String(order.id || '').slice(-8)}`,
  dispatchSlotDate: order.dispatchSlotDate || '',
  dispatchSlotWindow: order.dispatchSlotWindow || '',
  dispatchNotes: order.dispatchNotes || '',
  courierPartner: order.courierPartner || '',
  refundStatus: order.refundStatus || 'none',
  refundReason: order.refundReason || '',
  refundAmount: Number(order.refundAmount || 0),
  createdAt: order.createdAt || new Date().toISOString(),
  deliveredAt: order.deliveredAt,
});

const formatDateSafe = (value: any, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-AE');
};

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  averageOrderValue: number;
  pendingOrders: number;
  deliveredToday: number;
}

const AdminOrderMonitoring = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'seller' | 'customer'>('date');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    dispatchSlotDate: '',
    dispatchSlotWindow: '10:00 AM - 1:00 PM',
    dispatchNotes: '',
    courierPartner: 'ExShopi Logistics',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rawOrders = await orderAPI.getAllOrders();
        const allOrders = Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [];
        setOrders(allOrders);

        // Calculate stats
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + o.subtotal, 0);
        const totalCommission = allOrders.reduce((sum, o) => sum + o.commission, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = allOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned').length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deliveredToday = allOrders.filter((o) => {
          if (!o.deliveredAt || o.status !== 'delivered') return false;
          const deliveryDate = new Date(o.deliveredAt);
          deliveryDate.setHours(0, 0, 0, 0);
          return deliveryDate.getTime() === today.getTime();
        }).length;

        setStats({
          totalOrders,
          totalRevenue,
          totalCommission,
          averageOrderValue,
          pendingOrders,
          deliveredToday,
        });
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Subscribe to server-sent events for realtime order updates
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/stream');

      const handleCreated = async (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data || '{}');
          if (!payload?.id) return;
          const raw = await orderAPI.get(payload.id);
          const next = normalizeOrder(raw);
          setOrders((prev) => [next, ...prev.filter((o) => o.id !== next.id)]);
        } catch (err) {
          console.error('SSE order-created handler failed', err);
        }
      };

      const handleUpdated = async (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data || '{}');
          if (!payload?.id) return;
          const raw = await orderAPI.get(payload.id);
          const updated = normalizeOrder(raw);
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          setSelectedOrder((prev) => (prev && prev.id === updated.id ? updated : prev));
        } catch (err) {
          console.error('SSE order-updated handler failed', err);
        }
      };

      es.addEventListener('order-created', handleCreated as any);
      es.addEventListener('order-updated', handleUpdated as any);
    } catch (err) {
      // ignore SSE connection errors
    }

    return () => {
      try {
        es?.close();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // Filter and sort orders
  useEffect(() => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(order.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(order.trackingCode || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.subtotal - a.subtotal;
        case 'seller':
          return a.sellerName.localeCompare(b.sellerName);
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    if (!selectedOrder) return;
    setDispatchForm({
      dispatchSlotDate: selectedOrder.dispatchSlotDate || '',
      dispatchSlotWindow: selectedOrder.dispatchSlotWindow || '10:00 AM - 1:00 PM',
      dispatchNotes: selectedOrder.dispatchNotes || '',
      courierPartner: selectedOrder.courierPartner || 'ExShopi Logistics',
    });
  }, [selectedOrder]);

  const dispatchQueue = useMemo(
    () => orders.filter((order) => ['placed', 'packed', 'pickup_scheduled'].includes(order.status)).slice(0, 5),
    [orders]
  );

  const fraudAlerts = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'cancelled' ||
          order.refundStatus === 'requested' ||
          order.status === 'returned' ||
          Number(order.refundAmount || 0) > Number(order.subtotal || 0) * 0.8
      ),
    [orders]
  );

  const syncUpdatedOrder = (updated: any) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? { ...order, ...updated } : order)));
    setSelectedOrder((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const handleScheduleDispatch = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await orderAPI.updateDispatchSlot(selectedOrder.id, {
        ...dispatchForm,
        status: 'pickup_scheduled',
      });
      syncUpdatedOrder(updated);
    } catch (error) {
      console.error('Failed to schedule dispatch:', error);
    }
  };

  const handleRefundAction = async (action: 'approve' | 'reject') => {
    if (!selectedOrder) return;
    try {
      const updated = await orderAPI.processRefund(selectedOrder.id, {
        action,
        refundAmount: selectedOrder.refundAmount || selectedOrder.subtotal,
        reason: action === 'reject' ? 'Refund rejected after admin review' : 'Refund approved by admin',
      });
      syncUpdatedOrder(updated);
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      placed: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        icon: Clock,
      },
      packed: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: Package,
      },
      pickup_scheduled: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: Calendar,
      },
      handed_to_partner: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        icon: TrendingUp,
      },
      in_transit: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: MapPin,
      },
      delivered: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: CheckCircle,
      },
      cancelled: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        icon: AlertCircle,
      },
      returned: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        icon: AlertCircle,
      },
    };

    const style = styles[status];
    const Icon = style.icon;

    const displayStatus = status.replace(/_/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text} text-xs font-medium`}>
        <Icon size={14} />
        {displayStatus}
      </div>
    );
  };

  const getStatusTimeline = (status: Order['status']) => {
    const statuses: Order['status'][] = ['placed', 'packed', 'pickup_scheduled', 'handed_to_partner', 'in_transit', 'delivered'];
    const currentIndex = statuses.indexOf(status);

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {statuses.map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx <= currentIndex ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {idx + 1}
            </div>
            {idx < statuses.length - 1 && <div className="w-3 h-0.5 bg-slate-200 mx-0.5"></div>}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#2563eb] p-8 text-white shadow-2xl shadow-blue-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
              <Truck size={14} />
              Order Operations Center
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Marketplace Order Monitoring</h1>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Control fulfillment, dispatch scheduling, refund reviews, and seller handoffs from one dense UAE-first operations workspace.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Dispatch Queue', dispatchQueue.length, Truck, 'bg-amber-50 text-amber-600'],
            ['Fraud / Risk Flags', fraudAlerts.length, ShieldAlert, 'bg-rose-50 text-rose-600'],
            ['Delivered Today', stats?.deliveredToday || 0, CheckCircle, 'bg-emerald-50 text-emerald-600'],
            ['Payout Exposure', formatAED(orders.reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0)), Wallet, 'bg-violet-50 text-violet-600'],
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fulfillment Overview</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Real-time operational metrics for orders, refunds, and seller settlement flow.</p>
        </div>
        <ShoppingCart size={32} className="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Orders</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats?.totalOrders || 0}</p>
            </div>
            <ShoppingCart size={24} className="text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Revenue</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatAED(stats?.totalRevenue || 0)}</p>
            </div>
            <TrendingUp size={24} className="text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Commission Earned</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatAED(stats?.totalCommission || 0)}</p>
            </div>
            <TrendingUp size={24} className="text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Average Order</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatAED(stats?.averageOrderValue || 0)}</p>
            </div>
            <Package size={24} className="text-slate-600" />
          </div>
        </div>

        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">In Progress</p>
              <p className="text-2xl font-black text-amber-600 mt-2">{stats?.pendingOrders || 0}</p>
            </div>
            <Clock size={24} className="text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivered Today</p>
              <p className="text-2xl font-black text-emerald-600 mt-2">{stats?.deliveredToday || 0}</p>
            </div>
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer, seller, or tracking code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="placed">Placed</option>
            <option value="packed">Packed</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="handed_to_partner">Handed to Partner</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="date">Recent First</option>
            <option value="value">Highest Value</option>
            <option value="seller">By Seller</option>
            <option value="customer">By Customer</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Seller
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Commission
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-600">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 text-sm">{order.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{order.sellerName}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">{formatAED(order.subtotal)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">{formatAED(order.commission)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{order.trackingCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{formatDateSafe(order.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Dispatch Queue</h3>
          <div className="mt-5 space-y-3">
            {dispatchQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                No pending dispatch actions right now.
              </div>
            ) : (
              dispatchQueue.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowModal(true);
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{order.id}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{order.customerName} • {order.sellerName}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Risk & Refund Alerts</h3>
          <div className="mt-5 space-y-3">
            {fraudAlerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
                No unusual refund or cancellation risk detected.
              </div>
            ) : (
              fraudAlerts.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-black text-slate-900">{order.id}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{order.customerName} • {order.sellerName}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                    {order.refundStatus === 'requested' ? 'Refund requested' : order.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-900">Order Details</h3>

            {/* Order Header */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Order ID</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Tracking Code</p>
                  <p className="font-semibold text-slate-900 font-mono">{selectedOrder.trackingCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Order Date</p>
                  <p className="font-semibold text-slate-900">{formatDateSafe(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Refund Status</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.refundStatus || 'none'}</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Delivery Timeline</p>
              {getStatusTimeline(selectedOrder.status)}
            </div>

            {/* Customer & Seller Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Customer</p>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.customPhone}</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Seller</p>
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{selectedOrder.sellerName}</p>
                  <p className="text-sm text-slate-600">ID: {selectedOrder.sellerId}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Products</p>
              <div className="space-y-2">
                {selectedOrder.products.map((product) => (
                  <div key={product.id} className="flex justify-between items-center border rounded p-3 bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{product.title}</p>
                      <p className="text-xs text-slate-600">Qty: {product.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatAED(product.price * product.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-slate-200 pt-4 bg-indigo-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-slate-700">Subtotal:</p>
                  <p className="font-semibold text-slate-900">{formatAED(selectedOrder.subtotal)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-slate-700">Commission (6%):</p>
                  <p className="font-semibold text-slate-900">{formatAED(selectedOrder.commission)}</p>
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-2">
                  <p className="font-semibold text-slate-900">Seller Amount:</p>
                  <p className="font-bold text-indigo-600 text-lg">{formatAED(selectedOrder.sellerAmount)}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">Shipping Address</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{selectedOrder.shippingAddress}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Dispatch Scheduling</p>
                <input
                  type="date"
                  value={dispatchForm.dispatchSlotDate}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, dispatchSlotDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={dispatchForm.dispatchSlotWindow}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, dispatchSlotWindow: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option>10:00 AM - 1:00 PM</option>
                  <option>1:00 PM - 4:00 PM</option>
                  <option>4:00 PM - 8:00 PM</option>
                </select>
                <input
                  type="text"
                  value={dispatchForm.courierPartner}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, courierPartner: e.target.value }))}
                  placeholder="Courier partner"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <textarea
                  value={dispatchForm.dispatchNotes}
                  onChange={(e) => setDispatchForm((prev) => ({ ...prev, dispatchNotes: e.target.value }))}
                  rows={3}
                  placeholder="Dispatch notes"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                />
                <button
                  onClick={handleScheduleDispatch}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Save Dispatch Slot
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Refund Review</p>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-900">Status:</span> {selectedOrder.refundStatus || 'none'}</p>
                  <p><span className="font-semibold text-slate-900">Amount:</span> {formatAED(selectedOrder.refundAmount || selectedOrder.subtotal || 0)}</p>
                  <p><span className="font-semibold text-slate-900">Reason:</span> {selectedOrder.refundReason || 'No refund requested yet'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRefundAction('approve')}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve Refund
                  </button>
                  <button
                    onClick={() => handleRefundAction('reject')}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Reject Refund
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg hover:bg-slate-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderMonitoring;
