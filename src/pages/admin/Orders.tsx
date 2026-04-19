import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  Truck,
  CreditCard,
  User
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatAED, formatAEDPlain } from '../../lib/currency';
import { trackingAPI } from '../../services/api';
import { downloadOrderInvoicePdf, printOrderDocuments } from '../../lib/orderAdmin';

interface Order {
  id: string;
  orderId?: string;
  customerId: string;
  sellerId?: string;
  sellerName?: string;
  productTitle?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  subtotal?: number;
  totalAmount?: number;
  shippingCost?: number;
  vatAmount?: number;
  trackingCode?: string;
  pickupQrCode?: string;
  shippingAddress?: any;
  commission?: number;
  sellerAmount?: number;
  status: string;
  paymentStatus: string;
  riskLevel?: string;
  riskReasons?: string[];
  createdAt: string;
}

const statusLabelMap: Record<string, string> = {
  pending_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  packed: 'Packed',
  waiting_for_pickup: 'Waiting for Pickup',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  return_approved: 'Return Approved',
  returned: 'Returned',
  refund_review: 'Refund Review',
  refunded: 'Refunded',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await orderAPI.getAllOrders();
        if (!mounted) return;
        // sort by createdAt desc
        data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const reloadOrders = async () => {
    try {
      const data = await orderAPI.getAllOrders();
      data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleScanPickup = async (id: string) => {
    try {
      await trackingAPI.scanQR(id);
      await reloadOrders();
    } catch (error) {
      console.error('Failed to scan pickup QR', error);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      await trackingAPI.markDelivered(id);
      await reloadOrders();
    } catch (error) {
      console.error('Failed to mark order delivered', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(s) ||
      (order.orderId || '').toLowerCase().includes(s) ||
      (order.customerName || '').toLowerCase().includes(s) ||
      (order.customerEmail || '').toLowerCase().includes(s);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h2>
          <p className="text-slate-500 font-medium">Track and manage all marketplace transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none w-64"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="packed">Packed</option>
            <option value="waiting_for_pickup">Waiting for Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="return_requested">Return Requested</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
            <ShoppingCart size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">No orders found</h3>
          <p className="text-slate-500 font-medium mt-2">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer & Seller</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight">#EXS-{(order.orderId || order.id).slice(0, 12).toUpperCase()}</span>
                        <span className="mt-1 text-xs font-semibold text-slate-600">{order.productTitle || 'Marketplace Product'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2 font-bold">
                          <User size={14} className="text-slate-400" />
                          {order.customerName || `${order.customerId.slice(0, 8)}...`}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Truck size={13} className="text-slate-400" />
                          {order.sellerName || 'ExShopi Official'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <span className="block text-sm font-black text-slate-900">{formatAED(order.totalAmount ?? order.subtotal ?? 0)}</span>
                        <span className="block text-[11px] font-medium text-slate-500">
                          Shipping {formatAEDPlain(order.shippingCost ?? 0)} • VAT {formatAEDPlain(order.vatAmount ?? 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <span className={`
                          px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2
                          ${['completed', 'paid'].includes(order.paymentStatus) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                        `}>
                          <CreditCard size={12} />
                          {order.paymentStatus === 'cod_pending' ? 'COD Pending' : order.paymentStatus}
                        </span>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {order.paymentMethod || 'cod'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <span className={`
                          px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2
                          ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                            order.status === 'return_requested' || order.status === 'returned' ? 'bg-rose-100 text-rose-600' : 
                            order.status === 'cancelled' ? 'bg-slate-200 text-slate-700' :
                            'bg-violet-100 text-violet-600'}
                        `}>
                          <Truck size={12} />
                          {statusLabelMap[order.status] || order.status.replace(/_/g, ' ')}
                        </span>
                        {order.trackingCode && (
                          <div className="text-[11px] font-semibold text-slate-500">
                            Track: {order.trackingCode}
                          </div>
                        )}
                        {order.riskLevel === 'suspicious' && (
                          <div className="text-[11px] font-semibold text-rose-500">
                            Suspicious COD order
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => printOrderDocuments([{
                            ...order,
                            orderNumber: order.orderId || order.id,
                            deliveryFee: order.shippingCost,
                          }], 'compact')}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                          title="Print shipping label"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          onClick={() => downloadOrderInvoicePdf({
                            ...order,
                            orderNumber: order.orderId || order.id,
                            deliveryFee: order.shippingCost,
                            items: order.productTitle
                              ? [{
                                  id: order.id,
                                  title: order.productTitle,
                                  quantity: 1,
                                  unitPrice: Number(order.totalAmount ?? order.subtotal ?? 0),
                                }]
                              : [],
                          })}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                          title="Download invoice PDF"
                        >
                          <CreditCard size={18} />
                        </button>
                        {order.status === 'waiting_for_pickup' && (
                          <button
                            onClick={() => handleScanPickup(order.id)}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                          >
                            Scan Pickup
                          </button>
                        )}
                        {['picked_up', 'in_transit', 'out_for_delivery'].includes(order.status) && (
                          <button
                            onClick={() => handleMarkDelivered(order.id)}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
