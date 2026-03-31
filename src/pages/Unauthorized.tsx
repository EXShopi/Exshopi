import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[1600px] items-center justify-center px-4 py-12 md:px-6">
      <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
          <ShieldAlert size={32} />
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
          Access Restricted
        </p>

        <h1 className="mt-3 text-4xl font-black text-slate-900">
          Unauthorized Access
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-slate-500">
          You do not have permission to view this page. Please go back to the
          homepage or sign in with the correct account.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <Link
            to="/support"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}