import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Globe,
  Image as ImageIcon,
  MapPin,
  Save,
  ShieldCheck,
  Store,
  Upload,
} from 'lucide-react';
import { sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { UAE_EMIRATES } from '../../lib/marketplaceTemplates';
import { uploadImageFile } from '../../lib/uploadClient';

type SellerFormData = {
  storeName: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  country: string;
  warehouseAddress: string;
  vatTrn: string;
  supportInfo: string;
  logo: string;
  banner: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  iban: string;
  returnPolicy: string;
  warrantyPolicy: string;
  shippingPolicy: string;
  instagram: string;
  facebook: string;
};

const initialFormData: SellerFormData = {
  storeName: '',
  description: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  country: 'UAE',
  warehouseAddress: '',
  vatTrn: '',
  supportInfo: '',
  logo: '',
  banner: '',
  bankName: '',
  bankAccount: '',
  accountHolder: '',
  iban: '',
  returnPolicy: '',
  warrantyPolicy: '',
  shippingPolicy: '',
  instagram: '',
  facebook: '',
};

export default function Settings() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<SellerFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const seller = await sellerAPI.getByUserId(user.id as string);
        if (seller && mounted) {
          setSellerId(seller.id);
          setFormData({
            storeName: seller.storeName || '',
            description: seller.description || '',
            email: seller.email || '',
            phone: seller.phone || '',
            website: seller.website || '',
            city: seller.city || '',
            country: seller.country || 'UAE',
            warehouseAddress: seller.warehouseAddress || '',
            vatTrn: seller.vatTrn || '',
            supportInfo: seller.supportInfo || '',
            logo: seller.logo || '',
            banner: seller.banner || '',
            bankName: seller.bankName || '',
            bankAccount: seller.bankAccount || '',
            accountHolder: seller.accountHolder || '',
            iban: seller.iban || '',
            returnPolicy: seller.policies?.returnPolicy || '',
            warrantyPolicy: seller.policies?.warrantyPolicy || '',
            shippingPolicy: seller.policies?.shippingPolicy || '',
            instagram: seller.socialLinks?.instagram || '',
            facebook: seller.socialLinks?.facebook || '',
          });
        }
      } catch (e) {
        setError('Failed to load store settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload =
    (target: 'logo' | 'banner') => async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      try {
        const file = e.target.files[0];
        const uploaded = await uploadImageFile(file, {
          folder: `seller/${target}`,
          fileName: `${formData.storeName || 'store'}-${target}`,
        });
        setFormData((prev) => ({ ...prev, [target]: uploaded || '' }));
      } catch (err) {
        setError(String(err));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sellerId) {
      setError('No seller profile found to update.');
      return;
    }

    setSaving(true);
    try {
      await sellerAPI.update(sellerId, {
        storeName: formData.storeName,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        city: formData.city,
        country: formData.country,
        warehouseAddress: formData.warehouseAddress,
        vatTrn: formData.vatTrn,
        supportInfo: formData.supportInfo,
        logo: formData.logo,
        banner: formData.banner,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        accountHolder: formData.accountHolder,
        iban: formData.iban,
        policies: {
          returnPolicy: formData.returnPolicy,
          warrantyPolicy: formData.warrantyPolicy,
          shippingPolicy: formData.shippingPolicy,
        },
        socialLinks: {
          instagram: formData.instagram,
          facebook: formData.facebook,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900">Store Settings</h2>
        <p className="mt-1 font-medium text-slate-500">
          Keep your public storefront, seller policies, and payout details aligned with ExShopi approval standards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 font-medium text-rose-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 font-medium text-emerald-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p>Store settings updated successfully.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-8">
            <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <Store className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Storefront Identity</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Store Name</label>
                  <input name="storeName" value={formData.storeName} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Business Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Website</label>
                  <input name="website" value={formData.website} onChange={handleChange} placeholder="https://yourstore.com" className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
                </div>
              </div>

              <div className="mt-6">
                <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Store Description / Bio</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-400">Store Logo</label>
                  <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-violet-300 hover:bg-violet-50/40">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-slate-500" />
                      <span className="font-medium text-slate-700">{formData.logo ? 'Replace logo' : 'Upload logo from PC'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload('logo')} />
                  </label>
                  {formData.logo && <img src={formData.logo} alt="Store logo" className="mt-4 h-24 w-24 rounded-2xl border border-slate-200 object-cover" />}
                </div>
                <div>
                  <label className="mb-3 block text-xs font-black uppercase tracking-widest text-slate-400">Store Banner</label>
                  <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-violet-300 hover:bg-violet-50/40">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5 text-slate-500" />
                      <span className="font-medium text-slate-700">{formData.banner ? 'Replace banner' : 'Upload banner from PC'}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload('banner')} />
                  </label>
                  {formData.banner && <img src={formData.banner} alt="Store banner" className="mt-4 h-24 w-full rounded-2xl border border-slate-200 object-cover" />}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Operations & Location</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Emirate / City</label>
                  <select name="city" value={formData.city} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20">
                    <option value="">Select city</option>
                    {UAE_EMIRATES.map((emirate) => (
                      <option key={emirate} value={emirate}>{emirate}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">VAT / TRN</label>
                  <input name="vatTrn" value={formData.vatTrn} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
                </div>
              </div>

              <div className="mt-6">
                <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Warehouse / Pickup Address</label>
                <textarea name="warehouseAddress" value={formData.warehouseAddress} onChange={handleChange} rows={4} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>

              <div className="mt-6">
                <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Support Info</label>
                <textarea name="supportInfo" value={formData.supportInfo} onChange={handleChange} rows={3} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Store Policies & Social Links</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Return Policy</label>
                  <textarea name="returnPolicy" value={formData.returnPolicy} onChange={handleChange} rows={4} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Warranty Policy</label>
                  <textarea name="warrantyPolicy" value={formData.warrantyPolicy} onChange={handleChange} rows={4} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Shipping Policy</label>
                  <textarea name="shippingPolicy" value={formData.shippingPolicy} onChange={handleChange} rows={4} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div>
                    <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Facebook</label>
                    <input name="facebook" value={formData.facebook} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Payout Details</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Bank Name</label>
                  <input name="bankName" value={formData.bankName} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Account Holder</label>
                  <input name="accountHolder" value={formData.accountHolder} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">Account Number</label>
                  <input name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="ml-1 block text-xs font-black uppercase tracking-widest text-slate-400">IBAN</label>
                  <input name="iban" value={formData.iban} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Globe className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Storefront Snapshot</h3>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Public Store Name</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{formData.storeName || 'Not set yet'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Seller Support</p>
                  <p className="mt-2 leading-6">{formData.supportInfo || 'Add support coverage for customers.'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Warehouse City</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{formData.city || 'Pending update'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Store Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
