import { useMemo, useState } from "react";
import { X, ChevronRight, ChevronDown, Menu, Grid2x2 } from "lucide-react";
import { marketplaceCategories } from "./categories";
export default function CategoryNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(
    marketplaceCategories[0].id
  );

  const activeCategory = useMemo(
    () =>
      marketplaceCategories.find((cat) => cat.id === activeCategoryId) ||
      marketplaceCategories[0],
    [activeCategoryId]
  );

  return (
    <>
      {/* Left 3-line sidebar trigger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        aria-label="Open categories sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Header categories button */}
      <div className="relative">
        <button
          onClick={() => setMegaOpen((prev) => !prev)}
          className="hidden h-[58px] min-w-[190px] items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 xl:inline-flex"
        >
          <span className="flex items-center gap-2">
            <Grid2x2 className="h-4 w-4" />
            All Categories
          </span>
          <ChevronDown
            className={`h-4 w-4 transition ${megaOpen ? "rotate-180" : ""}`}
          />
        </button>

        {megaOpen && (
          <>
            <div
              className="fixed inset-0 z-[90] bg-black/20"
              onClick={() => setMegaOpen(false)}
            />
            <div className="absolute left-0 top-[calc(100%+12px)] z-[100] hidden w-[1180px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.16)] xl:block">
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
                          onMouseEnter={() => setActiveCategoryId(category.id)}
                          onClick={() => setActiveCategoryId(category.id)}
                          className={`flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition ${
                            isActive
                              ? "bg-white shadow-sm"
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
                            <a
                              key={item}
                              href="#"
                              className="block text-sm text-slate-600 transition hover:text-slate-950"
                            >
                              {item}
                            </a>
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
      </div>

      {/* Sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[110] bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed left-0 top-0 z-[120] flex h-screen w-[380px] max-w-[92vw] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
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
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[150px_1fr]">
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
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-y-auto p-4">
                <div className="mb-4 text-lg font-bold text-slate-900">
                  {activeCategory.name}
                </div>

                <div className="space-y-5">
                  {activeCategory.groups.map((group) => (
                    <div key={group.title}>
                      <h4 className="mb-2 text-sm font-bold text-slate-900">
                        {group.title}
                      </h4>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <a
                            key={item}
                            href="#"
                            className="block text-sm text-slate-600 transition hover:text-slate-950"
                          >
                            {item}
                          </a>
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
    </>
  );
}