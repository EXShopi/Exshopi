import { useEffect, useMemo } from "react";
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

export default function Home() {
  const { settings, fetchSettings } = useSettingsStore();

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
        return <FeaturedProducts key={sectionId} />;
      case "brands":
        return <ShopByBrandSection key={sectionId} />;
      case "most-popular":
        return <MostPopularSection key={sectionId} />;
      case "flash-deals":
        return <BlackFridaySection key={sectionId} />;
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
    <div className="min-h-screen bg-[#f6f7f9]">
      <UAEPrideStrip {...settings.homepage.uaeStrip} />
      <HeroSection />
      <CategorySection />
      <MegaCategoryCarousel />
      <AccessoriesSection />
      {orderedCmsSections.map((section) => renderHomepageSection(section.id))}
      <AllProductsSection />
    </div>
  );
}
