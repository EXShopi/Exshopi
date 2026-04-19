import { BadgeCheck, CreditCard, MapPin, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "../components/seo/SEOHead";
import { buildAbsoluteUrl } from "../lib/seo";

const benefitCards = [
  {
    title: "6% Commission",
    description: "Keep more from every order with a simple marketplace commission built for growth.",
    icon: TrendingUp,
    accent: "bg-blue-100 text-blue-600",
  },
  {
    title: "99 AED Monthly Plan",
    description: "Launch with a predictable monthly seller plan designed for UAE marketplace brands.",
    icon: Store,
    accent: "bg-violet-100 text-violet-600",
  },
  {
    title: "Cash on Delivery",
    description: "Sell confidently with trusted COD support that matches how UAE customers prefer to buy.",
    icon: CreditCard,
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "UAE Wide Delivery",
    description: "Reach shoppers across Dubai, Abu Dhabi, Sharjah, and the rest of the Emirates.",
    icon: MapPin,
    accent: "bg-amber-100 text-amber-600",
  },
  {
    title: "Verified Marketplace",
    description: "Join a curated marketplace where sellers are reviewed before they go live.",
    icon: BadgeCheck,
    accent: "bg-sky-100 text-sky-600",
  },
];

const steps = [
  {
    step: "1",
    title: "Register",
    description: "Create your seller account and share your business details to get started.",
  },
  {
    step: "2",
    title: "Get Approved",
    description: "Our team reviews your application so the marketplace stays trusted and high quality.",
  },
  {
    step: "3",
    title: "Upload Products",
    description: "List your catalog, set your pricing, and prepare your store for UAE shoppers.",
  },
  {
    step: "4",
    title: "Start Selling",
    description: "Go live on ExShopi and begin reaching customers across the UAE marketplace.",
  },
];

export default function SellOnExShopi() {
  const pathname = "/sell-on-exshopi";
  const canonicalUrl = buildAbsoluteUrl(pathname);
  const title = "Sell on ExShopi UAE – Start Your Online Business in UAE Marketplace";
  const description =
    "Start selling on ExShopi UAE marketplace. Reach customers across UAE with cash on delivery, low commission, and fast approval.";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "ExShopi",
        url: buildAbsoluteUrl("/"),
      },
      about: {
        "@type": "Organization",
        name: "ExShopi",
        url: buildAbsoluteUrl("/"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ExShopi",
      url: buildAbsoluteUrl("/"),
      logo: buildAbsoluteUrl("/logo.png"),
      sameAs: [buildAbsoluteUrl("/")],
    },
  ];

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        pathname={pathname}
        canonicalUrl={canonicalUrl}
        type="website"
        ogTitle={title}
        ogDescription={description}
        ogImage={buildAbsoluteUrl("/logo.png")}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-slate-50 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 md:px-6">
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="grid gap-8 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  <ShieldCheck className="h-4 w-4" />
                  Sell On ExShopi
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                    Become an ExShopi Seller
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                    Sell across UAE with trusted marketplace support, simple onboarding, and a premium seller journey built for growing brands.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/seller/register"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-blue-600"
                  >
                    Start Selling
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefitCards.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Seller Benefits</h2>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Everything you need to launch and scale on ExShopi without changing how you already do business.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {benefitCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300"
                  >
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">How It Works</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">
                ExShopi keeps the seller onboarding flow straightforward so you can go from registration to live sales quickly.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] bg-slate-900 px-6 py-10 text-center text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:px-10 md:py-14">
            <div className="mx-auto max-w-3xl space-y-5">
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Ready to grow your business on ExShopi?</h2>
              <p className="text-sm leading-7 text-slate-300 md:text-base">
                Complete your seller registration and let our team help you launch across the UAE marketplace.
              </p>
              <div className="pt-2">
                <Link
                  to="/seller/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-900 transition-all hover:bg-blue-50 hover:text-blue-700"
                >
                  Start Selling Now
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
