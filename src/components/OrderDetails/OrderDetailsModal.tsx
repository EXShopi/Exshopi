import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Download,
  Mail,
  MapPin,
  Package2,
  Phone,
  Printer,
  ShieldAlert,
  Truck,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrencyForCountry } from '../../lib/currency';
import { isSupportedCountryCode } from '../../lib/countryConfig';
import {
  buildOrderAddress,
  copyToClipboard,
  downloadOrderInvoicePdf,
  downloadOrderLabelPdf,
  formatOrderDateTime,
  printOrderDocuments,
} from '../../lib/orderAdmin';
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
  sellerStoreSlug?: string;
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  commissionAmount?: number;
  sellerAmount?: number;
  currency?: string;
  taxRate?: number;
  status: string;
  operationalStatus?: string;
  refundStatus?: string;
  refundStatusLabel?: string;
  riskLevel?: string;
  riskReasons?: string[];
  deliveryType?: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
    salePrice?: number;
    sku?: string;
    image?: string;
  }>;
  shippingAddress?: {
    emirate?: string;
    area?: string;
    building?: string;
    flat?: string;
    addressLine?: string;
    landmark?: string;
  };
  trackingCode?: string;
  barcodeReference?: string;
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

export interface OrderDetailsModalProps {
  order: OrderDetailsData;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void> | void;
  onPrintLabel?: (orderId: string) => void;
  onUpdateDispatch?: (
    orderId: string,
    payload: {
      dispatchSlotDate?: string;
      dispatchSlotWindow?: string;
      dispatchNotes?: string;
      courierPartner?: string;
      status?: string;
    }
  ) => Promise<void> | void;
  onProcessRefund?: (action: 'approve' | 'reject') => Promise<void> | void;
}

const STATUS_ACTIONS = [
  { action: 'confirmed', label: 'Confirm Order', nextStatus: 'confirmed' },
  { action: 'packed', label: 'Mark Packed', nextStatus: 'packed' },
  { action: 'shipped', label: 'Mark Shipped', nextStatus: 'in_transit' },
  { action: 'delivered', label: 'Mark Delivered', nextStatus: 'delivered' },
  { action: 'returned', label: 'Mark Returned', nextStatus: 'returned' },
] as const;

function getValidNextStatuses(currentStatus: string) {
  const status = String(currentStatus || '').toLowerCase();

  if (status.includes('pending') || status.includes('placed')) return ['confirmed'];
  if (status.includes('confirm')) return ['packed'];
  if (status.includes('pack') || status.includes('ready') || status.includes('pickup')) return ['shipped'];
  if (status.includes('ship') || status.includes('transit') || status.includes('out_for')) return ['delivered'];
  if (status.includes('delivered')) return ['returned'];
  return ['confirmed', 'packed', 'shipped', 'delivered'];
}

function getOrderCountryCode(order: OrderDetailsData) {
  const rawCountry = (order.shippingAddress as any)?.country || order.shippingAddressJson?.country;
  if (isSupportedCountryCode(rawCountry)) return rawCountry;
  return order.currency === 'SAR' ? 'SA' : 'AE';
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onUpdateDispatch,
  onProcessRefund,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'label'>('overview');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [dispatchDraft, setDispatchDraft] = useState({
    trackingCode: order.trackingCode || '',
    courierPartner: order.courierPartner || 'ExShopi Logistics',
    dispatchSlotDate: order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '10:00 AM - 1:00 PM',
    dispatchNotes: order.dispatchNotes || '',
  });

  const address = useMemo(() => buildOrderAddress(order), [order]);
  const validNextActions = getValidNextStatuses(order.status || order.operationalStatus || 'pending');
  const riskReasons = Array.isArray(order.riskReasons) ? order.riskReasons : [];
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const orderCountryCode = getOrderCountryCode(order);

  if (!isOpen || !order) return null;

  const runAction = async (key: string, task: () => Promise<void> | void) => {
    try {
      setLoadingAction(key);
      await task();
    } finally {
      setLoadingAction(null);
    }
  };

  const actionButtonClass = (enabled: boolean) =>
    enabled
      ? 'bg-slate-900 text-white hover:bg-blue-600'
      : 'border border-slate-200 bg-white text-slate-400 cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-700 px-7 py-6 text-white">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Order operations</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Order #{order.orderNumber || order.id}</h2>
              <p className="mt-2 text-sm font-medium text-blue-100/85">
                Premium order workspace for fulfillment, customer contact, payout review, dispatch, and label printing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => printOrderDocuments([order], 'a4')}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
              >
                <Printer className="h-4 w-4" />
                Print Label
              </button>
              <button
                onClick={() => downloadOrderLabelPdf(order, 'a4')}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                Download Label PDF
              </button>
              <button
                onClick={() => downloadOrderInvoicePdf(order)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
              >
                <Wallet className="h-4 w-4" />
                Export Invoice
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/20"
                aria-label="Close order details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              ['Customer total', formatCurrencyForCountry(order.totalAmount, orderCountryCode), Wallet],
              ['Items', `${itemCount}`, Package2],
              ['Status', String(order.status || order.operationalStatus || 'pending').replace(/_/g, ' '), CheckCircle2],
              ['Payment', String(order.paymentMethod || 'cod').toUpperCase(), Wallet],
              ['Tracking', order.trackingCode || 'Pending', Truck],
              ['Risk', order.riskLevel || 'normal', ShieldAlert],
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">{label}</p>
                  <Icon className="h-4 w-4 text-blue-100" />
                </div>
                <p className="mt-3 text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-7 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['overview', 'Overview'],
              ['timeline', 'Timeline'],
              ['label', 'Label'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveTab(value as any)}
                className={`rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition ${
                  activeTab === value
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-7 py-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Summary</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Order command view</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(order.orderNumber || order.id, 'Order ID copied')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                      >
                        <Clipboard className="h-4 w-4" />
                        Copy Order ID
                      </button>
                      <button
                        onClick={() => copyToClipboard(order.trackingCode || '', 'Tracking code copied')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                      >
                        <Clipboard className="h-4 w-4" />
                        Copy Tracking
                      </button>
                      <a
                        href={order.customerPhone ? `tel:${order.customerPhone}` : '#'}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                      >
                        <Phone className="h-4 w-4" />
                        Contact Customer
                      </a>
                      <a
                        href={order.customerEmail ? `mailto:${order.customerEmail}` : '#'}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                      >
                        <Mail className="h-4 w-4" />
                        Email Customer
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-3">
                        <UserRound className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Customer details</p>
                          <p className="mt-1 text-lg font-black text-slate-900">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                        <p>{order.customerEmail || 'No email on file'}</p>
                        <p>{order.customerPhone || 'No phone on file'}</p>
                        <p>Placed {formatOrderDateTime(order.createdAt)}</p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-3">
                        <Package2 className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Seller details</p>
                          <p className="mt-1 text-lg font-black text-slate-900">{order.sellerName}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                        <p>Seller ID: {order.sellerId}</p>
                        <p>Tracking: {order.trackingCode || 'Pending assignment'}</p>
                        <p>Courier: {order.courierPartner || 'Pending courier assignment'}</p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-rose-600" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Delivery address</p>
                            <p className="mt-1 text-base font-black text-slate-900">{address.full || 'Address unavailable'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(address.full, 'Address copied')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
                        >
                          Copy Address
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Items</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Ordered items</h3>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                      {itemCount} units
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
                    <div className="grid grid-cols-[1.5fr_0.8fr_0.55fr_0.8fr_0.8fr] gap-4 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      <p>Product</p>
                      <p>SKU / Variant</p>
                      <p>Qty</p>
                      <p>Unit</p>
                      <p>Subtotal</p>
                    </div>
                    {(order.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1.5fr_0.8fr_0.55fr_0.8fr_0.8fr] gap-4 border-t border-slate-200 px-5 py-4 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">Product link follows existing route support from seller/customer panel data.</p>
                        </div>
                        <div className="font-mono text-slate-600">{item.sku || 'No SKU'}</div>
                        <div className="font-bold text-slate-900">{item.quantity}</div>
                        <div className="font-semibold text-slate-700">{formatCurrencyForCountry(item.unitPrice, orderCountryCode)}</div>
                        <div className="font-black text-slate-900">{formatCurrencyForCountry(item.unitPrice * item.quantity, orderCountryCode)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Financials</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Pricing breakdown</h3>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-600">Subtotal</span>
                      <span className="font-black text-slate-900">{formatCurrencyForCountry(order.subtotal, orderCountryCode)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-600">VAT</span>
                      <span className="font-black text-slate-900">{formatCurrencyForCountry(order.vatAmount, orderCountryCode)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-600">Shipping fee</span>
                      <span className="font-black text-slate-900">{formatCurrencyForCountry(order.deliveryFee, orderCountryCode)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-600">Commission</span>
                      <span className="font-black text-slate-900">{formatCurrencyForCountry(order.commissionAmount || 0, orderCountryCode)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-semibold text-slate-600">Seller payout</span>
                      <span className="font-black text-emerald-700">{formatCurrencyForCountry(order.sellerAmount || 0, orderCountryCode)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[1.5rem] bg-slate-900 px-4 py-4 text-white">
                      <span className="text-sm font-black uppercase tracking-[0.18em]">Grand total</span>
                      <span className="text-lg font-black">{formatCurrencyForCountry(order.totalAmount, orderCountryCode)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Dispatch</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Tracking & handoff</h3>

                  <div className="mt-5 grid gap-4">
                    <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Courier</span>
                      <input
                        value={dispatchDraft.courierPartner}
                        onChange={(event) => setDispatchDraft((prev) => ({ ...prev, courierPartner: event.target.value }))}
                        className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                        placeholder="Assign courier"
                      />
                    </label>
                    <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dispatch date</span>
                      <input
                        type="date"
                        value={dispatchDraft.dispatchSlotDate ? String(dispatchDraft.dispatchSlotDate).slice(0, 10) : ''}
                        onChange={(event) => setDispatchDraft((prev) => ({ ...prev, dispatchSlotDate: event.target.value }))}
                        className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                      />
                    </label>
                    <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dispatch window</span>
                      <input
                        value={dispatchDraft.dispatchSlotWindow}
                        onChange={(event) => setDispatchDraft((prev) => ({ ...prev, dispatchSlotWindow: event.target.value }))}
                        className="mt-3 w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                        placeholder="10:00 AM - 1:00 PM"
                      />
                    </label>
                    <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Internal note / courier note</span>
                      <textarea
                        value={dispatchDraft.dispatchNotes}
                        onChange={(event) => setDispatchDraft((prev) => ({ ...prev, dispatchNotes: event.target.value }))}
                        className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm font-medium text-slate-900 outline-none"
                        placeholder="Add handling note, delivery attempt note, or warehouse comment"
                      />
                    </label>
                    <button
                      onClick={() =>
                        runAction('dispatch', () =>
                          onUpdateDispatch?.(order.id, {
                            courierPartner: dispatchDraft.courierPartner,
                            dispatchSlotDate: dispatchDraft.dispatchSlotDate,
                            dispatchSlotWindow: dispatchDraft.dispatchSlotWindow,
                            dispatchNotes: dispatchDraft.dispatchNotes,
                            status: 'waiting_for_pickup',
                          })
                        )
                      }
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-600"
                    >
                      {loadingAction === 'dispatch' ? 'Saving dispatch...' : 'Assign Courier / Save Dispatch'}
                    </button>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Risk & refunds</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Operational exceptions</h3>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Risk level</p>
                      <p className="mt-2 text-base font-black text-slate-900">{order.riskLevel || 'normal'}</p>
                    </div>
                    {riskReasons.length ? (
                      <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Risk signals</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {riskReasons.map((reason) => (
                            <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-amber-800">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {order.refundStatus && order.refundStatus !== 'none' ? (
                      <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Refund status</p>
                        <p className="mt-2 text-base font-black capitalize text-rose-900">{order.refundStatus.replace(/_/g, ' ')}</p>
                        {order.refundReason ? (
                          <p className="mt-2 text-sm font-medium text-rose-800">{order.refundReason}</p>
                        ) : null}
                        {order.refundAmount ? (
                          <p className="mt-2 text-sm font-black text-rose-900">
                            {formatCurrencyForCountry(order.refundAmount, orderCountryCode)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => runAction('refund-approve', () => onProcessRefund?.('approve'))}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => runAction('refund-reject', () => onProcessRefund?.('reject'))}
                        className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-rose-700"
                      >
                        Reject Refund
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Admin actions</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Next-step workflow</h3>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {STATUS_ACTIONS.map((item) => {
                      const enabled = validNextActions.includes(item.action);
                      return (
                        <button
                          key={item.action}
                          onClick={() =>
                            enabled &&
                            runAction(item.action, async () => {
                              if (item.action === 'returned') {
                                await onStatusChange?.(order.id, 'returned');
                                return;
                              }
                              await onStatusChange?.(order.id, item.nextStatus);
                            })
                          }
                          disabled={!enabled || loadingAction === item.action}
                          className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${actionButtonClass(
                            enabled && loadingAction !== item.action
                          )}`}
                        >
                          {loadingAction === item.action ? 'Working...' : item.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <OrderStatusTimeline events={order.trackingEvents || []} currentStatus={order.status} orderId={order.id} />
          )}

          {activeTab === 'label' && <OrderDetailsShippingLabel order={order} />}
        </div>
      </div>
    </div>
  );
};
