import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Eye,
  Star,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { buildProductPath } from "../lib/seo";
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { formatCurrencyPlainForCountry } from "../lib/currency";
import { analyticsAPI, productAPI } from "../services/api";
import { getLiveMarketplaceProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";
import { OrbitLoader } from "./ui/OrbitLoader";
import { OptimizedImage } from "./OptimizedImage";
import {
  getProductCountryCompareAtPrice,
  getProductCountryPrice,
  type CountryAwarePriced,
} from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

type PopularProduct = CountryAwarePriced & {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  brand: string;
  badge: string;
  vendor: string;
  stockText: string;
  rating: number;
  reviews: number;
  image: string;
};

type PopularCardProps = {
  product: PopularProduct;
};

const tabs = [
  { key: "under200", label: "Under 200", maxPrice: 200 },
  { key: "under500", label: "Under 500", maxPrice: 500 },
  { key: "under1000", label: "Under 1000", maxPrice: 1000 },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function mapPopularProduct(product: LiveMarketplaceProduct): PopularProduct {
  return {
    id: String(product.id),
    slug: product.slug || String(product.id),
    title: product.title,
    price: product.price,
    oldPrice: product.oldPrice,
    brand: product.category,
    badge: product.badge || "Live",
    vendor: product.seller,
    stockText: typeof product.stock === "string" ? product.stock : product.stock ? "In Stock" : "Out of Stock",
    rating: product.rating,
    reviews: product.reviews,
    image: product.image,
    priceUae: product.priceUae ?? product.price,
    priceKsa: product.priceKsa,
    compareAtPriceUae: product.compareAtPriceUae ?? product.oldPrice,
    compareAtPriceKsa: product.compareAtPriceKsa,
  };
}

const PopularCard = React.memo(function PopularCard({ product }: PopularCardProps) {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const { addItem } = useCartStore();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const [isAdded, setIsAdded] = useState(false);
  const displayPrice = getProductCountryPrice(product, selectedCountry);
  const displayComparePrice = getProductCountryCompareAtPrice(product, selectedCountry);

  const saved = useWishlistStore((state) =>
    state.collections.some((collection) => collection.productIds.includes(product.id))
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      priceUae: Number(product.priceUae ?? product.price),
      priceKsa: product.priceKsa != null ? Number(product.priceKsa) : undefined,
      compareAtPriceUae: Number(product.compareAtPriceUae ?? product.oldPrice),
      compareAtPriceKsa: product.compareAtPriceKsa != null ? Number(product.compareAtPriceKsa) : undefined,
      image: product.image,
      slug: product.slug || product.id,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: product.id,
      slug: product.slug || product.id,
      name: product.title,
      category: product.brand,
      price: product.price,
      priceUae: Number(product.priceUae ?? product.price),
      priceKsa: product.priceKsa != null ? Number(product.priceKsa) : undefined,
      oldPrice: product.oldPrice,
      compareAtPriceUae: Number(product.compareAtPriceUae ?? product.oldPrice),
      compareAtPriceKsa: product.compareAtPriceKsa != null ? Number(product.compareAtPriceKsa) : undefined,
      rating: product.rating,
      reviews: product.reviews,
      badge: product.badge,
      image: product.image,
      stock: product.stockText,
    });

    analyticsAPI
      .track({
        eventType: saved ? "wishlist_remove" : "wishlist_add",
        entityType: "product",
        entityId: product.id,
        metadata: {
          title: product.title,
        },
      })
      .catch(() => undefined);
  };

  return (
    <Link
      to={buildProductPath(product)}
      className="group block w-full max-w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] no-underline md:max-w-[264px] md:min-w-[264px] md:rounded-[26px]"
    >
      <div className="relative overflow-hidden bg-slate-100 p-3 md:p-4">
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white md:left-4 md:top-4 md:px-3 md:text-[11px]">
          {product.badge}
        </span>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute right-2.5 top-2.5 z-20 flex h-8.5 w-8.5 items-center justify-center rounded-full border transition md:right-4 md:top-4 md:h-11 md:w-11 ${
            saved
              ? "border-rose-200 bg-white text-rose-500 shadow-md"
              : "border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 md:h-5 md:w-5 ${saved ? "fill-current text-rose-500" : ""}`} />
        </button>

        <button
          type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = buildProductPath(product);
            }}
          className="absolute right-2.5 top-12 z-20 flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white md:right-4 md:top-16 md:h-11 md:w-11"
        >
          <Eye className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <div className="aspect-square flex items-center justify-center md:h-[245px] md:aspect-auto">
          <OptimizedImage
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
            lazy={true}
            width={245}
            height={245}
            sizes="(max-width: 768px) 50vw, 245px"
          />
        </div>
      </div>

      <div className="flex min-h-[170px] flex-col p-2.5 md:min-h-[300px] md:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-500">{product.brand}</p>
          <p className="text-[10px] font-semibold text-emerald-600">{product.stockText}</p>
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[32px] text-[0.76rem] font-black leading-4.5 tracking-tight text-slate-900 md:min-h-[56px] md:text-[1.3rem] md:leading-7">
          {product.title}
        </h3>

        <p className="mt-1 text-[10px] text-slate-500 md:mt-3 md:text-sm">
          Sold by <span className="font-semibold text-slate-700">{product.vendor}</span>
        </p>

        <div className="mt-1 flex items-center gap-1 text-[8px] text-slate-600 md:mt-3 md:gap-2 md:text-sm">
          <Star className="h-3.5 w-3.5 fill-current text-amber-400 md:h-4 md:w-4" />
          <span>{product.rating}</span>
          <span className="text-slate-300">•</span>
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-2 flex items-end gap-1 md:gap-3">
          <span className="text-[0.92rem] font-black tracking-tight text-slate-900 md:text-3xl">
            {formatCurrencyPlainForCountry(displayPrice, selectedCountry)}
          </span>
          {displayComparePrice > displayPrice ? (
            <span className="pb-0.5 text-[10px] text-slate-400 line-through md:text-sm">
              {formatCurrencyPlainForCountry(displayComparePrice, selectedCountry)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition md:h-12 md:gap-2 md:rounded-2xl md:px-5 md:text-sm ${
              isAdded
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Add to Cart
              </>
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:h-12 md:w-12 md:rounded-2xl"
          >
            +1
          </button>
        </div>
      </div>
    </Link>
  );
});

export default function MostPopularSection() {
  const navigate = useNavigate();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const [activeTab, setActiveTab] = useState<TabKey>("under200");
  const [catalog, setCatalog] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const CARD_WIDTH = 264;
  const CARD_GAP = 20;

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const liveProducts = getLiveMarketplaceProducts(items)
          .sort((a, b) => {
            if (b.reviews !== a.reviews) return b.reviews - a.reviews;
            if (b.rating !== a.rating) return b.rating - a.rating;
            return getProductCountryPrice(a, selectedCountry) - getProductCountryPrice(b, selectedCountry);
          })
          .slice(0, 24)
          .map(mapPopularProduct);

        setCatalog(liveProducts);
      })
      .catch(() => {
        if (mounted) setCatalog([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedCountry]);

  const activeProducts = useMemo<PopularProduct[]>(() => {
    const activeFilter = tabs.find((tab) => tab.key === activeTab);
    if (!activeFilter) return catalog;
    return catalog.filter((product) => getProductCountryPrice(product, selectedCountry) <= activeFilter.maxPrice);
  }, [activeTab, catalog, selectedCountry]);

  const collectionRoute = useMemo(() => {
    const mapping: Record<TabKey, string> = {
      under200: "/popular/under-200",
      under500: "/popular/under-500",
      under1000: "/popular/under-1000",
    };

    return mapping[activeTab];
  }, [activeTab]);

  const scrollByCards = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const visibleCards = Math.max(1, Math.floor(el.clientWidth / (CARD_WIDTH + CARD_GAP)));
    const amount = visibleCards * (CARD_WIDTH + CARD_GAP);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-10 max-w-[1800px] px-4 md:mt-12 md:px-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-300" />
        <h2 className="text-center text-[1.65rem] font-black tracking-tight text-slate-900 md:text-5xl">
          Most popular <span className="text-violet-600">this month</span>
        </h2>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <div className="mt-6 grid grid-cols-1 items-center gap-4 md:mt-8 md:gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" />

        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-[28px] border border-slate-200 bg-slate-100/90 p-1.5 shadow-inner shadow-slate-200/60 md:gap-2 md:rounded-full md:p-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all duration-300 md:px-6 md:py-3 md:text-sm ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                      : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center justify-center gap-3 lg:justify-end">
          <button
            type="button"
            onClick={() => scrollByCards("left")}
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <ChevronLeft className="h-6 w-6 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => scrollByCards("right")}
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-fuchsia-600 shadow-[0_10px_30px_rgba(217,70,239,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-500 hover:bg-fuchsia-50 hover:text-fuchsia-700"
          >
            <ChevronRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:mt-8">
        {loading ? (
          <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
            <OrbitLoader label="Loading live marketplace products..." size={24} />
          </div>
        ) : activeProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {activeProducts.slice(0, 4).map((product) => (
                <PopularCard key={product.id || product.title} product={product} />
              ))}
            </div>
            <div
              ref={scrollRef}
              className="hidden overflow-x-auto overflow-y-hidden pb-2 scroll-smooth snap-x snap-mandatory scroll-px-0 md:block [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-5 pt-2">
                {activeProducts.map((product) => (
                  <PopularCard key={product.id || product.title} product={product} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-xl font-black text-slate-900">No live products in this range yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              This section will only show approved live seller and ExShopi Official products.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center md:mt-10">
        <button
          type="button"
          onClick={() => navigate(collectionRoute)}
          className="rounded-full border-2 border-slate-900 bg-white px-6 py-2.5 text-[14px] font-semibold text-slate-900 transition hover:bg-slate-50 md:px-8 md:py-3 md:text-xl"
        >
          Show more
        </button>
      </div>
    </section>
  );
}
