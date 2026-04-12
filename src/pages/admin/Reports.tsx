import React, { useEffect, useState } from 'react';
import { BarChart3, Search, Heart, Eye, Store, RotateCcw } from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

export function AdminReports() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getAdminAnalytics()
      .then((data) => setAnalytics(data))
      .catch((error) => console.error('Failed to load admin analytics', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center font-bold text-slate-500">Loading marketplace analytics...</div>;
  }

  const cards = [
    { label: 'Total Logins', value: analytics?.totalLogins || 0, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { label: 'Searches', value: analytics?.totalSearches || 0, icon: Search, color: 'text-violet-600 bg-violet-50' },
    { label: 'Product Views', value: analytics?.totalProductViews || 0, icon: Eye, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Wishlist Adds', value: analytics?.totalWishlistAdds || 0, icon: Heart, color: 'text-rose-600 bg-rose-50' },
    { label: 'Refund Requests', value: analytics?.refundRequests || 0, icon: RotateCcw, color: 'text-amber-600 bg-amber-50' },
    { label: 'Seller Ranking Rows', value: analytics?.sellerPerformance?.length || 0, icon: Store, color: 'text-slate-700 bg-slate-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Reports</h2>
        <p className="text-slate-500 font-medium">Traffic, search, wishlist, banner, and seller performance in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Top Search Keywords</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.topSearches || []).length ? (
              (analytics?.topSearches || []).map((entry: any, index: number) => {
                const queryLabel = String(entry?.query || 'Unknown search');
                return (
                  <div key={`${queryLabel}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-bold text-slate-900">{queryLabel}</span>
                    <span className="text-sm font-black text-violet-600">{Number(entry?.count || 0)}</span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                Search trends will appear here after customers generate live marketplace search traffic.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Banner Performance</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.bannerPerformance || []).length ? (
              (analytics?.bannerPerformance || []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{entry.title}</p>
                    <p className="text-xs font-medium text-slate-500">{entry.link}</p>
                  </div>
                  <span className="text-sm font-black text-blue-600">{entry.clicks} clicks</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                Banner performance will populate once active homepage campaigns receive traffic.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Most Viewed Products</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.mostViewedProducts || []).length ? (
              (analytics?.mostViewedProducts || []).map((entry: any) => (
                <div key={entry.productId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="font-bold text-slate-900">{entry.product?.title || entry.productId}</span>
                  <span className="text-sm font-black text-emerald-600">{entry.views} views</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                Product-view rankings will appear when shoppers browse the live catalog.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Most Wishlisted Products</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.mostWishlistedProducts || []).length ? (
              (analytics?.mostWishlistedProducts || []).map((entry: any) => (
                <div key={entry.productId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="font-bold text-slate-900">{entry.product?.title || entry.productId}</span>
                  <span className="text-sm font-black text-rose-600">{entry.count} wishlists</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                Wishlist analytics will appear once customers start saving products.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900">Seller Performance Ranking</h3>
        {(analytics?.sellerPerformance || []).length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="pb-3">Seller</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Gross Sales</th>
                  <th className="pb-3">Commission</th>
                  <th className="pb-3">Return Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(analytics?.sellerPerformance || []).map((entry: any) => (
                  <tr key={entry.sellerId}>
                    <td className="py-4 font-bold text-slate-900">{entry.sellerName}</td>
                    <td className="py-4 font-semibold text-slate-600">{entry.totalOrders}</td>
                    <td className="py-4 font-semibold text-slate-600">{formatAED(Math.round(entry.grossSales))}</td>
                    <td className="py-4 font-semibold text-slate-600">{formatAED(Math.round(entry.commission))}</td>
                    <td className="py-4 font-semibold text-slate-600">{(entry.returnRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm font-medium text-slate-500">
            Seller performance rankings will appear once marketplace order volume is available.
          </div>
        )}
      </div>
    </div>
  );
}
