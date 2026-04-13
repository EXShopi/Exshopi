import React from "react";
import { Heart } from "lucide-react";
import { useEcommerceStore } from "../../store/ecommerce";
import { analyticsAPI } from "../../services/api";

interface WishlistIconProps {
  productId: string;
  showCount?: boolean;
}

export default function WishlistIcon({ productId, showCount = false }: WishlistIconProps) {
  const isInWishlist = useEcommerceStore((state) => state.isInWishlist);
  const toggleWishlist = useEcommerceStore((state) => state.toggleWishlist);
  const count = useEcommerceStore((state) => state.wishlistItems.length);
  const isFavorited = isInWishlist(productId);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(productId);
          analyticsAPI
            .track({
              eventType: isFavorited ? "wishlist_remove" : "wishlist_add",
              entityType: "product",
              entityId: productId,
            })
            .catch(() => undefined);
        }}
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5"
        aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={isFavorited}
      >
        <Heart
          className={`h-5 w-5 transition-all duration-300 ${
            isFavorited
              ? "fill-red-500 stroke-red-500"
              : "stroke-current fill-none"
          }`}
          style={{
            animation: isFavorited ? "heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
          }}
        />

        {/* Badge */}
        {showCount && count > 0 && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white shadow-lg">
            {count > 99 ? "99+" : count}
          </div>
        )}
      </button>

      <style>{`
        @keyframes heartPop {
          0% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
