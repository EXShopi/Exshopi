import { Link } from "react-router-dom";
import { PackageCheck, Search, Truck, MapPin, Clock3 } from "lucide-react";

export default function TrackOrder() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Track Order</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
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

          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <PackageCheck size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">
          Order Tracking
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            placeholder="Enter Order ID"
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          <input
            type="text"
            placeholder="Enter Phone or Email"
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800">
            <Search size={18} />
            Track
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <Clock3 className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Order Received
            </h3>
            <p className="mt-2 text-slate-500">
              Your order has been placed successfully and is waiting for processing.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <Truck className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Out for Delivery
            </h3>
            <p className="mt-2 text-slate-500">
              Once dispatched, your package will be handed over to the courier.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
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
          <p>• Keep your order number ready for faster tracking.</p>
          <p>• Tracking updates may take some time after shipment confirmation.</p>
          <p>• For delivery issues, contact support with your order details.</p>
        </div>
      </div>
    </div>
  );
}