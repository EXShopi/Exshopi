import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, TrendingUp, Clock, AlertCircle, CheckCircle, Package, ShieldAlert, Truck, Wallet } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';
import { OrderDetailsModal } from '../../components/OrderDetails';

type CanonicalOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  products: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    unitPrice?: number;
    sku?: string;
  }>;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    salePrice?: number;
    sku?: string;
  }>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  deliveryFee?: number;
  paymentMethod: string;
  commission: number;
  sellerAmount: number;
  status: CanonicalOrderStatus;
  rawStatus: string;
  shippingAddress: string;
  shippingAddressJson?: any;
  trackingCode: string;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  refundStatus?: string;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
  placedAt?: string;
  deliveredAt?: string;
  deliveryType?: string;
  paymentStatus?: string;
  operationalStatus?: string;
  trackingEvents?: Array<{
    id: string;
    status: string;
    timestamp: string;
    notes?: string;
    location?: string;
  }>;
}

const ORDER_STATUS_LABELS: Record<CanonicalOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const ORDER_STATUS_STYLES: Record<
  CanonicalOrderStatus,
  { bg: string; text: string; icon: typeof Clock }
> = {
  pending: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    icon: Clock,
  },
  confirmed: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: CheckCircle,
  },
  processing: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: Package,
  },
  shipped: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: Truck,
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
  refunded: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: ShieldAlert,
  },
};

const TIMELINE_STATUSES: CanonicalOrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const ORDER_FILTER_OPTIONS: Array<{ value: 'all' | CanonicalOrderStatus; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

function normalizeOrderStatus(value: unknown, refundStatus?: unknown): CanonicalOrderStatus {
  const status = String(value || '').toLowerCase();
  const refund = String(refundStatus || '').toLowerCase();

  if (refund === 'approved' || refund === 'completed' || refund === 'refunded') {
    return 'refunded';
  }

  if (['returned', 'return_requested', 'refund_requested', 'refunded'].includes(status)) {
    return 'refunded';
  }

  if (['cancelled', 'failed'].includes(status)) {
    return 'cancelled';
  }

  if (status === 'delivered') {
    return 'delivered';
  }

  if (['handed_to_partner', 'in_transit', 'picked_up', 'shipped', 'out_for_delivery'].includes(status)) {
    return 'shipped';
  }

  if (
    [
      'packed',
      'pickup_scheduled',
      'waiting_for_pickup',
      'processing',
      'ready_to_ship',
    ].includes(status)
  ) {
    return 'processing';
  }

  if (['confirmed', 'approved'].includes(status)) {
    return 'confirmed';
  }

  return 'pending';
}

const normalizeOrder = (order: any): Order => {
  // Handle items array properly
  const items = order.items || [];
  const products = items.length > 0 
    ? items.map((item: any) => ({
        id: item.id || item.productId || String(order.id || ''),
        title: item.productTitle || item.title || 'Marketplace Product',
        quantity: item.quantity || 1,
        price: Number(item.unitPrice || item.salePrice || 0),
        unitPrice: Number(item.unitPrice || 0),
        sku: item.sku,
      }))
    : [
        {
          id: String(order.productId || order.id || ''),
          title: order.productTitle || 'Marketplace Product',
          quantity: order.quantity || 1,
          price: Number(order.unitPrice || order.subtotal || 0),
        },
      ];

  return {
    id: String(order.id || ''),
    orderNumber: order.orderNumber || String(order.id || '').slice(-8),
    customerId: String(order.customerId || ''),
    customerName: order.customerName || 'Customer',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || order.customPhone || '',
    sellerId: String(order.sellerId || ''),
    sellerName: order.sellerName || 'ExShopi Official',
    products,
    items: products.map(p => ({
      id: p.id,
      title: p.title,
      quantity: p.quantity,
      unitPrice: p.price,
      sku: p.sku,
    })),
    subtotal: Number(order.subtotal || 0),
    vatAmount: Number(order.vatAmount || 0),
    totalAmount: Number(order.totalAmount || order.total || order.subtotal || 0),
    deliveryFee: Number(order.deliveryFee || order.shippingCost || 0),
    paymentMethod: String(order.paymentMethod || 'Unknown'),
    paymentStatus: order.paymentStatus || 'pending',
    commission: Number(order.commission || order.commissionAmount || 0),
    sellerAmount: Number(order.sellerAmount || Math.max(Number(order.subtotal || 0) - Number(order.commission || 0), 0)),
    status: normalizeOrderStatus(order.operationalStatus || order.status, order.refundStatus),
    rawStatus: String(order.operationalStatus || order.status || 'pending'),
    shippingAddress: order.shippingAddress || order.address || '',
    shippingAddressJson: order.shippingAddressJson,
    trackingCode: order.trackingCode || `TRK-${String(order.id || '').slice(-8)}`,
    dispatchSlotDate: order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '',
    dispatchNotes: order.dispatchNotes || '',
    courierPartner: order.courierPartner || '',
    refundStatus: order.refundStatus || 'none',
    refundReason: order.refundReason || '',
    refundAmount: Number(order.refundAmount || 0),
    createdAt: order.createdAt || new Date().toISOString(),
    placedAt: order.placedAt || order.createdAt,
    deliveredAt: order.deliveredAt,
    deliveryType: order.deliveryType || 'Standard',
    operationalStatus: order.operationalStatus || order.status,
    trackingEvents: Array.isArray(order.trackingEvents) ? order.trackingEvents : [],
  };
};

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
  const [statusFilter, setStatusFilter] = useState<'all' | CanonicalOrderStatus>('all');
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
        const pendingOrders = allOrders.filter(
          (o) => !['delivered', 'cancelled', 'refunded'].includes(o.status)
        ).length;

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
    () => orders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).slice(0, 5),
    [orders]
  );

  const fraudAlerts = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'cancelled' ||
          order.refundStatus === 'requested' ||
          order.status === 'refunded' ||
          Number(order.refundAmount || 0) > Number(order.subtotal || 0) * 0.8
      ),
    [orders]
  );

  const syncUpdatedOrder = (updated: any) => {
    const normalized = normalizeOrder(updated);
    setOrders((prev) => prev.map((order) => (order.id === normalized.id ? normalized : order)));
    setSelectedOrder((prev) => (prev && prev.id === normalized.id ? normalized : prev));
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!orderId || !newStatus) {
      console.error('Invalid order ID or status');
      return;
    }

    try {
      // Call backend API to update status
      const updated = await orderAPI.updateStatus(orderId, newStatus);
      
      // Sync the updated order in state
      syncUpdatedOrder(updated);
      
      // Show success message
      const statusLabel = newStatus
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`✓ Order updated to: ${statusLabel}`);
      
      // Toast notification would go here in a real app
      // For now, just log the success
    } catch (error) {
      console.error('Failed to update order status:', error);
      // Toast error notification would go here
    }
  };

  const getStatusBadge = (status: CanonicalOrderStatus) => {
    const style = ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.pending;
    const Icon = style.icon;
    const displayStatus = ORDER_STATUS_LABELS[status] || ORDER_STATUS_LABELS.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.text} text-xs font-medium`}>
        <Icon size={14} />
        {displayStatus}
      </div>
    );
  };

  const getStatusTimeline = (status: CanonicalOrderStatus) => {
    const currentIndex = TIMELINE_STATUSES.indexOf(status);

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {TIMELINE_STATUSES.map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx <= currentIndex ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {idx + 1}
            </div>
            {idx < TIMELINE_STATUSES.length - 1 && <div className="w-3 h-0.5 bg-slate-200 mx-0.5"></div>}
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
            {ORDER_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
                    {order.refundStatus === 'requested' ? 'Refund requested' : ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          order={{
            id: selectedOrder.id,
            orderNumber: selectedOrder.orderNumber || selectedOrder.id,
            customerId: selectedOrder.customerId,
            customerName: selectedOrder.customerName,
            customerEmail: selectedOrder.customerEmail,
            customerPhone: selectedOrder.customerPhone,
            sellerId: selectedOrder.sellerId,
            sellerName: selectedOrder.sellerName,
            subtotal: selectedOrder.subtotal,
            vatAmount: selectedOrder.vatAmount,
            deliveryFee: selectedOrder.deliveryFee || 0,
            totalAmount: selectedOrder.totalAmount,
            paymentMethod: selectedOrder.paymentMethod,
            paymentStatus: selectedOrder.paymentStatus,
            commissionAmount: selectedOrder.commission,
            sellerAmount: selectedOrder.sellerAmount,
            status: selectedOrder.rawStatus,
            operationalStatus: selectedOrder.status,
            items: selectedOrder.items || selectedOrder.products?.map(product => ({
              id: product.id,
              title: product.title,
              quantity: product.quantity,
              unitPrice: product.price,
              salePrice: product.price,
              sku: product.sku,
            })) || [],
            shippingAddress: selectedOrder.shippingAddress,
            shippingAddressJson: selectedOrder.shippingAddressJson,
            trackingCode: selectedOrder.trackingCode,
            dispatchSlotDate: selectedOrder.dispatchSlotDate,
            dispatchSlotWindow: selectedOrder.dispatchSlotWindow,
            dispatchNotes: selectedOrder.dispatchNotes,
            courierPartner: selectedOrder.courierPartner,
            refundStatus: selectedOrder.refundStatus,
            refundReason: selectedOrder.refundReason,
            refundAmount: selectedOrder.refundAmount,
            createdAt: selectedOrder.createdAt,
            deliveredAt: selectedOrder.deliveredAt,
            deliveryType: selectedOrder.deliveryType,
            trackingEvents: selectedOrder.trackingEvents,
          }}
          onStatusChange={(orderId, newStatus) => {
            handleStatusChange(orderId, newStatus);
          }}
        />
      )}
    </div>
  );
};

export default AdminOrderMonitoring;
