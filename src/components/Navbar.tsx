import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import {
  Menu,
  Search,
  Mic,
  ChevronDown,
  Grid2x2,
  ChevronRight,
  X,
} from "lucide-react";
import PremiumAccountButton from "./Premium/PremiumAccountButton";
import CartIcon from "./Premium/CartIcon";
import NavbarWishlistIcon from "./Premium/NavbarWishlistIcon";
import SupportIcon from "./Premium/SupportIcon";
import CartDrawer from "./CartDrawer";
import { useLanguageStore } from "../store/language";
import { storefrontT } from "../lib/storefrontCopy";
import { analyticsAPI, productAPI } from "../services/api";
import { formatAEDPlain } from "../lib/currency";
import { useAuthStore } from "../store/auth";
import { getLiveMarketplaceProducts, type LiveMarketplaceProduct } from "../lib/liveMarketplaceProducts";

type SubCategoryGroup = {
  title: string;
  items: string[];
};

type MainCategory = {
  id: string;
  name: string;
  description: string;
  groups: SubCategoryGroup[];
};

const marketplaceCategories: MainCategory[] = [
  {
    id: "electronics-mobiles",
    name: "Electronics & Mobiles",
    description: "Phones, laptops, gadgets and accessories",
    groups: [
      {
        title: "Mobiles & Tablets",
        items: [
          "Smartphones",
          "Tablets",
          "iPads",
          "Refurbished Phones",
          "Mobile Accessories",
          "Cases",
          "Screen Protectors",
        ],
      },
      {
        title: "Laptops & Computers",
        items: [
          "MacBooks",
          "Windows Laptops",
          "Gaming PCs",
          "Monitors",
          "Printers",
          "Storage",
          "SSD / HDD",
        ],
      },
      {
        title: "Audio & Video",
        items: [
          "Headphones",
          "Earbuds (TWS)",
          "Bluetooth Speakers",
          "Home Theater",
          "Smart TVs",
        ],
      },
      {
        title: "Cameras",
        items: [
          "DSLR",
          "Mirrorless",
          "Action Cameras",
          "Drones",
          "Security Cameras",
        ],
      },
      {
        title: "Wearables",
        items: [
          "Smartwatches",
          "Fitness Trackers",
          "Apple Watch",
          "Accessories",
        ],
      },
    ],
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Men, women and kids fashion",
    groups: [
      {
        title: "Clothing",
        items: [
          "Tops",
          "Dresses",
          "Hoodies",
          "Activewear",
          "Abayas",
          "Kaftans",
          "Kurtas",
        ],
      },
      {
        title: "Footwear",
        items: [
          "Sneakers",
          "Formal Shoes",
          "Sandals",
          "Heels",
          "Sports Shoes",
        ],
      },
      {
        title: "Bags & Accessories",
        items: ["Handbags", "Backpacks", "Wallets", "Belts", "Sunglasses"],
      },
      {
        title: "Jewelry & Watches",
        items: [
          "Luxury Watches",
          "Smartwatches",
          "Fine Jewelry",
          "Fashion Jewelry",
        ],
      },
    ],
  },
  {
    id: "home-kitchen-appliances",
    name: "Home, Kitchen & Appliances",
    description: "Furniture, decor and appliances",
    groups: [
      {
        title: "Large Appliances",
        items: [
          "Refrigerators",
          "Washing Machines",
          "Ovens",
          "Dishwashers",
          "ACs",
        ],
      },
      {
        title: "Small Appliances",
        items: [
          "Air Fryers",
          "Coffee Makers",
          "Blenders",
          "Kettles",
          "Microwaves",
        ],
      },
      {
        title: "Kitchen & Dining",
        items: [
          "Cookware Sets",
          "Storage & Organization",
          "Dinnerware",
          "Bakeware",
        ],
      },
      {
        title: "Furniture",
        items: [
          "Living Room",
          "Bedroom",
          "Office Furniture",
          "Gaming Chairs",
        ],
      },
      {
        title: "Home Decor",
        items: ["Lighting", "Rugs", "Bedding & Bath", "Candles", "Diffusers"],
      },
    ],
  },
  {
    id: "beauty-health-personal-care",
    name: "Beauty, Health & Personal Care",
    description: "Beauty, skincare and wellness",
    groups: [
      {
        title: "Beauty & Makeup",
        items: [
          "Face Makeup",
          "Eye Makeup",
          "Lip Makeup",
          "Makeup Tools",
          "Brushes",
        ],
      },
      {
        title: "Skincare",
        items: ["Moisturizers", "Serums", "Sunscreen", "K-Beauty"],
      },
      {
        title: "Fragrances",
        items: [
          "Luxury Perfumes",
          "Arabic Perfumes",
          "Body Mists",
          "Men’s Colognes",
        ],
      },
      {
        title: "Personal Care",
        items: ["Haircare", "Oral Care", "Men’s Grooming", "Bath & Body"],
      },
      {
        title: "Health & Wellness",
        items: ["Vitamins & Supplements", "First Aid", "Medical Devices"],
      },
    ],
  },
  {
    id: "baby-kids-toys",
    name: "Baby, Kids & Toys",
    description: "Baby essentials, toys and kids fashion",
    groups: [
      {
        title: "Baby Essentials",
        items: [
          "Diapers",
          "Wipes",
          "Baby Food & Formula",
          "Strollers",
          "Car Seats",
        ],
      },
      {
        title: "Toys & Games",
        items: [
          "LEGO",
          "Action Figures",
          "Dolls",
          "Board Games",
          "Outdoor Play",
          "Educational Toys",
        ],
      },
      {
        title: "Kids Fashion",
        items: ["Boys Clothing", "Girls Clothing", "Infant Clothing", "Kids Shoes"],
      },
    ],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    description: "Fitness and outdoor gear",
    groups: [
      {
        title: "Fitness & Training",
        items: ["Gym Equipment", "Treadmills", "Dumbbells", "Yoga Mats"],
      },
      {
        title: "Outdoor Adventure",
        items: ["Camping Gear", "Cycling", "Scooters", "Swimming"],
      },
      {
        title: "Team Sports",
        items: ["Football", "Basketball", "Tennis", "Padel Rackets"],
      },
    ],
  },
  {
    id: "grocery",
    name: "Grocery",
    description: "Fresh, pantry and household essentials",
    groups: [
      {
        title: "Fresh Food",
        items: [
          "Fruits & Vegetables",
          "Meat & Seafood",
          "Dairy & Eggs",
          "Bakery",
        ],
      },
      {
        title: "Pantry",
        items: [
          "Snacks",
          "Chocolates",
          "Beverages",
          "Canned Food",
          "Cooking Oils",
          "Rice & Pasta",
        ],
      },
      {
        title: "Household",
        items: ["Laundry Care", "Cleaning Supplies", "Tissues & Paper Rolls"],
      },
      {
        title: "Pet Supplies",
        items: ["Dog Food", "Cat Food", "Pet Toys", "Grooming", "Pet Healthcare"],
      },
    ],
  },
  {
    id: "tools-diy-automotive",
    name: "Tools, DIY & Automotive",
    description: "Tools, home improvement and automotive",
    groups: [
      {
        title: "Tools",
        items: ["Power Tools", "Hand Tools", "Measurement", "Safety Gear"],
      },
      {
        title: "Home Improvement",
        items: ["Smart Home", "Alexa / Google Home", "Electrical", "Plumbing"],
      },
      {
        title: "Automotive",
        items: ["Car Accessories", "Tires", "Car Care", "Spare Parts"],
      },
    ],
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(
    marketplaceCategories[0].id
  );

  const [searchText, setSearchText] = useState("");
  const [searchCatalog, setSearchCatalog] = useState<LiveMarketplaceProduct[]>([]);
  const [listening, setListening] = useState(false);
  const { lang } = useLanguageStore();

  // Listen for custom cart drawer event from ProductDetail
  useEffect(() => {
    const handleOpenCart = () => {
      setCartDrawerOpen(true);
    };
    window.addEventListener('openCartDrawer', handleOpenCart);
    return () => window.removeEventListener('openCartDrawer', handleOpenCart);
  }, []);

  useEffect(() => {
    let mounted = true;

    productAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        setSearchCatalog(getLiveMarketplaceProducts(items));
      })
      .catch(() => {
        if (mounted) setSearchCatalog([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchText(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const activeCategory = useMemo(
    () =>
      marketplaceCategories.find((cat) => cat.id === activeCategoryId) ||
      marketplaceCategories[0],
    [activeCategoryId]
  );

  const slugifyValue = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleSearchSubmit = () => {
    const query = searchText.trim();
    if (query) {
      analyticsAPI
        .track({
          eventType: "search",
          entityType: "catalog",
          metadata: { query },
        })
        .catch(() => undefined);
    }
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  const navigateToCategory = (categoryName: string, itemName?: string) => {
    const categorySlug = slugifyValue(categoryName);
    const itemSlug = itemName ? slugifyValue(itemName) : "";
    setMegaOpen(false);
    setSidebarOpen(false);
    navigate(itemSlug ? `/category/${categorySlug}/${itemSlug}` : `/category/${categorySlug}`);
  };

  const quickSuggestions = useMemo(
    () =>
      searchCatalog
        .filter((product) =>
          searchText.trim()
            ? `${product.title} ${product.seller} ${product.category}`.toLowerCase().includes(searchText.trim().toLowerCase())
            : false
        )
        .slice(0, 6),
    [searchCatalog, searchText]
  );

  return (
    <>
      <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/98 backdrop-blur-xl shadow-sm">
        {/* Premium accent line under header */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-60"></div>
        
        <div className="mx-auto max-w-[1800px] px-4 md:px-6">
          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <Link to="/" className="flex items-center">
                  <img
                    src="/logo.png"
                    alt="Exshopi"
                    className="h-16 w-auto object-contain"
                  />
                  <div className="-ml-1 leading-tight">
                    <div className="text-2xl font-black tracking-tight text-slate-900">
                      Exshopi
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      UAE’s Trusted Marketplace
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex flex-1 flex-col gap-4 xl:mx-8 xl:max-w-5xl xl:flex-row xl:items-center">
                <div className="relative hidden xl:block">
                  <button
                    onClick={() => setMegaOpen((prev) => !prev)}
                    className="inline-flex h-[64px] min-w-[210px] items-center justify-between rounded-[24px] border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 text-sm font-semibold text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-slate-50 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] active:scale-95"
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <Grid2x2 className="h-5 w-5 text-blue-600" />
                      <span>{storefrontT(lang, "all_categories")}</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {megaOpen && (
                    <div className="absolute left-0 top-[calc(100%+12px)] z-[90] w-[1180px] overflow-hidden rounded-[30px] border-2 border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.24)]">
                      <div className="grid grid-cols-[320px_1fr]">
                        <div className="border-r border-slate-200 bg-slate-50 p-5">
                          <div className="mb-4 text-sm font-bold text-slate-900">
                            Main Categories
                          </div>

                          <div className="space-y-1">
                            {marketplaceCategories.map((category) => {
                              const isActive = category.id === activeCategoryId;

                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => setActiveCategoryId(category.id)}
                                  className={`flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition ${
                                    isActive
                                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                                      : "hover:bg-white/70"
                                  }`}
                                >
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {category.name}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {category.description}
                                    </div>
                                  </div>
                                  <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-8">
                          <div className="mb-2 text-2xl font-bold text-slate-900">
                            {activeCategory.name}
                          </div>
                          <div className="mb-8 text-sm text-slate-500">
                            {activeCategory.description}
                          </div>

                          <div className="grid grid-cols-3 gap-x-10 gap-y-8">
                            {activeCategory.groups.map((group) => (
                              <div key={group.title}>
                                <h4 className="mb-3 text-sm font-bold text-slate-900">
                                  {group.title}
                                </h4>

                                <div className="space-y-2">
                                  {group.items.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => navigateToCategory(activeCategory.name, item)}
                                      className="block text-left text-sm text-slate-600 transition hover:text-slate-950"
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative group flex h-[70px] flex-1 items-center overflow-visible rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.92))] pl-5 pr-2 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all duration-300 hover:border-slate-300 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)] focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-[0_22px_50px_rgba(15,23,42,0.12)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-white shadow-inner">
                    <Search className="h-5 w-5 text-blue-600 font-semibold" />
                  </div>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder={storefrontT(lang, "search_placeholder")}
                    className="h-full w-full bg-transparent px-4 text-[16px] font-medium text-slate-900 outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`relative mr-2 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                      listening
                        ? "animate-pulse bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)]"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    }`}
                    title="Voice Search"
                  >
                    <Mic className="h-5 w-5 font-semibold" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="h-[56px] rounded-[22px] bg-gradient-to-r from-blue-600 to-blue-700 px-8 text-sm font-bold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95"
                  >
                    {storefrontT(lang, "search")}
                  </button>

                  {quickSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[95] overflow-hidden rounded-[24px] border border-white/60 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                      <div className="border-b border-slate-100 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        {storefrontT(lang, "search")}
                      </div>
                      <div className="p-3">
                        {quickSuggestions.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => navigate(`/product/${product.slug}`)}
                            className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="h-12 w-12 rounded-2xl border border-slate-100 bg-slate-50 object-cover"
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{product.title}</div>
                                <div className="text-xs text-slate-500">{product.seller}</div>
                              </div>
                            </div>
                            <div className="text-sm font-black text-blue-600">{formatAEDPlain(product.price)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                {/* Support Icon */}
                <SupportIcon />

                {/* Wishlist Icon */}
                <NavbarWishlistIcon />

                {/* Account Button */}
                <PremiumAccountButton
                  isLoggedIn={Boolean(authUser?.id || authUser?.uid)}
                  userName={
                    authUser?.name ||
                    authUser?.fullName ||
                    authUser?.displayName ||
                    authUser?.email ||
                    undefined
                  }
                />

                {/* Cart Icon */}
                <CartIcon onClick={() => setCartDrawerOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {megaOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/20"
          onClick={() => setMegaOpen(false)}
        />
      )}

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[100000] bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed left-0 top-0 z-[100001] flex h-screen w-[390px] max-w-[92vw] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Categories</div>
                <div className="text-xs text-slate-500">
                  Browse all marketplace departments
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[160px_1fr]">
              <div className="overflow-y-auto border-r border-slate-200 bg-slate-50 p-3">
                <div className="space-y-1">
                  {marketplaceCategories.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:bg-white/80"
                        }`}
                        type="button"
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-y-auto p-4">
                <button
                  type="button"
                  onClick={() => navigateToCategory(activeCategory.name)}
                  className="mb-2 text-left text-lg font-bold text-slate-900 hover:text-blue-600"
                >
                  {activeCategory.name}
                </button>
                <div className="mb-4 text-xs text-slate-500">
                  {activeCategory.description}
                </div>

                <div className="space-y-5">
                  {activeCategory.groups.map((group) => (
                    <div key={group.title}>
                      <h4 className="mb-2 text-sm font-bold text-slate-900">
                        {group.title}
                      </h4>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => navigateToCategory(activeCategory.name, item)}
                            className="block text-left text-sm text-slate-600 transition hover:text-slate-950"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}
