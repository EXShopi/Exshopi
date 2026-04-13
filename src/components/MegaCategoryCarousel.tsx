import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "./OptimizedImage";

type MegaCategoryItem = {
  title: string;
  image: string;
  link: string;
  badge?: string;
};

const megaCategories: MegaCategoryItem[] = [
  {
    title: "Deals",
    image: "/Category Card/clearncestore",
    link: "/category/deals",
    badge: "SALE",
  },
  {
    title: "Global Store",
    image: "/Category Card/electronics",
    link: "/category/global-store",
  },
  {
    title: "Grocery",
    image: "/Category Card/Grocery",
    link: "/category/grocery",
  },
  {
    title: "Electronics",
    image: "/Category Card/electronics",
    link: "/category/electronics",
  },
  {
    title: "Mobiles",
    image: "/Category Card/Mobile",
    link: "/category/mobiles",
  },
  {
    title: "Laptops & Desktops",
    image: "/Category Card/Laptop",
    link: "/category/laptops-desktops",
  },
  {
    title: "Beauty",
    image: "/Category Card/beauty",
    link: "/category/beauty",
  },
  {
    title: "Gift Cards",
    image: "/Category Card/Gift",
    link: "/category/gift-cards",
  },
  {
    title: "Home & Kitchen",
    image: "/Category Card/home&kitchen",
    link: "/category/home-kitchen",
  },
  {
    title: "Women's Fashion",
    image: "/Category Card/women fashion",
    link: "/category/womens-fashion",
  },
  {
    title: "Men's Fashion",
    image: "/Category Card/manfashion",
    link: "/category/mens-fashion",
  },
  {
    title: "Home Appliances",
    image: "/Category Card/Homeappliances",
    link: "/category/home-appliances",
  },
  {
    title: "Health & Nutrition",
    image: "/Category Card/healthnutrition",
    link: "/category/health-nutrition",
  },
  {
    title: "Wearables",
    image: "/Category Card/wearable",
    link: "/category/wearables",
  },
  {
    title: "Backpack",
    image: "/Category Card/Backpack",
    link: "/category/backpack",
  },
  {
    title: "Luggage",
    image: "/Category Card/Luggage",
    link: "/category/luggage",
  },
  {
    title: "Televisions",
    image: "/Category Card/Television",
    link: "/category/televisions",
  },
  {
    title: "Footwear",
    image: "/Category Card/footwear",
    link: "/category/footwear",
  },
  {
    title: "Camera",
    image: "/Category Card/Cameraa",
    link: "/category/camera",
  },
  {
    title: "Gaming",
    image: "/Category Card/Gamingpc",
    link: "/category/gaming",
  },
  {
    title: "Men's Care",
    image: "/Category Card/menscare",
    link: "/category/mens-care",
  },
  {
    title: "Personal Care",
    image: "/Category Card/personalcare",
    link: "/category/personal-care",
  },
  {
    title: "Makeup",
    image: "/Category Card/makeup",
    link: "/category/makeup",
  },
  {
    title: "Watches",
    image: "/Category Card/watches",
    link: "/category/watches",
  },
  {
    title: "Eyewear",
    image: "/Category Card/eyeware",
    link: "/category/eyewear",
  },
  {
    title: "Travel Store",
    image: "/Category Card/travelstore",
    link: "/category/travel-store",
  },
  {
    title: "Clearance Store",
    image: "/Category Card/clearncestore",
    link: "/category/clearance-store",
    badge: "SALE",
  },
  {
    title: "Sports & Fitness",
    image: "/Category Card/sportsequipments",
    link: "/category/sports-fitness",
  },
  {
    title: "Fragrances",
    image: "/Category Card/fragranc",
    link: "/category/fragrances",
  },
  {
    title: "Baby",
    image: "/Category Card/babcare",
    link: "/category/baby",
  },
  {
    title: "Toys & Games",
    image: "/Category Card/toys&games",
    link: "/category/toys-games",
  },
  {
    title: "Stationery",
    image: "/Category Card/stationary",
    link: "/category/stationery",
  },
  {
    title: "Furniture",
    image: "/Category Card/furniture",
    link: "/category/furniture",
  },
  {
    title: "Digital Cards",
    image: "/Category Card/digitalcard",
    link: "/category/digital-cards",
  },
  {
    title: "Skincare",
    image: "/Category Card/skincare",
    link: "/category/skincare",
  },
  {
    title: "Kitchen Dining",
    image: "/Category Card/kitchendining.com",
    link: "/category/kitchen-dining",
  },
  {
    title: "Large Appliances",
    image: "/Category Card/largeappliances",
    link: "/category/large-appliances",
  },
  {
    title: "Home Improvement",
    image: "/Category Card/homeimprovement",
    link: "/category/home-improvement",
  },
  {
    title: "Mobile Accessories",
    image: "/Category Card/mobileAcessories",
    link: "/category/mobile-accessories",
  },
  {
    title: "Computer Accessories",
    image: "/Category Card/computeracessories",
    link: "/category/computer-accessories",
  },
  {
    title: "Headphones",
    image: "/Category Card/Headphone",
    link: "/category/headphones",
  },
  {
    title: "Hair Care",
    image: "/Category Card/personalcare",
    link: "/category/hair-care",
  },
  {
    title: "Home Decor",
    image: "/Category Card/homedecration",
    link: "/category/home-decor",
  },
  {
    title: "Kids' Fashion",
    image: "/Category Card/kidsfashion",
    link: "/category/kids-fashion",
  },
  {
    title: "Pet Store",
    image: "/Category Card/petstore",
    link: "/category/pet-store",
  },
  {
    title: "Automotive",
    image: "/Category Card/automotivetools",
    link: "/category/automotive",
  },
  {
    title: "Books",
    image: "/Category Card/book",
    link: "/category/books",
  },
  {
    title: "Music & Media",
    image: "/Category Card/music medi",
    link: "/category/music-media",
  },
  {
    title: "Jewelry",
    image: "/Category Card/Jewlery",
    link: "/category/jewelry",
  },
  {
    title: "New Arrivals",
    image: "/Category Card/new arrival",
    link: "/category/new-arrivals",
  },
  {
    title: "Bestsellers",
    image: "/Category Card/best seller",
    link: "/category/bestsellers",
  },
  {
    title: "Top Rated",
    image: "/Category Card/Top Rated",
    link: "/category/top-rated",
  },
  {
    title: "Traditional Wear",
    image: "/Category Card/traditionalwear",
    link: "/category/traditional-wear",
  },
  {
    title: "Bath & Bedding",
    image: "/Category Card/bed&bath",
    link: "/category/bath-bedding",
  },
  {
    title: "Experience Vouchers",
    image: "/Category Card/digitalcard",
    link: "/category/experience-vouchers",
  },
  {
    title: "Snacks & Chips",
    image: "/Category Card/Snack",
    link: "/category/snacks-chips",
  },
  {
    title: "Beverages",
    image: "/Category Card/Beverage",
    link: "/category/beverages",
  },
  {
    title: "Laundry & Dishwashing",
    image: "/Category Card/Laundry",
    link: "/category/laundry-dishwashing",
  },
];

export default function MegaCategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const CARD_WIDTH = 156;
  const CARD_GAP = 20;

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const visibleCards = Math.max(1, Math.floor(el.clientWidth / (CARD_WIDTH + CARD_GAP)));
    const moveBy = visibleCards * (CARD_WIDTH + CARD_GAP);
    el.scrollBy({
      left: direction === "left" ? -moveBy : moveBy,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto mt-10 max-w-[1800px] overflow-x-hidden px-4 md:px-6">
      <div className="relative max-w-full overflow-hidden">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-2 top-[72px] z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm transition hover:scale-105 hover:text-slate-900 lg:flex"
          aria-label="Previous categories"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 top-[72px] z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-slate-300/80 bg-white/95 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm transition hover:scale-105 hover:text-slate-900 lg:flex"
          aria-label="Next categories"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          className="max-w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory scroll-px-1"
        >
          <div className="flex w-max gap-4 pb-2 sm:gap-5">
            {megaCategories.map((item) => (
              <a
                key={item.title}
                href={item.link}
                className="group min-w-[132px] max-w-[132px] snap-start text-center sm:min-w-[144px] sm:max-w-[144px] md:min-w-[156px] md:max-w-[156px]"
              >
                <div className="relative overflow-hidden rounded-[26px] border border-[#efc7b7] bg-[linear-gradient(180deg,#f7cbbd_0%,#f8d4c8_58%,#ffffff_100%)] shadow-[0_6px_18px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                  {item.badge ? (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-[#ff4d4f] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                      {item.badge}
                    </div>
                  ) : null}

                  <div className="relative flex h-[150px] items-center justify-center overflow-visible px-3 sm:h-[162px] sm:px-4 md:h-[172px]">
                    <OptimizedImage
                      src={item.image}
                      alt={item.title}
                      lazy={true}
                      useWebP={true}
                      className="relative h-[102px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-[112px] md:h-[120px]"
                    />
                  </div>
                </div>

                <h3 className="mx-auto mt-3 max-w-[124px] text-[15px] font-semibold leading-5 text-slate-800 sm:max-w-[138px] sm:text-[16px] md:mt-4 md:max-w-[145px] md:text-[17px] md:leading-6">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
