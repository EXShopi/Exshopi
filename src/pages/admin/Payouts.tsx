import React, { useState, useEffect } from 'react';
import {
  Wallet, 
  Search, 
  CheckCircle2, 
  Loader2,
  Eye,
  DollarSign,
  Store,
  X
} from 'lucide-react';
import { payoutRequestAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

interface PayoutRequest {
  id: string;
  sellerId?: string;
  sellerName?: string;
  sellerStoreSlug?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: any;
  bankDetails: any;
}

export function AdminPayouts() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await payoutRequestAPI.getAllAdmin();
        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching payout requests:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const updated = await payoutRequestAPI.update(requestId, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    } catch (error) {
      console.error("Error updating payout status:", error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const haystack = `${request.sellerName || ''} ${request.sellerId || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payout Management</h2>
          <p className="text-slate-500 font-medium">Review and process vendor withdrawal requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by seller..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none w-64"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Payouts...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
            <Wallet size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">No payout requests</h3>
          <p className="text-slate-500 font-medium mt-2">Vendor requests will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Request ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-black text-slate-900 tracking-tight">#PAY-{request.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Store size={14} className="text-slate-400" />
                        {request.sellerName || request.sellerId?.slice(0, 8) || 'Seller'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-emerald-600">{formatAED(request.amount)}</span>
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`
                        px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2
                        ${request.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 
                          request.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                          request.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-violet-100 text-violet-600'}
                      `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          request.status === 'paid' ? 'bg-emerald-500' : 
                          request.status === 'pending' ? 'bg-amber-500' : 
                          'bg-rose-500'
                        }`} />
                        {request.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {request.status === 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        {request.status === 'approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(request.id, 'paid')}
                            className="p-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-600 hover:text-white transition-all"
                            title="Mark as Paid"
                          >
                            <DollarSign size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Payout Request</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  #PAY-{selectedRequest.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Vendor</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {selectedRequest.sellerName || selectedRequest.sellerId || 'Seller'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Store slug: {selectedRequest.sellerStoreSlug || 'Not available'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Payout Amount</p>
                  <p className="mt-2 text-lg font-black text-emerald-600">
                    {formatAED(selectedRequest.amount)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Requested on{' '}
                    {selectedRequest.createdAt
                      ? new Date(selectedRequest.createdAt).toLocaleString('en-AE')
                      : 'Recent'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-base font-black text-slate-900">{selectedRequest.status}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Bank Details</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {selectedRequest.bankDetails
                      ? JSON.stringify(selectedRequest.bankDetails, null, 2)
                      : 'No bank details were attached to this payout request.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                {selectedRequest.status === 'pending' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleStatusUpdate(selectedRequest.id, 'approved');
                      setSelectedRequest((current) =>
                        current ? { ...current, status: 'approved' } : current
                      );
                    }}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    Approve Request
                  </button>
                )}
                {selectedRequest.status === 'approved' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleStatusUpdate(selectedRequest.id, 'paid');
                      setSelectedRequest((current) =>
                        current ? { ...current, status: 'paid' } : current
                      );
                    }}
                    className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
