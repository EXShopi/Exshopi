import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ui/ProductCardSkeleton";
import SEOHead from "../components/seo/SEOHead";
import { productAPI } from "../services/api";
import { buildAbsoluteUrl, getCategoryPath } from "../lib/seo";
import { getLandingPageBySlug, UAE_TRUST_SIGNALS } from "../lib/seoMarketplace";
import { getCountryConfig, getCountryTrustMessage } from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const page = getLandingPageBySlug(slug || location.pathname.replace(/^\//, ""));
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const country = getCountryConfig(selectedCountry);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!page?.primaryCategorySlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    productAPI
      .getBySlug(page.primaryCategorySlug, page.primarySubcategorySlug)
      .then((items) => {
        if (!active) return;
        setProducts(Array.isArray(items) ? items.slice(0, 8) : []);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load landing page products:", error);
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page?.primaryCategorySlug, page?.primarySubcategorySlug]);

  const categoryPath = page?.primaryCategorySlug
    ? getCategoryPath(page.primaryCategorySlug, page.primarySubcategorySlug)
    : "/products";

  const jsonLd = useMemo(
    () =>
      page
        ? {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.title,
            description: page.metaDescription,
            url: buildAbsoluteUrl(`/${page.slug}`),
            about: page.keywords,
          }
        : undefined,
    [page]
  );

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        keywords={page.keywords.join(", ")}
        pathname={`/${page.slug}`}
        canonicalUrl={buildAbsoluteUrl(`/${page.slug}`)}
        type="website"
        jsonLd={jsonLd}
      />

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">UAE SEO Landing Page</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">{page.h1}</h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">{page.intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={categoryPath} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
            Browse Matching Category
          </Link>
          <Link to="/products" className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
            Explore All Products
          </Link>
          <Link to="/blog" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:text-blue-600">
            Read UAE Buying Guides
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          {page.sections.map((section) => (
            <article key={section.heading} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="text-base leading-8 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">UAE Trust Signals</p>
          <ul className="mt-4 space-y-3">
            {UAE_TRUST_SIGNALS.map((signal) => (
              <li key={signal} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {signal}
              </li>
            ))}
            <li className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              {getCountryTrustMessage(country.code)}
            </li>
          </ul>

          <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Internal Links</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link to={categoryPath} className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                View related category
              </Link>
              <Link to="/" className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                Return to homepage
              </Link>
              <Link to="/blog/macbook-buying-guide" className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                Read a buyer guide
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-950">Related marketplace products</h2>
          <Link to={categoryPath} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View more
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)
            : products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={String(product.id)}
                  slug={product.slug || String(product.id)}
                  parentCategorySlug={product.specs?.parentCategorySlug || product.specs?.categorySlug || product.category}
                  subcategorySlug={product.specs?.subcategorySlug || product.specs?.templateId || page.primarySubcategorySlug}
                  title={product.title}
                  price={Number(product.price || 0)}
                  oldPrice={Number(product.originalPrice || 0) > Number(product.price || 0) ? Number(product.originalPrice || 0) : undefined}
                  rating={Number(product.rating || 0)}
                  reviews={Number(product.reviews || 0)}
                  image={product.image || product.images?.[0] || "/hero/hero-1.webp"}
                  badge={product.badges?.[0] || product.badge}
                  badges={product.badges}
                  category={product.specs?.categoryName || product.category || "Marketplace"}
                  stock={Number(product.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                  seller={product.sellerName || product.seller || "Marketplace Seller"}
                  freeDelivery={Boolean(product.freeDelivery ?? true)}
                />
              ))}
        </div>
      </section>
    </div>
  );
}
