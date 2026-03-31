import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Image as ImageIcon, Sparkles, Tag } from 'lucide-react';
import { adminOpsAPI, adminProductAPI, bannerAPI } from '../../services/api';

export function AdminOffers() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [bannerStats, setBannerStats] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [marketplaceSettings, allProducts, analytics] = await Promise.all([
          adminOpsAPI.getMarketplaceSettings(),
          adminProductAPI.getAll(),
          bannerAPI.getAnalytics().catch(() => []),
        ]);
        setSettings(marketplaceSettings || null);
        setProducts(Array.isArray(allProducts) ? allProducts : []);
        setBannerStats(Array.isArray(analytics) ? analytics : []);
      } catch (error) {
        console.error('Failed to load offers overview:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featuredOffers = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isOffer ||
          product.isOfferCampaign ||
          product.isFlashDeal ||
          product.isTodaysDeal ||
          product.isBlackFriday
      ),
    [products]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Offers & Campaigns</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
          Control ExShopi’s seasonal merchandising, homepage campaign labels, and offer-linked products from one place.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-[#0033CC]/10 via-blue-50 to-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Primary Campaign Section</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                {settings?.campaignSectionTitle || 'Eid Offers'}
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {settings?.campaignSectionSubtitle ||
                  'Rename, rotate, and promote homepage offer collections from admin settings and banner controls.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <CalendarRange className="text-blue-700" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Offer Inventory</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '...' : featuredOffers.length}</p>
          <p className="mt-2 text-sm font-medium text-slate-500">Products currently tagged for campaign or offer placement.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Tag className="text-violet-600" size={20} />
            <h3 className="text-xl font-black tracking-tight text-slate-900">Offer-Tagged Products</h3>
          </div>
          <div className="space-y-3">
            {featuredOffers.slice(0, 8).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{product.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {product.soldByLabel || product.sellerName || 'ExShopi Official'}
                  </p>
                </div>
                <div className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
                  Offer Live
                </div>
              </div>
            ))}
            {!loading && featuredOffers.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                No products are currently tagged for homepage campaign placement.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ImageIcon className="text-blue-600" size={20} />
            <h3 className="text-xl font-black tracking-tight text-slate-900">Banner Performance</h3>
          </div>
          <div className="space-y-3">
            {bannerStats.slice(0, 6).map((banner) => (
              <div key={banner.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{banner.title || 'Homepage Banner'}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Last click: {banner.lastClickAt ? new Date(banner.lastClickAt).toLocaleString() : 'No clicks yet'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Clicks</p>
                    <p className="text-lg font-black text-slate-900">{banner.clicks || 0}</p>
                  </div>
                </div>
              </div>
            ))}
            {!loading && bannerStats.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                Banner analytics will appear here once campaign banners receive traffic.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-violet-50 to-blue-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <Sparkles className="text-violet-600" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Premium Workflow Tip</h3>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Use Banners for visual campaigns, Settings for section naming, and Products for tag-based merchandising. Together they control the full ExShopi homepage offer experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
