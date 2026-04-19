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

const faqItems = [
  {
    question: "How to sell on ExShopi?",
    answer:
      "Create your seller account, complete approval, upload your products, and start selling across the UAE marketplace through ExShopi.",
  },
  {
    question: "Is ExShopi available in UAE?",
    answer:
      "Yes. ExShopi is available in UAE and is built to help sellers reach customers across Dubai, Abu Dhabi, Sharjah, and other Emirates.",
  },
  {
    question: "What commission does ExShopi charge?",
    answer:
      "ExShopi offers a simple 6% commission model designed for sellers who want to grow their ecommerce UAE business with predictable costs.",
  },
  {
    question: "How fast is seller approval?",
    answer:
      "Seller approval is designed to be fast once your business details are submitted and verified, helping you start online business UAE operations quickly.",
  },
  {
    question: "Do you support cash on delivery?",
    answer:
      "Yes. ExShopi supports cash on delivery, giving sellers access to one of the most trusted payment methods for customers who sell online UAE wide.",
  },
];

export default function SellOnExShopi() {
  const pathname = "/sell-on-exshopi";
  const canonicalUrl = buildAbsoluteUrl(pathname);
  const title = "Sell on ExShopi UAE | Start Selling Online in UAE Marketplace";
  const description =
    "Sell online in UAE with ExShopi marketplace. Low commission, cash on delivery, fast seller approval. Start your ecommerce business today.";

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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
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
        image={buildAbsoluteUrl("/logo.png")}
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
            <div className="max-w-4xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                Why Sell on ExShopi UAE?
              </h2>
              <div className="mt-3 space-y-4 text-sm leading-7 text-slate-500 md:text-base">
                <p>
                  ExShopi is built for businesses that want to sell online UAE wide through a professional, trusted, and growth-focused UAE marketplace. For many merchants, the hardest part of ecommerce UAE expansion is not product sourcing or pricing, but finding a reliable platform that already understands local customer expectations. ExShopi makes that process easier by creating a marketplace environment where sellers can enter the digital space with clear onboarding, simple cost structures, and a premium storefront presence that fits the UAE market.
                </p>
                <p>
                  If you want to start online business UAE operations with confidence, ExShopi gives you a practical path to launch without rebuilding everything from scratch. Instead of spending time setting up every delivery workflow, trust system, and payment expectation alone, sellers can plug into a marketplace experience designed around real shopping behavior in the Emirates. That includes support for cash on delivery, a key conversion driver for customers who still prefer flexible payment options when they shop online.
                </p>
                <p>
                  ExShopi also helps sellers position their products inside a premium ecommerce UAE environment that feels trustworthy to buyers. Strong approval standards, curated marketplace quality, and clear seller onboarding help create more confidence on both sides of the transaction. Whether you are launching a new retail brand, moving an offline business online, or expanding an existing catalog into a stronger UAE marketplace presence, ExShopi is designed to help you reach more customers across Dubai, Abu Dhabi, Sharjah, and the wider Emirates.
                </p>
                <p>
                  For businesses looking to grow steadily, ExShopi combines low-friction entry with marketplace features that support long-term selling. The goal is not only to help you sell online UAE wide, but to help you build a stronger ecommerce UAE presence with faster approval, clear costs, and a polished route to market. If your next step is to start online business UAE growth on a trusted platform, ExShopi gives you that opportunity in one focused seller journey.
                </p>
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
            <div className="max-w-3xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Seller FAQ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">
                Common questions for businesses planning to join ExShopi as a UAE marketplace seller.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-[26px] border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-black text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.answer}</p>
                </div>
              ))}
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

          <nav aria-label="Seller SEO links" className="sr-only">
            <Link to="/seller/register">Start selling on ExShopi</Link>
            <Link to="/">ExShopi homepage</Link>
          </nav>
        </div>
      </div>
    </>
  );
}
