import { useEffect, useMemo, useState } from "react";
import { productAPI } from "../services/api";
import ProductCard from "./ProductCard";
import { OrbitLoader } from "./ui/OrbitLoader";
import { useSettingsStore } from "../store/settings";
import { isLiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

export default function AllProductsSection() {
  const settings = useSettingsStore((state) => state.settings);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionSettings = settings.homepage.allProductsSection;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        setProducts((data || []).filter(isLiveMarketplaceProduct));
      } catch (error) {
        console.error("Error loading all products section:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const cards = useMemo(
    () =>
      products.map((product) => ({
        id: String(product.id),
        slug: product.slug || String(product.id),
        title: product.title,
        price: product.price,
        oldPrice: product.originalPrice || product.oldPrice || product.salePrice || 0,
        rating: Number(product.rating || 4.5),
        reviews: Number(product.reviews || 0),
        image: product.image,
        badge: product.ownership === "official" ? "OFFICIAL" : "LIVE",
        badges: product.badges || [],
        category:
          product?.specs?.templateName ||
          product?.brand ||
          product?.specs?.attributes?.brand ||
          "General",
        stock: Number(product.stock || 0) > 0 ? "In stock" : "Out of stock",
        seller: product.sellerName || "ExShopi Seller",
      })),
    [products]
  );

  if (!sectionSettings.show) return null;

  return (
    <section className="mx-auto mt-10 max-w-[1800px] px-4 pb-8 md:mt-14 md:px-6 md:pb-12">
      <div className="rounded-[28px] border border-slate-200 bg-white/80 px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl md:px-8 md:py-8">
        <div className="mb-5 md:mb-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Marketplace Catalog
          </p>
          <div className="mt-3 flex items-center gap-4 md:gap-6">
            <div className="hidden h-px flex-1 bg-slate-200 md:block" />
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                {sectionSettings.title}
              </h2>
              <p className="max-w-3xl text-sm text-slate-500 md:text-base">
                {sectionSettings.subtitle}
              </p>
            </div>
            <div className="hidden h-px flex-1 bg-slate-200 md:block" />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <OrbitLoader label="Loading products..." />
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            No live products are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {cards.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
