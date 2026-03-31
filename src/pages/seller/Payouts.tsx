import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Building2,
  CreditCard,
  History,
  Plus
} from 'lucide-react';
import { sellerAPI, payoutRequestAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { formatAED } from '../../lib/currency';

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: any;
  notes?: string;
  bankDetails?: any;
}

const formatDateSafe = (value: any) => {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleDateString('en-AE');
};

const formatTimeSafe = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function SellerPayouts() {
  const { user } = useAuthStore();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestAmount, setRequestAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const pendingAmount = payouts.filter((item) => item.status === 'pending' || item.status === 'approved').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const releasedAmount = payouts.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const bankDetails = vendorData?.bankDetails || {
    bankName: vendorData?.bankName || '',
    accountHolder: vendorData?.accountHolder || '',
    accountNumber: vendorData?.bankAccount || '',
    iban: vendorData?.iban || '',
  };

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || user.uid || '');
        setVendorData(seller || null);
        if (seller && seller.id) {
          const reqs = await payoutRequestAPI.getSellerRequests(seller.id);
          // sort by createdAt desc
          reqs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPayouts(reqs || []);
        }
      } catch (err) {
        console.error('Error loading payouts or vendor data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vendorData) return;

    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // In a real app, check if amount <= available balance
    // For now, we'll just allow the request

    setIsRequesting(true);
    setError(null);

    try {
      const seller = await sellerAPI.getByUserId(user.id || user.uid || '');
      if (!seller || !seller.id) throw new Error('Seller profile not found');
      const res = await payoutRequestAPI.create({ amount, notes: '' });
      setPayouts(prev => [res, ...prev]);
      setSuccess(true);
      setRequestAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to submit payout request. Please try again.');
      console.error('Payout request error:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Payouts & Withdrawals</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your earnings and request payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pending Payouts</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{formatAED(pendingAmount)}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Released Payouts</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{formatAED(releasedAmount)}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next Settlement Window</p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {payouts[0]?.createdAt ? formatDateSafe(payouts[0].createdAt) : 'Awaiting request'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout Request Form */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Request Payout</h3>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Withdraw your earnings</p>
              </div>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Withdraw (AED)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">AED</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-black text-lg"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>Request submitted successfully!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isRequesting}
                className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-violet-600/20 hover:bg-violet-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bank Information</h4>
            {bankDetails?.bankName || bankDetails?.accountNumber ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Bank Name</p>
                          <p className="font-bold">{bankDetails.bankName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Number</p>
                          <p className="font-bold">**** {String(bankDetails.accountNumber || '').slice(-4)}</p>
                        </div>
                      </div>
                {bankDetails.iban && (
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">IBAN</p>
                    <p className="mt-2 font-bold">{bankDetails.iban}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 font-medium">No bank details found. Update them in settings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-slate-400" />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Payout History</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-400 font-bold">No payout history found.</p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900">{formatDateSafe(payout.createdAt)}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                            {formatTimeSafe(payout.createdAt)}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900">{formatAED(Number(payout.amount || 0))}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(payout.status)}`}>
                            {payout.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {payout.status === 'paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {payout.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm text-slate-500 font-medium">{payout.notes || 'No notes'}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
