import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productAPI, reviewAPI, sellerAPI } from "../services/api";
import { getSellerProfile, normalizeSellerSlug } from "../lib/sellerProfiles";

type StorefrontSeller = {
  id: string;
  storeName: string;
  storeSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  supportInfo?: string;
  policies?: Record<string, string>;
  socialLinks?: Record<string, string>;
  totalProducts?: number;
  status?: string;
};

type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  seller: string;
  stock: string;
  freeDelivery: boolean;
  badge?: string;
};

export default function VendorStorefront() {
  const { storeSlug } = useParams();
  const normalizedSlug = (storeSlug || "exshopi").toLowerCase();
  const [seller, setSeller] = useState<StorefrontSeller | null>(null);
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStorefront() {
      setLoading(true);
      try {
        const [sellerRecord, allProducts] = await Promise.all([
          sellerAPI.getBySlug(normalizedSlug),
          productAPI.getAll(),
        ]);

        if (!mounted) return;

        const foundSeller =
          sellerRecord && !sellerRecord.error
            ? sellerRecord
            : normalizedSlug === "exshopi"
            ? await sellerAPI.getBySlug("exshopi-official").catch(() => null)
            : null;

        const sellerEntity = foundSeller && !foundSeller?.error ? foundSeller : null;
        setSeller(sellerEntity);

        const filtered = (allProducts || [])
          .filter((product: any) => {
            if (sellerEntity?.id) {
              return product.sellerId === sellerEntity.id;
            }
            return normalizeSellerSlug(product.seller || "") === normalizedSlug;
          })
          .map(
            (product: any): StorefrontProduct => ({
              id: product.id,
              slug: product.slug || product.id,
              title: product.title,
              price: product.price,
              oldPrice: product.originalPrice && product.originalPrice > product.price ? product.originalPrice : undefined,
              rating: product.rating || 4.6,
              reviews: product.reviews || 0,
              image: product.image,
              category:
                product.specs?.templateName ||
                product.specs?.attributes?.brand ||
                product.categoryId ||
                "Marketplace",
              seller: sellerEntity?.storeName || "Marketplace Seller",
              stock: product.stock > 0 ? "In Stock" : "Out of Stock",
              freeDelivery: true,
              badge: Array.isArray(product.badges) ? product.badges[0] : undefined,
            })
          );

        setProducts(filtered);

        if (sellerEntity?.id) {
          const sellerReviews = await reviewAPI.getSellerReviews(sellerEntity.id);
          if (mounted && Array.isArray(sellerReviews)) {
            const count = sellerReviews.length;
            const avg = count > 0 ? sellerReviews.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / count : 0;
            setReviewCount(count);
            setAverageRating(Number(avg.toFixed(1)));
          }
        } else {
          setReviewCount(0);
          setAverageRating(0);
        }
      } catch (error) {
        if (mounted) {
          setSeller(null);
          setProducts([]);
          setReviewCount(0);
          setAverageRating(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStorefront();
    return () => {
      mounted = false;
    };
  }, [normalizedSlug]);

  const fallbackProfile = useMemo(
    () => getSellerProfile(seller?.storeName || "ExShopi Official"),
    [seller?.storeName]
  );

  const displayName = seller?.storeName || "Unknown Store";
  const cover = seller?.banner || fallbackProfile.cover;
  const avatar = seller?.logo || fallbackProfile.avatar;
  const sellerCategories = [
    ...new Set(products.map((item) => item.category).filter(Boolean)),
  ].slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
        <img src={cover} alt={displayName} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.88),rgba(15,23,42,0.68),rgba(30,41,59,0.78))]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="mb-6 text-sm text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-white">{displayName}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[160px_1fr_320px] lg:items-end">
            <div className="h-36 w-36 overflow-hidden rounded-[32px] border border-white/20 bg-white/10 shadow-2xl">
              <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
            </div>

            <div>
              <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                {seller?.status === "active" ? "Approved Marketplace Seller" : "Marketplace Store"}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">{displayName}</h1>
              <p className="mt-3 text-lg font-medium text-blue-100">
                {seller?.city ? `${seller.city}, ${seller.country || "UAE"}` : "UAE marketplace storefront"}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
                {seller?.description || "Store details and policies will appear here once the seller profile is fully configured."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {sellerCategories.map((category) => (
                  <span key={category} className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/10 p-6 backdrop-blur">
              <div className="grid grid-cols-2 gap-4 text-white">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/60">Rating</div>
                  <div className="mt-1 text-3xl font-black">{averageRating || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/60">Reviews</div>
                  <div className="mt-1 text-3xl font-black">{reviewCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/60">Products</div>
                  <div className="mt-1 text-2xl font-black text-emerald-300">{products.length}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/60">Store</div>
                  <div className="mt-1 text-base font-black">{seller?.storeSlug || normalizedSlug}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Products by {displayName}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading ? "Loading seller catalog..." : `${products.length} live products available from this seller`}
                </p>
              </div>
              <Link
                to="/products"
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white"
              >
                Explore All Products
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.slug} {...product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h3 className="text-2xl font-black text-slate-900">No live products yet</h3>
                <p className="mt-3 text-slate-500">
                  This storefront is active, but there are no approved products visible right now.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-900">Store Information</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Location:</span> {seller?.city ? `${seller.city}, ${seller.country || "UAE"}` : "UAE marketplace seller"}</p>
                <p><span className="font-semibold text-slate-900">Email:</span> {seller?.email || "Support details not published yet"}</p>
                {seller?.phone && <p><span className="font-semibold text-slate-900">Phone:</span> {seller.phone}</p>}
                {seller?.website && (
                  <p>
                    <span className="font-semibold text-slate-900">Website:</span>{" "}
                    <a href={seller.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {seller.website}
                    </a>
                  </p>
                )}
                {seller?.supportInfo && <p><span className="font-semibold text-slate-900">Support:</span> {seller.supportInfo}</p>}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-900">Policies</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">Return Policy</p>
                  <p className="mt-1 leading-6">{seller?.policies?.returnPolicy || "Standard ExShopi return rules apply."}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Warranty Policy</p>
                  <p className="mt-1 leading-6">{seller?.policies?.warrantyPolicy || "Warranty terms vary by product listing."}</p>
                </div>
                {seller?.policies?.shippingPolicy && (
                  <div>
                    <p className="font-semibold text-slate-900">Shipping Policy</p>
                    <p className="mt-1 leading-6">{seller.policies.shippingPolicy}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
