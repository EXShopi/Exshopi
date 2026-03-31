import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Layers3, SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ui/ProductCardSkeleton";
import CategoryComingSoon from "./CategoryComingSoon";
import { categoryData } from "../data/categoryStructure";
import { categoryAPI, productAPI } from "../services/api";

type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  stock: string;
  seller: string;
  badge?: string;
};

const keywordMap: Record<string, string[]> = {
  laptops: ["laptop", "macbook", "notebook", "elitebook", "thinkpad", "dell", "hp", "lenovo"],
  "laptops-desktops": ["laptop", "desktop", "elitebook", "thinkpad", "monitor"],
  electronics: ["laptop", "monitor", "printer", "speaker", "electronics", "desktop"],
  mobiles: ["phone", "iphone", "smartphone", "pixel", "samsung", "mobile"],
  tablets: ["tablet", "ipad", "tab"],
  accessories: ["earbuds", "headphones", "speaker", "airpods", "buds", "accessories", "charger", "cable"],
  gaming: ["gaming", "predator", "console", "controller"],
  deals: ["sale", "deal", "save", "black friday", "offer"],
};

const categoryDescriptions: Record<string, string> = {
  laptops: "Explore premium laptops, used devices, and business machines curated for UAE shoppers.",
  electronics: "Discover electronics, computing gear, and marketplace essentials from trusted vendors.",
  mobiles: "Browse smartphones, flagship devices, and mobile accessories with verified seller offers.",
  tablets: "Find iPads, Android tablets, and portable work-from-anywhere devices.",
  accessories: "Shop headphones, earbuds, speakers, chargers, and daily-use accessories.",
  gaming: "Level up with gaming laptops, accessories, and performance gear.",
  deals: "Today’s strongest offers, flash deals, and savings in one place.",
  categories: "Browse all marketplace categories and curated product selections.",
};

function titleFromSlug(value?: string) {
  if (!value) return "Marketplace";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

const PAGE_SIZE = 12;

export default function CategoryPage() {
  const { category, subcategory } = useParams<{ category?: string; subcategory?: string }>();
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryKey = (category || "categories").toLowerCase();
  const subcategoryKey = (subcategory || "").toLowerCase();
  const categoryInfo = categoryData.find((entry) => entry.slug === categoryKey);
  const subcategoryInfo = categoryInfo?.subcategories.find((entry) => entry.slug === subcategoryKey);
  const liveCategory = categories.find((entry) => entry.slug === categoryKey);
  const isComingSoon = Boolean(category && liveCategory && liveCategory.active === false);
  const displayTitle = subcategoryInfo?.name || categoryInfo?.name || liveCategory?.name || titleFromSlug(categoryKey);
  const description =
    categoryDescriptions[categoryKey] ||
    `Shop ${displayTitle.toLowerCase()} with curated marketplace offers, fast UAE delivery, and trusted vendors.`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setVisibleCount(PAGE_SIZE);

    Promise.all([categoryAPI.getAll(), productAPI.getAll()])
      .then(([categoryRows, productRows]) => {
        if (!mounted) return;
        setCategories(Array.isArray(categoryRows) ? categoryRows : []);
        const liveProducts = (productRows || [])
          .filter(
            (product: any) =>
              product?.status === "live" ||
              product?.productStatus === "live" ||
              (product?.approvalStatus === "approved" && product?.visibilityStatus === "live")
          )
          .map(
            (product: any): CatalogProduct => ({
              id: String(product.id),
              slug: product.slug || String(product.id),
              title: product.title,
              price: Number(product.price || 0),
              oldPrice:
                Number(product.originalPrice || 0) > Number(product.price || 0)
                  ? Number(product.originalPrice || 0)
                  : undefined,
              rating: Number(product.rating || 0),
              reviews: Number(product.reviews || product.reviewsCount || 0),
              image: product.image || product.images?.[0] || "",
              category: product.category || product.brand || "Marketplace",
              stock: Number(product.stock || 0) > 0 ? "In stock" : "Out of stock",
              seller: product.sellerName || "Marketplace Seller",
              badge: product.badges?.[0] || product.badge,
            })
          );
        setCatalog(liveProducts);
      })
      .catch((err) => {
        console.error("Error loading category page:", err);
        if (mounted) setError("We couldn't load this category right now.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [categoryKey]);

  const filteredProducts = useMemo(() => {
    if (categoryKey === "categories") {
      return catalog;
    }

    const searchTerms = [
      categoryKey,
      subcategoryKey,
      ...(keywordMap[categoryKey] || []),
      ...(subcategoryKey ? subcategoryKey.split("-") : []),
    ]
      .filter(Boolean)
      .map((term) => term.toLowerCase());

    const matches = catalog.filter((product) => {
      const haystack = normalizeText(`${product.title} ${product.category} ${product.seller} ${product.badge || ""} ${product.slug}`);
      return searchTerms.some((term) => haystack.includes(term));
    });

    return matches;
  }, [catalog, categoryKey, subcategoryKey]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const relatedSubcategories = categoryInfo?.subcategories || [];

  if (!loading && isComingSoon) {
    return <CategoryComingSoon category={liveCategory} />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <section className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,#ffffff,#eef4ff)]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-slate-900">Categories</Link>
            {category && (
              <>
                <span>/</span>
                <span className="font-semibold text-slate-900">{titleFromSlug(category)}</span>
              </>
            )}
            {subcategory && (
              <>
                <span>/</span>
                <span className="font-semibold text-blue-600">{titleFromSlug(subcategory)}</span>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-600 shadow-[0_12px_40px_rgba(148,163,184,0.18)] backdrop-blur-xl">
                <Layers3 className="h-4 w-4 text-blue-600" />
                {subcategoryInfo ? "Subcategory Collection" : "Category Collection"}
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{displayTitle}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/products" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
                  Explore All Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/deals" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:border-blue-200 hover:text-blue-600">
                  View Today Deals
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_50px_rgba(148,163,184,0.18)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                Quick navigation
              </div>
              <div className="grid gap-3">
                {(relatedSubcategories.length > 0
                  ? relatedSubcategories
                  : [
                      { name: "Featured Products", slug: categoryKey },
                      { name: "Top Rated", slug: `${categoryKey}-top-rated` },
                      { name: "Best Deals", slug: `${categoryKey}-deals` },
                    ]).map((entry) => (
                  <Link
                    key={entry.slug}
                    to={`/category/${categoryKey}/${entry.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <span>{entry.name}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {loading ? "Loading live marketplace products" : `Showing ${filteredProducts.length} live products`}
            </p>
            <p className="mt-1 text-sm text-slate-500">Marketplace picks selected for {displayTitle.toLowerCase()}.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live marketplace selection
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">Category unavailable right now</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.slug} {...product} />
              ))}
            </div>
            {visibleCount < filteredProducts.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-3xl">🛍️</div>
            <p className="mt-5 text-xl font-black text-slate-900">No live products yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              This category will show approved marketplace products as soon as sellers and ExShopi Official publish them.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

