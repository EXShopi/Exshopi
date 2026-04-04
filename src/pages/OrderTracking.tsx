import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Check,
  Clock,
  Truck,
  Home,
  MapPin,
  Package,
  CheckCircle2,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { trackingAPI } from '../services/api';
import { formatAED } from '../lib/currency';
import { OrbitLoader } from '../components/ui/OrbitLoader';

export default function OrderTracking() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState(trackingCode || '');
  const [searched, setSearched] = useState(Boolean(trackingCode));
  const [loading, setLoading] = useState(Boolean(trackingCode));
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!trackingCode) return;
    let mounted = true;
    setLoading(true);
    trackingAPI
      .get(trackingCode)
      .then((data) => {
        if (mounted) setResult(data);
      })
      .catch(() => {
        if (mounted) setResult(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [trackingCode]);

  const order = result?.order;
  const trackingEvents = result?.trackingEvents || [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!searchCode.trim()) return;
    navigate(`/order-tracking/${searchCode.trim()}`);
  };

  const trackingSteps = useMemo(
    () => [
      {
        id: 'pending_confirmation',
        label: 'Pending Confirmation',
        description: 'Your COD order was placed and is waiting for seller confirmation.',
        icon: Check,
        completed: ['pending_confirmation', 'confirmed', 'preparing', 'packed', 'waiting_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        description: 'The seller accepted your order and started preparing it.',
        icon: CheckCircle2,
        completed: ['confirmed', 'preparing', 'packed', 'waiting_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'packed',
        label: 'Packed',
        description: 'The seller packed your items for ExShopi pickup.',
        icon: Package,
        completed: ['packed', 'waiting_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'waiting_for_pickup',
        label: 'Waiting for Pickup',
        description: 'The order is packed and ready for ExShopi logistics pickup.',
        icon: Truck,
        completed: ['waiting_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'picked_up',
        label: 'Picked Up',
        description: 'ExShopi logistics scanned your order and collected it from the seller.',
        icon: Truck,
        completed: ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'in_transit',
        label: 'In Transit',
        description: 'Your shipment is moving through the ExShopi delivery network.',
        icon: Truck,
        completed: ['in_transit', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'returned', 'refund_review', 'refunded'].includes(order?.status),
      },
      {
        id: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'The courier is heading to your delivery address.',
        icon: Truck,
        completed: ['out_for_delivery', 'delivered'].includes(order?.status),
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: 'Your order has been delivered successfully.',
        icon: CheckCircle2,
        completed: order?.status === 'delivered' || order?.status === 'return_requested' || order?.status === 'returned',
      },
    ],
    [order?.status]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Track Your Order</h1>
          <p className="text-lg text-slate-600">Use your ExShopi tracking code to view live marketplace delivery updates.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Enter tracking code"
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono"
                />
              </div>
              <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                Search
              </button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <OrbitLoader label="Loading tracking details..." size={24} />
          </div>
        )}

        {searched && !loading && !order && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm mb-8">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tracking Code Not Found</h2>
            <p className="text-slate-600 mb-6">Please check the code and try again.</p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        )}

        {order && !loading && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500 uppercase font-bold mb-1">Tracking Code</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{order.trackingCode}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase font-bold mb-1">Order Number</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{order.orderId || order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase font-bold mb-1">Payment</p>
                  <p className="text-lg font-bold text-slate-900 uppercase">{order.paymentMethod || 'cod'}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 uppercase">{order.paymentStatus === 'cod_pending' ? 'COD Pending' : order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 uppercase font-bold mb-1">Total</p>
                  <p className="text-lg font-bold text-slate-900">{formatAED(order.totalAmount || order.subtotal || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-8">Delivery Timeline</h2>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-slate-200" />
                <div className="space-y-8">
                  {trackingSteps.map((step) => (
                    <div key={step.id} className="relative">
                      <div className="absolute left-0 top-0 flex items-center justify-center">
                        <div className={`h-14 w-14 rounded-full border-4 flex items-center justify-center z-10 ${step.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                          {step.completed ? (
                            <Check className="h-6 w-6 text-white" />
                          ) : (
                            <step.icon className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div className="ml-24">
                        <h3 className={`text-lg font-bold mb-1 ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</h3>
                        <p className={`${step.completed ? 'text-slate-600' : 'text-slate-400'} text-sm`}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Delivery Address
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{order.customerName || 'Customer'}</p>
                  <p>{order.shippingAddress?.addressLine1 || order.shippingAddress?.address || order.shippingAddress || 'Address unavailable'}</p>
                  <p>{order.shippingAddress?.building || ''}{order.shippingAddress?.building && order.shippingAddress?.area ? ', ' : ''}{order.shippingAddress?.area || ''}</p>
                  <p>{order.shippingAddress?.emirate || order.shippingAddress?.city || ''}</p>
                  <p>{order.shippingAddress?.country || order.deliveryCountry || 'AE'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Delivery Details
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">ETA:</span> {order.deliveryEta || 'To be confirmed'}</p>
                  <p><span className="font-semibold text-slate-900">Seller:</span> {order.sellerName || 'ExShopi Official'}</p>
                  <p><span className="font-semibold text-slate-900">Barcode Ref:</span> {order.barcodeReference || order.pickupQrCode || 'Generating'}</p>
                  <p><span className="font-semibold text-slate-900">Refund Status:</span> {order.refundStatus || 'none'}</p>
                </div>
              </div>
            </div>

            {trackingEvents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Latest Tracking Events</h2>
                <div className="space-y-4">
                  {trackingEvents.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-600">
                        {event.status === 'return_requested' ? <RotateCcw className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{String(event.status).replace(/_/g, ' ')}</p>
                        <p className="text-sm text-slate-600">{event.notes || 'Marketplace tracking update'}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
