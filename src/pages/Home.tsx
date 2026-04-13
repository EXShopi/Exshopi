import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";
import UAEPrideStrip from "../components/UAEPrideStrip";
import MegaCategoryCarousel from "../components/MegaCategoryCarousel";
import FeaturedProducts from "../components/FeaturedProducts";
import ShopByBrandSection from "../components/ShopByBrandSection";
import AccessoriesSection from "../components/AccessoriesSection";
import MostPopularSection from "../components/MostPopularSection";
import BlackFridaySection from "../components/BlackFridaySection";
import PromoSection from "../components/PromoSection";
import AllProductsSection from "../components/AllProductsSection";
import { useSettingsStore } from "../store/settings";
import SEOHead from "../components/seo/SEOHead";
import { generateHomepageSeo, buildHomepageSchemas } from "../lib/seo";
import { LazyComponent } from "../components/LazyComponent";

export default function Home() {
  const { settings, fetchSettings } = useSettingsStore();
  const homeSeo = generateHomepageSeo();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
          <LazyComponent key={sectionId} deferUntilVisible={true} rootMargin="100px">
            <FeaturedProducts />
          </LazyComponent>
        );
      case "brands":
        return (
          <LazyComponent key={sectionId} deferUntilVisible={true} rootMargin="100px">
            <ShopByBrandSection />
          </LazyComponent>
        );
      case "most-popular":
        return (
          <LazyComponent key={sectionId} deferUntilVisible={true} rootMargin="100px">
            <MostPopularSection />
          </LazyComponent>
        );
      case "flash-deals":
        return (
          <LazyComponent key={sectionId} deferUntilVisible={true} rootMargin="100px">
            <BlackFridaySection />
          </LazyComponent>
        );
      case "promo":
        return (
          <div key={sectionId}>
            <PromoSection boxes={settings.homepage.promoBoxes} />
          </div>
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
      <AccessoriesSection />
      {orderedCmsSections.map((section) => renderHomepageSection(section.id))}
      <LazyComponent deferUntilVisible={true} rootMargin="100px">
        <AllProductsSection />
      </LazyComponent>
      <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 md:px-6">
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
    </div>
  );
}
