import React, { useEffect, useMemo, useState } from 'react';
import { BadgePercent, CalendarDays, Sparkles, Tag, TrendingUp } from 'lucide-react';
import { productAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { formatAED } from '../../lib/currency';

export default function Offers() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || user.uid || '');
        if (!seller?.id) return;
        const sellerProducts = await productAPI.getSellerProducts(seller.id);
        setProducts(Array.isArray(sellerProducts) ? sellerProducts : []);
      } catch (error) {
        console.error('Failed to load seller offers:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const offerProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.salePrice ||
          product.isOffer ||
          product.isOfferCampaign ||
          product.isFlashDeal ||
          product.isTodaysDeal
      )
      .map((product) => ({
        ...product,
        campaignName: product.isFlashDeal ? 'Flash Sale' : product.isTodaysDeal ? 'Today Deal' : product.isOfferCampaign ? 'Campaign Request' : 'Discounted Product',
        approvalStatus: product.approvalStatus || product.status || 'pending',
        discountPercentage:
          product.salePrice && product.price && Number(product.price) > Number(product.salePrice)
            ? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)
            : 0,
      }));
  }, [products]);

  const promotionReadyProducts = useMemo(
    () => products.filter((product) => (product.approvalStatus || product.status) === 'approved' || (product.productStatus || product.status) === 'live'),
    [products]
  );

  return (
    <div className="space-y-8 pb-12">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0f3aa8] to-[#22c55e] p-8 text-white shadow-2xl shadow-emerald-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <BadgePercent size={14} />
              Promotions Center
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Offers, Discounts & Campaigns</h1>
            <p className="mt-3 text-sm leading-7 text-emerald-50/90">
              Manage active discounts, prepare products for Eid and seasonal offers, and keep your promotion-ready catalog visible to the ExShopi campaigns team.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Active Discounts', offerProducts.length, BadgePercent],
            ['Promotion Ready', promotionReadyProducts.length, Sparkles],
            ['Campaign Eligible', promotionReadyProducts.filter((product) => Number(product.stock || 0) > 0).length, TrendingUp],
            ['Scheduled / Requested', offerProducts.filter((product) => product.approvalStatus === 'pending').length, CalendarDays],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Promotions Table</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Dense catalog view for active discounts, flash sale readiness, and campaign performance.</p>
            </div>
            <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
              Request Eid Offer Placement
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4">Campaign</th>
                    <th className="px-4 py-4">Pricing</th>
                    <th className="px-4 py-4">Discount</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {offerProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <p className="max-w-[220px] text-sm font-black text-slate-900">{product.title}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{product.category || 'Marketplace'} • {product.brand || 'Brand not set'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{product.campaignName}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {product.startDate ? new Date(product.startDate).toLocaleDateString('en-AE') : 'Schedule flexible'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{formatAED(product.salePrice || product.price || 0)}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400 line-through">
                          {formatAED(product.price || product.salePrice || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                          {product.discountPercentage ? `Save ${product.discountPercentage}%` : 'Price match'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                          product.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : product.approvalStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {product.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-slate-900">{product.views || 0} views</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{product.wishlistCount || 0} wishlist adds</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && offerProducts.length === 0 && (
              <div className="bg-white px-6 py-16 text-center">
                <Tag className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-xl font-black text-slate-900">No active promotions yet</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Add sale prices to approved products to build your promotion-ready catalog for Eid offers and campaigns.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Campaign Eligibility</h3>
            <div className="mt-5 space-y-3">
              {[
                ['Approved products in stock', promotionReadyProducts.filter((product) => Number(product.stock || 0) > 0).length],
                ['Products with sale price', products.filter((product) => Number(product.salePrice || 0) > 0).length],
                ['Products ready for Eid', promotionReadyProducts.filter((product) => Number(product.stock || 0) > 5).length],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                  <span className="text-lg font-black text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Promotion Notes</h3>
            <div className="mt-5 space-y-3">
              {[
                'Approved products with good stock are more likely to be included in campaigns.',
                'Use competitive sale prices and complete media sets before requesting placements.',
                'Wishlist adds and product views strengthen campaign eligibility.',
              ].map((note) => (
                <div key={note} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
