import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock3, LifeBuoy, MessageSquareMore, ShieldCheck, Ticket } from 'lucide-react';
import { adminOpsAPI, orderAPI, supportAPI } from '../../services/api';
import { formatAED } from '../../lib/currency';

const formatDateSafe = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-AE');
};

export function AdminSupport() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress'>('all');
  const [loading, setLoading] = useState(true);

  const handleTicketUpdate = async (ticketId: string, status: 'pending' | 'resolved') => {
    try {
      const updated = await supportAPI.updateTicket(ticketId, { status });
      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
    } catch (error) {
      console.error('Failed to update support ticket:', error);
    }
  };

  useEffect(() => {
    Promise.all([adminOpsAPI.getNotifications(), adminOpsAPI.getActivityLogs(), orderAPI.getAllOrders(), supportAPI.getAdminTickets()])
      .then(([notifs, logs, allOrders, supportRows]) => {
        setNotifications(Array.isArray(notifs) ? notifs : []);
        setActivityLogs(Array.isArray(logs) ? logs : []);
        setOrders(Array.isArray(allOrders) ? allOrders : []);
        setTickets(Array.isArray(supportRows) ? supportRows : []);
      })
      .catch((error) => console.error('Failed to load admin support ops data', error))
      .finally(() => setLoading(false));
  }, []);

  const supportTickets = useMemo(() => {
    const ticketRows = tickets.map((ticket: any) => ({
      id: ticket.id,
      orderId: ticket.orderId || '-',
      customerName: ticket.customerId || 'Customer',
      sellerName: ticket.sellerId || 'Seller',
      issue: ticket.subject,
      status: ticket.status === 'pending' ? 'in_progress' : ticket.status,
      createdAt: ticket.createdAt || new Date().toISOString(),
      amount: 0,
    }));

    const orderRows = orders
      .filter((order) => order.refundStatus === 'requested' || order.status === 'return_requested' || order.status === 'returned')
      .map((order: any, index: number) => ({
        id: `TKT-${order.id || index + 1}`,
        orderId: order.orderId || order.id,
        customerName: order.customerName || 'Customer',
        sellerName: order.sellerName || 'ExShopi Official',
        issue: order.refundReason || 'Return / refund request linked to order',
        status: order.refundStatus === 'requested' ? 'open' : 'in_progress',
        createdAt: order.createdAt || new Date().toISOString(),
        amount: Number(order.refundAmount || order.totalAmount || order.subtotal || 0),
      }));

    const mapped = [...ticketRows, ...orderRows];
    if (ticketFilter === 'all') return mapped;
    return mapped.filter((ticket) => ticket.status === ticketFilter);
  }, [orders, tickets, ticketFilter]);

  const criticalAlerts = notifications.filter((item) => Number(item.value || 0) > 0);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center font-bold text-slate-500">Loading support operations...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#081324] via-[#172554] to-[#8b5cf6] p-8 text-white shadow-2xl shadow-violet-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">
              <LifeBuoy size={14} />
              Support command
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Tickets, refunds & service control</h1>
            <p className="mt-3 text-sm leading-7 text-violet-100/90">
              Manage order-linked service issues, refund requests, support alerts, and operator activity in one dense backoffice workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Open support tickets', supportTickets.filter((ticket) => ticket.status === 'open').length, Ticket],
            ['Marketplace alerts', notifications.length, Bell],
            ['Audit events', activityLogs.length, ShieldCheck],
            ['Refund-linked cases', supportTickets.length, MessageSquareMore],
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

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Support ticket queue</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Return, refund, and service cases linked to live marketplace orders.</p>
            </div>
            <div className="flex gap-2">
              {[
                ['all', 'All'],
                ['open', 'Open'],
                ['in_progress', 'In Progress'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTicketFilter(value as any)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                    ticketFilter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Ticket</th>
                    <th className="px-4 py-4">Linked order</th>
                    <th className="px-4 py-4">Issue</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {supportTickets.map((ticket) => (
                    <tr key={ticket.id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{ticket.id}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{formatDateSafe(ticket.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">Order {ticket.orderId}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{ticket.customerName}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Seller: {ticket.sellerName}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-600">{ticket.issue}</td>
                      <td className="px-4 py-4 text-sm font-black text-slate-900">
                        {formatAED(ticket.amount || 0)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                          ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[150px] flex-col gap-2">
                          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white">
                            Open case
                          </button>
                          {String(ticket.id).startsWith('ticket_') && (
                            <button
                              type="button"
                              onClick={() => handleTicketUpdate(ticket.id, 'pending')}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
                            >
                              Mark in progress
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {supportTickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Ticket className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-lg font-black text-slate-900">No support tickets in this view</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">Tickets linked to returns and refunds will appear automatically.</p>
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
            <div className="mb-5 flex items-center gap-3">
              <Bell className="text-violet-600" size={18} />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Marketplace alerts</h3>
            </div>
            <div className="space-y-3">
              {(criticalAlerts.length ? criticalAlerts : notifications).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{item.value} open items</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  No urgent alerts right now.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Clock3 className="text-slate-700" size={18} />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Recent admin activity</h3>
            </div>
            <div className="space-y-3">
              {activityLogs.length > 0 ? (
                activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <p className="font-bold text-slate-900">{log.summary}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      {log.entityType} • {log.action}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">{formatDateSafe(log.createdAt)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                  Audit activity will appear here as the operations team takes action.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
