import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Mail, Phone, ChevronDown, ChevronUp, LifeBuoy, Package, Wallet, AlertTriangle } from 'lucide-react';
import { orderAPI, payoutRequestAPI, sellerAPI, supportAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';

const FAQS = [
  { question: 'How do I get paid?', answer: 'Payments are processed every Monday for orders delivered in the previous week.' },
  { question: 'What are the commission rates?', answer: 'Standard commission is 6% on all orders. Rates may vary by category.' },
  { question: 'How do I handle returns?', answer: 'Customers can request returns within 14 days. You will be notified automatically.' },
];

export default function Support() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const seller = await sellerAPI.getByUserId(user.id || (user as any).uid || '');
        if (!seller?.id) return;
        const [orders, payoutRequests, supportTickets] = await Promise.all([
          orderAPI.getSellerOrders(seller.id),
          payoutRequestAPI.getSellerRequests(seller.id),
          supportAPI.getMyTickets(),
        ]);

        const orderTickets = (orders || [])
          .filter((order: any) => order.status === 'return_requested' || order.refundStatus === 'requested' || order.status === 'cancelled')
          .map((order: any) => ({
            id: `ORD-${order.id}`,
            subject: `Order support for ${order.productTitle || order.products?.[0]?.title || 'Marketplace item'}`,
            status: order.refundStatus === 'approved' ? 'resolved' : 'open',
            date: order.updatedAt || order.createdAt,
            priority: order.status === 'return_requested' ? 'high' : 'medium',
            type: 'order',
            reference: order.id,
          }));

        const payoutTickets = (payoutRequests || []).map((request: any) => ({
          id: `PAY-${request.id}`,
          subject: `Payout request ${request.status}`,
          status: request.status === 'rejected' ? 'open' : request.status === 'paid' ? 'resolved' : 'in_review',
          date: request.updatedAt || request.createdAt,
          priority: request.status === 'pending' ? 'medium' : 'low',
          type: 'payout',
          reference: request.id,
        }));

        const manualTickets = (supportTickets || []).map((ticket: any) => ({
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          date: ticket.updatedAt || ticket.createdAt,
          priority: ticket.priority || 'medium',
          type: ticket.payoutRequestId ? 'payout' : ticket.orderId ? 'order' : 'general',
          reference: ticket.orderId || ticket.payoutRequestId || ticket.id,
        }));

        const merged = [...manualTickets, ...orderTickets, ...payoutTickets].sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        setTickets(merged);
        setSelectedTicket(merged[0]?.id || '');
      } catch (error) {
        console.error('Failed to load seller support data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const supportSummary = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === 'open').length,
      inReview: tickets.filter((ticket) => ticket.status === 'in_review').length,
      resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    }),
    [tickets]
  );

  const handleCreateTicket = async () => {
    try {
      setCreatingTicket(true);
      const created = await supportAPI.createTicket({
        subject: 'General seller support request',
        description: 'Seller requested support from the seller panel help center.',
        priority: 'medium',
      });
      setTickets((current) => [
        {
          id: created.id,
          subject: created.subject,
          status: created.status,
          date: created.updatedAt || created.createdAt,
          priority: created.priority || 'medium',
          type: 'general',
          reference: created.id,
        },
        ...current,
      ]);
      setSelectedTicket(created.id);
    } catch (error) {
      console.error('Failed to create support ticket:', error);
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support & Help</h1>
          <p className="text-slate-600">Get help with your seller account and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <LifeBuoy className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Open Tickets</h3>
            <p className="text-2xl font-black text-slate-900">{supportSummary.open}</p>
            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={creatingTicket}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
            >
              {creatingTicket ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
          <a href="mailto:support@exshopi.com" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition">
            <Mail className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
            <p className="text-sm text-slate-600">exshopi@exshopi.com</p>
          </a>
          <a href="tel:+971522608063" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition">
            <Phone className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Phone Support</h3>
            <p className="text-sm text-slate-600">+971 52 260 8063</p>
          </a>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <MessageCircle className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">Live Chat</h3>
            <p className="text-sm text-slate-600">Priority support for payout and order issues</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Support Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Support Tickets</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-500">Loading support workspace...</div>
              ) : tickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Package className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 font-bold text-slate-900">No active tickets yet</p>
                  <p className="mt-2 text-sm text-slate-500">Order issues, return requests, and payout reviews will appear here automatically.</p>
                </div>
              ) : tickets.map(ticket => (
                <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)} className={`w-full text-left p-4 rounded-lg transition ${selectedTicket === ticket.id ? 'bg-blue-50 border-2 border-blue-300' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{ticket.subject}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(ticket.date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{ticket.type} • Ref {ticket.reference}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : ticket.status === 'in_review' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                    {ticket.priority === 'high' ? <AlertTriangle className="h-3 w-3 text-rose-500" /> : <Wallet className="h-3 w-3 text-slate-400" />}
                    {ticket.priority} priority
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full text-left p-4 hover:bg-slate-50 transition flex justify-between items-center">
                    <p className="font-semibold text-slate-900">{faq.question}</p>
                    {openFaq === idx ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
