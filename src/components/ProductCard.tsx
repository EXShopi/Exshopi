import React, { useMemo, useState } from "react";
import { ShoppingCart, Star, Check, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cart";
import WishlistIcon from "./Premium/WishlistIcon";
import { formatAEDPlain } from "../lib/currency";
import LazyImage from "./ui/LazyImage";
import { buildProductImageAlt, buildProductPath } from "../lib/seo";

export interface ProductCardProps {
  id?: string;
  slug?: string;
  parentCategorySlug?: string;
  subcategorySlug?: string;
  title: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  badges?: string[];
  category: string;
  stock: string | boolean;
  seller: string;
  freeDelivery?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  slug,
  parentCategorySlug,
  subcategorySlug,
  title,
  price,
  oldPrice,
  rating,
  reviews,
  image,
  badge,
  badges,
  category,
  stock,
  seller,
  freeDelivery,
}) => {
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productId = id ?? slug ?? title;
  const productSlug = slug ?? id ?? title;
  const productPath = useMemo(
    () =>
      buildProductPath({
        id: productId,
        slug: productSlug,
        title,
        category: parentCategorySlug || category,
        specs: {
          parentCategorySlug: parentCategorySlug || category,
          subcategorySlug: subcategorySlug || category,
        },
      }),
    [category, parentCategorySlug, productId, productSlug, subcategorySlug, title]
  );
  const resolvedBadge = badge ?? badges?.[0];
  const stockLabel = typeof stock === "boolean" ? (stock ? "In Stock" : "Out of Stock") : stock;

  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubmitting(true);
    addItem({
      id: productId,
      title,
      price,
      image,
      slug: productSlug,
    });
    setIsAdded(true);
    window.setTimeout(() => setIsSubmitting(false), 420);
    // Show success feedback
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    navigate(productPath);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(productPath);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`View ${title}`}
      className="block group cursor-pointer"
    >
      <div className="flex h-full max-w-full flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] md:rounded-[26px]">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-white px-3 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4">
          <LazyImage
            src={image}
            alt={buildProductImageAlt({ title })}
            wrapperClassName="h-full w-full overflow-hidden rounded-[14px] bg-white md:rounded-[18px]"
            className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
          
          {/* Badge */}
          {resolvedBadge && (
            <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
              {resolvedBadge}
            </div>
          )}
          
          {/* Discount */}
          {discount > 0 && (
            <div className="absolute right-14 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
              -{discount}%
            </div>
          )}
          
          {/* Wishlist Button */}
          <div className="absolute right-3 top-3">
            <WishlistIcon productId={productId} />
          </div>
        </div>

        {/* Content */}
        <div className="-mt-px flex flex-1 flex-col bg-[linear-gradient(180deg,rgba(243,247,255,0.96)_0%,rgba(232,240,252,0.93)_100%)] px-3.5 pb-3.5 pt-3 backdrop-blur-xl md:px-4 md:pb-4 md:pt-4">
          {/* Category */}
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{category}</p>
          
          {/* Title */}
          <h3 className="mb-2 line-clamp-2 min-h-[36px] text-[13px] font-bold leading-5 text-slate-900 transition-colors duration-300 group-hover:text-blue-600 md:min-h-[42px] md:text-[14px] md:leading-5.5">
            {title}
          </h3>

          {/* Rating */}
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
                />
              ))}
            </div>
            <span className="text-xs text-slate-600">({reviews})</span>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="whitespace-nowrap text-[22px] font-black leading-none text-slate-900 md:text-[28px]">{formatAEDPlain(price)}</span>
              {oldPrice && (
                <span className="whitespace-nowrap text-sm text-slate-600 line-through">{formatAEDPlain(oldPrice)}</span>
              )}
            </div>
          </div>

          {/* Stock & Seller */}
          <div className="mb-4 rounded-2xl border border-white/70 bg-white/50 px-3 py-2 text-xs text-slate-600 backdrop-blur-md">
            <p className="font-semibold text-slate-800">{seller}</p>
            <p className="mt-1">{stockLabel}</p>
            {freeDelivery && (
              <div className="mt-1 inline-flex items-center gap-1 text-emerald-600">
                <Truck size={12} />
                Free delivery
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            onClickCapture={(e) => e.stopPropagation()}
            className={`mt-auto flex items-center justify-center gap-2 rounded-2xl border py-2.5 font-bold text-sm backdrop-blur-xl transition-all duration-300 md:py-3 ${
              isAdded
                ? "border-green-300 bg-[linear-gradient(180deg,rgba(220,252,231,0.95)_0%,rgba(187,247,208,0.88)_100%)] text-green-700 shadow-lg shadow-green-200/40"
                : "border-slate-300/90 bg-[linear-gradient(180deg,rgba(39,55,87,0.88)_0%,rgba(27,40,66,0.92)_100%)] text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-slate-400 hover:bg-[linear-gradient(180deg,rgba(46,63,98,0.92)_0%,rgba(31,45,73,0.96)_100%)]"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={16} />
                Added!
              </>
            ) : isSubmitting ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
