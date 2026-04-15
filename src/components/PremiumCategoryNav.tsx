import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Flame, Laptop2, Smartphone, Tablet, Headphones, Cpu, BadgePercent, Gamepad2, Tags, Sparkles } from "lucide-react";
import { categoryData, mainNavItems, NavItem } from "../data/categoryStructure";
import { getCategoryPath } from "../lib/seo";
import { useLanguageStore } from "../store/language";
import { storefrontT } from "../lib/storefrontCopy";

const navVisuals: Record<string, { icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  departments: { icon: ChevronDown, accent: "from-[#e7fff6]/92 via-[#eefbf5]/82 to-white/72" },
  laptops: { icon: Laptop2, accent: "from-[#eef8ff]/92 via-[#eefcf3]/82 to-white/72" },
  mobiles: { icon: Smartphone, accent: "from-[#effff3]/92 via-[#f6fff0]/82 to-white/72" },
  tablets: { icon: Tablet, accent: "from-[#f2fffa]/92 via-[#eefbf0]/82 to-white/72" },
  accessories: { icon: Headphones, accent: "from-[#f8ffef]/92 via-[#eefcf7]/82 to-white/72" },
  electronics: { icon: Cpu, accent: "from-[#eefaff]/92 via-[#f1fff4]/82 to-white/72" },
  deals: { icon: BadgePercent, accent: "from-[#f4ffef]/92 via-[#eefbf7]/82 to-white/72" },
  gaming: { icon: Gamepad2, accent: "from-[#eefcf9]/92 via-[#f5fff3]/82 to-white/72" },
  sales: { icon: Tags, accent: "from-[#f5ffef]/92 via-[#eefbf6]/82 to-white/72" },
  offers: { icon: Sparkles, accent: "from-[#eefcf7]/92 via-[#f1fff0]/82 to-white/72" },
};

const extraNavItems: NavItem[] = [
  { name: "Gaming", slug: "gaming", route: "/category/gaming" },
  { name: "Sales", slug: "sales", route: "/deals" },
  { name: "Offers", slug: "offers", route: "/deals" },
];

export default function PremiumCategoryNav() {
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const departmentsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const location = useLocation();
  const { lang } = useLanguageStore();

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        departmentsRef.current &&
        (departmentsRef.current.contains(target) || panelRef.current?.contains(target))
      ) {
        return;
      }
      setDepartmentsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setDepartmentsOpen(false);
  }, [location.pathname]);

  // Calculate panel position when opening and on resize/scroll
  useEffect(() => {
    if (!departmentsOpen) {
      setPanelPos(null);
      return;
    }

    const compute = () => {
      const trigger = departmentsRef.current;
      if (!trigger) return setPanelPos(null);
      const rect = trigger.getBoundingClientRect();
      const margin = 16;
      const maxWidth = Math.min(window.innerWidth - margin * 2, 1150);
      let left = rect.left + window.scrollX;
      // Ensure panel stays within viewport
      if (left + maxWidth > window.scrollX + window.innerWidth - margin) {
        left = window.scrollX + window.innerWidth - margin - maxWidth;
      }
      if (left < window.scrollX + margin) left = window.scrollX + margin;

      const top = rect.bottom + window.scrollY;
      setPanelPos({ left, top, width: maxWidth });
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, { passive: true });
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute);
    };
  }, [departmentsOpen]);

  const isActiveRoute = (route?: string) => {
    if (!route) return false;
    return location.pathname.startsWith(route);
  };

  const handleCategoryClick = () => {
    setDepartmentsOpen(false);
  };

  return (
    <nav className="sticky top-[96px] z-[70] max-w-full overflow-x-clip bg-transparent md:top-[96px]">
      <div className="mx-auto max-w-[1800px] px-3 pt-2 md:px-6 md:pt-2">
        <div className="max-w-full overflow-hidden rounded-[22px] border border-slate-200/85 bg-white/95 px-2 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.07)] backdrop-blur-2xl md:rounded-[22px] md:border md:bg-white/95 md:px-2 md:py-2 md:shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto py-0.5 no-scrollbar md:flex-wrap md:justify-center md:overflow-visible">
          {/* Departments with Departments Mega Menu */}
          <div
            ref={departmentsRef}
            className="relative shrink-0"
            onMouseEnter={() => setDepartmentsOpen(true)}
            onMouseLeave={() => setDepartmentsOpen(false)}
          >
            <button
              onClick={() => setDepartmentsOpen(!departmentsOpen)}
              className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#d9efe7]/90 bg-[linear-gradient(135deg,rgba(232,255,246,0.92),rgba(241,255,246,0.86),rgba(255,255,255,0.78))] px-3.5 py-2 text-[13px] font-semibold tracking-tight text-[#27453d] shadow-[0_8px_16px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 md:px-4 md:py-2.5 md:text-sm ${
                departmentsOpen
                  ? "border-emerald-300 text-[#163d33] shadow-[0_18px_36px_rgba(0,0,0,0.20)]"
                  : "hover:border-emerald-200 hover:text-[#163d33] hover:shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
              }`}
            >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(232,255,246,1),rgba(218,247,232,0.96))] text-[#2d5a4e] shadow-inner md:h-7 md:w-7">
                  <Flame className="h-3.5 w-3.5" />
                </span>
              <span>{storefrontT(lang, "departments")}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  departmentsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Premium Departments Mega Menu rendered in portal to avoid clipping */}
            {departmentsOpen && panelPos && createPortal(
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-[1100] bg-transparent" />

                {/* Mega Menu Dropdown Panel (fixed, positioned by JS) */}
                <div
                  ref={panelRef}
                  className="fixed z-[1110] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                  style={{
                    left: panelPos.left,
                    top: panelPos.top,
                    width: panelPos.width,
                    animation: "slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Mega Menu Content Grid */}
                  <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-4">
                    {categoryData.map((category) => (
                      <div
                        key={category.slug}
                        className="border-r border-slate-100 p-6 transition-all duration-200 hover:bg-slate-50"
                      >
                        {/* Category Title - Clickable */}
                        <Link
                          to={getCategoryPath(category.slug)}
                          onClick={handleCategoryClick}
                          className="group/cat mb-4 flex items-center gap-2 transition-all"
                        >
                          {category.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <h3 className="font-bold text-slate-900 group-hover/cat:text-blue-600 group-hover/cat:underline underline-offset-2">
                            {category.name}
                          </h3>
                        </Link>

                        {/* Subcategories List */}
                        <div className="space-y-2">
                          {category.subcategories.map((subcategory) => (
                            <Link
                              key={subcategory.slug}
                              to={getCategoryPath(category.slug, subcategory.slug)}
                              onClick={handleCategoryClick}
                              className="block text-sm font-medium text-slate-600 transition-all duration-150 hover:text-blue-600 hover:translate-x-1"
                            >
                              {subcategory.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mega Menu Footer */}
                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <Link
                      to="/categories"
                      onClick={handleCategoryClick}
                      className="inline-flex items-center gap-2 font-semibold text-blue-600 transition-all hover:text-blue-700 hover:gap-3"
                    >
                      <span>{storefrontT(lang, "browse_all_categories")}</span>
                      <span className="text-lg">→</span>
                    </Link>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>

          {/* Other Main Navigation Items - Direct Links */}
          {[...mainNavItems.slice(1), ...extraNavItems].map((item: NavItem) => (
            <Link
              key={item.slug}
              to={item.route || "/"}
              className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[#d9efe7]/90 bg-[linear-gradient(135deg,rgba(232,255,246,0.92),rgba(241,255,246,0.86),rgba(255,255,255,0.78))] px-3.5 py-2 text-[13px] font-semibold tracking-tight text-[#27453d] shadow-[0_8px_16px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-200 md:px-4 md:py-2.5 md:text-sm ${
                isActiveRoute(item.route)
                  ? "border-emerald-300 text-[#163d33] shadow-[0_18px_36px_rgba(0,0,0,0.20)]"
                  : "hover:border-emerald-200 hover:text-[#163d33] hover:shadow-[0_18px_36px_rgba(0,0,0,0.18)]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${
                  navVisuals[item.slug]?.accent || "from-slate-100/90 to-white/70"
                } text-[#2d5a4e] shadow-inner md:h-7 md:w-7`}
              >
                {(() => {
                  const Icon = navVisuals[item.slug]?.icon || Cpu;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
              </span>
              <span>{item.slug === "laptops" ? storefrontT(lang, "laptops") : item.slug === "mobiles" ? storefrontT(lang, "mobiles") : item.slug === "tablets" ? storefrontT(lang, "tablets") : item.slug === "accessories" ? storefrontT(lang, "accessories") : item.slug === "deals" ? storefrontT(lang, "today_deals") : item.name}</span>
            </Link>
          ))}
        </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
