import React from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlistStore } from "../../store/wishlist";

export default function NavbarWishlistIcon() {
  const { items } = useWishlistStore();
  const count = items.length;

  return (
    <Link
      to="/wishlist"
      aria-label="Open wishlist"
      className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-red-300 hover:shadow-md hover:bg-red-50 hover:-translate-y-0.5"
    >
      <Heart className="h-5 w-5 text-current" />

      {/* Badge */}
      {count > 0 && (
        <div
          key={`wishlist-badge-${count}`}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white shadow-lg"
          style={{
            animation: "badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {count > 99 ? "99+" : count}
        </div>
      )}

      <style>{`
        @keyframes badgePop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Link>
  );
}
