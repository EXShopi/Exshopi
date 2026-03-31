import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Loader2,
  Eye
} from 'lucide-react';
import { sellerAPI, userAPI } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface Vendor {
  uid: string;
  storeName: string;
  businessEmail: string;
  phone: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: any;
  logoUrl?: string;
  sellerType: 'individual' | 'company';
  fullName?: string;
  dob?: string;
  nationality?: string;
  emiratesIdUrl?: string;
  passportUrl?: string;
  companyName?: string;
  tradeLicenseNumber?: string;
  businessAddress?: string;
  tradeLicenseUrl?: string;
  moaUrl?: string;
  ownerName?: string;
  bankName: string;
  accountHolderName: string;
  ibanNumber: string;
  approvalStatus?: string;
  kycStatus?: 'verified' | 'pending' | 'missing';
  tradeLicenseStatus?: 'verified' | 'pending' | 'missing';
  payoutBankStatus?: 'verified' | 'pending' | 'missing';
  storeQualityScore?: number;
  orderSuccessRate?: number;
  returnRate?: number;
  responseSla?: string;
  lastLoginAt?: string;
  liveProductCount?: number;
  riskScore?: number;
  vendorRiskLevel?: 'low' | 'medium' | 'high';
  internalNotes?: string;
  statusHistory?: Array<{
    status: string;
    reason?: string;
    updatedAt?: string;
    updatedBy?: string;
  }>;
}

export function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const formatDateSafe = (value: unknown, fallback = 'N/A') => {
    if (!value) return fallback;
    const raw = typeof value === 'object' && value !== null && 'toDate' in (value as any)
      ? (value as any).toDate?.()
      : value;
    const date = new Date(raw as string | number | Date);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString('en-AE');
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await sellerAPI.getAll();
        // normalize to expected shape
        const vendorsList = (data || []).map((v: any) => ({ ...v, uid: v.id }));
        vendorsList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVendors(vendorsList);
      } catch (err) {
        console.error('Error fetching vendors:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      // read statusHistory from selectedVendor if present
      setStatusHistory(selectedVendor.statusHistory || []);
    } else {
      setStatusHistory([]);
    }
  }, [selectedVendor]);

  const handleStatusUpdate = async (vendorId: string, newStatus: string, reason?: string) => {
    try {
      const updatePayload: any = { status: newStatus };
      if (reason) updatePayload.rejectionReason = reason;
      const updated = await sellerAPI.update(vendorId, updatePayload);
      // update local list
      setVendors(prev => prev.map(v => v.uid === vendorId ? { ...v, ...updated, uid: updated.id } : v));

      // update status history and selected vendor
      if (selectedVendor && selectedVendor.uid === vendorId) {
        setSelectedVendor(prev => prev ? { ...prev, ...updated, statusHistory: updated.statusHistory || prev.statusHistory } : prev);
      }

      // Also update the user role if approved
      if (newStatus === 'approved' && updated.userId) {
        try { await userAPI.update(updated.userId, { role: 'seller' }); } catch (e) { /* ignore */ }
      }

      setIsRejecting(false);
      setRejectionReason('');
    } catch (error) {
      console.error("Error updating vendor status:", error);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         vendor.businessEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || vendor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vendor Management</h2>
          <p className="text-slate-500 font-medium">Approve, reject, or manage seller accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search vendors..." 
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
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
            <Users size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">No vendors found</h3>
          <p className="text-slate-500 font-medium mt-2">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Store Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Info</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Health</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.uid} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black overflow-hidden border border-slate-200">
                          {vendor.logoUrl ? (
                            <img src={vendor.logoUrl} alt={vendor.storeName} className="w-full h-full object-cover" />
                          ) : (
                            vendor.storeName[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tight">{vendor.storeName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {vendor.uid.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {vendor.businessEmail}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {vendor.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400" />
                          {vendor.city || 'UAE'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['KYC', vendor.kycStatus || 'pending'],
                            ['License', vendor.tradeLicenseStatus || 'pending'],
                            ['Bank', vendor.payoutBankStatus || 'pending'],
                          ].map(([label, value]) => (
                            <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                              {label}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="rounded-2xl border border-slate-200 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quality Score</p>
                          <p className="mt-2 text-lg font-black text-slate-900">{Math.round(vendor.storeQualityScore || 0)}/100</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">{Math.round(vendor.orderSuccessRate || 0)}% success</div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">{Math.round(vendor.returnRate || 0)}% returns</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-3">
                        <span className={`
                          px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2
                          ${vendor.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                            vendor.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                            vendor.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-slate-100 text-slate-600'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            vendor.status === 'approved' ? 'bg-emerald-500' : 
                            vendor.status === 'pending' ? 'bg-amber-500' : 
                            vendor.status === 'rejected' ? 'bg-rose-500' :
                            'bg-slate-500'
                          }`} />
                          {vendor.status}
                        </span>
                        <div className="space-y-1 text-xs font-medium text-slate-500">
                          <p>Live products: <span className="font-black text-slate-700">{vendor.liveProductCount || 0}</span></p>
                          <p>Last login: <span className="font-black text-slate-700">{formatDateSafe(vendor.lastLoginAt, 'No login')}</span></p>
                          <p>Risk: <span className={`font-black ${vendor.vendorRiskLevel === 'high' ? 'text-rose-600' : vendor.vendorRiskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{vendor.vendorRiskLevel || 'low'} ({Math.round(vendor.riskScore || 0)})</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {vendor.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(vendor.uid, 'approved')}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                              title="Approve"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(vendor.uid, 'rejected')}
                              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(vendor.uid, 'suspended')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                            title="Suspend"
                          >
                            <AlertCircle size={18} />
                          </button>
                        )}
                        {(vendor.status === 'suspended' || vendor.status === 'rejected') && (
                          <button 
                            onClick={() => handleStatusUpdate(vendor.uid, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            title="Restore"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsReviewing(true);
                          }}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                          title="Review KYC"
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

      {/* KYC Review Modal */}
      {isReviewing && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black overflow-hidden border border-slate-200 shadow-sm">
                  {selectedVendor.logoUrl ? (
                    <img src={selectedVendor.logoUrl} alt={selectedVendor.storeName} className="w-full h-full object-cover" />
                  ) : (
                    selectedVendor.storeName[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedVendor.storeName}</h3>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                      selectedVendor.sellerType === 'individual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {selectedVendor.sellerType} Seller
                    </span>
                    • ID: {selectedVendor.uid}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsReviewing(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Basic & Contact Info */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Contact & Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor.fullName || selectedVendor.ownerName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor.businessEmail}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor.phone}</p>
                  </div>
                </div>
              </section>

              {/* Business/KYC Details */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">KYC & Business Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedVendor.sellerType === 'individual' ? (
                    <>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVendor.dob}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nationality</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVendor.nationality}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company Name</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVendor.companyName}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Trade License Number</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVendor.tradeLicenseNumber}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Business Address</p>
                        <p className="text-sm font-bold text-slate-900">{selectedVendor.businessAddress}</p>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Bank Details */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Bank Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bank Name</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor.bankName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Account Holder</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor.accountHolderName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">IBAN Number</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{selectedVendor.ibanNumber}</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Operations Snapshot</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    ['Store Quality', `${Math.round(selectedVendor.storeQualityScore || 0)}/100`],
                    ['Order Success Rate', `${Math.round(selectedVendor.orderSuccessRate || 0)}%`],
                    ['Return Rate', `${Math.round(selectedVendor.returnRate || 0)}%`],
                    ['Response SLA', selectedVendor.responseSla || 'Within 24h'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                      <p className="text-sm font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal Admin Notes</p>
                  <p className="text-sm font-medium text-slate-600">{selectedVendor.internalNotes || 'No internal notes recorded for this vendor yet.'}</p>
                </div>
              </section>

              {/* Status History */}
              {statusHistory.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Status History & Audit Log</h4>
                  <div className="space-y-3">
                    {statusHistory.map((log, idx) => (
                      <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                            log.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {log.status === 'approved' ? <CheckCircle2 size={14} /> :
                             log.status === 'rejected' ? <XCircle size={14} /> :
                             <AlertCircle size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 capitalize">{log.status}</p>
                            {log.reason && <p className="text-xs text-slate-500 mt-1 italic">"{log.reason}"</p>}
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {formatDateSafe(log.updatedAt)} • By {log.updatedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Documents */}
              <section>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Verification Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {selectedVendor.sellerType === 'individual' ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emirates ID</p>
                        <a 
                          href={selectedVendor.emiratesIdUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-500 transition-colors relative group"
                        >
                          <img src={selectedVendor.emiratesIdUrl} alt="Emirates ID" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passport Copy</p>
                        <a 
                          href={selectedVendor.passportUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-500 transition-colors relative group"
                        >
                          <img src={selectedVendor.passportUrl} alt="Passport Copy" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trade License</p>
                        <a 
                          href={selectedVendor.tradeLicenseUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-500 transition-colors relative group"
                        >
                          <img src={selectedVendor.tradeLicenseUrl} alt="Trade License" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MOA Document</p>
                        <a 
                          href={selectedVendor.moaUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-500 transition-colors relative group"
                        >
                          <img src={selectedVendor.moaUrl} alt="MOA" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-6">
              {isRejecting && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rejection Reason</h4>
                    <button 
                      onClick={() => setIsRejecting(false)}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the application is being rejected (this will be shared with the vendor)..."
                    className="w-full h-32 p-6 bg-white border border-rose-100 rounded-[32px] text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all outline-none resize-none shadow-inner"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                        if (rejectionReason.trim()) {
                          handleStatusUpdate(selectedVendor.uid, 'rejected', rejectionReason);
                          setIsReviewing(false);
                        }
                      }}
                      disabled={!rejectionReason.trim()}
                      className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {!isRejecting && (
                <div className="flex items-center justify-end gap-4">
                  {selectedVendor.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => setIsRejecting(true)}
                        className="px-8 py-3 bg-white border border-rose-200 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 transition-all flex items-center gap-2"
                      >
                        <XCircle size={18} /> Reject Application
                      </button>
                      <button 
                        onClick={() => {
                          handleStatusUpdate(selectedVendor.uid, 'approved');
                          setIsReviewing(false);
                        }}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle2 size={18} /> Approve Seller
                      </button>
                    </>
                  )}
                  {selectedVendor.status === 'approved' && (
                    <button 
                      onClick={() => {
                        handleStatusUpdate(selectedVendor.uid, 'suspended');
                        setIsReviewing(false);
                      }}
                      className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20"
                    >
                      <AlertCircle size={18} /> Suspend Seller
                    </button>
                  )}
                  {(selectedVendor.status === 'suspended' || selectedVendor.status === 'rejected') && (
                    <button 
                      onClick={() => {
                        handleStatusUpdate(selectedVendor.uid, 'approved');
                        setIsReviewing(false);
                      }}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={18} /> Restore Seller
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
