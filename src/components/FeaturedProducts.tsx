import React, { useRef, useState, useEffect } from "react";
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
import { productAPI } from "../services/api";
import { isLiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";
import { formatAEDPlain } from "../lib/currency";
import { OrbitLoader } from "./ui/OrbitLoader";
import { useSettingsStore } from "../store/settings";

const tabs = ["bestsellers", "bestchoice", "onsale"] as const;

interface FeaturedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  image: string;
  badge: string;
  category: string;
  stock: string;
  seller: string;
}

const FeaturedCard: React.FC<{ product: FeaturedProduct }> = ({ product }) => {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const navigate = useNavigate();

  const saved = useWishlistStore((state) =>
    state.collections.some((collection) =>
      collection.productIds.includes(product.id)
    )
  );

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      slug: product.slug || product.id,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className="group block w-full max-w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] no-underline md:max-w-[246px] md:min-w-[246px] md:rounded-[24px]"
    >
      <div className="relative overflow-hidden bg-white px-3 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4">
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white md:left-4 md:top-4 md:px-3 md:text-[11px]">
          {product.badge}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              id: product.id,
              slug: product.slug || product.id,
              name: product.title,
              category: product.category,
              price: product.price,
              oldPrice: product.oldPrice,
              rating: product.rating,
              reviews: product.reviews,
              badge: product.badge,
              image: product.image,
              stock: product.stock,
            });
          }}
          aria-label={saved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={saved}
          className={`absolute right-2.5 top-2.5 z-20 flex h-8.5 w-8.5 items-center justify-center rounded-full border transition md:right-4 md:top-4 md:h-11 md:w-11 ${
            saved
              ? "border-rose-200 bg-white text-rose-500 shadow-md"
              : "border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white"
          }`}
        >
          <Heart
            className={`h-4 w-4 md:h-5 md:w-5 ${saved ? "fill-current text-rose-500" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/product/${product.slug || product.id}`);
          }}
          className="absolute right-2.5 top-12 z-20 flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white md:right-4 md:top-16 md:h-11 md:w-11"
          aria-label={`View ${product.title}`}
        >
          <Eye className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <div className="aspect-square w-full overflow-hidden rounded-[14px] bg-white flex items-center justify-center md:h-[245px] md:aspect-auto md:rounded-[18px]">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      <div className="-mt-px bg-[linear-gradient(180deg,rgba(243,247,255,0.96)_0%,rgba(232,240,252,0.93)_100%)] backdrop-blur-xl flex min-h-[158px] flex-col p-2.5 md:min-h-[276px] md:p-4.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-slate-600">{product.category}</p>
          <p className="text-[10px] font-semibold text-emerald-600">{product.stock}</p>
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[30px] text-[0.72rem] font-black leading-4.5 tracking-tight text-slate-900 md:min-h-[48px] md:text-[1.06rem] md:leading-6">
          {product.title}
        </h3>

        <p className="mt-1 min-h-[22px] text-[10px] text-slate-600 md:mt-2.5 md:min-h-[34px] md:text-[12px]">
          Sold by{" "}
          <span className="font-semibold text-slate-700">{product.seller}</span>
        </p>

        <div className="mt-1 flex items-center gap-1 text-[8px] text-slate-600 md:mt-3 md:gap-2 md:text-sm">
          <Star className="h-3.5 w-3.5 fill-current text-amber-400 md:h-4 md:w-4" />
          <span>{product.rating}</span>
          <span className="text-slate-300">•</span>
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-2 flex min-h-[28px] items-end gap-1 md:min-h-[48px] md:gap-2">
          <span className="whitespace-nowrap text-[0.9rem] font-black tracking-tight text-slate-900 md:text-[2rem]">
            {formatAEDPlain(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="whitespace-nowrap pb-0.5 text-[10px] text-slate-600 line-through md:text-sm">
              {formatAEDPlain(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`inline-flex h-8.5 flex-1 items-center justify-center gap-1 rounded-xl border px-2 text-[10px] font-semibold transition md:h-11 md:gap-2 md:rounded-2xl md:px-4 md:text-[12px] ${
              isAdded
                ? "border-green-300 bg-[linear-gradient(180deg,rgba(220,252,231,0.95)_0%,rgba(187,247,208,0.88)_100%)] text-green-700"
                : "border-slate-300/90 bg-[linear-gradient(180deg,rgba(39,55,87,0.88)_0%,rgba(27,40,66,0.92)_100%)] text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] backdrop-blur-xl hover:border-slate-400 hover:bg-[linear-gradient(180deg,rgba(46,63,98,0.92)_0%,rgba(31,45,73,0.96)_100%)]"
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
            aria-label="Add one more item to cart"
            className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/65 text-slate-700 shadow-[0_6px_14px_rgba(15,23,42,0.06)] backdrop-blur-lg transition hover:bg-white md:h-11 md:w-11 md:rounded-2xl"
          >
            +1
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("bestsellers");
  const [allProducts, setAllProducts] = useState<Record<string, any[]>>({
    bestsellers: [],
    bestchoice: [],
    onsale: [],
  });
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const CARD_WIDTH = 264;
  const CARD_GAP = 20;
  const settings = useSettingsStore((state) => state.settings);

  const mapProductsBySelection = (products: any[], selectedIds: string[]) => {
    if (!selectedIds.length) return [];

    const lookup = new Map<string, any>();
    products.forEach((product) => {
      if (!product) return;
      lookup.set(String(product.id), product);
      if (product.slug) lookup.set(String(product.slug), product);
    });

    const seen = new Set<string>();
    return selectedIds
      .map((value) => lookup.get(String(value)))
      .filter(Boolean)
      .filter((product) => {
        if (seen.has(String(product.id))) return false;
        seen.add(String(product.id));
        return true;
      });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        
        // Filter and organize products by category
        const filtered = (data || []).filter(isLiveMarketplaceProduct);
        
        // Create tabs data from backend products
        const featuredSettings = settings.homepage.featuredSection;
        const organized: Record<string, any[]> = {
          bestsellers: mapProductsBySelection(filtered, featuredSettings.bestsellersProductIds).length
            ? mapProductsBySelection(filtered, featuredSettings.bestsellersProductIds)
            : filtered.slice(0, 8),
          bestchoice: mapProductsBySelection(filtered, featuredSettings.bestchoiceProductIds).length
            ? mapProductsBySelection(filtered, featuredSettings.bestchoiceProductIds)
            : filtered.slice(8, 14),
          onsale: mapProductsBySelection(filtered, featuredSettings.onsaleProductIds).length
            ? mapProductsBySelection(filtered, featuredSettings.onsaleProductIds)
            : filtered.slice(14, 20),
        };
        
        setAllProducts(organized);
      } catch (error) {
        console.error('Error fetching products:', error);
        setAllProducts({
          bestsellers: [],
          bestchoice: [],
          onsale: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [settings.homepage.featuredSection]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const visibleCards = Math.max(1, Math.floor(scrollRef.current.clientWidth / (CARD_WIDTH + CARD_GAP)));
    scrollRef.current.scrollBy({
      left: dir === "left" ? -(visibleCards * (CARD_WIDTH + CARD_GAP)) : visibleCards * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-10 max-w-[1800px] px-4 md:mt-14 md:px-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-300" />
        <h2 className="text-center text-[1.7rem] font-black tracking-tight text-slate-900 md:text-5xl">
          Featured Products
        </h2>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <div className="mt-6 grid grid-cols-1 items-center gap-4 md:mt-8 md:gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" />

        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-[28px] border border-slate-200 bg-slate-100/90 p-1.5 shadow-inner shadow-slate-200/60 md:gap-2 md:rounded-full md:p-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = tab === "bestsellers"
                ? "Bestsellers"
                : tab === "bestchoice"
                ? "Best Choice"
                : "On Sale";

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all duration-300 md:px-6 md:py-3 md:text-sm ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center justify-center gap-3 lg:justify-end">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <ChevronLeft className="h-6 w-6 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="group flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-fuchsia-600 shadow-[0_10px_30px_rgba(217,70,239,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-500 hover:bg-fuchsia-50 hover:text-fuchsia-700"
          >
            <ChevronRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:mt-6">
          {loading ? (
            <div className="flex min-w-[240px] items-center justify-center px-6 py-10">
              <OrbitLoader label="Loading products..." size={22} />
            </div>
          ) : allProducts[activeTab]?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:hidden">
                {allProducts[activeTab].slice(0, 4).map((product: any) => (
                  <FeaturedCard
                    key={product.id}
                    product={{
                      id: product.id,
                      slug: product.id,
                      title: product.title,
                      price: product.price,
                      oldPrice: product.originalPrice || product.price * 1.2,
                      rating: product.rating || 4.5,
                      reviews: product.reviews || 0,
                      image: product.image,
                      badge: "FEATURED",
                      category: product.specs?.brand || "General",
                      stock: product.stock > 0 ? "In stock" : "Out of stock",
                      seller: product.sellerName || "ExShopi Seller",
                    } as FeaturedProduct}
                  />
                ))}
              </div>
              <div
                ref={scrollRef}
                className="hidden overflow-x-auto overflow-y-hidden pb-4 scroll-smooth snap-x snap-mandatory scroll-px-0 md:block [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex w-max gap-5">
                  {allProducts[activeTab].map((product: any) => (
                    <FeaturedCard 
                      key={product.id}
                      product={{
                        id: product.id,
                        slug: product.id,
                        title: product.title,
                        price: product.price,
                        oldPrice: product.originalPrice || product.price * 1.2,
                        rating: product.rating || 4.5,
                        reviews: product.reviews || 0,
                        image: product.image,
                        badge: "FEATURED",
                        category: product.specs?.brand || "General",
                        stock: product.stock > 0 ? "In stock" : "Out of stock",
                        seller: product.sellerName || "ExShopi Seller",
                      } as FeaturedProduct} 
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full rounded-[26px] border border-slate-200 bg-white px-6 py-16 text-center text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <p className="text-lg font-black text-slate-900">No featured products yet</p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Featured sections will populate automatically after approved products go live.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}
