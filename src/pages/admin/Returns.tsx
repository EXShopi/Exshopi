import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';
import { TableSkeleton } from '../../components/ui/TableSkeleton';

export function AdminReturns() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI
      .getAllOrders()
      .then((data) => {
        const nextOrders = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.orders)
          ? (data as any).orders
          : [];
        setOrders(nextOrders);
      })
      .catch((error) => console.error('Failed to load returns queue', error))
      .finally(() => setLoading(false));
  }, []);

  const returnOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'return_requested' ||
          order.status === 'returned' ||
          order.refundStatus === 'requested' ||
          order.refundStatus === 'refunded'
      ),
    [orders]
  );

  const handleRefundAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const updated = await orderAPI.processRefund(orderId, { action });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
    } catch (error) {
      console.error('Failed to process return/refund action', error);
    }
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={7} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Returns & Refunds</h2>
        <p className="text-slate-500 font-medium">Review return requests, refund status, and after-sales actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Return Requests</p>
          <p className="mt-2 text-3xl font-black text-amber-600">{returnOrders.filter((order) => order.status === 'return_requested').length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Refund Requested</p>
          <p className="mt-2 text-3xl font-black text-rose-600">{returnOrders.filter((order) => order.refundStatus === 'requested').length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Refunded</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{returnOrders.filter((order) => order.refundStatus === 'refunded').length}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="pb-3">Order</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Seller</th>
              <th className="pb-3">Refund Status</th>
              <th className="pb-3">Reason</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {returnOrders.map((order) => (
              <tr key={order.id}>
                <td className="py-4">
                  <p className="font-bold text-slate-900">#{(order.orderId || order.id).slice(0, 12)}</p>
                  <p className="text-xs font-medium text-slate-500">{order.productTitle || 'Marketplace Product'}</p>
                </td>
                <td className="py-4 font-semibold text-slate-600">{order.customerName}</td>
                <td className="py-4 font-semibold text-slate-600">{order.sellerName || 'ExShopi Official'}</td>
                <td className="py-4 font-semibold text-slate-600">{order.refundStatus || 'none'}</td>
                <td className="py-4 font-semibold text-slate-600">{order.refundReason || 'No reason provided'}</td>
                <td className="py-4 font-semibold text-slate-900">{formatAED(Math.round(order.refundAmount || order.totalAmount || order.subtotal || 0))}</td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleRefundAction(order.id, 'approve')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRefundAction(order.id, 'reject')}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {returnOrders.length === 0 && (
          <div className="rounded-2xl bg-slate-50 px-6 py-10 text-center text-sm font-bold text-slate-500">
            <RotateCcw className="mx-auto mb-3 h-6 w-6 text-slate-300" />
            No return or refund requests yet.
          </div>
        )}
      </div>
    </div>
  );
}
