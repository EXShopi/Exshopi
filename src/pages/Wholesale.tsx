import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, PackageSearch, Send, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { COUNTRY_CONFIG, SUPPORTED_COUNTRY_CODES, getCountryConfig } from '../lib/countryConfig';
import { getPhonePlaceholder } from '../utils/phone';
import { wholesaleAPI } from '../services/api';

const EXSHOPI_WHOLESALE_WHATSAPP = '971522608063';

const productCategories = [
  'Laptops',
  'Mobiles',
  'Tablets',
  'Cameras',
  'Computer Accessories',
  'Mobile Accessories',
  'Gaming',
  'Mixed Electronics',
];

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  country: 'AE',
  city: 'Dubai',
  productCategory: 'Laptops',
  productName: '',
  modelsRequired: '',
  quantity: '10',
  expectedPrice: '',
  conditionRequired: 'any',
  deliveryCountry: 'AE',
  deliveryAddress: '',
  notes: '',
};

export default function Wholesale() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const country = getCountryConfig(form.country);
  const deliveryCountry = getCountryConfig(form.deliveryCountry);

  const whatsappMessage = useMemo(
    () =>
      [
        'Hello ExShopi, I want a wholesale/bulk order.',
        '',
        `Name: ${form.fullName}`,
        `Phone: ${form.phone}`,
        `Email: ${form.email}`,
        `Country: ${country.name}`,
        `Product: ${form.productName || form.productCategory}`,
        `Models: ${form.modelsRequired}`,
        `Quantity: ${form.quantity}`,
        `Expected Price: ${form.expectedPrice || 'Please quote best price'}`,
        `Condition: ${form.conditionRequired}`,
        `Delivery Country: ${deliveryCountry.name}`,
        `Delivery Address: ${form.deliveryAddress}`,
        `Notes: ${form.notes || 'None'}`,
      ].join('\n'),
    [country.name, deliveryCountry.name, form]
  );

  const whatsappUrl = `https://wa.me/${EXSHOPI_WHOLESALE_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;

  const updateField = (name: string, value: string) => {
    setError('');
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'country') {
        next.city = getCountryConfig(value).defaultCity;
      }
      return next;
    });
  };

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await wholesaleAPI.create({
        ...form,
        quantity: Number(form.quantity || 1),
        source: 'wholesale_page',
      });
      setSubmitted(true);
    } catch (requestError: any) {
      setError(requestError?.message || 'We could not submit your wholesale request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Wholesale Bulk Orders | ExShopi"
        description="Request wholesale pricing for laptops, mobiles, tablets, and premium electronics from ExShopi."
        pathname="/wholesale"
        canonicalUrl="https://exshopi.com/wholesale"
      />

      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_44%,#f8fafc_100%)] px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[2.25rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-blue-200/30 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
                  <PackageSearch className="h-4 w-4" />
                  Wholesale / Bulk Orders
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Get ExShopi bulk pricing for electronics</h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-blue-100">
                  Tell us the models, quantity, condition, and delivery country. Our team will source stock and contact you with the best available wholesale price.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  ['Manual models accepted', 'Write Dell Latitude 5490, HP EliteBook 840 G5, iPhone 14 Pro Max, or any list you need.', ShoppingBag],
                  ['Admin tracked', 'Requests go to ExShopi operations as Wholesale Requests, separate from normal checkout orders.', ShieldCheck],
                  ['WhatsApp ready', 'Send the same request directly to ExShopi WhatsApp after filling the form.', MessageCircle],
                ].map(([title, text, Icon]: any) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <Icon className="h-5 w-5 text-blue-200" />
                    <p className="mt-3 font-black text-white">{title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-blue-100/80">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="mt-6 text-3xl font-black text-slate-900">Thank you! Your wholesale request has been received.</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    Our ExShopi team will contact you soon with the best available price.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white transition hover:bg-emerald-700">
                      <MessageCircle className="h-5 w-5" />
                      Send to WhatsApp
                    </a>
                    <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-4 font-black text-slate-900 transition hover:bg-slate-50">
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitRequest} className="space-y-6">
                  {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full Name" value={form.fullName} onChange={(value) => updateField('fullName', value)} required />
                    <Field label="Email / Gmail" type="email" value={form.email} onChange={(value) => updateField('email', value)} required />
                    <Field label="Phone Number" value={form.phone} placeholder={getPhonePlaceholder(form.country)} onChange={(value) => updateField('phone', value)} required />
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-800">Country</span>
                      <select value={form.country} onChange={(event) => updateField('country', event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white">
                        {SUPPORTED_COUNTRY_CODES.map((code) => (
                          <option key={code} value={code}>{COUNTRY_CONFIG[code].name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-800">City</span>
                      <select value={form.city} onChange={(event) => updateField('city', event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white">
                        {country.cities.map((city) => <option key={city}>{city}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-800">Product Category</span>
                      <select value={form.productCategory} onChange={(event) => updateField('productCategory', event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white">
                        {productCategories.map((category) => <option key={category}>{category}</option>)}
                      </select>
                    </label>
                    <Field label="Product Name" value={form.productName} placeholder="Laptop, iPhone, MacBook, monitor..." onChange={(value) => updateField('productName', value)} required />
                    <Field label="Quantity Required" type="number" value={form.quantity} onChange={(value) => updateField('quantity', value)} required />
                    <Field label="Expected Price / Target Price" value={form.expectedPrice} placeholder="Example: AED 850 each" onChange={(value) => updateField('expectedPrice', value)} />
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-800">Condition Required</span>
                      <select value={form.conditionRequired} onChange={(event) => updateField('conditionRequired', event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white">
                        <option value="new">New</option>
                        <option value="refurbished">Refurbished</option>
                        <option value="used">Used</option>
                        <option value="any">Any</option>
                      </select>
                    </label>
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-sm font-bold text-slate-800">Model / Models Required</span>
                    <textarea required value={form.modelsRequired} onChange={(event) => updateField('modelsRequired', event.target.value)} rows={4} placeholder="Dell Latitude 5490, HP EliteBook 840 G5, MacBook Air M1, iPhone 14 Pro Max" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white" />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-800">Delivery Country</span>
                      <select value={form.deliveryCountry} onChange={(event) => updateField('deliveryCountry', event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white">
                        {SUPPORTED_COUNTRY_CODES.map((code) => (
                          <option key={code} value={code}>{COUNTRY_CONFIG[code].name}</option>
                        ))}
                      </select>
                    </label>
                    <Field label="Delivery Address" value={form.deliveryAddress} onChange={(value) => updateField('deliveryAddress', value)} required />
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-sm font-bold text-slate-800">Extra Notes / Requirements</span>
                    <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} rows={4} placeholder="Warranty, charger, grade, packaging, delivery timing, or customs notes..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white" />
                  </label>

                  <div className="sticky bottom-3 z-10 grid gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-300/30 backdrop-blur md:grid-cols-2">
                    <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      <Send className="h-5 w-5" />
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 font-black text-emerald-700 transition hover:bg-emerald-100">
                      <MessageCircle className="h-5 w-5" />
                      Send to WhatsApp
                    </a>
                  </div>
                </form>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">How it works</p>
                <div className="mt-5 space-y-4">
                  {[
                    ['Submit models', 'List every model manually with quantity and target price.'],
                    ['Team reviews', 'ExShopi checks stock, condition, and best bulk pricing.'],
                    ['Quote & delivery', 'You receive a quote, WhatsApp follow-up, and delivery options.'],
                  ].map(([title, text], index) => (
                    <div key={title} className="flex gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">{index + 1}</div>
                      <div>
                        <p className="font-black text-slate-900">{title}</p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
                <Truck className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-black text-blue-950">Worldwide bulk delivery support</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-blue-900">Customs/import duties may apply depending on destination country. ExShopi will clarify logistics before confirmation.</p>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  );
}
