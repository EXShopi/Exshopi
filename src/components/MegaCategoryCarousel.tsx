import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MegaCategoryItem = {
  title: string;
  image: string;
  link: string;
  badge?: string;
};

const megaCategories: MegaCategoryItem[] = [
  {
    title: "Deals",
    image: "/Category Card/clearncestore.png",
    link: "/category/deals",
    badge: "SALE",
  },
  {
    title: "Global Store",
    image: "/Category Card/electronics.png",
    link: "/category/global-store",
  },
  {
    title: "Grocery",
    image: "/Category Card/Grocery.png",
    link: "/category/grocery",
  },
  {
    title: "Electronics",
    image: "/Category Card/electronics.png",
    link: "/category/electronics",
  },
  {
    title: "Mobiles",
    image: "/Category Card/Mobile.png",
    link: "/category/mobiles",
  },
  {
    title: "Laptops & Desktops",
    image: "/Category Card/Laptop.png",
    link: "/category/laptops-desktops",
  },
  {
    title: "Beauty",
    image: "/Category Card/beauty.png",
    link: "/category/beauty",
  },
  {
    title: "Gift Cards",
    image: "/Category Card/Gift.png",
    link: "/category/gift-cards",
  },
  {
    title: "Home & Kitchen",
    image: "/Category Card/home&kitchen.png",
    link: "/category/home-kitchen",
  },
  {
    title: "Women's Fashion",
    image: "/Category Card/women fashion.png",
    link: "/category/womens-fashion",
  },
  {
    title: "Men's Fashion",
    image: "/Category Card/manfashion.png",
    link: "/category/mens-fashion",
  },
  {
    title: "Home Appliances",
    image: "/Category Card/Homeappliances.png",
    link: "/category/home-appliances",
  },
  {
    title: "Health & Nutrition",
    image: "/Category Card/healthnutrition.png",
    link: "/category/health-nutrition",
  },
  {
    title: "Wearables",
    image: "/Category Card/wearable.png",
    link: "/category/wearables",
  },
  {
    title: "Backpack",
    image: "/Category Card/Backpack.png",
    link: "/category/backpack",
  },
  {
    title: "Luggage",
    image: "/Category Card/Luggage.png",
    link: "/category/luggage",
  },
  {
    title: "Televisions",
    image: "/Category Card/Television.png",
    link: "/category/televisions",
  },
  {
    title: "Footwear",
    image: "/Category Card/footwear.png",
    link: "/category/footwear",
  },
  {
    title: "Camera",
    image: "/Category Card/Cameraa.png",
    link: "/category/camera",
  },
  {
    title: "Gaming",
    image: "/Category Card/Gamingpc.png",
    link: "/category/gaming",
  },
  {
    title: "Men's Care",
    image: "/Category Card/menscare.png",
    link: "/category/mens-care",
  },
  {
    title: "Personal Care",
    image: "/Category Card/personalcare.png",
    link: "/category/personal-care",
  },
  {
    title: "Makeup",
    image: "/Category Card/makeup.png",
    link: "/category/makeup",
  },
  {
    title: "Watches",
    image: "/Category Card/watches.png",
    link: "/category/watches",
  },
  {
    title: "Eyewear",
    image: "/Category Card/eyeware.png",
    link: "/category/eyewear",
  },
  {
    title: "Travel Store",
    image: "/Category Card/travelstore.png",
    link: "/category/travel-store",
  },
  {
    title: "Clearance Store",
    image: "/Category Card/clearncestore.png",
    link: "/category/clearance-store",
    badge: "SALE",
  },
  {
    title: "Sports & Fitness",
    image: "/Category Card/sportsequipments.png",
    link: "/category/sports-fitness",
  },
  {
    title: "Fragrances",
    image: "/Category Card/fragranc.png",
    link: "/category/fragrances",
  },
  {
    title: "Baby",
    image: "/Category Card/babcare.png",
    link: "/category/baby",
  },
  {
    title: "Toys & Games",
    image: "/Category Card/toys&games.png",
    link: "/category/toys-games",
  },
  {
    title: "Stationery",
    image: "/Category Card/stationary.png",
    link: "/category/stationery",
  },
  {
    title: "Furniture",
    image: "/Category Card/furniture.png",
    link: "/category/furniture",
  },
  {
    title: "Digital Cards",
    image: "/Category Card/digitalcard.png",
    link: "/category/digital-cards",
  },
  {
    title: "Skincare",
    image: "/Category Card/skincare.png",
    link: "/category/skincare",
  },
  {
    title: "Kitchen Dining",
    image: "/Category Card/kitchendining.com.png",
    link: "/category/kitchen-dining",
  },
  {
    title: "Large Appliances",
    image: "/Category Card/largeappliances.png",
    link: "/category/large-appliances",
  },
  {
    title: "Home Improvement",
    image: "/Category Card/homeimprovement.png",
    link: "/category/home-improvement",
  },
  {
    title: "Mobile Accessories",
    image: "/Category Card/mobileAcessories.png",
    link: "/category/mobile-accessories",
  },
  {
    title: "Computer Accessories",
    image: "/Category Card/computeracessories.png",
    link: "/category/computer-accessories",
  },
  {
    title: "Headphones",
    image: "/Category Card/Headphone.png",
    link: "/category/headphones",
  },
  {
    title: "Hair Care",
    image: "/Category Card/personalcare.png",
    link: "/category/hair-care",
  },
  {
    title: "Home Decor",
    image: "/Category Card/homedecration.png",
    link: "/category/home-decor",
  },
  {
    title: "Kids' Fashion",
    image: "/Category Card/kidsfashion.png",
    link: "/category/kids-fashion",
  },
  {
    title: "Pet Store",
    image: "/Category Card/petstore.png",
    link: "/category/pet-store",
  },
  {
    title: "Automotive",
    image: "/Category Card/automotivetools.png",
    link: "/category/automotive",
  },
  {
    title: "Books",
    image: "/Category Card/book.png",
    link: "/category/books",
  },
  {
    title: "Music & Media",
    image: "/Category Card/music medi.png",
    link: "/category/music-media",
  },
  {
    title: "Jewelry",
    image: "/Category Card/Jewlery.png",
    link: "/category/jewelry",
  },
  {
    title: "New Arrivals",
    image: "/Category Card/new arrival.png",
    link: "/category/new-arrivals",
  },
  {
    title: "Bestsellers",
    image: "/Category Card/best seller.png",
    link: "/category/bestsellers",
  },
  {
    title: "Top Rated",
    image: "/Category Card/Top Rated.png",
    link: "/category/top-rated",
  },
  {
    title: "Traditional Wear",
    image: "/Category Card/traditionalwear.png",
    link: "/category/traditional-wear",
  },
  {
    title: "Bath & Bedding",
    image: "/Category Card/bed&bath.png",
    link: "/category/bath-bedding",
  },
  {
    title: "Experience Vouchers",
    image: "/Category Card/digitalcard.png",
    link: "/category/experience-vouchers",
  },
  {
    title: "Snacks & Chips",
    image: "/Category Card/Snack.png",
    link: "/category/snacks-chips",
  },
  {
    title: "Beverages",
    image: "/Category Card/Beverage.png",
    link: "/category/beverages",
  },
  {
    title: "Laundry & Dishwashing",
    image: "/Category Card/Laundry.png",
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
    <section className="mx-auto mt-10 max-w-[1800px] px-4 md:px-6">
      <div className="relative overflow-hidden">
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
          className="overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory scroll-px-1"
        >
          <div className="flex w-max gap-5 pb-2">
            {megaCategories.map((item) => (
              <a
                key={item.title}
                href={item.link}
                className="group min-w-[156px] max-w-[156px] snap-start text-center"
              >
                <div className="relative overflow-hidden rounded-[26px] border border-[#efc7b7] bg-[linear-gradient(180deg,#f7cbbd_0%,#f8d4c8_58%,#ffffff_100%)] shadow-[0_6px_18px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                  {item.badge ? (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-[#ff4d4f] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                      {item.badge}
                    </div>
                  ) : null}

                  <div className="relative flex h-[172px] items-center justify-center overflow-visible px-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="relative h-[120px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>

                <h3 className="mx-auto mt-4 max-w-[145px] text-[17px] font-semibold leading-6 text-slate-800">
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
