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
import { buildProductPath } from "../lib/seo";
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { useSettingsStore } from "../store/settings";
import { formatCurrencyPlainForCountry } from "../lib/currency";
import { analyticsAPI, productAPI } from "../services/api";
import {
  getCampaignProducts,
  getLiveMarketplaceProducts,
  productMatchesCategoryTerms,
  type LiveMarketplaceProduct,
} from "../lib/liveMarketplaceProducts";
import { OrbitLoader } from "./ui/OrbitLoader";
import { OptimizedImage } from "./OptimizedImage";
import {
  getProductCountryCompareAtPrice,
  getProductCountryPrice,
  type CountryAwarePriced,
} from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

type DealItem = CountryAwarePriced & {
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
    priceUae: product.priceUae ?? product.price,
    priceKsa: product.priceKsa,
    compareAtPriceUae: product.compareAtPriceUae ?? product.oldPrice,
    compareAtPriceKsa: product.compareAtPriceKsa,
  };
}

const DealCard = React.memo(function DealCard({ item }: DealCardProps) {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const { addItem } = useCartStore();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const [isAdded, setIsAdded] = useState(false);
  const displayPrice = getProductCountryPrice(item, selectedCountry);
  const displayComparePrice = getProductCountryCompareAtPrice(item, selectedCountry);

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
      priceUae: Number(item.priceUae ?? item.price),
      priceKsa: item.priceKsa != null ? Number(item.priceKsa) : undefined,
      compareAtPriceUae: Number(item.compareAtPriceUae ?? item.oldPrice),
      compareAtPriceKsa: item.compareAtPriceKsa != null ? Number(item.compareAtPriceKsa) : undefined,
      image: item.image,
      slug: item.slug || item.id,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: item.id,
      slug: item.slug || item.id,
      name: item.title,
      category: "Marketplace Deals",
      price: item.price,
      priceUae: Number(item.priceUae ?? item.price),
      priceKsa: item.priceKsa != null ? Number(item.priceKsa) : undefined,
      oldPrice: item.oldPrice,
      compareAtPriceUae: Number(item.compareAtPriceUae ?? item.oldPrice),
      compareAtPriceKsa: item.compareAtPriceKsa != null ? Number(item.compareAtPriceKsa) : undefined,
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
      to={buildProductPath(item)}
      className="group block w-full max-w-full overflow-hidden rounded-[18px] border border-[#d4c9f2] bg-white shadow-[0_8px_20px_rgba(36,20,84,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(36,20,84,0.12)] no-underline md:max-w-[190px] md:min-w-[190px]"
    >
      <div className="p-2.5">
        <div className="relative rounded-[14px] bg-[#f8f9fc] p-2.5">
          <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
            {item.badge}
          </span>

          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute right-2 top-2 z-20 flex h-7.5 w-7.5 items-center justify-center rounded-full border transition md:h-8 md:w-8 ${
              saved
                ? "border-rose-200 bg-white text-rose-500 shadow-md"
                : "border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50"
            }`}
          >
            <Heart className={`h-3 w-3 md:h-3.5 md:w-3.5 ${saved ? "fill-current text-rose-500" : ""}`} />
          </button>

          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[12px] bg-white md:h-[150px] md:aspect-auto">
            <OptimizedImage
              src={item.image}
              alt={item.title}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
              lazy={true}
              width={150}
              height={150}
              sizes="(max-width: 768px) 50vw, 150px"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-[154px] flex-col px-2.5 pb-2.5 md:min-h-[214px]">
        <div className="text-[12px] font-black leading-none text-slate-900 md:text-[14px]">
          {formatCurrencyPlainForCountry(displayPrice, selectedCountry)}
        </div>

        {displayComparePrice > displayPrice ? (
          <div className="mt-1 text-[10px] text-slate-400 line-through">
            {formatCurrencyPlainForCountry(displayComparePrice, selectedCountry)}
          </div>
        ) : null}

        <h3 className="mt-1.5 line-clamp-2 min-h-[34px] text-[10.5px] font-semibold leading-4 text-slate-800 md:line-clamp-3 md:min-h-[58px]">
          {item.title}
        </h3>

        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{item.rating}</span>
          <span>(Reviews: {item.reviews})</span>
        </div>

        <div
          className={`mt-1 text-[10px] font-medium ${
            item.stockText.toLowerCase().includes("out") ? "text-slate-500" : "text-emerald-600"
          }`}
        >
          {item.stockText}
        </div>

        <div className="mt-auto pt-2 md:pt-3">
          <div className="mb-2.5 rounded-2xl border border-slate-100 bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500">
            <div className="truncate font-semibold text-slate-800">{item.vendor}</div>
            <div>{item.location}</div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex h-8 w-full items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition md:h-10 md:gap-2 md:rounded-2xl md:px-4 md:text-[12px] ${
              isAdded ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-900 text-white hover:bg-slate-800"
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
        </div>
      </div>
    </Link>
  );
});

export default function BlackFridaySection() {
  const desktopScrollRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSettingsStore();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const campaignSection = settings.homepage.sections.find((section) => section.id === "flash-deals");
  const campaignSettings = settings.homepage.campaignSection;
  const countdownTarget = useMemo(() => {
    const cycleMs = 30 * 24 * 60 * 60 * 1000;
    const configuredTarget = new Date(campaignSettings.endAt || "").getTime();

    if (configuredTarget && !Number.isNaN(configuredTarget) && configuredTarget > now) {
      return configuredTarget;
    }

    const anchor = new Date();
    anchor.setHours(23, 59, 59, 999);
    const baseTarget = anchor.getTime() + cycleMs;

    if (baseTarget > now) return baseTarget;

    const elapsedCycles = Math.floor((now - baseTarget) / cycleMs) + 1;
    return baseTarget + elapsedCycles * cycleMs;
  }, [campaignSettings.endAt, now]);

  const countdown = useMemo(() => {
    const diff = Math.max(0, countdownTarget - now);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      { value: String(days).padStart(2, "0"), label: "days" },
      { value: String(hours).padStart(2, "0"), label: "hours" },
      { value: String(minutes).padStart(2, "0"), label: "minutes" },
      { value: String(seconds).padStart(2, "0"), label: "seconds" },
    ];
  }, [countdownTarget, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        const liveProducts = getLiveMarketplaceProducts(items);
        const campaignProducts = getCampaignProducts(items, campaignSettings.featuredProductIds);
        const apparelTerms = [
          "fashion",
          "clothing",
          "t-shirt",
          "t shirts",
          "tshirts",
          "shirt",
          "apparel",
          "men-clothing",
          "womens-clothing",
        ];
        const footwearTerms = [
          "footwear",
          "shoe",
          "shoes",
          "sneaker",
          "sneakers",
          "mens-shoes",
          "womens-shoes",
        ];

        const preferredCampaignDeals = campaignProducts.filter(
          (product) => productMatchesCategoryTerms(product, apparelTerms) || productMatchesCategoryTerms(product, footwearTerms)
        );
        const fallbackCategoryDeals = liveProducts.filter(
          (product) => productMatchesCategoryTerms(product, apparelTerms) || productMatchesCategoryTerms(product, footwearTerms)
        );
        const fallbackLiveDeals = liveProducts.filter(
          (product) =>
            !product.raw?.isDeleted &&
            Boolean(String(product.title || "").trim()) &&
            Boolean(String(product.image || "").trim()) &&
            Number(product.price || 0) > 0
        );

        const selectedDeals = (
          preferredCampaignDeals.length
            ? preferredCampaignDeals
            : campaignProducts.length
            ? campaignProducts
            : fallbackCategoryDeals.length
            ? fallbackCategoryDeals
            : fallbackLiveDeals
        )
          .sort((a, b) => {
            if (b.discount !== a.discount) return b.discount - a.discount;
            return b.reviews - a.reviews;
          })
          .slice(0, 10)
          .map(mapDealItem);

        setDeals(selectedDeals);
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
  }, [campaignSettings.featuredProductIds]);

  const scrollByCards = (direction: "left" | "right") => {
    const el = desktopScrollRef.current;
    if (!el) return;

    const amount = 260;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-10 max-w-[1800px] px-4 md:mt-14 md:px-6">
      <div
        className="overflow-hidden rounded-[28px] p-4 shadow-[0_24px_64px_rgba(29,78,216,0.24)]"
        style={{ backgroundColor: campaignSettings.sectionBgColor || "#1d4ed8" }}
      >
        <div className="grid gap-4 lg:grid-cols-[205px_minmax(0,1fr)] lg:items-start">
          <div
            className="rounded-[18px] p-4 text-white"
            style={{ background: `linear-gradient(180deg, ${campaignSettings.panelBgColor || "#4338ca"}, rgba(255,255,255,0.08))` }}
          >
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
              {campaignSettings.badgeText || "Campaign"}
            </div>
            <h2 className="text-[23px] font-black leading-[1.08] tracking-tight">
              {campaignSection?.title || "Campaign deals selected from live approved marketplace inventory."}
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-white/85">
              {campaignSection?.subtitle ||
                "This section now displays only approved live products that are active in marketplace campaigns or deal pricing."}
            </p>

            <div className="mt-4 text-[13px] font-medium text-white/90">
              {campaignSettings.expiresLabel || "Promotion expires within:"}
            </div>

            <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[14px] bg-white shadow-lg">
              {countdown.map((time, index) => (
                <div
                  key={time.label}
                  className={`px-2 py-3 text-center ${index < 3 ? "border-r border-[#dbe5ff]" : ""}`}
                  style={{ color: campaignSettings.sectionBgColor || "#1d4ed8" }}
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
                to={campaignSettings.moreCtaLink || "/campaigns/current"}
                className="inline-flex rounded-full bg-[#1f1f1f] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-black"
              >
                {campaignSettings.moreCtaText || "More"}
              </Link>

              <Link
                to={campaignSettings.allPromotionsLink || "/promotions"}
                className="text-[13px] font-bold text-white underline underline-offset-4 transition hover:text-white/85"
              >
                {campaignSettings.allPromotionsText || "All promotions"}
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
              <div
                className="rounded-[18px] px-6 py-16 text-center text-sm font-semibold text-white/90"
                style={{ backgroundColor: campaignSettings.productRailBgColor || "rgba(255,255,255,0.10)" }}
              >
                <OrbitLoader label="Loading live campaign products..." size={24} />
              </div>
            ) : deals.length > 0 ? (
              <>
                <div className="overflow-x-auto overflow-y-hidden pb-1 md:hidden no-scrollbar">
                  <div className="flex w-fit gap-3 pr-2">
                    {deals.map((deal) => (
                      <div key={deal.id || deal.title} className="w-[172px] min-w-[172px]">
                        <DealCard item={deal} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden overflow-x-auto overflow-y-hidden px-0 pb-1 md:block no-scrollbar" ref={desktopScrollRef}>
                  <div className="flex w-fit gap-2.5">
                    {deals.map((deal) => (
                      <DealCard key={deal.id || deal.title} item={deal} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                className="rounded-[18px] px-6 py-16 text-center text-sm font-semibold text-white/90"
                style={{ backgroundColor: campaignSettings.productRailBgColor || "rgba(255,255,255,0.10)" }}
              >
                <OrbitLoader label="Preparing campaign picks..." size={24} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
