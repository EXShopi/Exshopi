import { Link } from "react-router-dom";
import { ShieldCheck, BadgeCheck, Clock3, Wrench } from "lucide-react";

export default function Warranty() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Warranty</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Buyer Protection
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Warranty Information
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              Warranty coverage may vary depending on the seller, product type,
              and item condition. Please review the listing details and policy
              terms before purchase.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <ShieldCheck size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <BadgeCheck className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Covered Products
          </h2>
          <p className="mt-2 text-slate-500">
            Some products may include seller warranty, service warranty, or checking warranty.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Clock3 className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Warranty Period
          </h2>
          <p className="mt-2 text-slate-500">
            Warranty duration depends on the product listing and seller terms.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Wrench className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Service Process
          </h2>
          <p className="mt-2 text-slate-500">
            Eligible warranty claims may be repaired, replaced, or reviewed by the seller.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">Warranty Terms</h2>

        <div className="mt-6 space-y-5 text-slate-600">
          <p>
            Warranty applies only where clearly mentioned on the product page or
            invoice. Items sold without warranty will not be covered unless required by law.
          </p>

          <p>
            Warranty does not cover accidental damage, water damage, misuse,
            software issues caused by the user, or unauthorized repair attempts.
          </p>

          <p>
            Customers may be asked to provide proof of purchase, order number,
            photos, and issue details before the warranty claim is reviewed.
          </p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">
          How to Claim Warranty
        </h3>

        <div className="mt-4 space-y-4 text-slate-600">
          <p>• Contact support or the seller with your order number.</p>
          <p>• Explain the issue clearly and attach photos if needed.</p>
          <p>• Wait for inspection instructions or approval.</p>
          <p>• If approved, the item may be repaired, replaced, or otherwise resolved.</p>
        </div>
      </div>
    </div>
  );
}