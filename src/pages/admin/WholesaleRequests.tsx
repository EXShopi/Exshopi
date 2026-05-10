import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, ExternalLink, MessageCircle, PackageSearch, Phone, Search } from 'lucide-react';
import { wholesaleAPI, type WholesaleRequestStatus } from '../../services/api';

const statusOptions: WholesaleRequestStatus[] = ['new', 'contacted', 'quoted', 'confirmed', 'cancelled'];

const statusTone: Record<WholesaleRequestStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-violet-50 text-violet-700 border-violet-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const whatsappNumber = '971522608063';

export default function WholesaleRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WholesaleRequestStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await wholesaleAPI.getAdminAll();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      setSelected((current) => current || list[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests().catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests
      .filter((request) => (statusFilter === 'all' ? true : request.status === statusFilter))
      .filter((request) =>
        !q
          ? true
          : [
              request.fullName,
              request.phone,
              request.email,
              request.country,
              request.city,
              request.productName,
              request.modelsRequired,
              request.notes,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query, requests, statusFilter]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((item) => item.status === 'new').length,
      quoted: requests.filter((item) => item.status === 'quoted').length,
      confirmed: requests.filter((item) => item.status === 'confirmed').length,
    }),
    [requests]
  );

  const updateStatus = async (id: string, status: WholesaleRequestStatus) => {
    setSaving(true);
    try {
      const updated = await wholesaleAPI.updateStatus(id, status);
      setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
      setSelected((current) => (current?.id === id ? updated : current));
      setBanner('Wholesale request status updated.');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await wholesaleAPI.updateNotes(selected.id, selected.adminNotes || '');
      setRequests((current) => current.map((item) => (item.id === selected.id ? updated : item)));
      setSelected(updated);
      setBanner('Internal notes saved.');
    } finally {
      setSaving(false);
    }
  };

  const convertToOrder = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await wholesaleAPI.convertToOrder(selected.id);
      const updated = result?.request || selected;
      setRequests((current) => current.map((item) => (item.id === selected.id ? updated : item)));
      setSelected(updated);
      setBanner('Wholesale request prepared for order conversion.');
    } finally {
      setSaving(false);
    }
  };

  const copyDetails = async (request: any) => {
    const text = buildDetailsText(request);
    await navigator.clipboard.writeText(text);
    setBanner('Customer details copied.');
  };

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">Loading wholesale requests...</div>;
  }

  return (
    <div className="space-y-6">
      {banner && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{banner}</div>}

      <section className="rounded-[2.2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-blue-200/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
              <PackageSearch className="h-4 w-4" />
              Wholesale Orders / Bulk Requests
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Wholesale request control center</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-blue-100/90">
              Manage high-intent bulk buyers separately from normal checkout orders, with WhatsApp contact, quote status, and internal notes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            {[
              ['Total', stats.total],
              ['New', stats.new],
              ['Quoted', stats.quoted],
              ['Confirmed', stats.confirmed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, phone, email, product, models, or notes" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500">
                <option value="all">All Statuses</option>
                {statusOptions.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
              </select>
            </div>
          </div>

          <div className="max-h-[720px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-lg font-black text-slate-900">No wholesale requests found</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">New bulk order requests will appear here.</p>
              </div>
            ) : (
              filtered.map((request) => (
                <button key={request.id} onClick={() => setSelected(request)} className={`block w-full border-b border-slate-200 p-5 text-left transition hover:bg-slate-50 ${selected?.id === request.id ? 'bg-blue-50/60' : 'bg-white'}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900">{request.fullName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{request.productName} - Qty {request.quantity}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{request.modelsRequired}</p>
                    </div>
                    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone[request.status as WholesaleRequestStatus] || statusTone.new}`}>
                      {labelStatus(request.status)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <span>{request.phone}</span>
                    <span>{request.country} / {request.city}</span>
                    <span>{new Date(request.createdAt).toLocaleString('en-AE')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Wholesale Request</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{selected.productName}</h2>
                </div>
                <span className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone[selected.status as WholesaleRequestStatus] || statusTone.new}`}>
                  {labelStatus(selected.status)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Customer" value={selected.fullName} />
                <Info label="Phone" value={selected.phone} />
                <Info label="Email" value={selected.email} />
                <Info label="Country" value={`${selected.country} / ${selected.city}`} />
                <Info label="Quantity" value={String(selected.quantity)} />
                <Info label="Expected Price" value={selected.expectedPrice || 'Not specified'} />
                <Info label="Condition" value={labelStatus(selected.conditionRequired)} />
                <Info label="Date" value={new Date(selected.createdAt).toLocaleString('en-AE')} />
              </div>

              <Info label="Models Required" value={selected.modelsRequired} large />
              <Info label="Delivery" value={`${selected.deliveryCountry} - ${selected.deliveryAddress}`} large />
              <Info label="Notes" value={selected.notes || 'No extra notes'} large />

              <div className="grid gap-3 sm:grid-cols-2">
                <select disabled={saving} value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value as WholesaleRequestStatus)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500">
                  {statusOptions.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
                </select>
                <a href={`https://wa.me/${selected.phone.replace(/\D/g, '') || whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage(selected))}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Customer
                </a>
              </div>

              <textarea value={selected.adminNotes || ''} onChange={(event) => setSelected({ ...selected, adminNotes: event.target.value })} rows={5} placeholder="Internal notes for sourcing, quote, supplier, or conversion..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white" />

              <div className="grid gap-3 sm:grid-cols-3">
                <button disabled={saving} onClick={saveNotes} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" />
                  Save Notes
                </button>
                <button onClick={() => copyDetails(selected)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                  <Clipboard className="h-4 w-4" />
                  Copy Details
                </button>
                <button disabled={saving} onClick={convertToOrder} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                  <ExternalLink className="h-4 w-4" />
                  Convert
                </button>
              </div>

              <a href={`tel:${selected.phone}`} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">
                <Phone className="h-4 w-4" />
                Call Customer
              </a>
            </div>
          ) : (
            <div className="py-14 text-center text-sm font-bold text-slate-500">Select a wholesale request to review details.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${large ? 'sm:col-span-2' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function labelStatus(value: string) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildDetailsText(request: any) {
  return [
    `Name: ${request.fullName}`,
    `Phone: ${request.phone}`,
    `Email: ${request.email}`,
    `Country: ${request.country} / ${request.city}`,
    `Product: ${request.productName}`,
    `Models: ${request.modelsRequired}`,
    `Quantity: ${request.quantity}`,
    `Expected Price: ${request.expectedPrice || 'Not specified'}`,
    `Condition: ${request.conditionRequired}`,
    `Delivery: ${request.deliveryCountry} - ${request.deliveryAddress}`,
    `Notes: ${request.notes || 'None'}`,
  ].join('\n');
}

function buildWhatsappMessage(request: any) {
  return `Hello ${request.fullName}, this is ExShopi regarding your wholesale request for ${request.productName} (${request.modelsRequired}).`;
}
