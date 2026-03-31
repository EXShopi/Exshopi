import { useEffect, useMemo, useState } from 'react';
import { adminProductAPI, adminSellerApplicationAPI } from '../../services/api';
import { AlertCircle, CheckCircle, Clock3, FileWarning, Layers3, Store, XCircle } from 'lucide-react';
import { formatAED } from '../../lib/currency';

export default function AdminProductApprovals() {
  const [products, setProducts] = useState<any[]>([]);
  const [sellerApplications, setSellerApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'sellers'>('products');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadPendingItems();
  }, []);

  async function loadPendingItems() {
    try {
      const [data, applications] = await Promise.all([adminProductAPI.getPendingProducts(), adminSellerApplicationAPI.getAll()]);
      setProducts(Array.isArray(data) ? data : []);
      setSellerApplications((applications || []).filter((item: any) => ['pending_review', 'needs_more_info'].includes(item.status)));
    } catch (error) {
      console.error('Error loading approval queue:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSellerDecision(id: string, action: 'approve' | 'reject' | 'request', note = '') {
    try {
      if (action === 'approve') {
        await adminSellerApplicationAPI.approve(id, note);
      } else if (action === 'reject') {
        await adminSellerApplicationAPI.reject(id, note || 'Application rejected');
      } else {
        await adminSellerApplicationAPI.requestInfo(id, note || 'Please provide additional information');
      }
      loadPendingItems();
    } catch (error) {
      console.error('Error updating seller application:', error);
    }
  }

  async function handleApprove(productId: string) {
    try {
      await adminProductAPI.approve(productId, approvalNotes);
      setShowModal(false);
      setApprovalNotes('');
      setActionType(null);
      loadPendingItems();
    } catch (error) {
      console.error('Error approving product:', error);
    }
  }

  async function handleReject(productId: string) {
    try {
      await adminProductAPI.reject(productId, rejectReason);
      setShowModal(false);
      setRejectReason('');
      setActionType(null);
      loadPendingItems();
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  }

  const approvalMetrics = useMemo(() => {
    return {
      productQueue: products.length,
      sellerQueue: sellerApplications.length,
      highValueProducts: products.filter((item) => Number(item.price || 0) >= 1000).length,
      reviewPressure: products.filter((item) => String(item.category || '').toLowerCase().includes('electronics')).length,
    };
  }, [products, sellerApplications]);

  if (loading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center font-bold text-slate-500">Loading approval queue...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-[#081324] via-[#123c8f] to-[#38bdf8] p-8 text-white shadow-2xl shadow-blue-200/30">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
              <Layers3 size={14} />
              Approval center
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">Seller & product moderation queue</h1>
            <p className="mt-3 text-sm leading-7 text-blue-100/90">
              Control seller onboarding and product approval with one operational queue designed for real ExShopi marketplace moderation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Pending products', approvalMetrics.productQueue, Clock3],
            ['Pending sellers', approvalMetrics.sellerQueue, Store],
            ['High value listings', approvalMetrics.highValueProducts, FileWarning],
            ['Electronics review load', approvalMetrics.reviewPressure, AlertCircle],
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Approval queue</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Switch between product moderation and seller onboarding review.</p>
          </div>
          <div className="flex gap-2">
            {[
              ['products', `Products (${products.length})`],
              ['sellers', `Sellers (${sellerApplications.length})`],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                  activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'sellers' ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sellerApplications.map((application) => (
              <div key={application.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-900">{application.businessName}</p>
                    <p className="text-sm text-slate-500">{application.ownerName} • {application.city}, {application.country}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    {application.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fee plan</p>
                    <p className="mt-1 font-black text-slate-900">AED {application.monthlyFeeAed}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Commission</p>
                    <p className="mt-1 font-black text-slate-900">{application.commissionRate}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Compliance</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      VAT/TRN: {application.vatTrn || 'Not submitted'} • Documents: {application.documents?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSellerDecision(application.id, 'approve', 'Seller approved for launch')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSellerDecision(application.id, 'request', 'Please upload clearer trade documents and confirm warehouse address.')}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Request info
                  </button>
                  <button
                    onClick={() => handleSellerDecision(application.id, 'reject', 'Application rejected due to incomplete compliance information.')}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {sellerApplications.length === 0 && (
              <div className="col-span-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-lg font-bold text-emerald-800">No seller applications are waiting right now.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex gap-4">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="h-24 w-24 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-slate-300">
                      <Layers3 size={28} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-lg font-black text-slate-900">{product.title}</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">{product.category || 'Uncategorized'}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
                        <p className="mt-1 font-black text-slate-900">{formatAED(product.price || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Seller</p>
                        <p className="mt-1 line-clamp-1 font-black text-blue-700">{product.seller?.storeName || product.soldByLabel || 'Unknown seller'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Moderation snapshot</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Brand: {product.brand || 'Not set'} • Stock: {product.stock ?? 0} • Media: {Array.isArray(product.images) ? product.images.length : product.image ? 1 : 0}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setActionType('approve');
                      setShowModal(true);
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setActionType('reject');
                      setShowModal(true);
                    }}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="col-span-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-lg font-bold text-emerald-800">No products are waiting for moderation.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-6">
              <h3 className="text-2xl font-black text-slate-900">{selectedProduct.title}</h3>
              <p className="mt-2 text-sm text-slate-500">Seller: {selectedProduct.seller?.storeName || selectedProduct.soldByLabel || 'Unknown seller'}</p>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{formatAED(selectedProduct.price || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Stock</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{selectedProduct.stock || 0}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Description</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProduct.description || 'No description provided'}</p>
              </div>

              {actionType === 'approve' ? (
                <div>
                  <label className="text-sm font-black text-slate-900">Approval notes</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(event) => setApprovalNotes(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                    placeholder="Add optional approval note for the seller"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-black text-slate-900">Rejection reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                    placeholder="Tell the seller what must be fixed before resubmission"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                  setActionType(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                Cancel
              </button>
              {actionType === 'approve' ? (
                <button onClick={() => handleApprove(selectedProduct.id)} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                  <CheckCircle className="mr-2 inline h-4 w-4" />
                  Approve listing
                </button>
              ) : (
                <button onClick={() => handleReject(selectedProduct.id)} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white">
                  <XCircle className="mr-2 inline h-4 w-4" />
                  Reject listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
