import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Download,
  Eye,
  Filter,
  Mail,
  Package2,
  Phone,
  Printer,
  Search,
  ShieldAlert,
  Truck,
  Wallet,
} from 'lucide-react';
import { OrderDetailsModal } from '../../components/OrderDetails';
import { formatAED } from '../../lib/currency';
import {
  AdminOrderLike,
  copyToClipboard,
  exportOrdersCsv,
  formatOrderDateTime,
  printOrderDocuments,
} from '../../lib/orderAdmin';
import { orderAPI } from '../../services/api';

type CanonicalOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

type QuickFilterKey =
  | 'all'
  | 'new'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'refunded'
  | 'cod'
  | 'high_value'
  | 'needs_action';

interface Order extends AdminOrderLike {
  customerId: string;
  sellerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerName: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    salePrice?: number;
    sku?: string;
    image?: string;
  }>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  commission: number;
  sellerAmount: number;
  status: CanonicalOrderStatus;
  rawStatus: string;
  operationalStatus?: string;
  trackingCode: string;
  createdAt: string;
  paymentStatus?: string;
  deliveryType?: string;
  riskLevel?: string;
  riskReasons?: string[];
  refundStatus?: string;
  refundReason?: string;
  refundAmount?: number;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  deliveredAt?: string;
  itemsCount: number;
  sellerType: 'official' | 'vendor';
}

const STATUS_LABELS: Record<CanonicalOrderStatus, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  processing: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_TONES: Record<CanonicalOrderStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  shipped: 'bg-amber-50 text-amber-700 border-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-rose-50 text-rose-700 border-rose-200',
};

function normalizeOrderStatus(value: unknown, refundStatus?: unknown): CanonicalOrderStatus {
  const status = String(value || '').toLowerCase();
  const refund = String(refundStatus || '').toLowerCase();

  if (['approved', 'completed', 'refunded'].includes(refund)) return 'refunded';
  if (['returned', 'return_requested', 'refund_requested', 'refunded'].includes(status)) return 'refunded';
  if (['cancelled', 'failed'].includes(status)) return 'cancelled';
  if (status === 'delivered') return 'delivered';
  if (['handed_to_partner', 'in_transit', 'picked_up', 'shipped', 'out_for_delivery'].includes(status)) return 'shipped';
  if (['packed', 'pickup_scheduled', 'waiting_for_pickup', 'processing', 'ready_to_ship'].includes(status))
    return 'processing';
  if (['confirmed', 'approved'].includes(status)) return 'confirmed';
  return 'pending';
}

const normalizeOrder = (order: any): Order => {
  const normalizedItems =
    Array.isArray(order.items) && order.items.length
      ? order.items.map((item: any) => ({
          id: item.id || item.productId || String(order.id || ''),
          title: item.productTitle || item.title || 'Marketplace Product',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || item.salePrice || 0),
          salePrice: Number(item.salePrice || item.unitPrice || 0),
          sku: item.sku || '',
          image: item.image || '',
        }))
      : Array.isArray(order.products) && order.products.length
      ? order.products.map((item: any) => ({
          id: item.id || item.productId || String(order.id || ''),
          title: item.title || 'Marketplace Product',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.price || item.unitPrice || 0),
          salePrice: Number(item.price || item.unitPrice || 0),
          sku: item.sku || '',
          image: item.image || '',
        }))
      : [];

  const canonicalStatus = normalizeOrderStatus(order.operationalStatus || order.status, order.refundStatus);
  const sellerName = order.sellerName || order.seller?.storeName || 'ExShopi Official';
  const itemsCount = normalizedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return {
    ...order,
    id: String(order.id || ''),
    orderNumber: order.orderNumber || String(order.id || '').slice(-8),
    customerId: String(order.customerId || ''),
    sellerId: String(order.sellerId || ''),
    customerName: order.customerName || 'Customer',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    sellerName,
    sellerStoreSlug: order.sellerStoreSlug || order.seller?.storeSlug || '',
    items: normalizedItems,
    subtotal: Number(order.subtotal || 0),
    vatAmount: Number(order.vatAmount || 0),
    totalAmount: Number(order.totalAmount || order.total || order.subtotal || 0),
    deliveryFee: Number(order.deliveryFee || order.shippingCost || 0),
    paymentMethod: String(order.paymentMethod || 'cod'),
    commission: Number(order.commission || order.commissionAmount || 0),
    sellerAmount: Number(
      order.sellerAmount || Math.max(Number(order.subtotal || 0) - Number(order.commission || 0), 0)
    ),
    status: canonicalStatus,
    rawStatus: String(order.operationalStatus || order.status || 'pending'),
    operationalStatus: order.operationalStatus || order.status,
    trackingCode: order.trackingCode || `TRK-${String(order.id || '').slice(-8)}`,
    createdAt: order.createdAt || new Date().toISOString(),
    paymentStatus: order.paymentStatus || 'pending',
    deliveryType: order.deliveryType || 'Standard Delivery',
    riskLevel: order.riskLevel || 'normal',
    riskReasons: Array.isArray(order.riskReasons) ? order.riskReasons : [],
    refundStatus: order.refundStatus || 'none',
    refundReason: order.refundReason || '',
    refundAmount: Number(order.refundAmount || 0),
    dispatchSlotDate: order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '',
    dispatchNotes: order.dispatchNotes || '',
    courierPartner: order.courierPartner || '',
    deliveredAt: order.deliveredAt || '',
    shippingAddress: order.shippingAddress,
    shippingAddressJson: order.shippingAddressJson,
    barcodeReference: order.barcodeReference,
    trackingEvents: Array.isArray(order.trackingEvents) ? order.trackingEvents : [],
    itemsCount,
    sellerType: sellerName.toLowerCase().includes('exshopi') ? 'official' : 'vendor',
  };
};

const quickFilters: Array<{ key: QuickFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'returned', label: 'Returned' },
  { key: 'refunded', label: 'Refunded' },
  { key: 'cod', label: 'COD' },
  { key: 'high_value', label: 'High Value' },
  { key: 'needs_action', label: 'Needs Action' },
];

export default function AdminOrderMonitoring() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CanonicalOrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>('all');
  const [actionBanner, setActionBanner] = useState<string>('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const rawOrders = await orderAPI.getAllOrders();
        setOrders(Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/stream');

      const refreshOrder = async (id: string, mode: 'create' | 'update') => {
        const raw = await orderAPI.get(id);
        const next = normalizeOrder(raw);
        setOrders((prev) =>
          mode === 'create'
            ? [next, ...prev.filter((item) => item.id !== next.id)]
            : prev.map((item) => (item.id === next.id ? next : item))
        );
        setSelectedOrder((prev) => (prev?.id === next.id ? next : prev));
      };

      es.addEventListener('order-created', ((event: MessageEvent) => {
        const payload = JSON.parse(event.data || '{}');
        if (payload?.id) refreshOrder(payload.id, 'create').catch(() => undefined);
      }) as EventListener);

      es.addEventListener('order-updated', ((event: MessageEvent) => {
        const payload = JSON.parse(event.data || '{}');
        if (payload?.id) refreshOrder(payload.id, 'update').catch(() => undefined);
      }) as EventListener);
    } catch {
      //
    }

    return () => {
      try {
        es?.close();
      } catch {
        //
      }
    };
  }, []);

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter((order) =>
        [
          order.id,
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.sellerName,
          order.trackingCode,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') list = list.filter((order) => order.status === statusFilter);
    if (paymentFilter !== 'all') list = list.filter((order) => String(order.paymentMethod).toLowerCase() === paymentFilter);
    if (deliveryFilter !== 'all') list = list.filter((order) => String(order.deliveryType || '').toLowerCase() === deliveryFilter);
    if (sellerTypeFilter !== 'all') list = list.filter((order) => order.sellerType === sellerTypeFilter);
    if (riskFilter !== 'all') {
      list = list.filter((order) =>
        riskFilter === 'flagged'
          ? order.riskLevel === 'suspicious' || order.refundStatus === 'requested'
          : order.refundStatus === 'requested' || order.status === 'refunded'
      );
    }
    if (dateFrom) list = list.filter((order) => new Date(order.createdAt).getTime() >= new Date(dateFrom).getTime());
    if (dateTo) list = list.filter((order) => new Date(order.createdAt).getTime() <= new Date(`${dateTo}T23:59:59`).getTime());

    switch (quickFilter) {
      case 'new':
        list = list.filter((order) => order.status === 'pending');
        break;
      case 'confirmed':
        list = list.filter((order) => order.status === 'confirmed');
        break;
      case 'packed':
        list = list.filter((order) => order.status === 'processing');
        break;
      case 'shipped':
        list = list.filter((order) => order.status === 'shipped');
        break;
      case 'delivered':
        list = list.filter((order) => order.status === 'delivered');
        break;
      case 'returned':
        list = list.filter((order) => order.rawStatus.includes('return') || order.refundStatus === 'requested');
        break;
      case 'refunded':
        list = list.filter((order) => order.status === 'refunded' || order.refundStatus === 'refunded');
        break;
      case 'cod':
        list = list.filter((order) => String(order.paymentMethod).toLowerCase() === 'cod');
        break;
      case 'high_value':
        list = list.filter((order) => Number(order.totalAmount) >= 1500);
        break;
      case 'needs_action':
        list = list.filter(
          (order) =>
            order.riskLevel === 'suspicious' ||
            order.refundStatus === 'requested' ||
            ['pending', 'confirmed', 'processing'].includes(order.status)
        );
        break;
      default:
        break;
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, query, statusFilter, paymentFilter, deliveryFilter, sellerTypeFilter, riskFilter, dateFrom, dateTo, quickFilter]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)),
    [orders, selectedIds]
  );

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalCommission = orders.reduce((sum, order) => sum + Number(order.commission || 0), 0);
    const inProgress = orders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status)).length;
    const dispatchQueue = orders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).length;
    const riskFlags = orders.filter((order) => order.riskLevel === 'suspicious' || order.refundStatus === 'requested').length;
    const deliveredToday = orders.filter((order) => {
      if (!order.deliveredAt || order.status !== 'delivered') return false;
      const today = new Date();
      const deliveredAt = new Date(order.deliveredAt);
      return deliveredAt.toDateString() === today.toDateString();
    }).length;

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCommission,
      averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
      inProgress,
      deliveredToday,
      dispatchQueue,
      riskFlags,
      payoutExposure: orders.reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0),
    };
  }, [orders]);

  const dispatchQueueOrders = useMemo(
    () => orders.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status)).slice(0, 6),
    [orders]
  );

  const riskOrders = useMemo(
    () =>
      orders
        .filter((order) => order.riskLevel === 'suspicious' || order.refundStatus === 'requested' || order.status === 'refunded')
        .slice(0, 6),
    [orders]
  );

  const syncUpdatedOrder = (updated: any) => {
    const normalized = normalizeOrder(updated);
    setOrders((prev) => prev.map((order) => (order.id === normalized.id ? normalized : order)));
    setSelectedOrder((prev) => (prev?.id === normalized.id ? normalized : prev));
  };

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const updated = await orderAPI.updateStatus(orderId, newStatus);
    syncUpdatedOrder(updated);
  };

  const handleDispatchUpdate = async (
    orderId: string,
    payload: {
      dispatchSlotDate?: string;
      dispatchSlotWindow?: string;
      dispatchNotes?: string;
      courierPartner?: string;
      status?: string;
    }
  ) => {
    const updated = await orderAPI.updateDispatchSlot(orderId, payload);
    syncUpdatedOrder(updated);
  };

  const handleRefundAction = async (action: 'approve' | 'reject') => {
    if (!selectedOrder) return;
    const updated = await orderAPI.processRefund(selectedOrder.id, {
      action,
      refundAmount: selectedOrder.refundAmount || selectedOrder.totalAmount,
      reason: action === 'approve' ? 'Approved by admin operations' : 'Rejected by admin operations',
    });
    syncUpdatedOrder(updated);
  };

  const handleBulkStatus = async (status: string, label: string) => {
    if (!selectedOrders.length) return;
    await Promise.all(selectedOrders.map((order) => orderAPI.updateStatus(order.id, status)));
    const nextRawOrders = await orderAPI.getAllOrders();
    setOrders(Array.isArray(nextRawOrders) ? nextRawOrders.map(normalizeOrder) : []);
    setActionBanner(`${label} applied to ${selectedOrders.length} orders.`);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredOrders.map((order) => order.id));
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const statusPill = (order: Order) => (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${STATUS_TONES[order.status]}`}
    >
      {STATUS_LABELS[order.status]}
    </span>
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Loading order operations workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-[2.2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-700 p-8 text-white shadow-2xl shadow-blue-200/20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
              <Truck className="h-4 w-4" />
              Premium Order Control Center
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Marketplace Order Operations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/90">
              Run confirmation, packing, dispatch, delivery, refunds, tracking, and payout visibility from one refined operations workspace built on live ExShopi order data.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ['Total orders', `${stats.totalOrders}`],
                ['Needs action', `${stats.inProgress}`],
                ['Delivered today', `${stats.deliveredToday}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">{label}</p>
                  <p className="mt-3 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Revenue', formatAED(stats.totalRevenue), Wallet, 'from-emerald-500/15 to-emerald-50 text-emerald-700'],
            ['Commissions', formatAED(stats.totalCommission), Wallet, 'from-blue-500/15 to-blue-50 text-blue-700'],
            ['Dispatch Queue', `${stats.dispatchQueue}`, Truck, 'from-amber-500/15 to-amber-50 text-amber-700'],
            ['Risk Flags', `${stats.riskFlags}`, ShieldAlert, 'from-rose-500/15 to-rose-50 text-rose-700'],
            ['Average Order', formatAED(stats.averageOrderValue), Package2, 'from-slate-500/15 to-slate-50 text-slate-700'],
            ['Payout Exposure', formatAED(stats.payoutExposure), AlertTriangle, 'from-violet-500/15 to-violet-50 text-violet-700'],
          ].map(([label, value, Icon, tone]: any) => (
            <div key={label} className={`rounded-[1.75rem] border border-slate-200 bg-gradient-to-br ${tone} p-5 shadow-sm`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Filters & search</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Fulfillment workspace</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Search by order ID, customer, seller, phone, or tracking. Layer operational filters for COD, vendor/official, date range, and refund/risk review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportOrdersCsv(selectedOrders.length ? selectedOrders : filteredOrders)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export {selectedOrders.length ? 'Selected' : 'Visible'}
            </button>
            <button
              onClick={() => printOrderDocuments(selectedOrders.length ? selectedOrders : filteredOrders.slice(0, 5), 'a4')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_repeat(5,minmax(0,0.8fr))]">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order ID, customer, seller, tracking code, or phone"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="pending">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option value="all">Payment</option>
            <option value="cod">COD</option>
            <option value="card">Card</option>
          </select>
          <select value={deliveryFilter} onChange={(event) => setDeliveryFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option value="all">Delivery Type</option>
            {Array.from(new Set(orders.map((order) => String(order.deliveryType || '').toLowerCase()).filter(Boolean))).map((value) => (
              <option key={value} value={value}>
                {value.replace(/\b\w/g, (match) => match.toUpperCase())}
              </option>
            ))}
          </select>
          <select value={sellerTypeFilter} onChange={(event) => setSellerTypeFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option value="all">Seller Type</option>
            <option value="official">Official</option>
            <option value="vendor">Vendor</option>
          </select>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
            <option value="all">Risk / Refund</option>
            <option value="flagged">Risk flagged</option>
            <option value="refunds">Refunds</option>
          </select>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Date From</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-2 w-full bg-transparent text-sm font-bold text-slate-700 outline-none" />
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Date To</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-2 w-full bg-transparent text-sm font-bold text-slate-700 outline-none" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <button
                key={item.key}
                onClick={() => setQuickFilter(item.key)}
                className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                  quickFilter === item.key
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setDeliveryFilter('all');
              setSellerTypeFilter('all');
              setRiskFilter('all');
              setDateFrom('');
              setDateTo('');
              setQuickFilter('all');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Reset
          </button>
        </div>
      </section>

      {actionBanner ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {actionBanner}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Orders table</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Order execution queue</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">{filteredOrders.length} visible orders • {selectedIds.length} selected</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleBulkStatus('confirmed', 'Confirmed')} disabled={!selectedIds.length} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-600">Confirm</button>
              <button onClick={() => handleBulkStatus('packed', 'Packed')} disabled={!selectedIds.length} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">Pack</button>
              <button onClick={() => handleBulkStatus('in_transit', 'Shipped')} disabled={!selectedIds.length} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">Ship</button>
              <button onClick={() => handleBulkStatus('delivered', 'Delivered')} disabled={!selectedIds.length} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">Deliver</button>
              <button onClick={() => printOrderDocuments(selectedOrders, 'a4')} disabled={!selectedIds.length} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">Print Labels</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1460px] w-full">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    '',
                    'Order ID',
                    'Date / Time',
                    'Customer',
                    'Phone',
                    'Seller',
                    'Items',
                    'Total',
                    'Commission',
                    'Payment',
                    'Delivery',
                    'Status',
                    'Tracking',
                    'Risk',
                    'Action',
                  ].map((label, index) => (
                    <th key={`${label}-${index}`} className={`px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ${index === 0 ? 'w-12' : ''}`}>
                      {index === 0 ? (
                        <input type="checkbox" checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300" />
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-16 text-center">
                      <p className="text-lg font-black tracking-tight text-slate-900">No matching orders</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Adjust the search terms or filters to widen the queue.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isUrgent =
                      order.riskLevel === 'suspicious' ||
                      order.refundStatus === 'requested' ||
                      (order.status === 'pending' && Number(order.totalAmount) >= 1500);

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-slate-200 transition hover:bg-slate-50/90 ${
                          isUrgent ? 'bg-rose-50/40' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-4 align-top">
                          <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <p className="font-black text-slate-900">{order.orderNumber || order.id}</p>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => copyToClipboard(order.orderNumber || order.id, 'Order ID copied')} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">Copy</button>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${order.sellerType === 'official' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {order.sellerType}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-slate-700">{formatOrderDateTime(order.createdAt)}</td>
                        <td className="px-4 py-4 align-top">
                          <p className="font-bold text-slate-900">{order.customerName}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{order.customerEmail || 'No email'}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-700">
                            <Phone className="h-4 w-4" />
                            {order.customerPhone || 'No phone'}
                          </a>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="font-bold text-slate-900">{order.sellerName}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">Payout {formatAED(order.sellerAmount)}</p>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-black text-slate-900">{order.itemsCount}</td>
                        <td className="px-4 py-4 align-top text-sm font-black text-slate-900">{formatAED(order.totalAmount)}</td>
                        <td className="px-4 py-4 align-top text-sm font-black text-slate-900">{formatAED(order.commission)}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <p className="text-sm font-black text-slate-900">{String(order.paymentMethod).toUpperCase()}</p>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{order.paymentStatus || 'pending'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-bold text-slate-700">{order.deliveryType}</td>
                        <td className="px-4 py-4 align-top">{statusPill(order)}</td>
                        <td className="px-4 py-4 align-top">
                          <button onClick={() => copyToClipboard(order.trackingCode, 'Tracking code copied')} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-700 hover:bg-white">
                            {order.trackingCode}
                          </button>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {isUrgent ? (
                            <div className="space-y-2">
                              <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                                Needs review
                              </span>
                              <p className="text-xs font-bold text-rose-800">
                                {order.refundStatus === 'requested'
                                  ? 'Refund requested'
                                  : order.riskLevel === 'suspicious'
                                  ? 'Risk flagged'
                                  : 'High value'}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => openOrder(order)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-600">
                              <Eye className="h-4 w-4" />
                              Open
                            </button>
                            <a href={`mailto:${order.customerEmail}`} className="inline-flex items-center rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                              <Mail className="h-4 w-4" />
                            </a>
                            <button onClick={() => printOrderDocuments([order], 'compact')} className="inline-flex items-center rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Dispatch queue</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Next handoffs</h3>
              </div>
              <span className="rounded-full bg-amber-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
                {dispatchQueueOrders.length} live
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {dispatchQueueOrders.length ? (
                dispatchQueueOrders.map((order) => (
                  <button key={order.id} onClick={() => openOrder(order)} className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{order.orderNumber || order.id}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{order.sellerName} • {order.customerName}</p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Pending: {order.status === 'pending' ? 'Confirm order' : order.status === 'confirmed' ? 'Pack order' : 'Prepare dispatch'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                  Dispatch queue is clear right now.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Risk & refunds</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Alerts</h3>
              </div>
              <span className="rounded-full bg-rose-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-rose-700">
                {riskOrders.length} flagged
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {riskOrders.length ? (
                riskOrders.map((order) => (
                  <button key={order.id} onClick={() => openOrder(order)} className="w-full rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-left transition hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{order.orderNumber || order.id}</p>
                        <p className="mt-1 text-sm font-medium text-slate-600">{order.customerName} • {order.sellerName}</p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700">
                          {order.refundStatus === 'requested'
                            ? 'Refund review needed'
                            : order.riskLevel === 'suspicious'
                            ? 'Risk review needed'
                            : 'Refunded / returned'}
                        </p>
                      </div>
                      <ShieldAlert className="h-5 w-5 text-rose-600" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                  No active refund or risk alerts detected.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {selectedOrder ? (
        <OrderDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          order={{
            ...selectedOrder,
            orderNumber: selectedOrder.orderNumber || selectedOrder.id,
            commissionAmount: selectedOrder.commission,
          }}
          onStatusChange={handleStatusChange}
          onUpdateDispatch={handleDispatchUpdate}
          onProcessRefund={handleRefundAction}
        />
      ) : null}
    </div>
  );
}
