import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Store,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import AuthService from '../../lib/authService';
import { sellerApplicationAPI } from '../../services/api';
import { UAE_EMIRATES } from '../../lib/marketplaceTemplates';
import { uploadDocumentFile, uploadImageFile } from '../../lib/uploadClient';

type SellerType = 'individual' | 'company' | 'distributor';

type SellerRegisterForm = {
  fullName: string;
  storeName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  businessType: SellerType;
  emirate: string;
  city: string;
  warehouseAddress: string;
  tradeLicense: string;
  vatTrn: string;
  about: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  logo: string;
  banner: string;
  documents: string[];
  returnPolicy: string;
  warrantyPolicy: string;
  supportInfo: string;
  agreeTerms: boolean;
};

const initialFormData: SellerRegisterForm = {
  fullName: '',
  storeName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  businessType: 'individual',
  emirate: '',
  city: '',
  warehouseAddress: '',
  tradeLicense: '',
  vatTrn: '',
  about: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  iban: '',
  logo: '',
  banner: '',
  documents: [],
  returnPolicy: '7-day return policy. Product must remain in original condition for approval.',
  warrantyPolicy: 'Warranty details will be listed per product and store policy.',
  supportInfo: 'Support available Monday to Saturday, 9 AM - 7 PM GST.',
  agreeTerms: false,
};

export function SellerRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragState, setDragState] = useState<'logo' | 'banner' | 'documents' | null>(null);
  const navigate = useNavigate();
  const { setUser, setRole, setSellerApplication } = useAuthStore();

  const [formData, setFormData] = useState<SellerRegisterForm>(initialFormData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmirateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      emirate: value,
      city: prev.city || value,
    }));
  };

  const setFileData = async (target: 'logo' | 'banner' | 'documents', files: FileList | File[]) => {
    const items = Array.from(files);
    const uploaded =
      target === 'documents'
        ? await Promise.all(
            items.map((file) =>
              uploadDocumentFile(file, {
                folder: 'seller-documents',
                fileName: `${formData.storeName || formData.fullName || 'seller'}-${file.name}`,
              })
            )
          )
        : await Promise.all(
            items.slice(0, 1).map((file) =>
              uploadImageFile(file, {
                folder: `seller-onboarding/${target}`,
                fileName: `${formData.storeName || formData.fullName || 'seller'}-${target}`,
              })
            )
          );
    setFormData((prev) => {
      if (target === 'documents') {
        return { ...prev, documents: [...prev.documents, ...uploaded].slice(0, 5) };
      }
      return { ...prev, [target]: uploaded[0] || '' };
    });
  };

  const handleFileChange =
    (target: 'logo' | 'banner' | 'documents') =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      try {
        await setFileData(target, e.target.files);
      } catch (err) {
        setError(String(err));
      }
    };

  const handleDrop =
    (target: 'logo' | 'banner' | 'documents') =>
    async (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragState(null);
      if (!e.dataTransfer.files?.length) return;
      try {
        await setFileData(target, e.dataTransfer.files);
      } catch (err) {
        setError(String(err));
      }
    };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Owner name is required.';
    if (!formData.storeName.trim()) return 'Store name is required.';
    if (!formData.about.trim()) return 'Tell us about your store before continuing.';
    return '';
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email address.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!formData.password) return 'Password is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    if (!formData.emirate) return 'Please select an emirate.';
    if (!formData.city.trim()) return 'City is required.';
    if (!formData.warehouseAddress.trim()) return 'Warehouse or pickup address is required.';
    return '';
  };

  const validateStep3 = () => {
    if (!formData.bankName.trim()) return 'Bank name is required.';
    if (!formData.accountHolder.trim()) return 'Account holder is required.';
    if (!formData.iban.trim()) return 'IBAN is required.';
    if (!formData.logo) return 'Store logo upload is required.';
    if (formData.documents.length === 0) return 'Please upload at least one business document.';
    if (!formData.agreeTerms) return 'You must agree to the seller terms and agreement.';
    return '';
  };

  const handleNext = () => {
    setError('');
    const stepError = step === 1 ? validateStep1() : validateStep2();
    if (stepError) {
      setError(stepError);
      return;
    }
    setStep((current) => current + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((current) => current - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const stepError = validateStep3();
    if (stepError) {
      setError(stepError);
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.signUp(formData.email, formData.password, formData.fullName);

      setUser({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        status: result.user.status,
        sellerApplicationStatus: result.user.sellerApplicationStatus,
      } as any);
      setRole('seller');

      const application = await sellerApplicationAPI.submit({
        businessName: formData.storeName,
        ownerName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        businessType: formData.businessType,
        country: 'UAE',
        city: formData.city,
        warehouseAddress: formData.warehouseAddress,
        vatTrn: formData.vatTrn,
        about: formData.about,
        logo: formData.logo,
        banner: formData.banner,
        documents: [
          ...formData.documents,
          ...(formData.tradeLicense ? [`TRADE_LICENSE:${formData.tradeLicense}`] : []),
        ],
        policies: {
          returnPolicy: formData.returnPolicy,
          warrantyPolicy: formData.warrantyPolicy,
          supportInfo: formData.supportInfo,
        },
        bankDetails: {
          bankName: formData.bankName,
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          iban: formData.iban,
        },
      });

      setSellerApplication(application);
      setSuccess('Seller application submitted successfully. Redirecting to approval status...');

      setTimeout(() => {
        navigate('/seller/pending-approval');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadCard = (
    label: string,
    target: 'logo' | 'banner' | 'documents',
    multiple = false
  ) => {
    const hasValue =
      target === 'documents' ? formData.documents.length > 0 : Boolean(formData[target]);

    return (
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragState(target);
        }}
        onDragLeave={() => setDragState(null)}
        onDrop={handleDrop(target)}
        className={`block cursor-pointer rounded-2xl border-2 border-dashed px-5 py-6 transition ${
          dragState === target
            ? 'border-violet-400 bg-violet-50'
            : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/60'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-white p-3 text-slate-600 shadow-sm">
            <Upload className="h-6 w-6" />
          </div>
          <p className="font-bold text-slate-900">{label}</p>
          <p className="mt-2 text-sm text-slate-500">
            {multiple ? 'Upload from your PC or drag files here.' : 'Upload from your PC or drop an image here.'}
          </p>
          {hasValue && (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              {target === 'documents' ? `${formData.documents.length} file(s) attached` : 'Uploaded'}
            </p>
          )}
        </div>
        <input type="file" accept="image/*,.pdf" multiple={multiple} className="hidden" onChange={handleFileChange(target)} />
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/70 lg:p-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-slate-900 text-white shadow-xl">
            <Store size={30} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Seller approval required
            </div>
            <h1 className="text-3xl font-black text-slate-900">Become an ExShopi Marketplace Seller</h1>
            <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-slate-500">
              Complete your UAE-first seller onboarding with store branding, operations details, and payout setup.
              ExShopi reviews every application before the store goes live.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-10 rounded-full transition-all ${s <= step ? 'bg-violet-600' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Store & Owner Information</h2>
                <p className="mt-1 text-sm text-slate-500">Set the identity customers and admins will review first.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Owner / account holder name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Store Name
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="ExShopi seller storefront name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Business Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="individual">Individual Vendor</option>
                    <option value="company">Registered Company</option>
                    <option value="distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Trade License / Registration
                  </label>
                  <input
                    type="text"
                    name="tradeLicense"
                    value={formData.tradeLicense}
                    onChange={handleChange}
                    placeholder="Optional for individual, required in review for companies"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  About Your Store
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe your business, product focus, and why ExShopi should approve your storefront."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Account, Contact & Location</h2>
                <p className="mt-1 text-sm text-slate-500">Set your login, customer contact, and warehouse location.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+971 5X XXX XXXX"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Emirate
                  </label>
                  <select
                    name="emirate"
                    value={formData.emirate}
                    onChange={(e) => handleEmirateChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="">Select emirate</option>
                    {UAE_EMIRATES.map((emirate) => (
                      <option key={emirate} value={emirate}>
                        {emirate}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Dubai"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Warehouse / Pickup Address
                  </label>
                  <textarea
                    name="warehouseAddress"
                    value={formData.warehouseAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Full warehouse, pickup, or dispatch-ready address for order collection."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    VAT / TRN
                  </label>
                  <input
                    type="text"
                    name="vatTrn"
                    value={formData.vatTrn}
                    onChange={handleChange}
                    placeholder="If registered"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Compliance, Payouts & Branding</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload your store identity, documents, and payout information for admin review.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.accountHolder}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {renderUploadCard('Store Logo', 'logo')}
                {renderUploadCard('Store Banner', 'banner')}
              </div>

              {renderUploadCard('Trade / ID Documents', 'documents', true)}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Return Policy
                  </label>
                  <textarea
                    name="returnPolicy"
                    value={formData.returnPolicy}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Warranty / Support Policy
                  </label>
                  <textarea
                    name="warrantyPolicy"
                    value={formData.warrantyPolicy}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Customer Support Info
                </label>
                <textarea
                  name="supportInfo"
                  value={formData.supportInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 rounded accent-violet-600"
                  />
                  <span className="text-sm font-medium leading-7 text-slate-700">
                    I agree to ExShopi’s Seller Agreement, approval workflow, monthly seller subscription of 99 AED,
                    6% marketplace commission, and policy compliance requirements.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-slate-900 py-4 text-lg font-black text-white shadow-lg shadow-violet-600/25 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Complete Seller Registration
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          )}

          {step < 3 && (
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-3 font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-2xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-700"
              >
                Continue
              </button>
            </div>
          )}
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-sm font-medium text-slate-600">
            Already have a seller account?{' '}
            <Link to="/seller/login" className="font-bold text-violet-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
