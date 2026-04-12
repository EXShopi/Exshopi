import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { productAPI, categoryAPI } from "../services/api";
import ProductCardSkeleton from "../components/ui/ProductCardSkeleton";
import { OrbitLoader } from "../components/ui/OrbitLoader";
import { mapLegacyCategory, filterProductsByCategoryTree } from "../lib/masterCategories";
import SEOHead from "../components/seo/SEOHead";

const isVisibleMarketplaceProduct = (product: any) => {
  const status = String(product?.status || '').toLowerCase();
  const productStatus = String(product?.productStatus || '').toLowerCase();
  const approval = String(product?.approvalStatus || product?.approval_status || '').toLowerCase();
  const visibility = String(product?.visibilityStatus || product?.visibility_status || '').toLowerCase();

  return (
    status === 'live' ||
    productStatus === 'live' ||
    (approval === 'approved' && visibility === 'live')
  );
};

export default function ProductListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const categoryParam = searchParams.get('category') || '';
    if (categoryParam) {
      navigate(`/category/${categoryParam}`, { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const categoryParam = searchParams.get('category') || '';

        if (categoryParam) {
          // Try server-side lookup by slug -> category id
          try {
            const cats = await categoryAPI.getAll().catch(() => []);
            const matched = (cats || []).find((c: any) => String(c.slug || '').toLowerCase() === String(categoryParam).toLowerCase());
            if (matched && matched.id) {
              const rows = await productAPI.getByCategory(matched.id).catch(() => []);
              setProducts((rows || []).filter(isVisibleMarketplaceProduct));
              return;
            }

            // fallback mapping from legacy slugs/keywords to category/subcategory
            const mapped = mapLegacyCategory(categoryParam);
            if (mapped && mapped.category) {
              const byCat = (cats || []).find((c: any) => String(c.slug) === String(mapped.category));
              if (byCat && byCat.id) {
                const rows = await productAPI.getByCategory(byCat.id).catch(() => []);
                // if subcategory present, do a client-side filter
                const final = mapped.subcategory ? filterProductsByCategoryTree(rows || [], mapped.category, mapped.subcategory, cats) : rows || [];
                setProducts((final || []).filter(isVisibleMarketplaceProduct));
                return;
              }
            }

            // last resort: fetch all and filter client-side
            const data = await productAPI.getAll();
            const filtered = filterProductsByCategoryTree((data || []), categoryParam, null, cats);
            setProducts((filtered || []).filter(isVisibleMarketplaceProduct));
            return;
          } catch (err) {
            // Do NOT fallback to full catalog for a category page. Return empty result and log.
            console.warn('Category filtering failed for', categoryParam, err);
            setProducts([]);
            return;
          }
        }

        const data = await productAPI.getAll();
        setProducts((data || []).filter(isVisibleMarketplaceProduct));
      } catch (error) {
        console.error('Error fetching products:', error);
        setError("We couldn't load the marketplace products right now.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) =>
      [product.title, product.specs?.brand, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [searchQuery, products]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <SEOHead
        title="All Products in UAE | Electronics, Laptops & Marketplace Deals | ExShopi"
        description="Browse all live ExShopi marketplace products with trusted sellers, premium electronics, UAE delivery support, and COD-ready checkout."
        keywords="buy electronics UAE, marketplace UAE, refurbished laptops UAE, cheap iPhone UAE"
        pathname="/products"
      />
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">All Products</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Marketplace
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Product Listing
            </h1>
            <p className="mt-3 text-slate-500">
              Explore premium electronics and daily-use products.
            </p>
          </div>

          <div className="flex w-full max-w-xl items-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-inner">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 flex-1 bg-transparent px-6 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button className="mx-1.5 flex h-11 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-500">
            {loading ? "Loading..." : `${filteredProducts.length} products found`}
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900">
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      <section className="mt-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
          {loading ? (
            <>
              <div className="col-span-full flex justify-center pb-2">
                <OrbitLoader label="Loading products..." size={24} />
              </div>
              {Array.from({ length: 10 }).map((_, index) => <ProductCardSkeleton key={index} />)}
            </>
          ) : error ? (
            <div className="col-span-full rounded-[28px] border border-rose-200 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-lg font-black text-slate-900">Unable to load products</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug || product.id}
                parentCategorySlug={product.specs?.parentCategorySlug || product.specs?.categorySlug}
                subcategorySlug={product.specs?.subcategorySlug || product.specs?.templateId}
                title={product.title}
                price={product.price}
                oldPrice={product.originalPrice}
                image={product.image}
                rating={product.rating || 4.5}
                reviews={product.reviews || 0}
                category={product.category || product.specs?.brand || "General"}
                seller={product.sellerName || "ExShopi Seller"}
                stock={product.stock > 0}
                freeDelivery={true}
                badges={["LIVE"]}
              />
            ))
          ) : (
            <div className="col-span-full rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-50 text-3xl">📦</div>
              <p className="mt-5 text-lg font-black text-slate-900">No products found</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Try another search or browse a different live category.</p>
            </div>
          )}
        </div>
        {!loading && !error && visibleCount < filteredProducts.length && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount((count) => count + 15)}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              Load More
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
