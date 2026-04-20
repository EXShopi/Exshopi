import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Copy,
  FileText,
  Truck,
  Home,
  AlertCircle,
  Mail,
  Clock,
  MapPin,
} from "lucide-react";
import { useOrderStore } from "../store/orders";
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { orderAPI } from "../services/api";
import { formatCurrencyForCountry } from "../lib/currency";
import { getCountryConfig, isSupportedCountryCode } from "../lib/countryConfig";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrder } = useOrderStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const user = useAuthStore((state) => state.user);
  const [copied, setCopied] = useState(false);
  const [restoredOrder, setRestoredOrder] = useState<any>(null);
  const [loadingRestoredOrder, setLoadingRestoredOrder] = useState(false);
  const stripeSessionId = searchParams.get("session_id");
  const isStripeReturn = useMemo(() => Boolean(searchParams.get("session_id") || searchParams.get("provider") === "stripe"), [searchParams]);

  useEffect(() => {
    if (currentOrder) {
      if (isStripeReturn) {
        clearCart();
      }
      return;
    }

    if (!isStripeReturn || !user?.id) {
      navigate("/");
      return;
    }

    let mounted = true;
    setLoadingRestoredOrder(true);
    orderAPI
      .getCustomerOrders(user.id)
      .then((orders) => {
        if (!mounted) return;
        if (Array.isArray(orders) && orders.length > 0) {
          const sessionOrders = stripeSessionId
            ? orders.filter((order: any) => order.paymentSessionId === stripeSessionId)
            : orders.slice(0, 1);
          const selectedOrders = sessionOrders.length > 0 ? sessionOrders : [orders[0]];
          const primaryOrder = selectedOrders[0];
          setRestoredOrder({
            id: primaryOrder.orderId || primaryOrder.id,
            trackingCode: primaryOrder.trackingCode || "",
            createdAt: primaryOrder.createdAt || new Date().toISOString(),
            customer: {
              firstName: primaryOrder.customerName?.split(" ")[0] || user.fullName?.split(" ")[0] || "Customer",
              lastName: primaryOrder.customerName?.split(" ").slice(1).join(" ") || "",
              email: primaryOrder.customerEmail || user.email || "",
            },
            shipping: {
              address:
                primaryOrder.shippingAddress?.addressLine ||
                primaryOrder.shippingAddress?.address ||
                primaryOrder.shippingAddress ||
                "Address available in your account",
              city: primaryOrder.shippingAddress?.emirate || primaryOrder.shippingAddress?.city || "Dubai",
            },
            summary: {
              subtotal: selectedOrders.reduce((sum: number, order: any) => sum + Number(order.subtotal || 0), 0),
              total: selectedOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || order.subtotal || 0), 0),
            },
            items: selectedOrders.flatMap((order: any) => order.products || order.items || []),
          });
          clearCart();
        } else {
          navigate("/");
        }
      })
      .catch(() => {
        if (mounted) navigate("/");
      })
      .finally(() => {
        if (mounted) setLoadingRestoredOrder(false);
      });

    return () => {
      mounted = false;
    };
  }, [clearCart, currentOrder, isStripeReturn, navigate, stripeSessionId, user?.email, user?.fullName, user?.id]);

  const activeOrder = currentOrder || restoredOrder;
  const activeCountryCode = isSupportedCountryCode(activeOrder?.shipping?.country) ? activeOrder.shipping.country : 'AE';
  const activeCountry = getCountryConfig(activeCountryCode);

  // --- Google Ads Purchase Conversion Tracking ---
  useEffect(() => {
    if (!activeOrder) return;
    // Only fire once per order (by id)
    const firedKey = `exshopi_ads_conversion_${activeOrder.id}`;
    if (window.sessionStorage.getItem(firedKey)) return;

    // Google Ads conversion label for Purchase event:
    const CONVERSION_LABEL = 'LkqOCPSB0JwcEIXvvrBD';

    const value = Number(activeOrder?.summary?.total ?? activeOrder?.totalAmount ?? 0) || 0;
    const transactionId = String(activeOrder?.id || '');

    const sendConversion = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          send_to: `AW-18086868869/${CONVERSION_LABEL}`,
          value,
          currency: activeCountry.currency,
          transaction_id: transactionId,
        });
        window.sessionStorage.setItem(firedKey, '1');
        return true;
      }
      return false;
    };

    if (!sendConversion()) {
      // Retry a few times in case gtag hasn't loaded yet
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (sendConversion() || attempts >= 5) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    return () => {
      // cleanup any injected script
      try {
        const injected = document.head.querySelectorAll('script[data-exshopi-ads="conversion"]');
        injected.forEach((n) => n.remove());
      } catch (e) {
        // ignore
      }
    };
  }, [activeOrder]);

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{loadingRestoredOrder ? "Loading order..." : "Preparing your order confirmation..."}</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeOrder.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orderDate = new Date(activeOrder.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full blur-xl opacity-40"></div>
              <div className="relative bg-gradient-to-r from-emerald-400 to-emerald-500 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Thank You!</h1>
          <p className="text-lg text-slate-600 mb-2">
            Your COD order has been placed
          </p>
          <p className="text-slate-500">
            A confirmation email has been sent to <span className="font-semibold text-slate-900">{activeOrder.customer.email}</span>
          </p>
        </div>

        {/* Main Content Cards */}
        <div className="space-y-6 mb-10">
          {/* Order Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Order Confirmation
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{activeOrder.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Order Date</p>
                <p className="text-lg text-slate-900">{orderDate}</p>
              </div>
            </div>

            {/* Tracking Code */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 mb-6">
              <p className="text-xs uppercase text-blue-700 font-bold mb-2">Tracking Code</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-blue-900 font-mono">{activeOrder.trackingCode}</p>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Order Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-slate-600">COD Pending</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-slate-600">Pending Confirmation</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Truck className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                <p className="text-xs text-slate-600">Pay on Delivery</p>
              </div>
            </div>
          </div>

          {/* Delivery & Items Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Address
              </h3>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">{activeOrder.customer.firstName} {activeOrder.customer.lastName}</p>
                <p className="text-slate-600">{activeOrder.shipping.address}</p>
                <p className="text-slate-600">{activeOrder.shipping.city}, {activeCountry.shortName}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrencyForCountry(activeOrder.summary.subtotal, activeCountryCode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-semibold text-slate-900">{formatCurrencyForCountry(activeOrder.summary.shipping || 0, activeCountryCode)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{formatCurrencyForCountry(activeOrder.summary.total, activeCountryCode)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Items ({activeOrder.items.length})</h3>
            <div className="space-y-4">
              {activeOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="h-16 w-16 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                    <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrencyForCountry(item.price * item.quantity, activeCountryCode)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Boxes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-blue-900 mb-1">Confirmation Email Sent</p>
                <p className="text-blue-800">Check your inbox for order confirmation and tracking details</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-emerald-900 mb-1">Seller is Preparing Your Order</p>
                <p className="text-emerald-800">Estimated delivery in {activeCountryCode === 'AE' ? '2-4' : '3-5'} business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          
          <Link
            to={`/order-tracking/${activeOrder.trackingCode}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            <Truck className="h-4 w-4" />
            Track Order
          </Link>

          <Link
            to={`/invoice/${activeOrder.id}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-bold transition-colors"
          >
            <FileText className="h-4 w-4" />
            View Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
