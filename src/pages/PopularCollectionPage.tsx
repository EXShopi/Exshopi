import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { OrbitLoader } from "../components/ui/OrbitLoader";
import { productAPI } from "../services/api";
import { getLiveMarketplaceProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

const collectionConfig = {
  "under-200": { title: "Under 200", maxPrice: 200, description: "Affordable marketplace picks under AED 200." },
  "under-500": { title: "Under 500", maxPrice: 500, description: "Best-value products and popular items under AED 500." },
  "under-1000": { title: "Under 1000", maxPrice: 1000, description: "Premium choices under AED 1000 for smart UAE shoppers." },
} as const;

export default function PopularCollectionPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [products, setProducts] = useState<LiveMarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const config =
    collectionConfig[(slug as keyof typeof collectionConfig) || "under-200"] || collectionConfig["under-200"];

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const liveProducts = getLiveMarketplaceProducts(items)
          .filter((item) => item.price <= config.maxPrice)
          .sort((a, b) => {
            if (b.reviews !== a.reviews) return b.reviews - a.reviews;
            return b.rating - a.rating;
          });

        setProducts(liveProducts);
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
  }, [config.maxPrice]);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="mb-4 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">{config.title}</span>
          </div>
          <div className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600">
            Most Popular Collection
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{config.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{config.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <OrbitLoader label="Loading live marketplace products..." size={26} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">No approved live products in this price range yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              ExShopi will show only approved live marketplace products here when they are available.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
