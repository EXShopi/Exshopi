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
import { marketplaceCategories } from "./categories";

type SubCategoryGroup = {
  title: string;
  items: string[];
};

// marketplaceCategories are derived from src/components/categories -> uses MASTER_CATEGORIES

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
      <header className="sticky top-0 z-[80] max-w-full overflow-x-clip border-b border-slate-200 bg-white/98 backdrop-blur-xl shadow-sm">
        {/* Premium accent line under header */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-60"></div>
        
        <div className="mx-auto max-w-[1800px] px-3 md:px-6">
          <div className="flex flex-col gap-2 py-1.5 md:gap-4 md:py-4">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:h-12 md:w-12 md:rounded-2xl"
                  type="button"
                >
                  <Menu className="h-3.5 w-3.5 md:h-5 md:w-5" />
                </button>

                <Link to="/" className="flex min-w-0 max-w-full items-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Exshopi"
                    className="h-7 w-auto shrink-0 object-contain sm:h-8 md:h-16"
                  />
                  <div className="-ml-1 min-w-0 leading-tight">
                    <div className="truncate text-[15px] font-black tracking-tight text-slate-900 sm:text-[16px] md:text-2xl">
                      Exshopi
                    </div>
                    <div className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 md:block">
                      UAE’s Trusted Marketplace
                    </div>
                  </div>
                </Link>
              </div>

<div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-3 xl:hidden relative z-[600] overflow-visible">     
             <NavbarWishlistIcon />
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
                <CartIcon onClick={() => setCartDrawerOpen(true)} />
              </div>

<div className="hidden flex-wrap items-center gap-3 xl:flex xl:justify-end relative z-[600] overflow-visible">
                  <SupportIcon />
                <NavbarWishlistIcon />
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
                <CartIcon onClick={() => setCartDrawerOpen(true)} />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 xl:mx-8 xl:max-w-5xl xl:flex-row xl:items-center xl:gap-4">
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

                <div className="relative group flex h-[44px] min-w-0 w-full max-w-full items-center overflow-visible rounded-[15px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.92))] pl-2.5 pr-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all duration-300 hover:border-slate-300 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)] focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-[0_22px_50px_rgba(15,23,42,0.12)] md:h-[70px] md:rounded-[24px] md:pl-5 xl:flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-white shadow-inner md:h-11 md:w-11">
                    <Search className="h-4 w-4 text-blue-600 font-semibold md:h-5 md:w-5" />
                  </div>

                  <input
                    type="text"
                    aria-label="Search products and sellers"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder={storefrontT(lang, "search_placeholder")}
                    className="h-full min-w-0 w-full flex-1 bg-transparent px-2 text-[10.5px] font-medium text-slate-900 outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 placeholder:text-slate-400 md:px-4 md:text-[16px]"
                  />

                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    aria-label="Start voice search"
                    className={`relative mr-2 hidden h-11 w-11 items-center justify-center rounded-full transition-all duration-300 md:flex md:h-12 md:w-12 ${
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
                    aria-label="Submit search"
                    className="h-8 shrink-0 rounded-[12px] bg-gradient-to-r from-blue-600 to-blue-700 px-3 text-[10.5px] font-bold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95 md:h-[56px] md:rounded-[22px] md:px-8 md:text-sm"
                  >
                    {storefrontT(lang, "search")}
                  </button>

                  {quickSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[95] max-w-full overflow-hidden rounded-[24px] border border-white/60 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
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
