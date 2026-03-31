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
import { Link } from "react-router-dom";
import { useWishlistStore } from "../store/wishlist";
import { useCartStore } from "../store/cart";
import { productAPI } from "../services/api";
import { formatAEDPlain } from "../lib/currency";

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
      slug: product.slug,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              id: product.id,
              slug: product.slug,
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
          className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border transition ${
            saved
              ? "border-rose-200 bg-white text-rose-500 shadow-md"
              : "border-slate-200 bg-white/95 text-slate-700 shadow-md hover:bg-white"
          }`}
        >
          <Heart
            className={`h-5 w-5 ${saved ? "fill-current text-rose-500" : ""}`}
          />
        </button>

        <Link
          to={`/product/${product.slug}`}
          className="absolute right-4 top-16 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
        >
          <Eye className="h-5 w-5" />
        </Link>

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
          <p className="text-sm font-medium text-slate-500">{product.category}</p>
          <p className="text-sm font-semibold text-emerald-600">{product.stock}</p>
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-[56px] text-[1.3rem] font-black leading-7 tracking-tight text-slate-900">
          {product.title}
        </h3>

        <p className="mt-3 min-h-[40px] text-sm text-slate-500">
          Sold by{" "}
          <span className="font-semibold text-slate-700">{product.seller}</span>
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Star className="h-4 w-4 fill-current text-amber-400" />
          <span>{product.rating}</span>
          <span className="text-slate-300">•</span>
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-4 flex min-h-[52px] items-end gap-3">
          <span className="whitespace-nowrap text-3xl font-black tracking-tight text-slate-900">
            {formatAEDPlain(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="whitespace-nowrap pb-1 text-sm text-slate-400 line-through">
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        
        // Filter and organize products by category
        const filtered = (data || []).filter(
          (p: any) =>
            p?.status === 'live' ||
            p?.productStatus === 'live' ||
            (p?.approvalStatus === 'approved' && p?.visibilityStatus === 'live')
        );
        
        // Create tabs data from backend products
        const organized: Record<string, any[]> = {
          bestsellers: filtered.slice(0, 8),
          bestchoice: filtered.slice(8, 14),
          onsale: filtered.slice(14, 20),
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
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const visibleCards = Math.max(1, Math.floor(scrollRef.current.clientWidth / (CARD_WIDTH + CARD_GAP)));
    scrollRef.current.scrollBy({
      left: dir === "left" ? -(visibleCards * (CARD_WIDTH + CARD_GAP)) : visibleCards * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-14 max-w-[1800px] px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-300" />
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
          Featured Products
        </h2>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <div className="mt-8 grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" />

        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100/90 p-2 shadow-inner shadow-slate-200/60">
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
                  className={`rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                      : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
                  }`}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 lg:justify-end">
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

      <div className="mt-6 overflow-hidden">
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden pb-4 scroll-smooth snap-x snap-mandatory scroll-px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
        <div className="flex w-max gap-5">
          {loading ? (
            <div className="w-full text-center text-slate-500">Loading products...</div>
          ) : allProducts[activeTab]?.length > 0 ? (
            allProducts[activeTab].map((product: any) => (
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
            ))
          ) : (
            <div className="w-full rounded-[26px] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <p className="text-lg font-black text-slate-900">No featured products yet</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Featured sections will populate automatically after approved products go live.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
