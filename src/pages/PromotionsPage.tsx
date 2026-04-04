import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useSettingsStore } from "../store/settings";

export default function PromotionsPage() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const campaignSection = settings.homepage.sections.find((section) => section.id === "flash-deals");
  const visibleBoxes = settings.homepage.promoBoxes.filter((box) => box.show);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="mb-4 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">Promotions</span>
          </div>
          <div className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
            Seasonal Events & Festivals
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">All Promotions</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Browse the active ExShopi campaign section and all promotional blocks managed from the admin panel.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Link
            to={settings.homepage.campaignSection.moreCtaLink || "/campaigns/current"}
            className="rounded-[30px] border border-blue-100 bg-blue-50 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
              {settings.homepage.campaignSection.badgeText || "Campaign"}
            </div>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900">
              {campaignSection?.title || "Current Campaign"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {campaignSection?.subtitle || "Open the live campaign collection managed from the homepage CMS."}
            </p>
            <div className="mt-6 text-sm font-bold text-blue-700">
              Open current campaign
            </div>
          </Link>

          {visibleBoxes.map((box) => (
            <Link
              key={box.id}
              to={box.ctaLink}
              className={`overflow-hidden rounded-[30px] border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                box.tone === "dark" ? "border-slate-200 bg-slate-900 text-white" : "border-emerald-100 bg-emerald-50 text-slate-900"
              }`}
            >
              {box.imageUrl ? (
                <div className="mb-6 overflow-hidden rounded-[24px] border border-white/20">
                  <img src={box.imageUrl} alt={box.title} className="h-48 w-full object-cover" loading="lazy" />
                </div>
              ) : null}
              <div className={`text-sm font-bold uppercase tracking-[0.18em] ${box.tone === "dark" ? "text-slate-300" : "text-emerald-700"}`}>
                {box.badge}
              </div>
              <h2 className={`mt-3 text-3xl font-black leading-tight ${box.tone === "dark" ? "text-white" : "text-slate-900"}`}>
                {box.title}
              </h2>
              <p className={`mt-3 text-sm leading-6 ${box.tone === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                {box.description}
              </p>
              <div className={`mt-6 text-sm font-bold ${box.tone === "dark" ? "text-white" : "text-slate-900"}`}>
                {box.ctaText}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
