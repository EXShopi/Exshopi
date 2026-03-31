import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Package,
  ExternalLink,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { orderAPI, productAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { formatAED } from '../../lib/currency';

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  totalAmount?: number;
  trackingCode?: string;
  paymentMethod?: string;
  deliveryEta?: string;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  status: string;
  createdAt: any;
  vendorEarning: number;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: any;
}

export function SellerOrders() {
  const { user } = useAuthStore();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    dispatchSlotDate: '',
    dispatchSlotWindow: '10:00 AM - 1:00 PM',
    dispatchNotes: '',
    courierPartner: 'ExShopi Logistics',
  });

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // find seller by user id
        const seller = await sellerAPI.getByUserId(user.id || (user as any).uid);
        if (!seller || !seller.id) {
          setOrderItems([]);
          setLoading(false);
          return;
        }

        const orders = await orderAPI.getSellerOrders(seller.id);
        // enrich with product title where possible
        const enriched = await Promise.all((orders || []).map(async (o: any) => {
          let prod: any = null;
          try { prod = await productAPI.get(o.productId); } catch (e) { prod = null; }
          return {
            id: o.id,
            orderId: o.orderId || o.id,
            productId: o.productId,
            title: o.productTitle || prod?.title || `Product ${o.productId}`,
            price: o.unitPrice || 0,
            quantity: o.quantity || 1,
            subtotal: o.subtotal || 0,
            totalAmount: o.totalAmount || o.subtotal || 0,
            trackingCode: o.trackingCode || '',
            paymentMethod: o.paymentMethod || 'cod',
            deliveryEta: o.deliveryEta || '',
            dispatchSlotDate: o.dispatchSlotDate || '',
            dispatchSlotWindow: o.dispatchSlotWindow || '',
            dispatchNotes: o.dispatchNotes || '',
            courierPartner: o.courierPartner || '',
            status: o.status,
            createdAt: o.createdAt,
            vendorEarning: o.sellerAmount || 0,
            customerName: o.customerName || '',
            customerEmail: o.customerEmail || '',
            shippingAddress: o.shippingAddress || {},
          } as OrderItem;
        }));

        enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrderItems(enriched);
      } catch (err) {
        console.error('Error loading seller orders:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedOrder) return;
    setDispatchForm({
      dispatchSlotDate: selectedOrder.dispatchSlotDate || '',
      dispatchSlotWindow: selectedOrder.dispatchSlotWindow || '10:00 AM - 1:00 PM',
      dispatchNotes: selectedOrder.dispatchNotes || '',
      courierPartner: selectedOrder.courierPartner || 'ExShopi Logistics',
    });
  }, [selectedOrder]);

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const updated = await orderAPI.updateStatus(itemId, newStatus);
      setOrderItems(prev => prev.map(it => it.id === itemId ? { ...it, status: updated.status } : it));
      if (selectedOrder?.id === itemId) setSelectedOrder(prev => prev ? { ...prev, status: updated.status } : null);
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleScheduleDispatch = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await orderAPI.updateDispatchSlot(selectedOrder.id, {
        ...dispatchForm,
        status: 'pickup_scheduled',
      });
      setOrderItems(prev => prev.map(it => it.id === selectedOrder.id ? { ...it, ...updated } : it));
      setSelectedOrder(prev => prev ? { ...prev, ...updated } : null);
    } catch (error) {
      console.error('Dispatch scheduling error:', error);
    }
  };

  const filteredItems = orderItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_transit':
      case 'out_for_delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'packed':
      case 'pickup_scheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'return_requested':
      case 'returned':
      case 'failed': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Order Management</h2>
          <p className="text-slate-500 font-medium mt-1">Track and fulfill your customer orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Product or Customer..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="placed">Placed</option>
                  <option value="packed">Packed</option>
                  <option value="pickup_scheduled">Pickup Scheduled</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="return_requested">Return Requested</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                  <p className="text-slate-500 text-sm mt-1">When customers buy your products, they will appear here.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedOrder(item)}
                    className={`p-6 cursor-pointer transition-all hover:bg-slate-50/50 ${selectedOrder?.id === item.id ? 'bg-violet-50/50 border-l-4 border-l-violet-600' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          #{item.orderId.slice(0, 8)}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Item
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                        <p className="text-sm text-slate-500 font-medium">Qty: {item.quantity} × {formatAED(item.price, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</p>
                        <p className="text-sm font-black text-violet-600 mt-1">Earning: {formatAED(item.vendorEarning || 0, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {selectedOrder ? (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 sticky top-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Details</h3>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <User className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-bold">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-medium">{selectedOrder.customerEmail}</span>
                    </div>
                    {selectedOrder.shippingAddress?.phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-medium">{selectedOrder.shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shipping Address</h4>
                  <div className="flex gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-violet-500 flex-shrink-0 mt-1" />
                    <div className="text-sm font-medium leading-relaxed">
                      <p>{selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.address || selectedOrder.shippingAddress || 'Address pending'}</p>
                      <p>{selectedOrder.shippingAddress?.city || ''}{selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ''}</p>
                      <p>{selectedOrder.shippingAddress?.country || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shipping & Payment</h4>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900">Tracking</p>
                      <p className="mt-1 text-slate-600">{selectedOrder.trackingCode || 'Will be generated automatically'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900">Payment</p>
                      <p className="mt-1 text-slate-600 uppercase">{selectedOrder.paymentMethod || 'cod'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900">Delivery ETA</p>
                      <p className="mt-1 text-slate-600">{selectedOrder.deliveryEta || 'To be confirmed'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900">Dispatch Slot</p>
                      <p className="mt-1 text-slate-600">
                        {selectedOrder.dispatchSlotDate ? `${selectedOrder.dispatchSlotDate} · ${selectedOrder.dispatchSlotWindow}` : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dispatch Scheduling</h4>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <input
                      type="date"
                      value={dispatchForm.dispatchSlotDate}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, dispatchSlotDate: e.target.value }))}
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 outline-none focus:border-violet-500"
                    />
                    <select
                      value={dispatchForm.dispatchSlotWindow}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, dispatchSlotWindow: e.target.value }))}
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 outline-none focus:border-violet-500"
                    >
                      <option>10:00 AM - 1:00 PM</option>
                      <option>1:00 PM - 4:00 PM</option>
                      <option>4:00 PM - 8:00 PM</option>
                    </select>
                    <input
                      type="text"
                      value={dispatchForm.courierPartner}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, courierPartner: e.target.value }))}
                      placeholder="Courier partner"
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 outline-none focus:border-violet-500"
                    />
                    <textarea
                      value={dispatchForm.dispatchNotes}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, dispatchNotes: e.target.value }))}
                      placeholder="Pickup notes, package readiness, handoff details"
                      rows={3}
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 outline-none focus:border-violet-500 resize-none"
                    />
                    <button
                      onClick={handleScheduleDispatch}
                      className="rounded-2xl bg-violet-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                    >
                      Schedule Pickup Slot
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'packed')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedOrder.status === 'packed' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}
                    >
                      <Clock className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-black uppercase">Pack</span>
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'pickup_scheduled')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedOrder.status === 'pickup_scheduled' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}
                    >
                      <Truck className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-black uppercase">Dispatch</span>
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'handed_to_partner')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedOrder.status === 'handed_to_partner' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}
                    >
                      <CheckCircle2 className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-black uppercase">Handoff</span>
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedOrder.status === 'delivered' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 hover:border-slate-200 text-slate-400'}`}
                    >
                      <XCircle className="w-5 h-5 mb-2" />
                      <span className="text-[10px] font-black uppercase">Deliver</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Eye className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-slate-900 font-bold">Select an order</h4>
              <p className="text-slate-400 text-sm mt-1">Click on an order to view full details and manage fulfillment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
