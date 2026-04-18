import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Layers3, SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ui/ProductCardSkeleton";
import CategoryComingSoon from "./CategoryComingSoon";
import { categoryData } from "../data/categoryStructure";
import { debugCategoryAssignment, filterProductsByCategoryTree, getCategoryRouteInfo } from "../lib/masterCategories";
import { isLiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";
import { categoryAPI, productAPI } from "../services/api";
import SEOHead from "../components/seo/SEOHead";
import { buildCategorySeoDescription, generateCategorySeo, getCategoryPath, buildAbsoluteUrl } from "../lib/seo";
import { buildCategorySeoBody, UAE_TRUST_SIGNALS } from "../lib/seoMarketplace";
import { readRouteSnapshot } from "../lib/routeSnapshot";

type CatalogProduct = {
  id: string;
  slug: string;
  parentCategorySlug?: string;
  subcategorySlug?: string;
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

const CATEGORY_CONTENT: Record<
  string,
  {
    title: string;
    hero: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
  }
> = {
  electronics: {
    title: "Electronics",
    hero: "Shop electronics with curated marketplace offers, structured product specifications, and trusted UAE seller support.",
    seoTitle: "Electronics in UAE | ExShopi",
    seoDescription: "Browse electronics in UAE on ExShopi with clean category architecture, trusted marketplace listings, and clear paths into computers, PC, and laptop products.",
    seoKeywords: ["electronics UAE", "buy electronics UAE", "electronics Dubai", "ExShopi electronics"],
  },
  computers: {
    title: "Computers",
    hero: "Shop computers with marketplace-ready listings for everyday computing, office setups, and reliable UAE delivery support.",
    seoTitle: "Computers in UAE | ExShopi",
    seoDescription: "Shop computers in UAE on ExShopi with dedicated category filtering, clear product classification, and clean internal links for discovery.",
    seoKeywords: ["computers UAE", "buy computers UAE", "computer deals Dubai", "ExShopi computers"],
  },
  pc: {
    title: "PC",
    hero: "Shop PC listings with desktop-ready performance, workstation options, and structured specifications for UAE buyers.",
    seoTitle: "PC in UAE | ExShopi",
    seoDescription: "Explore PC products in UAE on ExShopi with a dedicated PC category, accurate breadcrumbs, and clearer desktop computing discovery.",
    seoKeywords: ["PC UAE", "desktop PC UAE", "buy PC Dubai", "ExShopi PC"],
  },
  laptops: {
    title: "Laptops",
    hero: "Shop laptops with curated marketplace offers, structured product specifications, and trusted UAE seller support.",
    seoTitle: "Laptops in UAE | ExShopi",
    seoDescription: "Shop laptops in UAE on ExShopi with dedicated laptop category filtering, clean canonical routing, and trusted marketplace discovery.",
    seoKeywords: ["laptops UAE", "buy laptops UAE", "refurbished laptops Dubai", "ExShopi laptops"],
  },
};

export default function CategoryPage() {
  const { category, subcategory } = useParams<{ category?: string; subcategory?: string }>();
  const routeInfo = useMemo(() => getCategoryRouteInfo(category, subcategory), [category, subcategory]);
  const canonicalCategoryKey = routeInfo?.canonicalCategorySlug || (category || "categories").toLowerCase();
  const canonicalSubcategoryKey = routeInfo?.canonicalSubcategorySlug || "";
  const canonicalPath =
    routeInfo?.canonicalPath || getCategoryPath(canonicalCategoryKey, canonicalSubcategoryKey || undefined);
  const routeSnapshot = readRouteSnapshot();
  const snapshotCategoryProducts =
    routeSnapshot?.kind === "category" &&
    routeSnapshot.category?.slug === canonicalCategoryKey &&
    (routeSnapshot.category?.subcategorySlug || "") === canonicalSubcategoryKey
      ? routeSnapshot.products || []
      : [];
  const snapshotCategories =
    routeSnapshot?.kind === "category" && Array.isArray(routeSnapshot.categories)
      ? routeSnapshot.categories
      : [];
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(snapshotCategories);
  const [loading, setLoading] = useState(snapshotCategoryProducts.length === 0);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const effectiveCategoryKey = canonicalCategoryKey;
  const effectiveSubcategoryKey = canonicalSubcategoryKey;

  const categoryInfo = categoryData.find((entry) => entry.slug === effectiveCategoryKey);
  const subcategoryInfo = categoryInfo?.subcategories.find((entry) => entry.slug === effectiveSubcategoryKey);
  const liveCategory = categories.find((entry) => entry.slug === effectiveCategoryKey);
  const isComingSoon = Boolean(category && liveCategory && liveCategory.active === false);
  const categoryContent = CATEGORY_CONTENT[effectiveSubcategoryKey || effectiveCategoryKey];
  const displayTitle = categoryContent?.title || subcategoryInfo?.name || categoryInfo?.name || liveCategory?.name || titleFromSlug(effectiveSubcategoryKey || effectiveCategoryKey);
  const heroDescription = categoryContent?.hero || `Shop ${displayTitle.toLowerCase()} with curated marketplace offers, structured product specifications, and trusted UAE seller support.`;
  const seoDescription = categoryContent?.seoDescription || buildCategorySeoDescription(displayTitle);
  const generatedSeo = generateCategorySeo(displayTitle, effectiveSubcategoryKey || effectiveCategoryKey);
  const seo = {
    ...generatedSeo,
    metaTitle: categoryContent?.seoTitle || generatedSeo.metaTitle,
    metaDescription: seoDescription,
    metaKeywords: Array.from(
      new Set([
        ...(categoryContent?.seoKeywords || []),
        ...String(generatedSeo.metaKeywords || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ])
    ).join(", "),
  };

  useEffect(() => {
    debugCategoryAssignment("category-route", {
      requestedCategory: category,
      requestedSubcategory: subcategory,
      routeInfo,
    });
  }, [category, subcategory, routeInfo]);

  useEffect(() => {
    if (!snapshotCategoryProducts.length) return;
    const seeded = snapshotCategoryProducts.map(
      (product: any): CatalogProduct => ({
        id: String(product.id),
        slug: product.slug || String(product.id),
        parentCategorySlug: product.specs?.parentCategorySlug || product.specs?.categorySlug,
        subcategorySlug: product.specs?.subcategorySlug || product.specs?.templateId,
        title: product.title,
        price: Number(product.price || 0),
        oldPrice:
          Number(product.originalPrice || 0) > Number(product.price || 0)
            ? Number(product.originalPrice || 0)
            : undefined,
        rating: Number(product.rating || 0),
        reviews: Number(product.reviews || product.reviewsCount || 0),
        image: product.image || product.images?.[0] || "",
        category: product.specs?.categoryName || product.specs?.parentCategoryName || product.brand || "Marketplace",
        stock: Number(product.stock || 0) > 0 ? "In stock" : "Out of stock",
        seller: product.sellerName || "Marketplace Seller",
        badge: product.badges?.[0] || product.badge,
      })
    );

    setRawProducts(snapshotCategoryProducts);
    setCatalog(seeded);
    setLoading(false);
  }, [snapshotCategoryProducts]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setVisibleCount(PAGE_SIZE);
    let fetchedCategories: any[] = [];
    categoryAPI
      .getAll()
      .then((categoryRows) => {
        if (!mounted) return Promise.reject(new Error('unmounted'));
        fetchedCategories = Array.isArray(categoryRows) ? categoryRows : [];
        setCategories(fetchedCategories);

        const liveCat = fetchedCategories.find((entry) => entry.slug === effectiveCategoryKey);
        if (liveCat && liveCat.id) {
          return productAPI.getByCategory(liveCat.id);
        }
        // No backend category id found — query server by canonical slug to avoid full client-side scans
        return productAPI.getBySlug(effectiveCategoryKey, effectiveSubcategoryKey);
      })
      .then((productRows) => {
        if (!mounted) return;
        const liveRaw = (productRows || []).filter(isLiveMarketplaceProduct);
        setRawProducts(liveRaw);
        const liveProducts = (liveRaw || []).map(
          (product: any): CatalogProduct => ({
            id: String(product.id),
            slug: product.slug || String(product.id),
            parentCategorySlug: product.specs?.parentCategorySlug || product.specs?.categorySlug,
            subcategorySlug: product.specs?.subcategorySlug || product.specs?.templateId,
            title: product.title,
            price: Number(product.price || 0),
            oldPrice:
              Number(product.originalPrice || 0) > Number(product.price || 0)
                ? Number(product.originalPrice || 0)
                : undefined,
            rating: Number(product.rating || 0),
            reviews: Number(product.reviews || product.reviewsCount || 0),
            image: product.image || product.images?.[0] || "",
            category: product.specs?.categoryName || product.specs?.parentCategoryName || product.brand || "Marketplace",
            stock: Number(product.stock || 0) > 0 ? "In stock" : "Out of stock",
            seller: product.sellerName || "Marketplace Seller",
            badge: product.badges?.[0] || product.badge,
          })
        );
        setCatalog(liveProducts);
      })
      .catch((err) => {
        if (err && err.message !== 'unmounted') console.error("Error loading category page:", err);
        if (mounted) setError("We couldn't load this category right now.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [category, subcategory, effectiveCategoryKey, effectiveSubcategoryKey]);

  const filteredProducts = useMemo(() => {
    if (effectiveCategoryKey === "categories") return catalog;
    // Use master category helpers to filter the raw product objects (preserve specs)
    try {
      const matched = filterProductsByCategoryTree(rawProducts || [], effectiveCategoryKey || null, effectiveSubcategoryKey || null, categories || []);
      // map matched raw products into the catalog shape
      return (matched || []).map((product: any): CatalogProduct => ({
        id: String(product.id),
        slug: product.slug || String(product.id),
        parentCategorySlug: product.specs?.parentCategorySlug || product.specs?.categorySlug,
        subcategorySlug: product.specs?.subcategorySlug || product.specs?.templateId,
        title: product.title,
        price: Number(product.price || 0),
        oldPrice: Number(product.originalPrice || 0) > Number(product.price || 0) ? Number(product.originalPrice || 0) : undefined,
        rating: Number(product.rating || 0),
        reviews: Number(product.reviews || product.reviewsCount || 0),
        image: product.image || product.images?.[0] || "",
        category: product.specs?.categoryName || product.specs?.parentCategoryName || product.brand || "Marketplace",
        stock: Number(product.stock || 0) > 0 ? "In stock" : "Out of stock",
        seller: product.sellerName || "Marketplace Seller",
        badge: product.badges?.[0] || product.badge,
      }));
    } catch (err) {
      // Do not fallback to heuristic text search for category pages — return empty and log.
      console.warn('Category filtering failed for', effectiveCategoryKey, effectiveSubcategoryKey, err);
      return [];
    }
  }, [catalog, effectiveCategoryKey, effectiveSubcategoryKey, categories]);

  const seoBody = buildCategorySeoBody({
    categoryName: displayTitle,
    categorySlug: effectiveCategoryKey,
    subcategorySlug: effectiveSubcategoryKey,
    productCount: filteredProducts.length,
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const relatedSubcategories = categoryInfo?.subcategories || [];

  useEffect(() => {
    debugCategoryAssignment("category-page-products", {
      route: canonicalPath,
      effectiveCategoryKey,
      effectiveSubcategoryKey,
      rawProducts: rawProducts.length,
      filteredProducts: filteredProducts.length,
    });
  }, [canonicalPath, effectiveCategoryKey, effectiveSubcategoryKey, filteredProducts.length, rawProducts.length]);

  if (!loading && isComingSoon) {
    return <CategoryComingSoon category={liveCategory} />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <SEOHead
        title={seo.metaTitle}
        description={seoDescription}
        keywords={seo.metaKeywords}
        pathname={canonicalPath}
        type="website"
        canonicalUrl={buildAbsoluteUrl(canonicalPath)}
      />
      <section className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,#ffffff,#eef4ff)]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-14">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-slate-900">Categories</Link>
                {effectiveCategoryKey && (
              <>
                <span>/</span>
                    <Link to={getCategoryPath(effectiveCategoryKey)} className="font-semibold text-slate-900">{titleFromSlug(effectiveCategoryKey)}</Link>
              </>
            )}
            {effectiveSubcategoryKey && (
              <>
                <span>/</span>
                <span className="font-semibold text-blue-600">{titleFromSlug(effectiveSubcategoryKey)}</span>
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
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{heroDescription}</p>

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
                      { name: "Featured Products", slug: effectiveCategoryKey },
                      { name: "Top Rated", slug: `${effectiveCategoryKey}-top-rated` },
                      { name: "Best Deals", slug: `${effectiveCategoryKey}-deals` },
                    ]).map((entry) => (
                  <Link
                    key={entry.slug}
                    to={getCategoryPath(effectiveCategoryKey, entry.slug)}
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

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">About This Category</p>
            <div className="mt-4 space-y-4">
              {seoBody.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-sm leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">UAE Trust Signals</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {UAE_TRUST_SIGNALS.map((signal) => (
                <span key={signal} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {signal}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Helpful links</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/" className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                  Homepage
                </Link>
                <Link to="/products" className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                  All products
                </Link>
                <Link to="/blog" className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                  UAE buying guides
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
