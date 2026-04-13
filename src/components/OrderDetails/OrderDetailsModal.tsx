import React, { useState, useEffect } from 'react';
import { 
  X, Download, Printer, CheckCircle, Clock, Truck, AlertCircle, 
  Package, ShoppingCart, MapPin, Phone, Mail, User, DollarSign,
  Calendar, BarChart, Anchor
} from 'lucide-react';
import { formatAED } from '../../lib/currency';
import { OrderDetailsShippingLabel } from './OrderDetailsShippingLabel';
import { OrderStatusTimeline } from './OrderStatusTimeline';

export interface OrderDetailsData {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  commissionAmount?: number;
  sellerAmount?: number;
  status: string;
  operationalStatus?: string;
  refundStatus?: string;
  deliveryType?: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    salePrice?: number;
    sku?: string;
  }>;
  shippingAddress: {
    emirate?: string;
    area?: string;
    building?: string;
    flat?: string;
    addressLine?: string;
    landmark?: string;
  };
  trackingCode?: string;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  refundReason?: string;
  refundAmount?: number;
  createdAt: string;
  placedAt?: string;
  deliveredAt?: string;
  shippingAddressJson?: any;
  trackingEvents?: Array<{
    id: string;
    status: string;
    timestamp: string;
    notes?: string;
    location?: string;
  }>;
}

interface OrderDetailsModalProps {
  order: OrderDetailsData;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onPrintLabel?: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onPrintLabel,
}) => {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'label'>('overview');

  if (!isOpen || !order) return null;

  const getStatusColor = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('delivered')) return 'text-emerald-600 bg-emerald-50';
    if (statusLower.includes('cancelled')) return 'text-rose-600 bg-rose-50';
    if (statusLower.includes('refunded') || statusLower.includes('return')) return 'text-rose-600 bg-rose-50';
    if (statusLower.includes('shipped') || statusLower.includes('transit') || statusLower.includes('dispatch')) return 'text-amber-600 bg-amber-50';
    if (statusLower.includes('confirmed') || statusLower.includes('packed')) return 'text-blue-600 bg-blue-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('delivered')) return <CheckCircle size={16} />;
    if (statusLower.includes('transit')) return <Truck size={16} />;
    if (statusLower.includes('packed') || statusLower.includes('ready')) return <Package size={16} />;
    return <Clock size={16} />;
  };

  const handleActionClick = (action: string) => {
    if (onStatusChange) {
      onStatusChange(order.id, action);
    }
  };

  const shipmentAddress = order.shippingAddressJson 
    ? (typeof order.shippingAddressJson === 'string' ? JSON.parse(order.shippingAddressJson) : order.shippingAddressJson)
    : order.shippingAddress || {};

  const fullAddress = [
    shipmentAddress.addressLine || '',
    shipmentAddress.building || '',
    shipmentAddress.flat || '',
    shipmentAddress.area || '',
    shipmentAddress.emirate || '',
  ].filter(Boolean).join(', ');

  const itemsTotal = order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-t-3xl p-6 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold">Order Details</h2>
            <p className="text-sm text-slate-300 mt-1">Order #{order.orderNumber || order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintDialog(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title="Print shipping label"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('order-label');
                if (element) {
                  const printWindow = window.open('', '', 'height=600,width=800');
                  if (printWindow) {
                    printWindow.document.write(element.innerHTML);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title="Print details"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === 'label'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Label
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Bar */}
              <div className={`rounded-lg p-4 flex items-center justify-between ${getStatusColor(order.status)}`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-semibold capitalize text-sm">
                      {String(order.status).replace(/_/g, ' ')}
                    </p>
                    {order.deliveryType && (
                      <p className="text-xs opacity-75">{order.deliveryType}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75 uppercase">Placed</p>
                  <p className="font-mono text-sm">{new Date(order.createdAt).toLocaleDateString('en-AE')}</p>
                </div>
              </div>

              {/* Customer & Seller */}
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Card */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={18} className="text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Customer</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-slate-900">{order.customerName}</p>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} />
                      <span className="truncate">{order.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} />
                      <span>{order.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Seller Card */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart size={18} className="text-amber-600" />
                    <h3 className="font-semibold text-slate-900">Seller</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-slate-900">{order.sellerName}</p>
                    <p className="text-slate-600">ID: {order.sellerId}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} className="text-rose-600" />
                  <h3 className="font-semibold text-slate-900">Delivery Address</h3>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                  {fullAddress || 'No address provided'}
                </p>
                {order.deliveryType && (
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-semibold">Delivery Type:</span> {order.deliveryType}
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Ordered Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex justify-between items-start p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {item.quantity}x @ {formatAED(item.unitPrice)} each
                          {item.sku && ` (SKU: ${item.sku})`}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 text-sm whitespace-nowrap ml-4">
                        {formatAED(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="border border-slate-200 rounded-lg p-4 bg-indigo-50">
                <h3 className="font-semibold text-slate-900 mb-3">Financial Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium text-slate-900">{formatAED(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">VAT (5%):</span>
                    <span className="font-medium text-slate-900">{formatAED(order.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery Fee:</span>
                    <span className="font-medium text-slate-900">{formatAED(order.deliveryFee)}</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-2 mt-2 flex justify-between font-semibold">
                    <span>Customer Total:</span>
                    <span className="text-indigo-600 text-lg">{formatAED(order.totalAmount)}</span>
                  </div>
                  {order.commissionAmount !== undefined && (
                    <div className="mt-3 pt-3 border-t border-indigo-200 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Commission (6%):</span>
                        <span className="font-medium text-slate-900">{formatAED(order.commissionAmount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Seller Amount:</span>
                        <span className="text-emerald-600">{formatAED(order.sellerAmount || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking & Dispatch */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Tracking & Dispatch</h3>
                <div className="space-y-3 text-sm">
                  {order.trackingCode && (
                    <div>
                      <p className="text-slate-600 mb-1">Tracking Code:</p>
                      <p className="font-mono bg-slate-100 p-2 rounded">{order.trackingCode}</p>
                    </div>
                  )}
                  {order.courierPartner && (
                    <div>
                      <p className="text-slate-600">Courier: {order.courierPartner}</p>
                    </div>
                  )}
                  {order.dispatchSlotDate && (
                    <div>
                      <p className="text-slate-600">
                        Dispatch Slot: {new Date(order.dispatchSlotDate).toLocaleDateString('en-AE')}
                        {order.dispatchSlotWindow && ` (${order.dispatchSlotWindow})`}
                      </p>
                    </div>
                  )}
                  {order.dispatchNotes && (
                    <div>
                      <p className="text-slate-600">Notes: {order.dispatchNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-3">Admin Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['confirmed', 'packed', 'shipped', 'delivered'].map((action) => (
                    <button
                      key={action}
                      onClick={() => handleActionClick(action)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <OrderStatusTimeline 
              events={order.trackingEvents || []} 
              currentStatus={order.status}
              orderId={order.id}
            />
          )}

          {/* Label Tab */}
          {activeTab === 'label' && (
            <OrderDetailsShippingLabel order={order} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 rounded-b-3xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-300 text-slate-900 font-medium hover:bg-slate-400 transition"
          >
            Close
          </button>
          <button
            onClick={() => onPrintLabel?.(order.id)}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
};
