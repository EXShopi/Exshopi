import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, Lock, Smartphone, Sparkles } from "lucide-react";
import { categoryAPI } from "../services/api";
import ProductCardSkeleton from "../components/ui/ProductCardSkeleton";

const categoryIcons: Record<string, string> = {
  electronics: "💻",
  mobiles: "📱",
  laptops: "🖥️",
  tablets: "📲",
  accessories: "🎧",
  fashion: "🛍️",
  beauty: "✨",
  home: "🏠",
};

export default function CategoryComingSoon({
  category,
}: {
  category: any;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const icon = useMemo(() => categoryIcons[String(category?.slug || "").split("-")[0]] || "🛒", [category?.slug]);

  const handleNotify = async () => {
    try {
      setSubmitting(true);
      setError("");
      await categoryAPI.notifyInterest(category.id, { email, phone });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Unable to save your interest right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(135deg,#f8fafc,#eef4ff)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-5xl rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(148,163,184,0.18)] backdrop-blur-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Category Preview
              </div>
              <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-100 to-emerald-100 text-4xl shadow-inner">
                <span>{icon}</span>
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950">Coming Soon</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                {category?.comingSoonMessage || "We’re preparing amazing products in this category"}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {category?.name || "This category"} will open once ExShopi finishes curation, onboarding, and launch inventory for the UAE marketplace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleNotify}
                  disabled={submitting || submitted}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <BellRing className="h-4 w-4" />
                  {submitted ? "You’re on the list" : submitting ? "Saving..." : "Notify Me"}
                </button>
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-blue-200 hover:text-blue-600"
                >
                  Browse Other Categories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+971 50 123 4567"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
              {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
            </div>

            <div className="rounded-[32px] border border-slate-200/80 bg-slate-50/80 p-5 shadow-inner">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Preview Collection</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 shadow-sm">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Coming Soon
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="relative">
                    <div className="absolute inset-0 z-10 rounded-[28px] bg-white/35 backdrop-blur-[2px]" />
                    <div className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      <Lock className="h-3 w-3" />
                      Locked
                    </div>
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

