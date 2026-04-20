import { Link, useNavigate } from "react-router-dom";
import { buildProductPath } from "../lib/seo";
import {
  Trash2,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Truck,
  MapPin,
  Percent,
  Plus,
  Minus,
  Heart,
  Edit2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/cart";
import { formatCurrencyForCountry, formatCurrencyPlainForCountry } from "../lib/currency";
import { productAPI } from "../services/api";
import { calculateVat, getCountryConfig, getDefaultShippingOption, getShippingOption } from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

export default function Cart() {
  const navigate = useNavigate();

  const {
    items,
    increaseQty,
    decreaseQty,
    removeItem,
    getCartTotal,
    getCartCount,
  } = useCartStore();

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [cartNotice, setCartNotice] = useState("");
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const selectedCity = useCountryStore((state) => state.selectedCity);
  const selectedShippingOption = useCountryStore((state) => state.selectedShippingOption);
  const setCity = useCountryStore((state) => state.setCity);
  const setShippingOption = useCountryStore((state) => state.setShippingOption);
  const country = getCountryConfig(selectedCountry);
  const activeShipping = getShippingOption(selectedCountry, selectedShippingOption);

  useEffect(() => {
    let active = true;

    const syncUnavailableItems = async () => {
      try {
        const liveProducts = await productAPI.getAll();
        if (!active) return;

        const liveIds = new Set(
          (liveProducts || []).flatMap((product: any) => [String(product.id || ''), String(product.slug || '')]).filter(Boolean)
        );

        const unavailableItems = items.filter(
          (item) => !liveIds.has(String(item.id)) && !liveIds.has(String(item.slug || ''))
        );

        if (!unavailableItems.length) {
          setCartNotice("");
          return;
        }

        unavailableItems.forEach((item) => removeItem(item.id));
        setCartNotice("Some unavailable products were removed from your cart.");
      } catch {
        if (active) {
          setCartNotice("");
        }
      }
    };

    if (items.length) {
      syncUnavailableItems();
    }

    return () => {
      active = false;
    };
  }, [items, removeItem]);

  const subtotal = getCartTotal();
  const vat = Math.round(calculateVat(subtotal, selectedCountry));
  const finalTotal = subtotal + activeShipping.fee + vat - discount;

  const applyPromo = () => {
    if (promoCode === "WELCOME10") {
      setDiscount(Math.round(subtotal * 0.1));
      setPromoApplied(true);
    } else if (promoCode === "SAVE5") {
      setDiscount(Math.round(subtotal * 0.05));
      setPromoApplied(true);
    } else {
      alert("Invalid promo code");
      setPromoApplied(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 py-12">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="relative mx-auto mb-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl">
            <ShoppingBag size={64} className="relative z-10 text-slate-300" />
          </div>

          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
            Your Cart is Empty
          </h2>
          <p className="mb-10 text-lg font-semibold leading-relaxed text-slate-600">
            Looks like you haven't added anything yet. Explore our premium selection and find something you love.
          </p>

          <Link
            to="/products"
            className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-10 py-4 font-black text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            Start Shopping <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3">
            Your Shopping Cart
          </h1>
          <p className="text-slate-600 font-semibold">
            {getCartCount()} items • Review before checkout
          </p>
          {cartNotice ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {cartNotice}
            </p>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items - Main */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <Link
                    to={buildProductPath(item)}
                    className="h-28 w-28 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-blue-300 transition"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      to={buildProductPath(item)}
                      className="text-lg font-bold text-slate-900 hover:text-blue-600 transition line-clamp-2 mb-2"
                    >
                      {item.title}
                    </Link>

                    {/* Badges */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {item.stockQuantity && item.stockQuantity > 5 && (
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                          ✓ In Stock
                        </span>
                      )}
                      {item.freeDelivery && (
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Free Delivery
                        </span>
                      )}
                    </div>

                    {/* Price & Seller */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-slate-900">{formatCurrencyForCountry(item.price, selectedCountry)}</span>
                      
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="text-slate-400 line-through">
                            {formatCurrencyForCountry(item.originalPrice, selectedCountry)}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            Save {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-4">
                      Sold by <span className="font-semibold text-slate-900">{item.seller || "ExShopi"}</span>
                    </p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col gap-4 items-end">
                    {/* Quantity Control */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 rounded transition text-slate-700 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="h-8 w-10 flex items-center justify-center text-slate-900 font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-slate-200 rounded transition text-slate-700 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price Total */}
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-1">Subtotal</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrencyForCountry(item.price * item.quantity, selectedCountry)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  Order Summary
                </h3>

                {/* Promo Code Section */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={applyPromo}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-emerald-600 font-bold">✓ Code applied!</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Try: WELCOME10 (10% off)</p>
                </div>

                {/* Delivery Info */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <label className="text-xs font-bold text-slate-900 uppercase mb-2 block">
                    {country.addressLabels.city}:
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  >
                    {country.cities.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex items-center gap-2 text-emerald-600">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-bold">{activeShipping.label} - {formatCurrencyForCountry(activeShipping.fee, selectedCountry)}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {country.shippingOptions.map((option) => (
                      <label key={option.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <input
                          type="radio"
                          name="cartShippingOption"
                          checked={activeShipping.id === option.id}
                          onChange={() => setShippingOption(option.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-bold text-slate-900">{option.label}</span>
                          <span className="block text-slate-500">{option.eta}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal ({getCartCount()} items)</span>
                    <span className="font-bold text-slate-900">{formatCurrencyForCountry(subtotal, selectedCountry)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">VAT ({Math.round(country.vatRate * 100)}%)</span>
                    <span className="font-bold text-slate-900">{formatCurrencyForCountry(vat, selectedCountry)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-bold text-slate-900">{formatCurrencyForCountry(activeShipping.fee, selectedCountry)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm bg-emerald-50 p-2 rounded-lg">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        Discount
                      </span>
                      <span className="font-bold text-emerald-700">- {formatCurrencyPlainForCountry(discount, selectedCountry)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t-2 border-slate-200 pt-6 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xl font-black text-slate-900">Total</span>
                    <div className="text-right">
                      <p className="text-3xl font-black text-blue-600">{formatCurrencyForCountry(finalTotal, selectedCountry)}</p>
                      <p className="text-xs text-slate-500">VAT included for {country.shortName}</p>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-900">Secure Checkout</p>
                    <p className="text-xs text-slate-600">256-bit SSL encryption</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
                  <Truck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-900">Free Delivery</p>
                    <p className="text-xs text-slate-600">{activeShipping.eta}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
                  <Edit2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-900">Easy Returns</p>
                    <p className="text-xs text-slate-600">30-day return policy</p>
                  </div>
                </div>
              </div>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
