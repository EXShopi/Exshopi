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
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { formatAEDPlain } from "../lib/currency";
import { analyticsAPI, productAPI } from "../services/api";
import { getLiveMarketplaceProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

type PopularProduct = {
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
  };
}

const PopularCard: React.FC<PopularCardProps> = ({ product }) => {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

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
      image: product.image,
      slug: product.slug,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: product.id,
      slug: product.slug,
      name: product.title,
      category: product.brand,
      price: product.price,
      oldPrice: product.oldPrice,
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
      to={`/product/${product.slug}`}
      className="group block min-w-[264px] max-w-[264px] snap-start overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] no-underline"
    >
      <div className="relative overflow-hidden bg-slate-100 p-4">
        <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
          {product.badge}
        </span>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border transition ${
            saved
              ? "border-rose-200 bg-white text-rose-500 shadow-md"
              : "border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white"
          }`}
        >
          <Heart className={`h-5 w-5 ${saved ? "fill-current text-rose-500" : ""}`} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/product/${product.slug}`;
          }}
          className="absolute right-4 top-16 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
        >
          <Eye className="h-5 w-5" />
        </button>

        <div className="flex h-[245px] items-center justify-center">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="flex min-h-[300px] flex-col p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{product.brand}</p>
          <p className="text-sm font-semibold text-emerald-600">{product.stockText}</p>
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-[56px] text-[1.3rem] font-black leading-7 tracking-tight text-slate-900">
          {product.title}
        </h3>

        <p className="mt-3 text-sm text-slate-500">
          Sold by <span className="font-semibold text-slate-700">{product.vendor}</span>
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Star className="h-4 w-4 fill-current text-amber-400" />
          <span>{product.rating}</span>
          <span className="text-slate-300">•</span>
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <span className="text-3xl font-black tracking-tight text-slate-900">
            {formatAEDPlain(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="pb-1 text-sm text-slate-400 line-through">
              {formatAEDPlain(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-5">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${
              isAdded
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            +1
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function MostPopularSection() {
  const navigate = useNavigate();
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
            return a.price - b.price;
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
  }, []);

  const activeProducts = useMemo<PopularProduct[]>(() => {
    const activeFilter = tabs.find((tab) => tab.key === activeTab);
    if (!activeFilter) return catalog;
    return catalog.filter((product) => product.price <= activeFilter.maxPrice);
  }, [activeTab, catalog]);

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
    <section className="mx-auto mt-12 max-w-[1800px] px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-300" />
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
          Most popular <span className="text-violet-600">this month</span>
        </h2>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <div className="mt-8 grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" />

        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100/90 p-2 shadow-inner shadow-slate-200/60">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 ${
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

        <div className="flex items-center justify-center gap-3 lg:justify-end">
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

      <div className="mt-8 overflow-hidden">
        {loading ? (
          <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
            Loading live marketplace products...
          </div>
        ) : activeProducts.length > 0 ? (
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden pb-2 scroll-smooth snap-x snap-mandatory scroll-px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max gap-5 pt-2">
              {activeProducts.map((product) => (
                <PopularCard key={product.id || product.title} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[26px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-xl font-black text-slate-900">No live products in this range yet</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              This section will only show approved live seller and ExShopi Official products.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => navigate(collectionRoute)}
          className="rounded-full border-2 border-slate-900 bg-white px-8 py-3 text-xl font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Show more
        </button>
      </div>
    </section>
  );
}
