import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { OrbitLoader } from "../components/ui/OrbitLoader";
import { productAPI } from "../services/api";
import { getCampaignProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";
import { useSettingsStore } from "../store/settings";

export default function CampaignCollectionPage() {
  const { settings, fetchSettings } = useSettingsStore();
  const [products, setProducts] = useState<LiveMarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const campaignProducts = getCampaignProducts(items, settings.homepage.campaignSection.featuredProductIds).sort((a, b) => {
          if (b.discount !== a.discount) return b.discount - a.discount;
          return b.reviews - a.reviews;
        });
        setProducts(campaignProducts);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [settings.homepage.campaignSection.featuredProductIds]);

  const campaignTitle = settings.homepage.sections.find((section) => section.id === "flash-deals")?.title || "Campaign Products";
  const campaignSubtitle =
    settings.homepage.sections.find((section) => section.id === "flash-deals")?.subtitle ||
    "Shop all products currently featured in the active ExShopi campaign section.";

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="mb-4 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">{campaignTitle}</span>
          </div>
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
            Active Campaign
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{campaignTitle}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{campaignSubtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <OrbitLoader label="Loading campaign products..." size={26} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">No live campaign products yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Add approved product IDs in admin settings or tag live deals to fill this campaign collection.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
