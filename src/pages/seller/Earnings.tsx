import React, { useEffect, useState } from 'react';
import { Eye, Heart, ShoppingCart, Wallet, AlertTriangle } from 'lucide-react';
import { dashboardAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { formatAED } from '../../lib/currency';

export default function Earnings() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || (user as any).uid);
        if (!seller?.id) return;
        const data = await dashboardAPI.getSellerAnalytics(seller.id);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load seller analytics', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-100 bg-white p-12 text-center font-bold text-slate-500">Loading seller analytics...</div>;
  }

  const cards = [
    { label: 'Product Views', value: analytics?.totalViews || 0, icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { label: 'Wishlist Adds', value: analytics?.totalWishlistAdds || 0, icon: Heart, color: 'text-rose-600 bg-rose-50' },
    { label: 'Orders', value: analytics?.totalOrders || 0, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Payout Due', value: `AED ${Math.round(analytics?.payoutDue || 0).toLocaleString()}`, icon: Wallet, color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seller Analytics</h1>
        <p className="text-slate-500 font-medium">Views, wishlists, rejected products, and store revenue performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
          <h3 className="text-lg font-black text-slate-900">Top Performing Products</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.topProducts || []).map((product: any) => (
              <div key={product.productId} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold text-slate-900">{product.title}</p>
                  <p className="text-sm font-black text-emerald-600">{formatAED(Math.round(product.revenue))}</p>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span>{product.views} views</span>
                  <span>{product.wishlists} wishlists</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Rejected Products</h3>
          <div className="mt-5 space-y-3">
            {(analytics?.rejectedProducts || []).length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-6 text-sm font-bold text-emerald-700">No rejected products. Your catalog quality looks strong.</div>
            ) : (
              (analytics?.rejectedProducts || []).map((product: any) => (
                <div key={product.id} className="rounded-2xl bg-amber-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-xl bg-amber-100 p-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{product.title}</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">{product.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
