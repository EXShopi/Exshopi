export default function ReturnPolicy() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
          ExShopi Support
        </p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Return Policy</h1>
        <p className="mt-4 max-w-3xl text-slate-500">
          We want you to shop with confidence. If the product you receive is not
          as described, damaged, or faulty, you may request a return according
          to the conditions below.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-900">Eligible Returns</h2>
            <p className="mt-3 text-slate-500">
              Returns are accepted for damaged, defective, incorrect, or
              significantly not-as-described items within the allowed return
              window.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-900">Return Window</h2>
            <p className="mt-3 text-slate-500">
              Return requests should usually be submitted within 7 days of
              delivery unless a different return period is shown on the product
              page.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-900">Condition</h2>
            <p className="mt-3 text-slate-500">
              Products should be returned in the same condition received,
              including accessories, charger, packaging, and invoice if
              available.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-900">Refund Process</h2>
            <p className="mt-3 text-slate-500">
              After inspection and approval, refunds are processed to the
              original payment method or according to marketplace policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}