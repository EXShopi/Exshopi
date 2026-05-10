import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cart";
import { formatCurrencyPlainForCountry } from "../lib/currency";
import { getProductCountryPrice } from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, increaseQty, decreaseQty, removeItem } = useCartStore();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);

  if (!isOpen) return null;

  const total = items.reduce(
    (sum, item) => sum + getProductCountryPrice(item, selectedCountry) * item.quantity,
    0
  );

  const cartContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99990] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-[99991] flex h-screen w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "slideInRight 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Shopping Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Your cart is empty
            </h3>
            <p className="text-center text-sm text-slate-600">
              Add some amazing products to get started!
            </p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-6 py-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-4 first:pt-0"
                >
                  {/* Image */}
                  <div className="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCurrencyPlainForCountry(getProductCountryPrice(item, selectedCountry), selectedCountry)}
                      </p>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg w-fit">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="h-6 w-6 flex items-center justify-center text-xs font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrencyPlainForCountry(
                        getProductCountryPrice(item, selectedCountry) * item.quantity,
                        selectedCountry
                      )}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-5 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600 text-sm font-semibold">
                    Subtotal
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatCurrencyPlainForCountry(total, selectedCountry)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Shipping calculated at checkout
                </p>
              </div>

              <div className="grid gap-3">
                <Link
                  to="/checkout?mode=guest"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-bold text-white transition hover:from-blue-700 hover:to-blue-800"
                >
                  Guest Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-50 transition"
                >
                  Continue
                </button>
                <Link
                  to="/checkout?mode=account"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-100 bg-blue-50 text-blue-700 font-bold rounded-lg transition hover:bg-blue-100"
                >
                  Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );

  return createPortal(cartContent, document.body);
}
