import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { orderAPI, sellerAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';
import { printOrderSlip } from '../../lib/orderPrint';

const formatDateSafe = (value: any) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusLabelMap: Record<string, string> = {
  pending_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  packed: 'Packed',
  ready_for_pickup: 'Ready for Pickup',
  waiting_for_pickup: 'Waiting for Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  return_requested: 'Return Requested',
  cancelled: 'Cancelled',
};

const statusToneMap: Record<string, string> = {
  pending_confirmation: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-sky-100 text-sky-700',
  packed: 'bg-violet-100 text-violet-700',
  ready_for_pickup: 'bg-amber-100 text-amber-700',
  waiting_for_pickup: 'bg-orange-100 text-orange-700',
  picked_up: 'bg-cyan-100 text-cyan-700',
  in_transit: 'bg-sky-100 text-sky-700',
  out_for_delivery: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  return_requested: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-700',
};

const orderStatusFilters = [
  'all',
  'pending_confirmation',
  'confirmed',
  'preparing',
  'packed',
  'waiting_for_pickup',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'return_requested',
  'cancelled',
];

function normalizeOrder(order: any) {
  return {
    ...order,
    id: String(order?.id || ''),
    orderId: order?.orderId || order?.id || 'N/A',
    customerName: order?.customerName || 'Marketplace Customer',
    paymentMethod: order?.paymentMethod || 'COD',
    sellerAmount: Number(order?.sellerAmount || 0),
    commission: Number(order?.commission || 0),
    totalAmount: Number(order?.totalAmount || order?.price || 0),
    quantity: Number(order?.quantity || 1),
    status: order?.status || 'pending_confirmation',
    productSummary:
      order?.products?.map((item: any) => item?.title).filter(Boolean).join(', ') ||
      order?.product?.title ||
      'Product',
    emirate:
      order?.shippingAddress?.city ||
      order?.shippingAddress?.emirate ||
      order?.shippingAddress?.area ||
      order?.deliveryCity ||
      'UAE',
    courierPartner: order?.courierPartner || 'Pending assignment',
    estimatedDelivery: order?.deliveryEta || order?.estimatedDelivery || null,
    dispatchSlotDate: order?.dispatchSlotDate || null,
    dispatchSlotWindow: order?.dispatchSlotWindow || null,
    trackingCode: order?.trackingCode || 'Pending',
    pickupQrCode: order?.pickupQrCode || order?.trackingCode || '',
    shippingAddress: order?.shippingAddress || {},
    paymentStatus: order?.paymentStatus || 'cod_pending',
    sellerName: order?.sellerName || 'ExShopi Official',
  };
}

export default function SellerOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const userId = user?.id || (user as any)?.uid || '';
        if (!userId) return;
        const seller =
          (await sellerAPI.getMyStore().catch(() => null)) ||
          (await sellerAPI.getByUserId(userId));
        const sellerId = seller?.id;
        if (!sellerId) return;
        const sellerOrders = await orderAPI.getSellerOrders(sellerId);
        setOrders(Array.isArray(sellerOrders) ? sellerOrders.map(normalizeOrder) : []);
      } catch (error) {
        console.error('Error loading seller orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        String(order.orderId || '').toLowerCase().includes(search) ||
        String(order.customerName || '').toLowerCase().includes(search) ||
        String(order.productSummary || '').toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const orderMetrics = useMemo(() => {
    const liveOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;
    const dispatchQueue = orders.filter((order) => ['confirmed', 'preparing', 'packed', 'waiting_for_pickup'].includes(order.status)).length;
    const returnRequests = orders.filter((order) => order.status === 'return_requested').length;
    const payoutEligible = orders.filter((order) => order.status === 'delivered').reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0);
    return { liveOrders, dispatchQueue, returnRequests, payoutEligible };
  }, [orders]);

  const pendingHandoffs = orders.filter((order) => ['packed', 'waiting_for_pickup'].includes(order.status)).slice(0, 5);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders((current) => current.map((order) => (order.id === orderId ? normalizeOrder({ ...order, status, updatedAt: new Date().toISOString() }) : order)));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const scheduleDispatch = async (orderId: string) => {
    const dispatchSlotDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    try {
      const updated = await orderAPI.updateDispatchSlot(orderId, {
        dispatchSlotDate,
        dispatchSlotWindow: '10:00 AM - 02:00 PM',
        courierPartner: 'ExShopi Logistics',
        dispatchNotes: 'Seller scheduled pickup from dashboard',
        status: 'waiting_for_pickup',
      });
      setOrders((current) => current.map((order) => (order.id === orderId ? normalizeOrder(updated) : order)));
    } catch (error) {
      console.error('Failed to schedule dispatch slot:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#60a5fa] p-8 text-white shadow-2xl shadow-blue-200/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
                <Truck size={14} />
                Fulfillment Center
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">Seller Order Workspace</h1>
              <p className="mt-3 text-sm leading-7 text-blue-100/90">
                Handle confirmations, packing, pickup scheduling, and payout-ready orders in one dense operations view built for UAE marketplace sellers.
              </p>
            </div>
            <div className="grid min-w-[240px] gap-4 rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">Dispatch Queue</p>
                <p className="mt-2 text-3xl font-black">{orderMetrics.dispatchQueue}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">Payout Eligible</p>
                <p className="mt-2 text-2xl font-black">{formatAED(orderMetrics.payoutEligible)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Live Orders', orderMetrics.liveOrders, ShoppingIcon],
            ['Return Requests', orderMetrics.returnRequests, CircleAlert],
            ['Pending Handoffs', pendingHandoffs.length, Package],
            ['Delivered This Cycle', orders.filter((order) => order.status === 'delivered').length, CheckCircle2],
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

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Orders Fulfillment Center</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Dense order table with status, dispatch, and payout visibility.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Search order ID, customer, product..."
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {orderStatusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {status === 'all' ? 'All Orders' : statusLabelMap[status] || status}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Order</th>
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Products</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Amounts</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{order.orderId}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{formatDateSafe(order.createdAt)}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{order.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Qty {order.quantity}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-[220px] text-sm font-bold text-slate-900">{order.productSummary}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Tracking: {order.trackingCode}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{order.emirate}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          ETA {formatDateSafe(order.estimatedDelivery)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-slate-900">{formatAED(order.totalAmount)}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Commission {formatAED(order.commission)}</p>
                        <p className="mt-1 text-xs font-black text-emerald-700">Your earning {formatAED(order.sellerAmount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${statusToneMap[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {statusLabelMap[order.status] || order.status}
                        </span>
                        {order.dispatchSlotDate && (
                          <p className="mt-2 text-xs font-medium text-slate-500">
                            Pickup {formatDateSafe(order.dispatchSlotDate)} {order.dispatchSlotWindow ? `• ${order.dispatchSlotWindow}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {order.status === 'pending_confirmation' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'packed')}
                              className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white"
                            >
                              Mark Packed
                            </button>
                          )}
                          {['packed', 'waiting_for_pickup'].includes(order.status) && (
                            <button
                              onClick={() => scheduleDispatch(order.id)}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                            >
                              Ready for Pickup
                            </button>
                          )}
                          <button
                            onClick={() => printOrderSlip(order, 'pickup')}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                          >
                            Print Pickup Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filteredOrders.length === 0 && (
              <div className="bg-white px-6 py-16 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-lg font-black text-slate-900">No orders found</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Orders will appear here with dispatch and payout details as soon as customers place them.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Truck className="text-blue-600" size={18} />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Dispatch Queue</h3>
            </div>
            <div className="mt-5 space-y-3">
              {pendingHandoffs.map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-900">{order.orderId}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{order.productSummary}</p>
                    </div>
                    <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${statusToneMap[order.status] || 'bg-slate-100 text-slate-700'}`}>
                      {statusLabelMap[order.status] || order.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => scheduleDispatch(order.id)}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                    >
                      Schedule Pickup
                    </button>
                    <button
                      onClick={() => printOrderSlip(order, 'pickup')}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      Print Slip
                    </button>
                  </div>
                </div>
              ))}
              {pendingHandoffs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-medium text-slate-500">
                  No pending handoffs right now. Packed and ready-for-pickup orders will appear here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-600" size={18} />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Seller Operations Notes</h3>
            </div>
            <div className="mt-5 space-y-3">
              {[
                'Confirm new orders quickly to improve store health.',
                'Packed orders should be moved to pickup scheduling before cutoff.',
                'Delivered orders become payout eligible after settlement checks.',
              ].map((note) => (
                <div key={note} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShoppingIcon(props: any) {
  return <Wallet {...props} />;
}
