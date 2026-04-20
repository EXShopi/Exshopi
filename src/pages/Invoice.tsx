import { useParams, useNavigate } from "react-router-dom";
import { useOrderStore } from "../store/orders";
import { PrinterIcon, ArrowLeft } from "lucide-react";
import { formatCurrencyForCountry } from "../lib/currency";
import { getCountryConfig, isSupportedCountryCode } from "../lib/countryConfig";

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder } = useOrderStore();

  const order = orderId ? getOrder(orderId) : null;

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Invoice Not Found</h1>
          <p className="text-slate-600 mb-6">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };
  const orderCountryCode = isSupportedCountryCode(order?.shipping?.country) ? order.shipping.country : 'AE';
  const orderCountry = getCountryConfig(orderCountryCode);

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
        {/* Print Header - Hidden on Print */}
        <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            <PrinterIcon className="h-4 w-4" />
            Print Invoice
          </button>
        </div>

        {/* Invoice Document */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-12 print:rounded-0 print:shadow-0 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-slate-900">ExShopi</h1>
              <p className="text-slate-600 mt-1">Premium Electronics Marketplace</p>
              <p className="text-sm text-slate-500 mt-4">
                365/1 Al Wasl Road<br />
                Dubai, United Arab Emirates<br />
                Phone: +971 4 123 4567<br />
                Email: orders@exshopi.ae
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">INVOICE</h2>
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-bold">Invoice #:</span> {order.id}
              </p>
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-bold">Tracking #:</span> {order.trackingCode}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-bold">Date:</span> {orderDate}
              </p>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Bill To:</h3>
              <p className="font-bold text-slate-900">{order.customer.firstName} {order.customer.lastName}</p>
              <p className="text-slate-600 text-sm">{order.customer.email}</p>
              <p className="text-slate-600 text-sm">{order.customer.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Ship To:</h3>
              <p className="font-bold text-slate-900">{order.customer.firstName} {order.customer.lastName}</p>
              <p className="text-slate-600 text-sm">{order.shipping.address}</p>
              <p className="text-slate-600 text-sm">{order.shipping.city}, {orderCountry.name}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-slate-600">Order Date</p>
                <p className="font-bold text-slate-900">{orderDate}</p>
              </div>
              <div>
                <p className="text-slate-600">Estimated Delivery</p>
                <p className="font-bold text-slate-900">
                  {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Payment Method</p>
                <p className="font-bold text-slate-900 uppercase">
                  {order.payment.method === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Payment Status</p>
                <p className="font-bold text-slate-900 uppercase">{order.payment.status}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-3 font-bold text-slate-900">Product</th>
                  <th className="text-center py-3 font-bold text-slate-900">Qty</th>
                  <th className="text-right py-3 font-bold text-slate-900">Unit Price</th>
                  <th className="text-right py-3 font-bold text-slate-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      {item.selectedColor && (
                        <p className="text-xs text-slate-600">Color: {item.selectedColor}</p>
                      )}
                      {item.selectedStorage && (
                        <p className="text-xs text-slate-600">Storage: {item.selectedStorage}</p>
                      )}
                    </td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrencyForCountry(item.price, orderCountryCode)}</td>
                    <td className="py-4 text-right font-bold text-slate-900">
                      {formatCurrencyForCountry(item.price * item.quantity, orderCountryCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-96">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatCurrencyForCountry(order.summary.subtotal, orderCountryCode)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-600">Shipping:</span>
                  <span className="font-bold text-emerald-600">{formatCurrencyForCountry(order.summary.shipping || 0, orderCountryCode)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-t border-slate-300 pt-3">
                  <span className="text-slate-600">VAT ({Math.round(orderCountry.vatRate * 100)}%):</span>
                  <span className="font-bold text-slate-900">{formatCurrencyForCountry(order.summary.vat || 0, orderCountryCode)}</span>
                </div>
                <div className="flex justify-between py-4 text-lg border-t-2 border-slate-300 pt-4">
                  <span className="font-bold text-slate-900">Total:</span>
                  <span className="font-bold text-blue-600 text-2xl">{formatCurrencyForCountry(order.summary.total, orderCountryCode)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-slate-200 pt-6 mt-12 text-center text-xs text-slate-600">
            <p className="mb-2">
              Thank you for your purchase! If you have any questions, contact us at support@exshopi.ae
            </p>
            <p>
              This is a system-generated invoice. No signature required.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}
