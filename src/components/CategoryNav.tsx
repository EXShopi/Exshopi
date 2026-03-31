import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  { label: "Laptops", route: "/category/laptops" },
  { label: "Mobiles", route: "/category/mobiles" },
  { label: "Tablets", route: "/category/tablets" },
  { label: "Accessories", route: "/category/accessories" },
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
    <nav className="sticky top-16 z-70 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex gap-6 overflow-x-auto">
          {navItems.map((item) => (
            <div key={item.label} className="relative group">
              {item.hasDropdown ? (
                <>
                  {/* Departments Button with Dropdown */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 whitespace-nowrap py-4 font-semibold text-slate-900 transition-all duration-300 hover:text-blue-600 group-hover:text-blue-600"
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
                              to={`/category/${dept.name.toLowerCase()}`}
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
                /* Regular Nav Links */
                <Link
                  to={item.route || "/"}
                  className={`relative whitespace-nowrap py-4 font-semibold transition-all duration-300 ${
                    isActive(item.route)
                      ? "text-blue-600"
                      : "text-slate-700 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                  {/* Active Indicator */}
                  {isActive(item.route) && (
                    <div className="absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-blue-500" />
                  )}
                  {/* Hover Underline */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 rounded-t-full bg-blue-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              )}
            </div>
          ))}
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
