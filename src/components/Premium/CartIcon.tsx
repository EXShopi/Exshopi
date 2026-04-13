import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/cart";

export default function CartIcon(props?: { onClick?: () => void }) {
  const { items } = useCartStore();
  const count = items.length;

  return (
    <button
      type="button"
      onClick={props?.onClick}
      aria-label="Open cart drawer"
      className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 hover:-translate-y-0.5"
    >
      <ShoppingCart className="h-5 w-5" />

      {/* Badge */}
      {count > 0 && (
        <div
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
    </button>
  );
}
