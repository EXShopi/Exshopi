import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Scale, AlertCircle } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Terms & Conditions</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Legal Information
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Terms & Conditions
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              By using ExShopi, you agree to follow these terms and conditions.
              Please read them carefully before placing an order or using our services.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <FileText size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">User Responsibility</h2>
          <p className="mt-2 text-slate-500">
            Users must provide accurate information and use the platform lawfully.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Scale className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">Fair Use</h2>
          <p className="mt-2 text-slate-500">
            Any misuse, fraud, or unauthorized activity may result in account restrictions.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <AlertCircle className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">Policy Updates</h2>
          <p className="mt-2 text-slate-500">
            ExShopi may update policies, services, or website content at any time.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">General Terms</h2>

        <div className="mt-6 space-y-5 text-slate-600">
          <p>
            All products, prices, and services listed on ExShopi are subject to availability.
            We reserve the right to correct errors, update product details, or cancel orders
            when necessary.
          </p>

          <p>
            Users agree not to misuse the website, interfere with operations, attempt fraud,
            or violate any applicable laws while using the platform.
          </p>

          <p>
            ExShopi is not responsible for delays, service interruptions, or indirect losses
            caused by courier issues, technical problems, or events beyond reasonable control.
          </p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">Orders & Payments</h3>

        <div className="mt-4 space-y-4 text-slate-600">
          <p>• Orders are confirmed only after successful payment or order approval.</p>
          <p>• Prices may change without prior notice.</p>
          <p>• Fraudulent or suspicious orders may be cancelled or held for review.</p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">Account & Usage</h3>

        <div className="mt-4 space-y-4 text-slate-600">
          <p>• Users are responsible for keeping their account information secure.</p>
          <p>• Any misuse of promotions, coupons, or offers may lead to account suspension.</p>
          <p>• Seller and buyer activity may be monitored for platform safety and compliance.</p>
        </div>
      </div>
    </div>
  );
}