import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Share2,
  Plus,
  Grid3X3,
  List,
  SlidersHorizontal,
  ShieldCheck,
  Truck,
  BadgePercent,
  FolderHeart,
  X,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlistStore } from "../store/wishlist";
import { formatAEDPlain } from "../lib/currency";
import { productAPI } from "../services/api";

function formatAED(value?: number) {
  if (value === undefined || value === null) return "—";
  return formatAEDPlain(value);
}

export default function Wishlist() {
  const {
    items,
    collections,
    activeCollectionId,
    view,
    filter,
    removeItem,
    createCollection,
    setActiveCollection,
    setView,
    setFilter,
    clearCollection,
  } = useWishlistStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [wishlistNotice, setWishlistNotice] = useState("");

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) || collections[0];

  const activeItems = useMemo(() => {
    const ids = activeCollection?.productIds || [];
    let filtered = items.filter((item) => ids.includes(item.id));

    if (filter === "inStock") {
      filtered = filtered.filter((item) =>
        (item.stock || "").toLowerCase().includes("stock") ||
        (item.stock || "").toLowerCase().includes("left")
      );
    }

    if (filter === "discounted") {
      filtered = filtered.filter(
        (item) => (item.oldPrice || 0) > (item.price || 0)
      );
    }

    if (filter === "topRated") {
      filtered = filtered.filter((item) => (item.rating || 0) >= 4.7);
    }

    return filtered;
  }, [items, activeCollection, filter]);

  const totalSaved = useMemo(() => {
    return activeItems.reduce((sum, item) => {
      return sum + Math.max((item.oldPrice || 0) - (item.price || 0), 0);
    }, 0);
  }, [activeItems]);

  useEffect(() => {
    let active = true;

    const syncUnavailableWishlistItems = async () => {
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
          setWishlistNotice("");
          return;
        }

        unavailableItems.forEach((item) => removeItem(item.id));
        setWishlistNotice("Unavailable products were removed from your wishlist.");
      } catch {
        if (active) {
          setWishlistNotice("");
        }
      }
    };

    if (items.length) {
      syncUnavailableWishlistItems();
    }

    return () => {
      active = false;
    };
  }, [items, removeItem]);

  const handleCreateWishlist = () => {
    if (!newWishlistName.trim()) return;
    createCollection(newWishlistName, makeDefault);
    setNewWishlistName("");
    setMakeDefault(false);
    setShowCreateModal(false);
  };

  const handleShareWishlist = async () => {
    const shareUrl = `${window.location.origin}/wishlist?list=${activeCollection?.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${activeCollection?.name || "Wishlist"} - Exshopi`,
          text: "Check my Exshopi wishlist",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      //
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="mx-auto max-w-[1680px] px-4 py-8 md:px-6 lg:py-10">
        <div className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
          <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white md:px-10 md:py-12">
            <div className="absolute -right-10 top-0 h-full w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-[35%] h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
                  My Wishlist
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                  Your Favourite Products
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-lg">
                  Save products you love, compare prices, watch deals, and shop
                  them anytime with a premium Exshopi wishlist experience.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10">
                    <ShieldCheck className="h-4 w-4" />
                    Trusted Sellers
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10">
                    <Truck className="h-4 w-4" />
                    Fast UAE Delivery
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10">
                    <BadgePercent className="h-4 w-4" />
                    Price Drop Tracking
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[26px] bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-sm text-white/65">Saved Items</p>
                  <p className="mt-2 text-3xl font-black">{activeItems.length}</p>
                </div>
                <div className="rounded-[26px] bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-sm text-white/65">You Save</p>
                  <p className="mt-2 text-3xl font-black">{formatAED(totalSaved)}</p>
                </div>
                <div className="rounded-[26px] bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur">
                  <p className="text-sm text-white/65">Wishlist Type</p>
                  <p className="mt-2 text-2xl font-black">
                    {activeCollection?.name || "Default"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-5 md:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <FolderHeart className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    Saved Collection
                  </h2>
                  <p className="text-sm text-slate-500">
                    {activeItems.length} products in your wishlist
                  </p>
                  {wishlistNotice ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                      {wishlistNotice}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleShareWishlist}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {shareCopied ? "Copied" : "Share Wishlist"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Create New Wishlist
                </button>

                <Link
                  to="/products"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-4 md:px-10">
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Wishlists
                </p>

                <div className="space-y-2">
                  {collections.map((collection) => {
                    const isActive = collection.id === activeCollectionId;
                    return (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => setActiveCollection(collection.id)}
                        className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                          isActive
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-600 hover:bg-white/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{collection.name}</span>
                          {collection.isDefault && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {collection.productIds.length} item(s)
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                  </button>

                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(
                        e.target.value as "all" | "inStock" | "discounted" | "topRated"
                      )
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="all">All Products</option>
                    <option value="inStock">In Stock</option>
                    <option value="discounted">Discounted</option>
                    <option value="topRated">Top Rated</option>
                  </select>

                  <div className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setView("grid")}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                        view === "grid"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                        view === "list"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      List
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => clearCollection(activeCollectionId)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Empty Wishlist
                </button>
              </div>
            </div>
          </div>

          {activeItems.length > 0 ? (
            <div className="px-6 py-8 md:px-10">
              {view === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {activeItems.map((item) => {
                    const hasDiscount = (item.oldPrice || 0) > (item.price || 0);
                    const savings = hasDiscount
                      ? (item.oldPrice || 0) - (item.price || 0)
                      : 0;

                    return (
                      <div
                        key={item.id}
                        className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)]"
                      >
                        <div className="relative overflow-hidden rounded-t-[30px] bg-gradient-to-b from-slate-100 to-white">
                          {item.badge && (
                            <div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
                              {item.badge}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md transition hover:scale-105 hover:bg-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <Link
                            to={item.slug ? `/product/${item.slug}` : "#"}
                            className="block"
                          >
                            <div className="flex h-[290px] items-center justify-center p-6">
                              <img
                                src={item.image || "https://via.placeholder.com/500x500?text=Exshopi"}
                                alt={item.name}
                                className="max-h-full w-full object-contain transition duration-500 group-hover:scale-[1.04]"
                              />
                            </div>
                          </Link>
                        </div>

                        <div className="flex flex-1 flex-col p-6">
                          <div className="min-h-[24px]">
                            <p className="text-sm font-medium text-slate-500">
                              {item.category || "Product"}
                            </p>
                          </div>

                          <Link
                            to={item.slug ? `/product/${item.slug}` : "#"}
                            className="mt-2 block"
                          >
                            <h3 className="min-h-[84px] text-[1.42rem] font-black leading-7 tracking-tight text-slate-900 transition group-hover:text-slate-700">
                              {item.name}
                            </h3>
                          </Link>

                          <div className="mt-3 min-h-[24px] flex items-center gap-2 text-sm text-slate-600">
                            <Star className="h-4 w-4 fill-current text-amber-400" />
                            <span>{item.rating || 4.5}</span>
                            <span className="text-slate-300">•</span>
                            <span>{item.reviews || 0} reviews</span>
                          </div>

                          <div className="mt-2 min-h-[24px]">
                            <p className="text-sm font-medium text-emerald-600">
                              {item.stock || "In stock"}
                            </p>
                          </div>

                          <div className="mt-5 min-h-[60px]">
                            <div className="flex flex-wrap items-end gap-3">
                              <span className="text-3xl font-black tracking-tight text-slate-900">
                                {formatAED(item.price)}
                              </span>
                              {hasDiscount && (
                                <span className="pb-1 text-sm text-slate-400 line-through">
                                  {formatAED(item.oldPrice)}
                                </span>
                              )}
                            </div>

                            {hasDiscount && (
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                                You save {formatAED(savings)}
                              </p>
                            )}
                          </div>

                          <div className="mt-auto pt-6">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                              </button>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                              >
                                <Heart className="h-5 w-5 fill-current" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-5">
                  {activeItems.map((item) => {
                    const hasDiscount = (item.oldPrice || 0) > (item.price || 0);

                    return (
                      <div
                        key={item.id}
                        className="grid gap-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:shadow-[0_16px_38px_rgba(15,23,42,0.07)] md:grid-cols-[220px_1fr_auto]"
                      >
                        <Link
                          to={item.slug ? `/product/${item.slug}` : "#"}
                          className="overflow-hidden rounded-[24px] bg-slate-50"
                        >
                          <div className="flex h-full min-h-[220px] items-center justify-center p-4">
                            <img
                              src={item.image || "https://via.placeholder.com/500x500?text=Exshopi"}
                              alt={item.name}
                              className="max-h-full w-full object-contain"
                            />
                          </div>
                        </Link>

                        <div className="flex flex-col justify-center">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">
                              {item.category || "Product"}
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <Link to={item.slug ? `/product/${item.slug}` : "#"}>
                            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 transition hover:text-slate-700">
                              {item.name}
                            </h3>
                          </Link>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <Star className="h-4 w-4 fill-current text-amber-400" />
                            <span>{item.rating || 4.5}</span>
                            <span className="text-slate-300">•</span>
                            <span>{item.reviews || 0} reviews</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-600">{item.stock || "In stock"}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-end gap-3">
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {formatAED(item.price)}
                            </span>
                            {hasDiscount && (
                              <span className="pb-1 text-sm text-slate-400 line-through">
                                {formatAED(item.oldPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 md:w-[190px] md:justify-center">
                          <button
                            type="button"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="px-8 py-20 text-center md:px-10">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Heart className="h-10 w-10" />
              </div>

              <h3 className="mt-7 text-3xl font-black tracking-tight text-slate-900">
                Your wishlist is empty
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                Start saving your favourite products to build a premium personal
                collection you can revisit anytime.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/products"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Browse Products
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Create Wishlist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  New Wishlist
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">
                  Create New Wishlist
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="Enter wishlist name..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Set as default wishlist
              </label>

              <button
                type="button"
                onClick={handleCreateWishlist}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
