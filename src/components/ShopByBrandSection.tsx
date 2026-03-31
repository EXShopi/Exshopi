import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const brands = [
  {
    name: "Apple",
    logo: "/Banners/apple.png",
    link: "/brands/apple",
  },
  {
    name: "Samsung",
    logo: "/Banners/samsung.png",
    link: "/brands/samsung",
  },
  {
    name: "Dell",
    logo: "/Banners/dell.png",
    link: "/brands/dell",
  },
  {
    name: "HP",
    logo: "/Banners/hp.png",
    link: "/brands/hp",
  },
  {
    name: "Lenovo",
    logo: "/Banners/lenovo.png",
    link: "/brands/lenovo",
  },
  {
    name: "Gaming",
    logo: "/Banners/gaming.png",
    link: "/brands/gaming",
  },
  {
    name: "Acer",
    logo: "/Banners/acer.png",
    link: "/brands/acer",
  },
  {
    name: "Asus",
    logo: "/Banners/asus.png",
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
    <section className="mx-auto mt-16 max-w-[1800px] px-4 md:px-6">
      <h2 className="mb-4 text-center text-[30px] font-black tracking-tight text-slate-900">
        Popular Brands
      </h2>
      <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-slate-500">
        Explore official brand storefronts, logos, and curated products from top marketplace names.
      </p>

      <div className="relative overflow-hidden py-2">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-slate-50 to-transparent" />

        <div
          ref={scrollRef}
          className="overflow-x-auto px-4 py-2 no-scrollbar"
        >
          <div className="flex min-w-max items-center gap-10">
            {[...brands, ...brands].map((brand, index) => (
              <button
                key={`${brand.name}-${index}`}
                onClick={() => handleBrandClick(brand.link)}
                className="group flex h-[138px] w-[138px] shrink-0 flex-col items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(180deg,#ffffff,#f7faff)] shadow-[0_14px_30px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_36px_rgba(15,23,42,0.14)] hover:ring-blue-200 cursor-pointer"
              >
                <div className="flex h-[64px] w-[88px] items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span className="mt-3 text-sm font-semibold text-slate-700 group-hover:text-blue-600">
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
