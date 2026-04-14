import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import OptimizedImage from "../components/OptimizedImage";
import { OrbitLoader } from "../components/ui/OrbitLoader";
import { brands } from "../components/ShopByBrandSection";
import { getBrandLogoForName, normalizeBrandKey } from "../data/brandLogos";
import { productAPI } from "../services/api";
import { getLiveMarketplaceProducts, productMatchesBrand, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

const brandDescriptions: Record<string, string> = {
  apple: "Premium Apple devices, laptops, tablets, and accessories selected for UAE marketplace buyers.",
  samsung: "Samsung smartphones, tablets, earbuds, and accessories with trusted marketplace offers.",
  dell: "Dell laptops, monitors, and computing essentials for work and daily use.",
  hp: "HP productivity devices, business machines, and reliable electronics for every workflow.",
  lenovo: "Lenovo laptops and professional computing picks from marketplace sellers.",
  acer: "Acer gaming and everyday computing products with competitive pricing.",
  asus: "ASUS laptops, components, and performance devices for modern shoppers.",
  gaming: "Gaming-focused devices, accessories, and performance products from top sellers.",
};

function titleFromSlug(slug?: string) {
  if (!slug) return "Brand";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BrandPage() {
  const { brand } = useParams<{ brand?: string }>();
  const [products, setProducts] = useState<LiveMarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const brandSlug = (brand || "").toLowerCase();
  // Resolve brand name + logo via centralized mapping
  const brandInfo = brands.find((item) => normalizeBrandKey(item.name) === brandSlug);
  const brandName = brandInfo?.name || titleFromSlug(brandSlug);
  const brandLogo =
    getBrandLogoForName(brandName) ||
    getBrandLogoForName(brandSlug) ||
    (brandSlug ? `/Banners/${brandSlug}` : null);

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const liveProducts = getLiveMarketplaceProducts(items)
          .filter((item) => productMatchesBrand(item, brandSlug))
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
  }, [brandSlug]);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),linear-gradient(135deg,#ffffff,#eff5ff)]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="mb-5 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900">{brandName}</span>
          </div>

          <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/70 bg-white/80 shadow-[0_20px_40px_rgba(15,23,42,0.10)] backdrop-blur">
              {brandInfo && brandLogo ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-md bg-white/90 p-2">
                  <OptimizedImage src={brandLogo} alt={brandName} useWebP lazy className="max-h-full max-w-full object-contain" width={160} height={80} />
                </div>
              ) : brandInfo ? (
                <span className="text-3xl font-black text-slate-900">{brandName.slice(0, 1)}</span>
              ) : (
                <span className="text-3xl font-black text-slate-900">{brandName.slice(0, 1)}</span>
              )}
            </div>
            <div>
              <div className="mb-3 inline-flex rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
                Brand Store
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{brandName}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {brandDescriptions[brandSlug] || `${brandName} product picks, popular listings, and marketplace deals in one dedicated brand page.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">All {brandName} products</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading live marketplace products" : `${products.length} approved live products found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <OrbitLoader label="Loading brand products..." size={26} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">No approved live products for {brandName} yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              This brand page will show only approved live marketplace listings as soon as they are available.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
