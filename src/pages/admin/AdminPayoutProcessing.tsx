import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CreditCard, Download, Landmark, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { payoutAPI, payoutRequestAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

const formatDateSafe = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-AE');
};

const requestStatusClass = (status: string) => {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700';
  if (status === 'paid') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};

export default function AdminPayoutProcessing() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const loadFinance = async () => {
      try {
        const [allPayouts, allRequests] = await Promise.all([payoutAPI.getAllPayouts(), payoutRequestAPI.getAllAdmin()]);
        setPayouts(Array.isArray(allPayouts) ? allPayouts : []);
        setRequests(Array.isArray(allRequests) ? allRequests : []);
      } catch (error) {
        console.error('Failed to load admin payouts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinance();
  }, []);

  const metrics = useMemo(() => {
    const pendingRequests = requests.filter((item) => item.status === 'pending');
    const approvedRequests = requests.filter((item) => item.status === 'approved');
    const processedPayouts = payouts.filter((item) => item.status === 'processed' || item.status === 'paid');
    const pendingValue = pendingRequests.reduce((sum, item) => sum + Number(item.amount || item.netAmount || 0), 0);
    const releasedValue = processedPayouts.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);
    const commissionValue = payouts.reduce((sum, item) => sum + Number(item.commission || 0), 0);

    return {
      pendingValue,
      approvedValue: approvedRequests.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      releasedValue,
      commissionValue,
      totalRecords: payouts.length + requests.length,
      nextPayoutCount: approvedRequests.length,
    };
  }, [payouts, requests]);

  const handleProcessPayout = async (payoutId: string) => {
    try {
      setProcessingId(payoutId);
      const updated = await payoutAPI.process(payoutId);
      setPayouts((current) => current.map((item) => (item.id === payoutId ? updated : item)));
    } catch (error) {
      console.error('Failed to process payout:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestDecision = async (requestId: string, status: 'approved' | 'rejected' | 'paid') => {
    try {
      setProcessingId(requestId);
      const updated = await payoutRequestAPI.update(requestId, { status });
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
    } catch (error) {
      console.error('Failed to update payout request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center font-bold text-slate-500">Loading finance operations...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#081324] via-[#172554] to-[#0ea5e9] p-8 text-white shadow-2xl shadow-cyan-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-100">
              <Wallet size={14} />
              Finance workspace
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Payouts, Wallets & Settlements</h1>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Control seller payout requests, commission exposure, and weekly settlements with finance-grade visibility for UAE marketplace operations.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Pending requests', formatAED(metrics.pendingValue), Wallet],
            ['Approved to release', formatAED(metrics.approvedValue), CreditCard],
            ['Released payouts', formatAED(metrics.releasedValue), Landmark],
            ['Commission earned', formatAED(metrics.commissionValue), TrendingUp],
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Payout request queue</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Approve, reject, and release seller payout requests with clear bank and settlement visibility.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              Next weekly run • {metrics.nextPayoutCount} sellers ready
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Seller</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Bank details</th>
                    <th className="px-4 py-4">Notes</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{request.sellerName || 'Unknown Seller'}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{request.sellerStoreSlug || 'No store slug'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-black text-slate-900">{formatAED(request.amount || 0)}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Requested {formatDateSafe(request.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${requestStatusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500">
                        <p>{request.bankDetails?.bankName || 'UAE Bank'}</p>
                        <p className="mt-1">{request.bankDetails?.accountHolder || 'Account holder pending'}</p>
                        <p className="mt-1">{request.bankDetails?.accountNumber || 'Account number not stored'}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-500">
                        {request.notes || 'No additional seller notes.'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[140px] flex-col gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                disabled={processingId === request.id}
                                onClick={() => handleRequestDecision(request.id, 'approved')}
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                disabled={processingId === request.id}
                                onClick={() => handleRequestDecision(request.id, 'rejected')}
                                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <button
                              disabled={processingId === request.id}
                              onClick={() => handleRequestDecision(request.id, 'paid')}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Wallet className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-lg font-black text-slate-900">No payout requests waiting</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">Seller payout requests will appear here as soon as they are submitted.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-blue-600" size={18} />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Settlement timeline</h3>
            </div>
            <div className="mt-5 space-y-3">
              {[
                'Weekly seller payout review every Monday',
                'Approved requests move to finance release queue',
                'Paid requests sync back to seller wallet history',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={18} />
                <h3 className="text-xl font-black tracking-tight text-slate-900">Processed payouts</h3>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                <Download size={16} />
                Download
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {payouts.slice(0, 6).map((payout) => (
                <div key={payout.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{payout.sellerName || 'Unknown Seller'}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {formatDateSafe(payout.weekStart)} - {formatDateSafe(payout.weekEnd)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${requestStatusClass(payout.status)}`}>
                      {payout.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Gross</p>
                      <p className="mt-1 font-black text-slate-900">{formatAED(payout.grossAmount || 0)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Commission</p>
                      <p className="mt-1 font-black text-slate-900">{formatAED(payout.commission || 0)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Net</p>
                      <p className="mt-1 font-black text-slate-900">{formatAED(payout.netAmount || 0)}</p>
                    </div>
                  </div>
                  {payout.status === 'pending' && (
                    <button
                      disabled={processingId === payout.id}
                      onClick={() => handleProcessPayout(payout.id)}
                      className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
                    >
                      Process payout
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
