import { Suspense, lazy, useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
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

const FeaturedProducts = lazy(() => import("../components/FeaturedProducts"));
const ShopByBrandSection = lazy(() => import("../components/ShopByBrandSection"));
const AccessoriesSection = lazy(() => import("../components/AccessoriesSection"));
const MostPopularSection = lazy(() => import("../components/MostPopularSection"));
const BlackFridaySection = lazy(() => import("../components/BlackFridaySection"));
const PromoSection = lazy(() => import("../components/PromoSection"));
const AllProductsSection = lazy(() => import("../components/AllProductsSection"));

function DeferredSection({
  children,
  rootMargin = "120px",
}: {
  children: ReactNode;
  rootMargin?: string;
}) {
  return (
    <LazyComponent deferUntilVisible={true} rootMargin={rootMargin}>
      <Suspense fallback={null}>{children}</Suspense>
    </LazyComponent>
  );
}

export default function Home() {
  const { settings, fetchSettings, hasFetched } = useSettingsStore();
  const homeSeo = generateHomepageSeo();

  useEffect(() => {
    if (hasFetched) return;
    fetchSettings();
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
          <DeferredSection key={sectionId} rootMargin="120px">
            <FeaturedProducts />
          </DeferredSection>
        );
      case "brands":
        return (
          <DeferredSection key={sectionId} rootMargin="120px">
            <ShopByBrandSection />
          </DeferredSection>
        );
      case "most-popular":
        return (
          <DeferredSection key={sectionId} rootMargin="120px">
            <MostPopularSection />
          </DeferredSection>
        );
      case "flash-deals":
        return (
          <DeferredSection key={sectionId} rootMargin="120px">
            <BlackFridaySection />
          </DeferredSection>
        );
      case "promo":
        return (
          <DeferredSection key={sectionId} rootMargin="120px">
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
      <UAEPrideStrip {...settings.homepage.uaeStrip} />
      <HeroSection />
      {/* SEO-optimized headline */}
      <div className="sr-only">
        <h1>ExShopi UAE Online Shopping Marketplace</h1>
      </div>
      <CategorySection />
      <MegaCategoryCarousel />
      <DeferredSection rootMargin="160px">
        <AccessoriesSection />
      </DeferredSection>
      {orderedCmsSections.map((section) => renderHomepageSection(section.id))}
      <DeferredSection rootMargin="180px">
        <AllProductsSection />
      </DeferredSection>
      <DeferredSection rootMargin="220px">
        <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">UAE & Saudi Arabia</p>
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

      <DeferredSection rootMargin="240px">
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

      <DeferredSection rootMargin="260px">
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
