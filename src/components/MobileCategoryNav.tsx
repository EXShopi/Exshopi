import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryPath } from "../lib/seo";
import { ChevronDown, X } from "lucide-react";
import { categoryData, mainNavItems, NavItem } from "../data/categoryStructure";

interface MobileCategoryNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Mobile Category Navigation Drawer
 * Provides expandable/accordion menu for touch-friendly browsing
 * Used on mobile/tablet screens
 */
export default function MobileCategoryNav({
  isOpen = false,
  onClose,
}: MobileCategoryNavProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleNavigate = () => {
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Drawer Overlay/Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      />

      {/* Mobile Category Drawer Panel */}
      <div className="fixed left-0 top-16 z-50 h-[calc(100vh-64px)] w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900">Categories</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 active:bg-slate-200"
            aria-label="Close categories menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category List */}
        <div className="divide-y divide-slate-200">
          {/* Quick Links Section - Top Navigation Items */}
          <div className="bg-slate-50 p-3">
            <div className="space-y-1">
              {mainNavItems.slice(1).map((item: NavItem) => (
                <Link
                  key={item.slug}
                  to={item.route || "/"}
                  onClick={handleNavigate}
                  className="block rounded-lg px-4 py-3 font-semibold text-blue-600 transition hover:bg-blue-50 active:bg-blue-100"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Expandable Department Categories */}
          <div>
            {categoryData.map((category) => {
              const isExpanded = expandedCategories.includes(category.slug);
              return (
                <div key={category.slug}>
                  {/* Category Header Button - Expandable */}
                  <button
                    onClick={() => toggleCategory(category.slug)}
                    className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-4 text-left font-semibold text-slate-900 transition hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      {category.icon && (
                        <span className="text-xl">{category.icon}</span>
                      )}
                      <span>{category.name}</span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Subcategories - Accordion Content */}
                  {isExpanded && (
                    <div className="bg-slate-50 px-4 py-2">
                      <div className="space-y-2 border-l-2 border-blue-200 pl-4">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            to={getCategoryPath(category.slug, sub.slug)}
                            onClick={handleNavigate}
                            className="block py-2 text-sm text-slate-600 transition hover:text-blue-600 hover:font-medium active:text-blue-700"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Call-to-Action */}
          <div className="p-4">
            <Link
              to="/categories"
              onClick={handleNavigate}
              className="block rounded-lg bg-blue-50 px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-100 active:bg-blue-200"
            >
              Browse All Categories
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
