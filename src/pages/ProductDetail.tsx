import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  Check,
  ChevronRight,
  Heart,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useCartStore } from "../store/cart";
import { useWishlistStore } from "../store/wishlist";
import { analyticsAPI, productAPI } from "../services/api";
import { formatAED, formatAEDPlain } from "../lib/currency";
import { getSellerProfile, normalizeSellerSlug } from "../lib/sellerProfiles";

const productHighlights = [
  "Premium aluminum unibody design",
  "Fast performance with latest processor",
  "All-day battery life up to 20 hours",
  "Optimized for UAE delivery and warranty support",
];

type ProductVariant = {
  id?: string;
  color?: string;
  storage?: string;
  ram?: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stock?: number | string | null;
  sku?: string;
};

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#111827",
  silver: "#d1d5db",
  gold: "#d97706",
  gray: "#9ca3af",
  grey: "#9ca3af",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  white: "#f8fafc",
  purple: "#7c3aed",
  pink: "#ec4899",
  orange: "#ea580c",
};

function colorToHex(color: string) {
  if (!color) return "#cbd5e1";
  return COLOR_HEX_MAP[color.trim().toLowerCase()] || "#94a3b8";
}

function getProductImages(image: string) {
  return [
    image,
    "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  ];
}

function mapToCardProduct(item: any) {
  return {
    id: String(item.id),
    slug: item.slug || String(item.id),
    title: item.title,
    price: item.price,
    oldPrice: item.oldPrice,
    rating: item.rating || 4.5,
    reviews: item.reviews || 0,
    image: item.image,
    category: item.category || item.brand || "Marketplace",
    stock:
      typeof item.stock === "number"
        ? item.stock > 0
          ? "In Stock"
          : "Out of Stock"
        : item.stockText || item.stock || "In Stock",
    seller: item.seller || item.vendor || "ExShopi Official",
    freeDelivery: item.freeDelivery ?? true,
    badge: item.badges?.[0] || item.badge,
  };
}

type DetailSlimCardProps = {
  product: ReturnType<typeof mapToCardProduct>;
  onAddToCart: (product: ReturnType<typeof mapToCardProduct>) => void;
};

const DetailSlimCard: React.FC<DetailSlimCardProps> = ({
  product,
  onAddToCart,
}) => {
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const sellerMeta = getSellerProfile(product.seller || "ExShopi Official");

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative mx-auto block h-full w-full max-w-[236px] overflow-hidden rounded-[16px] border border-slate-200 bg-white p-[11px] shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)]"
    >
      <div className="relative overflow-hidden rounded-[14px] border border-slate-100 bg-[#f8fafc]">
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-rose-500 px-2 py-1 text-[9px] font-bold leading-none text-white shadow-sm">
            {product.badge}
          </span>
        )}
        {product.freeDelivery && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold leading-none text-emerald-700 shadow-sm">
            Free shipping
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex translate-y-2 items-center justify-between px-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            aria-label={`Add ${product.title} to cart`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition hover:bg-slate-800"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            type="button"
            aria-label={`Save ${product.title}`}
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
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:bg-slate-50"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="h-[160px] w-full object-contain p-3 transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex min-h-[170px] flex-col px-0.5 pb-0.5 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{product.category}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[40px] text-[14px] font-bold leading-[1.35] text-slate-900">
          {product.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
              />
            ))}
          </div>
          <span className="text-[10px]">({product.reviews})</span>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-[22px] font-black leading-none text-slate-950">{formatAEDPlain(product.price)}</span>
          {product.oldPrice && <span className="pb-0.5 text-[11px] text-slate-400 line-through">{formatAEDPlain(product.oldPrice)}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={`text-[11px] font-semibold ${String(product.stock).toLowerCase().includes("out") ? "text-slate-500" : "text-emerald-600"}`}>
            {product.stock}
          </span>
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600">
            <img
              src={sellerMeta.avatar}
              alt={sellerMeta.name}
              loading="lazy"
              className="h-5 w-5 rounded-full border border-slate-200 object-cover"
            />
            <span className="truncate font-medium text-slate-700">{sellerMeta.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [mainImage, setMainImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "specifications" | "reviews" | "delivery" | "seller">("overview");
  const [wishlistActive, setWishlistActive] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const allProds = await productAPI.getAll();
        const normalized = (allProds || []).map((item: any) => ({
          ...item,
          slug: item.slug || item.id,
          seller: item.sellerName || item.seller || "ExShopi Official",
          sellerStoreSlug: item.sellerStoreSlug,
          badges: item.badges || [],
          stock: typeof item.stock === "number" ? item.stock : 20,
          rating: item.rating || 4.5,
          reviews: item.reviews || 0,
          category: item.category || item.brand || "Marketplace",
        }));

        setAllProducts(normalized);

        const matched =
          normalized.find((item: any) => String(item.id) === slug || item.slug === slug) || null;

        setProduct(matched);
      } catch (error) {
        console.error("Error fetching product:", error);
        setAllProducts([]);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  useEffect(() => {
    setMainImage(0);
  }, [product?.id]);

  const productSpecs = product?.specs || {};
  const baseAttributes = productSpecs?.attributes || product?.specifications || {};
  const variants = useMemo<ProductVariant[]>(
    () => (Array.isArray(productSpecs?.variants) ? productSpecs.variants : []),
    [productSpecs]
  );

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.color || "").trim())
            .filter(Boolean)
        )
      ).map((color) => {
        const colorValue = String(color);
        return {
        name: colorValue.toLowerCase(),
        label: colorValue,
        hex: colorToHex(colorValue),
      };
      }),
    [variants]
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.storage || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  const ramOptions = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((variant) => String(variant.ram || "").trim())
            .filter(Boolean)
        )
      ),
    [variants]
  );

  useEffect(() => {
    const firstVariant = variants[0];
    setSelectedColor(String(firstVariant?.color || baseAttributes.color || ""));
    setSelectedStorage(String(firstVariant?.storage || baseAttributes.storage || baseAttributes.Storage || ""));
    setSelectedRam(String(firstVariant?.ram || baseAttributes.ram || baseAttributes.RAM || ""));
  }, [variants, baseAttributes.color, baseAttributes.storage, baseAttributes.Storage, baseAttributes.ram, baseAttributes.RAM, product?.id]);

  const activeVariant = useMemo(() => {
    if (!variants.length) return null;

    const exactMatch =
      variants.find(
        (variant) =>
          (!selectedColor || String(variant.color || "").trim() === selectedColor) &&
          (!selectedStorage || String(variant.storage || "").trim() === selectedStorage) &&
          (!selectedRam || String(variant.ram || "").trim() === selectedRam)
      ) ||
      variants.find(
        (variant) =>
          (!selectedColor || String(variant.color || "").trim() === selectedColor) &&
          (!selectedStorage || String(variant.storage || "").trim() === selectedStorage)
      ) ||
      variants.find((variant) => !selectedColor || String(variant.color || "").trim() === selectedColor) ||
      variants[0];

    return exactMatch || null;
  }, [variants, selectedColor, selectedStorage, selectedRam]);

  const displayPrice = Number(activeVariant?.price ?? product?.price ?? 0);
  const displayOriginalPrice = Number(
    activeVariant?.originalPrice ?? product?.originalPrice ?? product?.salePrice ?? product?.price ?? 0
  );
  const displayStock = Number(activeVariant?.stock ?? product?.stock ?? 0);
  const displaySku = String(activeVariant?.sku || product?.sku || "");
  const selectedColorLabel = selectedColor || colorOptions[0]?.label || "";

  useEffect(() => {
    if (!product?.id) return;
    analyticsAPI
      .track({
        eventType: "product_view",
        entityType: "product",
        entityId: String(product.id),
        metadata: {
          title: product.title,
          sellerId: product.sellerId,
        },
      })
      .catch(() => undefined);
  }, [product?.id, product?.sellerId, product?.title]);

  const sellerProfile = useMemo(
    () => getSellerProfile(product?.seller || "ExShopi Official"),
    [product?.seller]
  );
  const sellerLinkSlug = product?.sellerStoreSlug || sellerProfile.slug;

  const sellerProducts = useMemo(
    () =>
      allProducts.filter(
        (item) =>
          (
            (product?.sellerId && item.sellerId && item.sellerId === product.sellerId) ||
            normalizeSellerSlug(item.seller || item.sellerName || item.vendor || "") === sellerProfile.slug
          ) &&
          String(item.id) !== String(product?.id)
      ),
    [allProducts, product?.id, product?.sellerId, sellerProfile.slug]
  );

  const relatedProducts = useMemo(
    () =>
      allProducts
        .filter((item) => String(item.id) !== String(product?.id))
        .slice(0, 8)
        .map(mapToCardProduct),
    [allProducts, product?.id]
  );

  const viewedProducts = useMemo(
    () =>
      allProducts
        .filter((item) => String(item.id) !== String(product?.id))
        .slice(8, 16)
        .map(mapToCardProduct),
    [allProducts, product?.id]
  );

  const specs = useMemo(() => {
    const base = baseAttributes || {};
    return {
      Brand: base.Brand || product?.category || "ExShopi",
      Model: base.Model || product?.title || "Marketplace Product",
      Condition: base.Condition || "New / Renewed",
      Weight: base.Weight || "Approx. 1.2 kg",
      Processor: base.Processor || "Latest generation chipset",
      "Memory (RAM)": selectedRam || base.ram || base.RAM || "8GB to 16GB options",
      Storage: selectedStorage || base.storage || base.Storage || "Marketplace configured",
      Color: selectedColorLabel || base.color || base.Color || "As selected",
      Display: base.Display || "Premium display panel",
      Battery: base.Battery || "Up to 20 hours",
      Warranty: base.Warranty || "1-Year Manufacturer Warranty",
    };
  }, [baseAttributes, product, selectedColorLabel, selectedRam, selectedStorage]);

  const productImages = useMemo(() => getProductImages(product?.image || ""), [product?.image]);

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-24">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center px-4 py-24">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">Product Not Found</h1>
          <p className="mb-6 text-slate-600">The product you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const variantLabel = [selectedColorLabel, selectedStorage, selectedRam].filter(Boolean).join(" / ");
    addItem({
      id: String(product.id),
      title: variantLabel ? `${product.title} (${variantLabel})` : product.title,
      price: displayPrice,
      image: product.image,
      slug: product.slug || String(product.id),
      originalPrice: displayOriginalPrice > displayPrice ? displayOriginalPrice : undefined,
      stockQuantity: displayStock,
      sku: displaySku || product.sku,
      variants: activeVariant ? [activeVariant] : [],
    });
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  const handleAddRelatedToCart = (item: ReturnType<typeof mapToCardProduct>) => {
    addItem({
      id: String(item.id),
      title: item.title,
      price: item.price,
      image: item.image,
      slug: item.slug,
    });
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: String(product.id),
      slug: product.slug || String(product.id),
      name: product.title,
      category: product.category || product.brand || "Marketplace",
      price: product.price,
      oldPrice: displayOriginalPrice > displayPrice ? displayOriginalPrice : product.oldPrice,
      rating: product.rating,
      reviews: product.reviews,
      badge: product.badges?.[0] || product.badge,
      image: product.image,
      stock: displayStock > 0 ? "In Stock" : "Out of Stock",
    });
    setWishlistActive((prev) => !prev);
    analyticsAPI
      .track({
        eventType: wishlistActive ? "wishlist_remove" : "wishlist_add",
        entityType: "product",
        entityId: String(product.id),
        metadata: {
          title: product.title,
        },
      })
      .catch(() => undefined);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on ExShopi`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Product link copied");
        setTimeout(() => setShareMessage(""), 2500);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Product link copied");
        setTimeout(() => setShareMessage(""), 2500);
      } catch {
        setShareMessage("Unable to share right now");
      }
    }
  };

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1800px] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 overflow-x-auto text-sm text-slate-500">
            <Link to="/" className="whitespace-nowrap hover:text-blue-600">Home</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/category/electronics" className="whitespace-nowrap hover:text-blue-600">Electronics</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to={`/vendor/${sellerLinkSlug}`} className="whitespace-nowrap hover:text-blue-600">{product.sellerName || sellerProfile.name}</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-semibold text-slate-900">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="sticky top-[150px] overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[1/1.02] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),linear-gradient(180deg,#ffffff,#f3f6fb)]">
                <img
                  src={productImages[mainImage]}
                  alt={product.title}
                  className="h-full w-full object-contain p-8 transition duration-300 hover:scale-105"
                />
                <div className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-bold text-white shadow-lg">
                  Save 23%
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white p-5">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(idx)}
                      className={`h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                        mainImage === idx
                          ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Sold by</p>
                    <Link to={`/vendor/${sellerLinkSlug}`} className="mt-2 inline-block text-sm font-bold text-blue-600 hover:underline">
                      {product.sellerName || sellerProfile.name}
                    </Link>
                  </div>
                  <Link to={`/vendor/${sellerLinkSlug}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    More from seller →
                  </Link>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950">{product.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">{product.rating || 4.5}</span>
                  <span className="text-slate-300">|</span>
                  <button className="text-sm font-medium text-blue-600 hover:underline">
                    {(product.reviews || 0).toLocaleString()} reviews
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(product.badges || []).map((badge: string, idx: number) => (
                    <span key={`${badge}-${idx}`} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-7 shadow-sm">
                <div className="mb-5 border-b border-blue-100 pb-5">
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="text-5xl font-black tracking-tight text-slate-950">{formatAEDPlain(displayPrice)}</span>
                    {displayOriginalPrice > displayPrice && (
                      <>
                        <span className="pb-2 text-xl text-slate-400 line-through">{formatAEDPlain(displayOriginalPrice)}</span>
                        <span className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
                          Save {Math.max(1, Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100))}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">Inclusive of VAT, fees, and marketplace protection</p>
                </div>

                <div className="space-y-3">
                  {productHighlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="space-y-5">
                  {colorOptions.length > 0 && (
                  <div>
                    <p className="mb-3 font-semibold text-slate-900">
                      Color: {selectedColorLabel || "Default"}
                    </p>
                    <div className="flex gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.label)}
                          className={`h-12 w-12 rounded-full border-2 transition ${
                            selectedColorLabel === color.label
                              ? "border-blue-600 ring-2 ring-blue-200"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  )}

                  {storageOptions.length > 0 && (
                  <div>
                    <p className="mb-3 font-semibold text-slate-900">Storage</p>
                    <div className="flex flex-wrap gap-2">
                      {storageOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedStorage(size)}
                          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                            selectedStorage === size
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-slate-200 text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  {ramOptions.length > 0 && (
                    <div>
                      <p className="mb-3 font-semibold text-slate-900">RAM</p>
                      <div className="flex flex-wrap gap-2">
                        {ramOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedRam(size)}
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                              selectedRam === size
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : "border-slate-200 text-slate-900 hover:border-slate-300"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Free Delivery</p>
                      <p className="text-sm text-slate-600">Wed, 31 Mar - Next day guaranteed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
                    <RotateCcw className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Easy Returns</p>
                      <p className="text-sm text-slate-600">7 days return policy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
                    <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Warranty</p>
                      <p className="text-sm text-slate-600">1-year manufacturer warranty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="sticky top-[150px] rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                    <p className="font-semibold text-emerald-900">
                      {displayStock > 0 ? `In Stock - Only ${Math.max(displayStock, 1)} left!` : "Out of Stock"}
                    </p>
                    <p className="text-sm text-emerald-800">Delivered by Wed, 31 Mar</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-b border-slate-200 pb-5">
                <p className="mb-2 text-sm text-slate-500">Price</p>
                <div className="text-4xl font-black text-slate-950">{formatAEDPlain(displayPrice)}</div>
                <p className="mt-1 text-xs text-slate-500">Inclusive of VAT</p>
              </div>

              <div className="mt-5">
                <p className="mb-3 font-semibold text-slate-900">Quantity</p>
                <div className="inline-flex items-center rounded-full border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(236,243,255,0.92))] p-1 shadow-[0_18px_36px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="min-w-[52px] text-center text-lg font-bold text-slate-900">{quantity}</div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-400/70 bg-[linear-gradient(135deg,#1840c9,#2456ea,#4f8dff)] px-6 py-3.5 font-semibold text-white shadow-[0_18px_38px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(37,99,235,0.34)]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300/70 bg-[linear-gradient(135deg,#04845f,#0da778,#58d7ab)] px-6 py-3.5 font-semibold text-white shadow-[0_18px_38px_rgba(16,185,129,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(16,185,129,0.30)]"
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleWishlist}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-medium transition ${
                    wishlistActive
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${wishlistActive ? "fill-current" : ""}`} />
                  Wishlist
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {shareMessage && <p className="mt-3 text-center text-xs font-semibold text-emerald-600">{shareMessage}</p>}

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Genuine product guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Free & fast delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Secure transactions</span>
                </div>
              </div>

              <button
                onClick={() => setContactOpen(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-slate-200 bg-white">
            {(["overview", "specifications", "reviews", "delivery", "seller"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-6 py-4 font-semibold capitalize transition ${
                  activeTab === tab
                    ? "border-b-blue-600 bg-blue-50 text-blue-600"
                    : "border-b-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Product Overview</p>
                  <p className="text-base leading-8 text-slate-700">
                    {product.description || `${product.title} is a premium marketplace pick selected for UAE shoppers who want strong performance, trusted seller support, and a polished buying experience.`}
                  </p>
                </div>
                <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(247,250,255,1))] p-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Top Highlights</p>
                  <div className="space-y-3">
                    {productHighlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="space-y-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Technical Details</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">Specifications</h3>
                  </div>
                  <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 md:block">
                    Built for UAE marketplace buyers
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(specs).map(([label, value], idx) => (
                    <div key={label} className={`rounded-[24px] border border-slate-200 p-5 ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="grid gap-8 rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff,#f4f8ff)] p-6 md:grid-cols-[0.35fr_1fr]">
                  <div className="text-center">
                    <p className="text-6xl font-black text-slate-950">{product.rating || 4.5}</p>
                    <div className="mt-3 flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-6 w-6 ${i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-slate-500">Based on {(product.reviews || 0).toLocaleString()} verified reviews</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { stars: 5, percentage: 65, color: "bg-yellow-400" },
                      { stars: 4, percentage: 20, color: "bg-blue-400" },
                      { stars: 3, percentage: 10, color: "bg-slate-300" },
                      { stars: 2, percentage: 3, color: "bg-orange-300" },
                      { stars: 1, percentage: 2, color: "bg-red-400" },
                    ].map((item) => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <span className="w-10 text-sm font-semibold text-slate-700">{item.stars}★</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold text-slate-500">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Premium Build Quality", "Shoppers consistently praise the finish and durability."],
                    ["Fast Delivery", "Most orders arrive quickly across UAE locations."],
                    ["Reliable Performance", "Buyers highlight smooth everyday usage and strong speed."],
                    ["Strong Seller Support", "Customers appreciate responsive follow-up and help."],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="font-bold text-slate-900">{title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
                  <p className="font-bold text-blue-900">Estimated Delivery</p>
                  <p className="mt-3 text-sm leading-7 text-blue-800">Standard: Wednesday, 31 Mar - Saturday, 3 Apr</p>
                  <p className="text-sm leading-7 text-blue-800">Express: Tuesday, 30 Mar (additional charge applies)</p>
                </div>
                <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="font-bold text-emerald-900">Return & Exchange</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                    <li>• 7-day easy returns</li>
                    <li>• Free return shipping</li>
                    <li>• Full refund in 7 to 10 business days</li>
                    <li>• Product must remain in original condition</li>
                  </ul>
                </div>
                <div className="rounded-[26px] border border-violet-100 bg-violet-50 p-5">
                  <p className="font-bold text-violet-900">Warranty</p>
                  <ul className="mt-3 space-y-2 text-sm text-violet-800">
                    <li>• 1-Year Manufacturer Warranty</li>
                    <li>• Covers manufacturing defects</li>
                    <li>• Service center support available</li>
                    <li>• Optional extension may apply</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "seller" && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[30px] border border-slate-200">
                  <div className="relative h-44 bg-slate-900">
                    <img src={sellerProfile.cover} alt={sellerProfile.name} className="h-full w-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.15),rgba(15,23,42,0.65))]" />
                  </div>
                  <div className="relative bg-white px-6 pb-6 pt-0">
                    <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-lg">
                          <img src={sellerProfile.avatar} alt={sellerProfile.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="pb-2">
                          <Link to={`/vendor/${sellerProfile.slug}`} className="text-2xl font-black text-slate-950 hover:text-blue-600">
                            {sellerProfile.name}
                          </Link>
                          <p className="mt-1 text-sm font-medium text-slate-500">{sellerProfile.verifiedLabel} • Since {sellerProfile.since}</p>
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="font-black text-slate-900">{sellerProfile.rating}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {sellerProfile.reviewCount.toLocaleString()} reviews
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-700">{sellerProfile.bio}</p>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Positive Rating</p>
                        <p className="mt-2 text-3xl font-black text-emerald-600">{sellerProfile.positiveRate}%</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">On-time Delivery</p>
                        <p className="mt-2 text-3xl font-black text-emerald-600">{sellerProfile.onTimeDelivery}%</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Categories</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{sellerProfile.categories.join(", ")}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setContactOpen(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4" />
                      Contact Seller
                    </button>
                  </div>
                </div>

                {sellerProducts.length > 0 && (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900">More from this seller</h4>
                      <Link to={`/vendor/${sellerProfile.slug}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        View seller profile →
                      </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {sellerProducts.slice(0, 4).map((item) => (
                        <DetailSlimCard
                          key={item.slug || item.id}
                          product={mapToCardProduct(item)}
                          onAddToCart={handleAddRelatedToCart}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900">Similar Products</h2>
            <p className="mt-1 text-sm text-slate-500">Handpicked recommendations</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {relatedProducts.map((item) => (
              <DetailSlimCard key={item.slug} product={item} onAddToCart={handleAddRelatedToCart} />
            ))}
          </div>
        </div>

        <div className="mt-14 pb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900">Customers Also Viewed</h2>
            <p className="mt-1 text-sm text-slate-500">Trending right now</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {viewedProducts.map((item) => (
              <DetailSlimCard key={item.slug} product={item} onAddToCart={handleAddRelatedToCart} />
            ))}
          </div>
        </div>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Contact Seller</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">{sellerProfile.name}</h3>
              </div>
              <button
                onClick={() => {
                  setContactOpen(false);
                  setContactSent(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {contactSent ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-950">Message sent</h4>
                  <p className="mt-3 text-slate-600">Your inquiry has been prepared for {sellerProfile.name}. In a live environment this would be delivered to the seller inbox.</p>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSent(true);
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your name" required />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Your email" type="email" required />
                  </div>
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Subject" defaultValue={`Question about ${product.title}`} required />
                  <textarea
                    className="min-h-[160px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Write your message to the seller..."
                    required
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
                      Send Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactOpen(false)}
                      className="rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
