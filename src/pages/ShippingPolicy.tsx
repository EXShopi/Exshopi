import { Link } from "react-router-dom";
import { Truck, Clock3, MapPin, ShieldCheck } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Shipping Policy</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Delivery Information
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Shipping Policy
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              We aim to deliver your orders safely and quickly across UAE and GCC.
              Delivery times may vary depending on location, stock availability,
              and public holidays.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <Truck size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Clock3 className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Processing Time
          </h2>
          <p className="mt-2 text-slate-500">
            Orders are usually processed within 1 business day after payment confirmation.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <MapPin className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Delivery Coverage
          </h2>
          <p className="mt-2 text-slate-500">
            We deliver across UAE and selected GCC locations depending on courier availability.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Safe Handling
          </h2>
          <p className="mt-2 text-slate-500">
            All items are packed carefully to reduce the risk of damage during shipping.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">
          Delivery Terms
        </h2>

        <div className="mt-6 space-y-5 text-slate-600">
          <p>
            UAE delivery timelines are generally faster than international or GCC deliveries.
            Some remote areas may require additional time.
          </p>

          <p>
            Customers are responsible for providing an accurate delivery address and contact
            number. Delays caused by incorrect address details may affect delivery times.
          </p>

          <p>
            Delivery fees, if any, will be shown during checkout before payment is completed.
          </p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">
          Estimated Delivery Time
        </h3>

        <div className="mt-4 space-y-4 text-slate-600">
          <p>• UAE major cities: 1 to 3 business days</p>
          <p>• Other UAE areas: 2 to 5 business days</p>
          <p>• GCC deliveries: 4 to 10 business days</p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">
          Important Notes
        </h3>

        <div className="mt-4 space-y-4 text-slate-600">
          <p>• Delivery timelines may change during sales events or public holidays.</p>
          <p>• Some items may ship separately depending on seller or warehouse location.</p>
          <p>• Signature or OTP confirmation may be required on delivery.</p>
        </div>
      </div>
    </div>
  );
}