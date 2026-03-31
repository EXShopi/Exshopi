import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { useSettingsStore } from "../store/settings";
import { formatAEDPlain } from "../lib/currency";
import { analyticsAPI, productAPI } from "../services/api";
import { getLiveMarketplaceProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

type DealItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  stockText: string;
  vendor: string;
  location: string;
  badge: string;
};

type DealCardProps = { item: DealItem };

function mapDealItem(product: LiveMarketplaceProduct): DealItem {
  return {
    id: String(product.id),
    slug: product.slug || String(product.id),
    title: product.title,
    price: product.price,
    oldPrice: product.oldPrice,
    image: product.image,
    rating: product.rating,
    reviews: product.reviews,
    stockText: typeof product.stock === "string" ? product.stock : product.stock ? "In Stock" : "Out of Stock",
    vendor: product.seller,
    location: "UAE Marketplace",
    badge: product.discount > 0 ? `Save ${product.discount}%` : product.badge || "Deal",
  };
}

const DealCard: React.FC<DealCardProps> = ({ item }) => {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  const saved = useWishlistStore((state) =>
    state.collections.some((collection) => collection.productIds.includes(item.id))
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      slug: item.slug,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: item.id,
      slug: item.slug,
      name: item.title,
      category: "Marketplace Deals",
      price: item.price,
      oldPrice: item.oldPrice,
      rating: item.rating,
      reviews: item.reviews,
      badge: item.badge,
      image: item.image,
      stock: item.stockText,
    });

    analyticsAPI
      .track({
        eventType: saved ? "wishlist_remove" : "wishlist_add",
        entityType: "product",
        entityId: item.id,
        metadata: {
          title: item.title,
        },
      })
      .catch(() => undefined);
  };

  return (
    <Link
      to={`/product/${item.slug}`}
      className="group block min-w-[190px] max-w-[190px] overflow-hidden rounded-[18px] border border-[#d4c9f2] bg-white shadow-[0_8px_20px_rgba(36,20,84,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(36,20,84,0.12)] no-underline"
    >
      <div className="p-2.5">
        <div className="relative rounded-[14px] bg-[#f8f9fc] p-2.5">
          <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
            {item.badge}
          </span>

          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border transition ${
              saved
                ? "border-rose-200 bg-white text-rose-500 shadow-md"
                : "border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current text-rose-500" : ""}`} />
          </button>

          <div className="flex h-[150px] items-center justify-center overflow-hidden rounded-[12px] bg-white">
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-[214px] flex-col px-3 pb-3">
        <div className="text-[14px] font-black leading-none text-slate-900">
          {formatAEDPlain(item.price)}
        </div>

        {item.oldPrice ? (
          <div className="mt-1 text-[11px] text-slate-400 line-through">
            {formatAEDPlain(item.oldPrice)}
          </div>
        ) : null}

        <h3 className="mt-2 line-clamp-3 min-h-[58px] text-[12px] font-semibold leading-5 text-slate-800">
          {item.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{item.rating}</span>
          <span>(Reviews: {item.reviews})</span>
        </div>

        <div
          className={`mt-1.5 text-[11px] font-medium ${
            item.stockText.toLowerCase().includes("out") ? "text-slate-500" : "text-emerald-600"
          }`}
        >
          {item.stockText}
        </div>

        <div className="mt-auto pt-3">
          <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500">
            <div className="truncate font-semibold text-slate-800">{item.vendor}</div>
            <div>{item.location}</div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[12px] font-semibold transition ${
              isAdded ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-900 text-white hover:bg-slate-800"
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
        </div>
      </div>
    </Link>
  );
};

export default function BlackFridaySection() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSettingsStore();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const campaignSection = settings.homepage.sections.find((section) => section.id === "flash-deals");
  const countdown = useMemo(
    () => [
      { value: "16", label: "days" },
      { value: "20", label: "hours" },
      { value: "1", label: "minute" },
      { value: "12", label: "seconds" },
    ],
    []
  );

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const liveDeals = getLiveMarketplaceProducts(items)
          .filter((product) => product.discount > 0 || /deal|offer|sale|flash/i.test(product.badge || ""))
          .sort((a, b) => {
            if (b.discount !== a.discount) return b.discount - a.discount;
            return b.reviews - a.reviews;
          })
          .slice(0, 10)
          .map(mapDealItem);

        setDeals(liveDeals);
      })
      .catch(() => {
        if (mounted) setDeals([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const scrollByCards = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = 260;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-14 max-w-[1800px] px-4 md:px-6">
      <div className="overflow-hidden rounded-[28px] bg-[#0033CC] p-4 shadow-[0_24px_64px_rgba(0,51,204,0.24)]">
        <div className="grid gap-4 lg:grid-cols-[205px_minmax(0,1fr)] lg:items-start">
          <div className="rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-4 text-white">
            <h2 className="text-[23px] font-black leading-[1.08] tracking-tight">
              {campaignSection?.title || "Campaign deals selected from live approved marketplace inventory."}
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-white/85">
              {campaignSection?.subtitle ||
                "This section now displays only approved live products that are active in marketplace campaigns or deal pricing."}
            </p>

            <div className="mt-4 text-[13px] font-medium text-white/90">Promotion expires within:</div>

            <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[14px] bg-white shadow-lg">
              {countdown.map((time, index) => (
                <div
                  key={time.label}
                  className={`px-2 py-3 text-center text-[#0033CC] ${index < 3 ? "border-r border-[#dbe5ff]" : ""}`}
                >
                  <div className="text-[16px] font-black leading-none">{time.value}</div>
                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#4f73dd]">
                    {time.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                to="/deals"
                className="inline-flex rounded-full bg-[#1f1f1f] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-black"
              >
                More
              </Link>

              <Link
                to="/deals"
                className="text-[13px] font-bold text-white underline underline-offset-4 transition hover:text-white/85"
              >
                All promotions
              </Link>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
              <button
                type="button"
                onClick={() => scrollByCards("left")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 transition hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
              <button
                type="button"
                onClick={() => scrollByCards("right")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 transition hover:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              <div className="rounded-[18px] bg-white/10 px-6 py-16 text-center text-sm font-semibold text-white/90">
                Loading live campaign products...
              </div>
            ) : deals.length > 0 ? (
              <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden px-0 pb-1 no-scrollbar">
                <div className="flex w-fit gap-2.5">
                  {deals.map((deal) => (
                    <DealCard key={deal.id || deal.title} item={deal} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[18px] bg-white/10 px-6 py-16 text-center text-sm font-semibold text-white/90">
                No active campaign products are live right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
