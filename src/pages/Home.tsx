import { Component, Suspense, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";
import UAEPrideStrip from "../components/UAEPrideStrip";
import MegaCategoryCarousel from "../components/MegaCategoryCarousel";
import { useSettingsStore } from "../store/settings";
import SEOHead from "../components/seo/SEOHead";
import { generateHomepageSeo, buildHomepageSchemas } from "../lib/seo";
import { LazyComponent } from "../components/LazyComponent";
import { UAE_TRUST_SIGNALS } from "../lib/seoMarketplace";
import { getDualCountryTrustText } from "../lib/countryConfig";
import { lazyWithRetry } from "../utils/lazyWithRetry";

const FeaturedProducts = lazyWithRetry(() => import("../components/FeaturedProducts"), "section-featured-products");
const ShopByBrandSection = lazyWithRetry(() => import("../components/ShopByBrandSection"), "section-shop-by-brand");
const AccessoriesSection = lazyWithRetry(() => import("../components/AccessoriesSection"), "section-accessories");
const MostPopularSection = lazyWithRetry(() => import("../components/MostPopularSection"), "section-most-popular");
const BlackFridaySection = lazyWithRetry(() => import("../components/BlackFridaySection"), "section-black-friday");
const PromoSection = lazyWithRetry(() => import("../components/PromoSection"), "section-promo");
const AllProductsSection = lazyWithRetry(() => import("../components/AllProductsSection"), "section-all-products");

function DeferredSection({
  children,
  rootMargin = "120px",
  delayMs = 0,
}: {
  children: ReactNode;
  rootMargin?: string;
  delayMs?: number;
}) {
  return (
    <LazyComponent deferUntilVisible={true} rootMargin={rootMargin} delayMs={delayMs}>
      <SectionBoundary>
        <Suspense fallback={null}>{children}</Suspense>
      </SectionBoundary>
    </LazyComponent>
  );
}

class SectionBoundary extends Component<{ children: ReactNode; name?: string }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[home-section] ${this.props.name || "section"} failed`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto my-4 max-w-7xl px-4 md:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
            This section is taking longer than expected.
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  const { settings, fetchSettings, hasFetched } = useSettingsStore();
  const homeSeo = generateHomepageSeo();
  const [wholesaleOpen, setWholesaleOpen] = useState(false);

  useEffect(() => {
    if (hasFetched || typeof window === "undefined") return;

    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const loadSettings = () => {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          void fetchSettings();
        }
      }, 900);
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(loadSettings, { timeout: 1600 });
      } else {
        loadSettings();
      }
    };

    const onLoad = () => schedule();

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [fetchSettings, hasFetched]);

  const orderedCmsSections = useMemo(
    () =>
      [...settings.homepage.sections]
        .filter((section) => section.show)
        .sort((a, b) => a.order - b.order),
    [settings.homepage.sections]
  );

  const renderHomepageSection = (sectionId: string) => {
    switch (sectionId) {
      case "featured-products":
        return (
          <DeferredSection key={sectionId} rootMargin="0px" delayMs={550}>
            <FeaturedProducts />
          </DeferredSection>
        );
      case "brands":
        return (
          <DeferredSection key={sectionId} rootMargin="0px" delayMs={650}>
            <ShopByBrandSection />
          </DeferredSection>
        );
      case "most-popular":
        return (
          <DeferredSection key={sectionId} rootMargin="0px" delayMs={800}>
            <MostPopularSection />
          </DeferredSection>
        );
      case "flash-deals":
        return (
          <DeferredSection key={sectionId} rootMargin="0px" delayMs={950}>
            <BlackFridaySection />
          </DeferredSection>
        );
      case "promo":
        return (
          <DeferredSection key={sectionId} rootMargin="0px" delayMs={1050}>
            <PromoSection boxes={settings.homepage.promoBoxes} />
          </DeferredSection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f6f7f9]">
      <SEOHead
        title={homeSeo.metaTitle}
        description={homeSeo.metaDescription}
        keywords={homeSeo.metaKeywords}
        pathname="/"
        image={settings.homepage.hero.productImageUrl}
        jsonLd={buildHomepageSchemas()}
      />
      <SectionBoundary name="UAE pride strip">
        <UAEPrideStrip {...settings.homepage.uaeStrip} />
      </SectionBoundary>
      <SectionBoundary name="Hero">
        <HeroSection />
      </SectionBoundary>
      <div className="fixed right-3 top-[46%] z-30 hidden -translate-y-1/2 lg:block">
        {!wholesaleOpen ? (
          <button
            type="button"
            onClick={() => setWholesaleOpen(true)}
            className="group flex w-[74px] flex-col items-center gap-2 rounded-2xl border border-blue-100 bg-white px-2 py-3 text-center shadow-[0_18px_44px_rgba(15,23,42,0.16)] transition hover:-translate-x-1 hover:border-blue-200"
            aria-label="Open wholesale contact"
          >
            <PackageSearch className="h-5 w-5 text-blue-600" />
            <span className="text-[10px] font-black uppercase leading-3 tracking-[0.12em] text-slate-900">
              Contact Wholesale
            </span>
          </button>
        ) : (
          <div className="w-[340px] rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Bulk Orders</p>
                <h2 className="mt-2 text-xl font-black leading-tight text-slate-950">Contact wholesale sourcing</h2>
              </div>
              <button
                type="button"
                onClick={() => setWholesaleOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                aria-label="Close wholesale contact"
              >
                x
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Need laptops, mobiles, MacBooks, iPhones, tablets, or mixed electronics in quantity? Send models and target price.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                [ShieldCheck, "Admin tracked"],
                [Truck, "Worldwide delivery"],
                [MessageCircle, "WhatsApp ready"],
              ].map(([Icon, label]: any) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-2">
              <Link
                to="/wholesale"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <PackageSearch className="h-5 w-5" />
                Open Wholesale Form
              </Link>
              <a
                href="https://wa.me/971522608063?text=Hello%20ExShopi%2C%20I%20want%20a%20wholesale%2Fbulk%20order."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp Bulk
              </a>
            </div>
          </div>
        )}
      </div>
      <section className="mx-auto -mt-2 max-w-7xl px-4 pb-4 md:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setWholesaleOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left shadow-sm"
        >
          <span className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
            <PackageSearch className="h-5 w-5 text-blue-600" />
            Contact Wholesale
          </span>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Open
          </span>
        </button>
        {wholesaleOpen && (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Request bulk prices for laptops, mobiles, MacBooks, iPhones, tablets, or mixed electronics.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link to="/wholesale" className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white">
                Open Wholesale Form
              </Link>
              <a href="https://wa.me/971522608063?text=Hello%20ExShopi%2C%20I%20want%20a%20wholesale%2Fbulk%20order." target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700">
                WhatsApp Bulk
              </a>
            </div>
          </div>
        )}
      </section>
      {/* SEO-optimized headline */}
      <div className="sr-only">
        <h1>ExShopi UAE Online Shopping Marketplace</h1>
      </div>
      <SectionBoundary name="Categories">
        <CategorySection />
      </SectionBoundary>
      <DeferredSection rootMargin="20px" delayMs={250}>
        <MegaCategoryCarousel />
      </DeferredSection>
      <DeferredSection rootMargin="0px" delayMs={450}>
        <AccessoriesSection />
      </DeferredSection>
      {orderedCmsSections.map((section) => renderHomepageSection(section.id))}
      <DeferredSection rootMargin="0px" delayMs={900}>
        <AllProductsSection />
      </DeferredSection>
      <DeferredSection rootMargin="0px" delayMs={1100}>
        <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">GCC Marketplace</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {UAE_TRUST_SIGNALS.map((signal) => (
                <span key={signal} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {signal}
                </span>
              ))}
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {getDualCountryTrustText()}
              </span>
            </div>
          </div>
        </section>
      </DeferredSection>

      <DeferredSection rootMargin="0px" delayMs={1250}>
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Landing Pages</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">High-intent UAE shopping routes</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Explore search-focused marketplace pages built around buyers looking for iPhones, refurbished laptops, MacBooks, and electronics online in the UAE.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/buy-iphone-uae" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                Buy iPhone UAE
              </Link>
              <Link to="/refurbished-laptops-uae" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                Refurbished Laptops UAE
              </Link>
              <Link to="/cheap-macbook-dubai" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                Cheap MacBook Dubai
              </Link>
              <Link to="/electronics-online-uae" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                Electronics Online UAE
              </Link>
            </div>
          </div>
        </section>
      </DeferredSection>

      <DeferredSection rootMargin="0px" delayMs={1400}>
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">From The Blog</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">UAE shopping guides that support SEO and trust</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Explore ExShopi content built around real buyer intent, including refurbished laptops UAE, used MacBook Dubai, and premium electronics buying advice.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/blog/best-laptops-uae" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
                Best Laptops UAE
              </Link>
              <Link to="/blog/macbook-buying-guide" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                MacBook Buying Guide
              </Link>
              <Link to="/blog" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
                Visit Blog
              </Link>
            </div>
          </div>
        </section>
      </DeferredSection>
    </div>
  );
}
