import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MessageSquare, Search, ShieldCheck, Star, User } from 'lucide-react';
import { sellerAPI, reviewAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface Review {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: any;
  vendorId: string;
}

const getReviewDate = (value: any) => {
  if (!value) return 'Not available';
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-AE');
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleDateString('en-AE');
};

export function SellerReviews() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showLowRatingOnly, setShowLowRatingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || (user as any).uid);
        if (!seller?.id) {
          setReviews([]);
          return;
        }

        const data = await reviewAPI.getSellerReviews(seller.id);
        const reviewsData = (data || []).map((item: any) => ({ id: item.id, ...item })) as Review[];
        setReviews(
          reviewsData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        );
      } catch (error) {
        console.error('Error loading seller reviews:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesRating = filterRating === 'all' || review.rating === filterRating;
      const matchesLowRating = !showLowRatingOnly || review.rating <= 3;
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        String(review.productTitle || '').toLowerCase().includes(search) ||
        String(review.customerName || '').toLowerCase().includes(search) ||
        String(review.comment || '').toLowerCase().includes(search);
      return matchesRating && matchesLowRating && matchesSearch;
    });
  }, [reviews, filterRating, showLowRatingOnly, searchQuery]);

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length;
    return {
      rating,
      count,
      percentage: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
    };
  });

  const unresolvedReviews = reviews.filter((review) => review.rating <= 3).length;

  return (
    <div className="space-y-8 pb-12">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#7c3aed] p-8 text-white shadow-2xl shadow-violet-200/40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">
              <MessageSquare size={14} />
              Reviews Center
            </div>
            <h2 className="mt-5 text-4xl font-black tracking-tight">Customer Feedback Control</h2>
            <p className="mt-3 text-sm leading-7 text-violet-100/90">
              Monitor verified customer sentiment, identify low-rating risks quickly, and keep your store reputation premium on ExShopi.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Average Rating', averageRating.toFixed(1)],
            ['Total Reviews', String(reviews.length)],
            ['Attention Needed', String(unresolvedReviews)],
            ['Verified Quality', reviews.length ? `${Math.max(0, Math.round((reviews.filter((item) => item.rating >= 4).length / reviews.length) * 100))}%` : '0%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Rating Breakdown</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">A cleaner view of product and seller satisfaction.</p>
          </div>
          <div className="mt-6 space-y-4">
            {ratingBreakdown.map((item) => (
              <div key={item.rating} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    {item.rating} <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Recent Reviews</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Filter by rating, product, or issue level.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLowRatingOnly((current) => !current)}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                  showLowRatingOnly ? 'bg-rose-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                Low Rating Attention
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reviews, products or customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(['all', 5, 4, 3, 2, 1] as const).map((rating) => (
                <button
                  key={String(rating)}
                  onClick={() => setFilterRating(rating)}
                  className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                    filterRating === rating ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {rating === 'all' ? 'All Ratings' : `${rating} Stars`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-xl font-black text-slate-900">No reviews found</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  When customers review your products, they will appear here with rating summaries and response actions.
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="rounded-[1.75rem] border border-slate-200 p-6 transition hover:shadow-md">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{review.customerName || 'Customer'}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                              <ShieldCheck className="h-3 w-3" />
                              Verified Order
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {getReviewDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                        <span className="ml-2 text-sm font-black text-slate-900">{review.rating}.0</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-600">
                        {review.comment || 'No review comment provided.'}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                          {review.productTitle || 'Marketplace Product'}
                        </span>
                        {review.rating <= 3 && (
                          <span className="rounded-full bg-rose-100 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700">
                            Needs attention
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-[180px]">
                      <button className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">
                        Reply to Review
                      </button>
                      <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                        View Product
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
