import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCategoryPath } from "../lib/seo";
import { ChevronDown } from "lucide-react";

const departmentCategories = [
  { name: "Electronics", icon: "📱" },
  { name: "Mobiles", icon: "📲" },
  { name: "Laptops", icon: "💻" },
  { name: "Accessories", icon: "🎧" },
  { name: "Gaming", icon: "🎮" },
  { name: "Home Products", icon: "🏠" },
];

const navItems = [
  { label: "Departments", route: null, hasDropdown: true },
  { label: "Laptops", route: getCategoryPath('laptops') },
  { label: "Mobiles", route: getCategoryPath('mobiles') },
  { label: "Tablets", route: getCategoryPath('tablets') },
  { label: "Accessories", route: getCategoryPath('accessories') },
  { label: "Vendors", route: "/vendors" },
  { label: "Today Deals", route: "/deals" },
];

export default function CategoryNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const isActive = (route: string | null) => {
    if (!route) return false;
    return location.pathname === route;
  };

  return (
    <nav className="sticky top-16 z-70 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Rounded department strip */}
        <div className="rounded-3xl bg-white/95 border border-slate-200 shadow-sm px-2 py-2 my-2">
          <div className="flex gap-3 overflow-x-auto items-center whitespace-nowrap px-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.hasDropdown ? (
                  <>
                    {/* Departments Button with Dropdown */}
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-full text-sm md:text-base font-semibold text-slate-900 transition-colors duration-200 hover:text-blue-600 hover:bg-slate-50"
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-60"
                          onClick={() => setDropdownOpen(false)}
                        />

                        {/* Dropdown Content */}
                        <div
                          className="absolute left-0 top-full z-70 mt-2 w-80 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
                          style={{
                            animation: "slideDown 0.2s ease-out",
                          }}
                        >
                          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
                            Shop by Category
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {departmentCategories.map((dept) => (
                              <Link
                                key={dept.name}
                                to={getCategoryPath(dept.name.toLowerCase())}
                                onClick={() => setDropdownOpen(false)}
                                className="group/item flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-blue-50"
                              >
                                <span className="text-2xl">{dept.icon}</span>
                                <span className="font-medium text-slate-900 group-hover/item:text-blue-600">
                                  {dept.name}
                                </span>
                              </Link>
                            ))}
                          </div>

                          {/* Dropdown Footer */}
                          <Link
                            to="/categories"
                            onClick={() => setDropdownOpen(false)}
                            className="mt-4 block rounded-xl border border-slate-200 py-3 text-center font-semibold text-blue-600 transition-all hover:bg-blue-50"
                          >
                            View All Categories
                          </Link>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* Regular Nav Links (pill style) */
                  <Link
                    to={item.route || "/"}
                    className={`relative whitespace-nowrap px-3 py-2 rounded-full text-sm md:text-base font-semibold transition-all duration-300 inline-flex items-center ${
                      isActive(item.route)
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
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
