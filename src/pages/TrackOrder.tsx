import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PackageCheck, Search, Truck, MapPin, Clock3, AlertCircle, Loader } from "lucide-react";
import { orderAPI } from "../services/api";

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderInput, setOrderInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      if (!orderInput.trim() && !contactInput.trim()) {
        setErrorMessage("Please enter either an Order ID or Phone/Email to search.");
        setLoading(false);
        return;
      }

      const searchQuery = orderInput.trim() || contactInput.trim();

      // Try to find the order using the search query
      const allOrders = await orderAPI.getAllOrders();
      if (!allOrders || allOrders.length === 0) {
        setErrorMessage("No orders found in the system. Please check your information and try again.");
        setLoading(false);
        return;
      }

      // Search for matching order
      const foundOrder = allOrders.find((order: any) => {
        const orderIdMatch = String(order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(order.orderNumber || order.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(order.trackingCode || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const phoneMatch = String(order.customerPhone || '').includes(searchQuery);
        const emailMatch = String(order.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());

        return orderIdMatch || phoneMatch || emailMatch;
      });

      if (!foundOrder) {
        setErrorMessage(
          "Order not found. Please double-check your Order ID, tracking code, or contact information."
        );
        setLoading(false);
        return;
      }

      // Navigate to the actual tracking page with the tracking code
      const trackingCode = foundOrder.trackingCode || foundOrder.id;
      navigate(`/order-tracking?code=${trackingCode}`);
    } catch (error) {
      console.error("Error searching for order:", error);
      setErrorMessage("Error searching for your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Track Order</span>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Delivery Status
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Track Your Order
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              Enter your order details to check the latest shipping and delivery
              status of your purchase.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg">
            <PackageCheck size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">
          Order Tracking
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            placeholder="Enter Order ID or Tracking Code"
            value={orderInput}
            onChange={(e) => {
              setOrderInput(e.target.value);
              setErrorMessage("");
            }}
            onKeyPress={handleKeyPress}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <input
            type="text"
            placeholder="Enter Your Phone or Email"
            value={contactInput}
            onChange={(e) => {
              setContactInput(e.target.value);
              setErrorMessage("");
            }}
            onKeyPress={handleKeyPress}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading ? "Searching..." : "Track"}
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{errorMessage}</p>
              <p className="text-sm text-red-800 mt-1">
                If you have recently placed an order, there might be a short delay in the system.
              </p>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <Clock3 className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Order Received
            </h3>
            <p className="mt-2 text-slate-500">
              Your order has been placed successfully and is waiting for processing.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <Truck className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Out for Delivery
            </h3>
            <p className="mt-2 text-slate-500">
              Once dispatched, your package will be handed over to the courier for delivery.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <MapPin className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Delivered
            </h3>
            <p className="mt-2 text-slate-500">
              You will see final delivery confirmation after successful receipt.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4 text-slate-600">
          <p>✓ Keep your order number or tracking code ready for faster tracking.</p>
          <p>✓ You can search using your phone number or email address associated with the order.</p>
          <p>✓ Tracking updates may take some time after shipment confirmation.</p>
          <p>✓ For delivery issues or support, contact us with your order details.</p>
        </div>
      </div>

      <div className="mt-10 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">
          Order Tracking
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            placeholder="Enter Order ID or Tracking Code"
            value={orderInput}
            onChange={(e) => {
              setOrderInput(e.target.value);
              setErrorMessage("");
            }}
            onKeyPress={handleKeyPress}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <input
            type="text"
            placeholder="Enter Your Phone or Email"
            value={contactInput}
            onChange={(e) => {
              setContactInput(e.target.value);
              setErrorMessage("");
            }}
            onKeyPress={handleKeyPress}
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading ? "Searching..." : "Track"}
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{errorMessage}</p>
              <p className="text-sm text-red-800 mt-1">
                If you have recently placed an order, there might be a short delay in the system.
              </p>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <Clock3 className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Order Received
            </h3>
            <p className="mt-2 text-slate-500">
              Your order has been placed successfully and is waiting for processing.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <Truck className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Out for Delivery
            </h3>
            <p className="mt-2 text-slate-500">
              Once dispatched, your package will be handed over to the courier for delivery.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <MapPin className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Delivered
            </h3>
            <p className="mt-2 text-slate-500">
              You will see final delivery confirmation after successful receipt.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4 text-slate-600">
          <p>✓ Keep your order number or tracking code ready for faster tracking.</p>
          <p>✓ You can search using your phone number or email address associated with the order.</p>
          <p>✓ Tracking updates may take some time after shipment confirmation.</p>
          <p>✓ For delivery issues or support, contact us with your order details.</p>
        </div>
      </div>
    </div>
  );
}