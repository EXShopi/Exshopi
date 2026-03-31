import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { payoutAPI, payoutRequestAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { DollarSign, TrendingUp, Download, AlertCircle, CheckCircle, Clock, Landmark, ShieldCheck } from 'lucide-react';
import { formatAED } from '../../lib/currency';

const safeDate = (value: any, fallback = 'Awaiting settlement') => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString('en-AE');
};

export default function SellerPayouts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, [user]);

  async function loadPayouts() {
    try {
      const userId = user?.id || (user as any)?.uid || '';
      if (!userId) return;
      const resolvedSeller =
        (await sellerAPI.getMyStore().catch(() => null)) ||
        (await sellerAPI.getByUserId(userId));
      const sellerId = resolvedSeller?.id;
      if (!sellerId) return;
      setLoading(true);
      const [payoutData, requestData, sellerData] = await Promise.all([
        payoutAPI.getSellerPayouts(sellerId),
        payoutRequestAPI.getSellerRequests(sellerId),
        sellerAPI.get(sellerId),
      ]);
      setPayouts(Array.isArray(payoutData) ? payoutData : []);
      setPayoutRequests(Array.isArray(requestData) ? requestData : []);
      setSeller(sellerData || resolvedSeller || null);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  }

  const normalizedPayouts = useMemo(() => {
    return payouts.map((payout) => {
      const grossSales = Number(payout.grossSales || payout.amount || 0);
      const commission = Number(payout.commission || payout.commissionAmount || 0);
      const netAmount = Number(payout.netAmount ?? Math.max(grossSales - commission, 0));
      const weekStart = payout.weekStart || payout.createdAt;
      const weekEnd = payout.weekEnd || payout.updatedAt || payout.createdAt;
      return { ...payout, grossSales, commission, netAmount, weekStart, weekEnd };
    });
  }, [payouts]);

  const totalPayout = normalizedPayouts.reduce((sum, p) => sum + Number(p.netAmount || 0), 0);
  const pendingPayout = normalizedPayouts
    .filter((p) => p.status === 'pending' || p.status === 'processed')
    .reduce((sum, p) => sum + Number(p.netAmount || 0), 0);
  const paidPayout = normalizedPayouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.netAmount || 0), 0);
  const nextPayoutDate = normalizedPayouts.find((p) => p.status !== 'paid')?.weekEnd || payoutRequests[0]?.createdAt;
  const bankDetails = seller?.bankDetails || {
    bankName: seller?.bankName || '',
    accountHolder: seller?.accountHolder || seller?.ownerName || '',
    accountNumber: seller?.bankAccount || '',
    iban: seller?.iban || '',
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'processed':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      default:
        return null;
    }
  }

  return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Payouts</h1>
          <p className="text-slate-600">Track your weekly earnings and payments</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <PayoutCard
            icon={<DollarSign className="h-6 w-6" />}
            label="Total Earned"
            value={formatAED(totalPayout)}
            color="blue"
          />
          <PayoutCard
            icon={<Clock className="h-6 w-6" />}
            label="Pending Payout"
            value={formatAED(pendingPayout)}
            color="amber"
          />
          <PayoutCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Total Paid"
            value={formatAED(paidPayout)}
            color="emerald"
          />
        </div>

        {/* Payout Schedule Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-2">📅 Weekly Payout Schedule</h3>
          <p className="text-sm text-blue-800 mb-4">
            Your payouts are calculated every week based on delivered orders. Commission (6%) is automatically deducted from your sales.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 font-semibold">Order Period</p>
              <p className="font-bold text-slate-900">Monday - Sunday</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 font-semibold">Calculation</p>
              <p className="font-bold text-slate-900">Every Monday</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 font-semibold">Payment</p>
              <p className="font-bold text-slate-900">Within 3 Days</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 font-semibold">Next Payout Date</p>
              <p className="font-bold text-slate-900">{safeDate(nextPayoutDate)}</p>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Payout Calculation Example</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-semibold">Sales from Orders</span>
              <span className="text-lg font-bold text-slate-900">{formatAED(100000)}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="text-slate-700 font-semibold">ExShopi Commission (6%)</span>
              <span className="text-lg font-bold text-red-600">- {formatAED(6000)}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
              <span className="text-slate-700 font-bold text-lg">Your Net Payout</span>
              <span className="text-2xl font-bold text-emerald-600">{formatAED(94000)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-6">
            💡 Commission helps us maintain the platform, provide customer support, handle payment processing, and improve marketplace features.
          </p>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Week</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Orders</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Gross Sales</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Commission</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Net Payout</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {normalizedPayouts.map(payout => (
                  <tr key={payout.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {safeDate(payout.weekStart)} - {safeDate(payout.weekEnd)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">
                      {Number(payout.totalOrders || 0)}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">
                      {formatAED(payout.grossSales)}
                    </td>
                    <td className="px-6 py-4 text-red-600 font-bold">
                      {formatAED(payout.commission)}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">
                      {formatAED(payout.netAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        <span className="capitalize font-semibold text-slate-900">
                          {payout.status}
                        </span>
                      </div>
                      {payout.paidAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Paid on {safeDate(payout.paidAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition font-semibold text-sm">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {normalizedPayouts.length === 0 && !loading && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">No payouts yet</p>
              <p className="text-sm text-slate-500">Your first payout will appear once orders are delivered</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-600 font-semibold mb-1">Account Holder</p>
              <p className="font-bold text-slate-900">{bankDetails.accountHolder || 'Add payout account holder'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold mb-1">Bank Name</p>
              <p className="font-bold text-slate-900">{bankDetails.bankName || 'Add bank name'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold mb-1">Account Number</p>
              <p className="font-bold text-slate-900">{bankDetails.accountNumber ? `•••• ${String(bankDetails.accountNumber).slice(-4)}` : 'Not added yet'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold mb-1">IBAN</p>
              <p className="font-bold text-slate-900">{bankDetails.iban || 'Not verified yet'}</p>
            </div>
            <div>
              <button className="text-blue-600 hover:underline font-bold">
                Update Bank Details →
              </button>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm">
          <h3 className="text-lg font-bold mb-4">Payout Trust & Eligibility</h3>
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-bold">Settlement rule</p>
                <p className="text-sm text-slate-300">Only delivered orders enter settlement. Returns and refunds are deducted automatically.</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
              <Landmark className="h-5 w-5 text-blue-300" />
              <div>
                <p className="font-bold">Bank verification</p>
                <p className="text-sm text-slate-300">{bankDetails.iban ? 'Bank details present for payout release.' : 'Add verified bank details to receive payouts.'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Pending Requests</p>
              <p className="mt-2 text-3xl font-black">{payoutRequests.length}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function PayoutCard({ icon, label, value, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  };

  return (
    <div className={`${colorMap[color]} border rounded-xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 font-semibold">{label}</span>
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
    </div>
  );
}
