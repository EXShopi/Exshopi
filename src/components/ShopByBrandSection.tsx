import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";
import { getBrandLogoForName, getBrandSlugFromName } from "../data/brandLogos";

export const brands = [
  {
    name: "Apple",
    logo: "/Banners/apple",
    link: "/brands/apple",
  },
  {
    name: "Samsung",
    logo: "/Banners/samsung",
    link: "/brands/samsung",
  },
  {
    name: "Dell",
    logo: "/Banners/dell",
    link: "/brands/dell",
  },
  {
    name: "HP",
    logo: "/Banners/hp",
    link: "/brands/hp",
  },
  {
    name: "Lenovo",
    logo: "/Banners/lenovo",
    link: "/brands/lenovo",
  },
  {
    name: "Gaming",
    logo: "/Banners/gaming",
    link: "/brands/gaming",
  },
  {
    name: "Acer",
    logo: "/Banners/acer",
    link: "/brands/acer",
  },
  {
    name: "Asus",
    logo: "/Banners/asus",
    link: "/brands/asus",
  },
];

export default function ShopByBrandSection() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handleBrandClick = (link: string) => {
    navigate(link);
  };
  
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const interval = window.setInterval(() => {
      const step = 180;
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const atEnd = el.scrollLeft >= maxScrollLeft - 8;

      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + step,
        behavior: "smooth",
      });
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto mt-16 max-w-[1800px] overflow-x-hidden px-4 md:px-6">
      <h2 className="mb-4 text-center text-[30px] font-black tracking-tight text-slate-900">
        Popular Brands
      </h2>
      <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-slate-500">
        Explore official brand storefronts, logos, and curated products from top marketplace names.
      </p>

      <div className="relative max-w-full overflow-hidden py-2">
        <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-24 bg-gradient-to-r from-slate-50 to-transparent md:block" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-24 bg-gradient-to-l from-slate-50 to-transparent md:block" />

        <div
          ref={scrollRef}
          className="max-w-full overflow-x-auto px-0 py-2 no-scrollbar md:px-4"
        >
          <div className="flex w-max max-w-full items-center gap-4 sm:gap-6 md:gap-10">
            {[...brands, ...brands].map((brand, index) => {
              const slug = getBrandSlugFromName(brand.name) || brand.link.replace('/brands/', '');
              const logoSrc = getBrandLogoForName(brand.name) || brand.logo || `/Banners/${slug}`;

              return (
              <button
                key={`${brand.name}-${index}`}
                onClick={() => handleBrandClick(brand.link)}
                className="group flex h-[112px] w-[112px] shrink-0 flex-col items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(180deg,#ffffff,#f7faff)] shadow-[0_14px_30px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_36px_rgba(15,23,42,0.14)] hover:ring-blue-200 cursor-pointer sm:h-[126px] sm:w-[126px] md:h-[138px] md:w-[138px]"
              >
                <div className="flex h-[52px] w-[72px] items-center justify-center sm:h-[58px] sm:w-[80px] md:h-[64px] md:w-[88px]">
                  <div className="flex h-full w-full items-center justify-center rounded-md bg-white/90 p-1">
                    <OptimizedImage
                      src={logoSrc}
                      alt={brand.name}
                      lazy={true}
                      useWebP={true}
                      className="max-h-full max-w-full object-contain"
                      width={160}
                      height={80}
                    />
                  </div>
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-blue-600 sm:mt-3 sm:text-sm">
                  {brand.name}
                </span>
              </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
