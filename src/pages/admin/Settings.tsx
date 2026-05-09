import React, { useState, useEffect } from 'react';
import { Save, Globe, Palette, Home, Layout, List, Search, Share2, Info, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Loader2, Video, Play, ShieldCheck, Upload, Settings2, Sparkles, LayoutPanelTop } from 'lucide-react';
import { getSiteSettings, updateSiteSettings, SiteSettings, defaultSettings } from '../../services/settingsService';
import { adminOpsAPI } from '../../services/api';
import { uploadImageFile } from '../../lib/uploadClient';
import { getSeoLengthStatus, normalizeSeoText, trimSeoKeywords } from '../../lib/seo';
import { COUNTRY_CONFIG, SUPPORTED_COUNTRY_CODES } from '../../lib/countryConfig';

type MarketplaceCountrySetting = {
  code: string;
  name: string;
  currency: string;
  vatPercent: number;
  deliveryBaseAed: number;
  codEnabled: boolean;
  exchangeRate?: number;
  phoneCode?: string;
  enabled?: boolean;
  cities?: string[];
};

type MarketplaceSettingsState = {
  sellerCommissionPercent: number;
  monthlySellerFeeAed: number;
  defaultCountry: string;
  lowStockThreshold: number;
  maintenanceMode: boolean;
  liveRateCarriers: string[];
  globalSeoEnabled: boolean;
  fraudMonitoringEnabled: boolean;
  prepaidOnlyOutsideUae: boolean;
  countries: MarketplaceCountrySetting[];
};

export function AdminSettings() {
  const defaultMarketplaceCountries = SUPPORTED_COUNTRY_CODES.map((countryCode) => {
    const config = COUNTRY_CONFIG[countryCode];
    return {
      code: config.code,
      name: config.name,
      currency: config.currency,
      vatPercent: config.vatRate * 100,
      deliveryBaseAed: config.shippingOptions[0]?.baseFeeAed ?? 10,
      codEnabled: config.code === 'AE',
      exchangeRate: config.fallbackExchangeRateFromAed,
      phoneCode: config.phonePrefix,
      enabled: true,
      cities: config.cities,
    };
  });

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettingsState>({
    sellerCommissionPercent: 6,
    monthlySellerFeeAed: 99,
    defaultCountry: 'AE',
    lowStockThreshold: 5,
    maintenanceMode: false,
    liveRateCarriers: ['DHL', 'FedEx', 'UPS', 'Aramex', 'Emirates Post'],
    globalSeoEnabled: true,
    fraudMonitoringEnabled: true,
    prepaidOnlyOutsideUae: true,
    countries: defaultMarketplaceCountries,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const [siteResult, marketplaceResult] = await Promise.allSettled([
          getSiteSettings(),
          adminOpsAPI.getMarketplaceSettings(),
        ]);

        if (siteResult.status === 'fulfilled') {
          setSettings(siteResult.value);
        } else {
          console.error('Error loading site settings:', siteResult.reason);
          setSettings(defaultSettings);
        }

        if (marketplaceResult.status === 'fulfilled' && marketplaceResult.value) {
          const incomingByCode = new Map(
            (Array.isArray(marketplaceResult.value?.countries) ? marketplaceResult.value.countries : []).map((country: any) => [country.code, country])
          );
          setMarketplaceSettings((prev) => ({
            ...prev,
            ...marketplaceResult.value,
            liveRateCarriers: Array.isArray(marketplaceResult.value?.liveRateCarriers)
              ? marketplaceResult.value.liveRateCarriers
              : prev.liveRateCarriers,
            globalSeoEnabled: Boolean(marketplaceResult.value?.globalSeoEnabled ?? prev.globalSeoEnabled),
            fraudMonitoringEnabled: Boolean(marketplaceResult.value?.fraudMonitoringEnabled ?? prev.fraudMonitoringEnabled),
            prepaidOnlyOutsideUae: Boolean(marketplaceResult.value?.prepaidOnlyOutsideUae ?? prev.prepaidOnlyOutsideUae),
            countries: defaultMarketplaceCountries.map((defaultCountry) => ({
              ...defaultCountry,
              ...(incomingByCode.get(defaultCountry.code) || {}),
              codEnabled:
                defaultCountry.code === 'AE'
                  ? Boolean((incomingByCode.get(defaultCountry.code) as any)?.codEnabled ?? true)
                  : false,
            })),
          }));
        } else if (marketplaceResult.status === 'rejected') {
          console.error('Error loading marketplace settings:', marketplaceResult.reason);
          setMessage({
            type: 'error',
            text: 'Marketplace settings could not be loaded. Default values are shown until the backend responds.',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Failed to load settings.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const cleanedSettings: SiteSettings = {
        ...settings,
        seo: {
          ...settings.seo,
          metaTitle: normalizeSeoText(settings.seo.metaTitle),
          metaDescription: normalizeSeoText(settings.seo.metaDescription),
          keywords: trimSeoKeywords(settings.seo.keywords),
          ogTitle: normalizeSeoText(settings.seo.ogTitle),
          ogDescription: normalizeSeoText(settings.seo.ogDescription),
          ogImage: normalizeSeoText(settings.seo.ogImage),
          homepage: {
            ...settings.seo.homepage,
            metaTitle: normalizeSeoText(settings.seo.homepage.metaTitle),
            metaDescription: normalizeSeoText(settings.seo.homepage.metaDescription),
            keywords: trimSeoKeywords(settings.seo.homepage.keywords),
            ogTitle: normalizeSeoText(settings.seo.homepage.ogTitle),
            ogDescription: normalizeSeoText(settings.seo.homepage.ogDescription),
            ogImage: normalizeSeoText(settings.seo.homepage.ogImage),
          },
          blog: {
            ...settings.seo.blog,
            metaTitle: normalizeSeoText(settings.seo.blog.metaTitle),
            metaDescription: normalizeSeoText(settings.seo.blog.metaDescription),
            keywords: trimSeoKeywords(settings.seo.blog.keywords),
            slug: normalizeSeoText(settings.seo.blog.slug),
            ogImage: normalizeSeoText(settings.seo.blog.ogImage),
          },
        },
      };

      await Promise.all([
        updateSiteSettings(cleanedSettings),
        adminOpsAPI.updateMarketplaceSettings(marketplaceSettings),
      ]);
      setSettings(cleanedSettings);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNested = (path: string, value: any) => {
    const keys = path.split('.');
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB.' });
      return;
    }

    setIsUploading(type);
    try {
      const url = await uploadImageFile(file, {
        folder: 'branding',
        fileName: `${type}-${settings.general.siteName || 'exshopi'}`,
      });
      if (type === 'logo') {
        updateNested('branding.logoUrl', url);
      } else {
        updateNested('branding.faviconUrl', url);
      }
      setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!` });
      setIsUploading(null);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
      setIsUploading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'marketplace', label: 'Marketplace', icon: Settings2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'homepage', label: 'Homepage', icon: Home },
    { id: 'header', label: 'Header', icon: Layout },
    { id: 'footer', label: 'Footer', icon: List },
    { id: 'seo', label: 'SEO', icon: Search },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h2>
          <p className="text-slate-500 font-medium">Manage your marketplace configuration and appearance.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 hover:bg-violet-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 lg:p-12">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Website Name</label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={e => updateNested('general.siteName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tagline</label>
                    <input
                      type="text"
                      value={settings.general.tagline}
                      onChange={e => updateNested('general.tagline', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Support Email</label>
                    <input
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={e => updateNested('general.supportEmail', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Support Phone</label>
                    <input
                      type="text"
                      value={settings.general.supportPhone}
                      onChange={e => updateNested('general.supportPhone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Business Address</label>
                    <textarea
                      value={settings.general.address}
                      onChange={e => updateNested('general.address', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Default Language</label>
                    <select
                      value={settings.general.defaultLanguage}
                      onChange={e => updateNested('general.defaultLanguage', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">VAT Percentage (%)</label>
                    <input
                      type="number"
                      value={settings.general.vatPercentage}
                      onChange={e => updateNested('general.vatPercentage', parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Seller Commission %</label>
                    <input type="number" value={marketplaceSettings.sellerCommissionPercent} onChange={e => setMarketplaceSettings(prev => ({ ...prev, sellerCommissionPercent: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Seller Fee (AED)</label>
                    <input type="number" value={marketplaceSettings.monthlySellerFeeAed} onChange={e => setMarketplaceSettings(prev => ({ ...prev, monthlySellerFeeAed: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Default Country</label>
                    <select value={marketplaceSettings.defaultCountry} onChange={e => setMarketplaceSettings(prev => ({ ...prev, defaultCountry: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20">
                      {SUPPORTED_COUNTRY_CODES.map((countryCode) => (
                        <option key={countryCode} value={countryCode}>
                          {COUNTRY_CONFIG[countryCode].name} ({countryCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Low Stock Threshold</label>
                    <input type="number" value={marketplaceSettings.lowStockThreshold} onChange={e => setMarketplaceSettings(prev => ({ ...prev, lowStockThreshold: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700">
                  <input type="checkbox" checked={marketplaceSettings.maintenanceMode} onChange={e => setMarketplaceSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))} />
                  Enable maintenance mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700">
                    <input type="checkbox" checked={marketplaceSettings.globalSeoEnabled} onChange={e => setMarketplaceSettings(prev => ({ ...prev, globalSeoEnabled: e.target.checked }))} />
                    Global SEO and hreflang
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700">
                    <input type="checkbox" checked={marketplaceSettings.fraudMonitoringEnabled} onChange={e => setMarketplaceSettings(prev => ({ ...prev, fraudMonitoringEnabled: e.target.checked }))} />
                    Fraud monitoring
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700">
                    <input type="checkbox" checked={marketplaceSettings.prepaidOnlyOutsideUae} onChange={e => setMarketplaceSettings(prev => ({ ...prev, prepaidOnlyOutsideUae: e.target.checked }))} />
                    Prepaid outside UAE
                  </label>
                </div>
                <label className="space-y-2 block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Courier Rate Providers</span>
                  <textarea
                    value={(marketplaceSettings.liveRateCarriers || []).join(', ')}
                    onChange={e => setMarketplaceSettings(prev => ({ ...prev, liveRateCarriers: e.target.value.split(',').map((carrier) => carrier.trim()).filter(Boolean) }))}
                    className="w-full min-h-[88px] rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <span className="block text-xs font-semibold text-slate-500">
                    UI-ready list. Connect carrier API credentials before treating these as live calculated rates.
                  </span>
                </label>
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900">Country Rules</h3>
                  {marketplaceSettings.countries.map((country, index) => (
                    <div key={country.code} className="grid grid-cols-1 md:grid-cols-6 gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Country</p>
                        <p className="mt-2 font-bold text-slate-900">{country.name} ({country.code})</p>
                      </div>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Currency</span>
                        <input value={country.currency} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, currency: e.target.value } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">VAT %</span>
                        <input type="number" value={country.vatPercent} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, vatPercent: parseFloat(e.target.value) || 0 } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Default Shipping Fee</span>
                        <input type="number" value={country.deliveryBaseAed} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, deliveryBaseAed: parseFloat(e.target.value) || 0 } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Exchange Rate from AED</span>
                        <input type="number" step="0.001" value={country.exchangeRate ?? 1} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, exchangeRate: parseFloat(e.target.value) || 0 } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Code</span>
                        <input value={country.phoneCode ?? ''} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, phoneCode: e.target.value } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className={`flex items-center gap-3 pt-8 font-bold ${country.code === 'AE' ? 'text-slate-700' : 'text-slate-400'}`}>
                        <input
                          type="checkbox"
                          checked={country.code === 'AE' ? country.codEnabled : false}
                          disabled={country.code !== 'AE'}
                          onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, codEnabled: item.code === 'AE' ? e.target.checked : false } : item) }))}
                        />
                        COD enabled {country.code !== 'AE' ? '(UAE only)' : ''}
                      </label>
                      <label className="flex items-center gap-3 pt-8 font-bold text-slate-700">
                        <input type="checkbox" checked={country.enabled ?? true} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: e.target.checked } : item) }))} />
                        Country enabled
                      </label>
                      <label className="space-y-2 md:col-span-6">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Available Cities</span>
                        <textarea value={(country.cities || []).join(', ')} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, cities: e.target.value.split(',').map((city) => city.trim()).filter(Boolean) } : item) }))} className="w-full min-h-[92px] rounded-2xl border border-slate-100 bg-white px-4 py-3 font-medium outline-none" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo</label>
                    <div className="flex flex-col gap-4">
                      <div className="relative group">
                        <div className="w-full h-40 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-violet-500 group-hover:bg-violet-50/30">
                          {settings.branding.logoUrl ? (
                            <img src={settings.branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-4" />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400">No logo uploaded</p>
                            </div>
                          )}
                          
                          <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-center text-white">
                              {isUploading === 'logo' ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                              ) : (
                                <>
                                  <Upload size={24} className="mb-2" />
                                  <span className="text-xs font-black uppercase tracking-widest">Upload Logo</span>
                                </>
                              )}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'logo')}
                              disabled={isUploading !== null}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo URL (Manual)</label>
                        <input
                          type="text"
                          value={settings.branding.logoUrl}
                          onChange={e => updateNested('branding.logoUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Favicon</label>
                    <div className="flex flex-col gap-4">
                      <div className="relative group">
                        <div className="w-full h-40 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-violet-500 group-hover:bg-violet-50/30">
                          {settings.branding.faviconUrl ? (
                            <img src={settings.branding.faviconUrl} alt="Favicon" className="w-16 h-16 object-contain" />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400">No favicon uploaded</p>
                            </div>
                          )}
                          
                          <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-center text-white">
                              {isUploading === 'favicon' ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                              ) : (
                                <>
                                  <Upload size={24} className="mb-2" />
                                  <span className="text-xs font-black uppercase tracking-widest">Upload Favicon</span>
                                </>
                              )}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'favicon')}
                              disabled={isUploading !== null}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Favicon URL (Manual)</label>
                        <input
                          type="text"
                          value={settings.branding.faviconUrl}
                          onChange={e => updateNested('branding.faviconUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={e => updateNested('branding.primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-xl border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.branding.primaryColor}
                        onChange={e => updateNested('branding.primaryColor', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Accent Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.branding.accentColor}
                        onChange={e => updateNested('branding.accentColor', e.target.value)}
                        className="w-12 h-12 rounded-xl border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.branding.accentColor}
                        onChange={e => updateNested('branding.accentColor', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="space-y-12">
                {/* Hero Management */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ImageIcon size={24} className="text-violet-600" />
                    Hero Section
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Title</label>
                      <input
                        type="text"
                        value={settings.homepage.hero.title}
                        onChange={e => updateNested('homepage.hero.title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Subtitle</label>
                      <input
                        type="text"
                        value={settings.homepage.hero.subtitle}
                        onChange={e => updateNested('homepage.hero.subtitle', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary CTA Text</label>
                      <input
                        type="text"
                        value={settings.homepage.hero.primaryCtaText}
                        onChange={e => updateNested('homepage.hero.primaryCtaText', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary CTA Link</label>
                      <input
                        type="text"
                        value={settings.homepage.hero.primaryCtaLink}
                        onChange={e => updateNested('homepage.hero.primaryCtaLink', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hero Product Image URL</label>
                      <input
                        type="text"
                        value={settings.homepage.hero.productImageUrl}
                        onChange={e => updateNested('homepage.hero.productImageUrl', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={24} className="text-violet-600" />
                      UAE Strip Above Hero
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.homepage.uaeStrip.show}
                        onChange={e => updateNested('homepage.uaeStrip.show', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Left Title</label>
                      <input value={settings.homepage.uaeStrip.leftTitle} onChange={e => updateNested('homepage.uaeStrip.leftTitle', e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Left Subtitle</label>
                      <input value={settings.homepage.uaeStrip.leftSubtitle} onChange={e => updateNested('homepage.uaeStrip.leftSubtitle', e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Right Title</label>
                      <input value={settings.homepage.uaeStrip.rightTitle} onChange={e => updateNested('homepage.uaeStrip.rightTitle', e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Right Subtitle</label>
                      <input value={settings.homepage.uaeStrip.rightSubtitle} onChange={e => updateNested('homepage.uaeStrip.rightSubtitle', e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>
                </div>

                {/* Video Section Settings */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Play size={24} className="text-violet-600" />
                      Video Promo Section
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.homepage.videoSection.show}
                        onChange={e => updateNested('homepage.videoSection.show', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Title</label>
                      <input
                        type="text"
                        value={settings.homepage.videoSection.title}
                        onChange={e => updateNested('homepage.videoSection.title', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Badge Text</label>
                      <input
                        type="text"
                        value={settings.homepage.videoSection.badgeText}
                        onChange={e => updateNested('homepage.videoSection.badgeText', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                      <textarea
                        value={settings.homepage.videoSection.description}
                        onChange={e => updateNested('homepage.videoSection.description', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold h-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Video URL (Embed)</label>
                      <input
                        type="text"
                        value={settings.homepage.videoSection.videoUrl}
                        onChange={e => updateNested('homepage.videoSection.videoUrl', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Thumbnail URL</label>
                      <input
                        type="text"
                        value={settings.homepage.videoSection.thumbnailUrl}
                        onChange={e => updateNested('homepage.videoSection.thumbnailUrl', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Trust Banner Settings */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={24} className="text-violet-600" />
                      Trust Banner
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.homepage.trustBanner.show}
                        onChange={e => updateNested('homepage.trustBanner.show', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.homepage.trustBanner.items.map((item, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Item {idx + 1}</span>
                          <select 
                            value={item.icon}
                            onChange={e => {
                              const newItems = [...settings.homepage.trustBanner.items];
                              newItems[idx].icon = e.target.value;
                              updateNested('homepage.trustBanner.items', newItems);
                            }}
                            className="text-xs font-black bg-white border border-slate-100 rounded-lg px-2 py-1 text-violet-600 outline-none"
                          >
                            <option value="truck">Truck</option>
                            <option value="shield">Shield</option>
                            <option value="zap">Zap</option>
                            <option value="check">Check</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={item.title}
                            onChange={e => {
                              const newItems = [...settings.homepage.trustBanner.items];
                              newItems[idx].title = e.target.value;
                              updateNested('homepage.trustBanner.items', newItems);
                            }}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.desc}
                            onChange={e => {
                              const newItems = [...settings.homepage.trustBanner.items];
                              newItems[idx].desc = e.target.value;
                              updateNested('homepage.trustBanner.items', newItems);
                            }}
                            className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Management */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <List size={24} className="text-violet-600" />
                      Homepage Sections
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {settings.homepage.sections.sort((a, b) => a.order - b.order).map((section, index) => (
                      <div key={section.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-6">
                        <div className="flex flex-col gap-2">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                              const newSections = [...settings.homepage.sections];
                              const temp = newSections[index].order;
                              newSections[index].order = newSections[index-1].order;
                              newSections[index-1].order = temp;
                              updateNested('homepage.sections', newSections);
                            }}
                            className="p-2 hover:bg-white rounded-xl transition-colors disabled:opacity-30"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            disabled={index === settings.homepage.sections.length - 1}
                            onClick={() => {
                              const newSections = [...settings.homepage.sections];
                              const temp = newSections[index].order;
                              newSections[index].order = newSections[index+1].order;
                              newSections[index+1].order = temp;
                              updateNested('homepage.sections', newSections);
                            }}
                            className="p-2 hover:bg-white rounded-xl transition-colors disabled:opacity-30"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-full">{section.type}</span>
                            <h4 className="font-black text-slate-900">{section.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{section.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={section.show}
                              onChange={e => {
                                const newSections = settings.homepage.sections.map(s => s.id === section.id ? { ...s, show: e.target.checked } : s);
                                updateNested('homepage.sections', newSections);
                              }}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                          </label>
                          <button className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                            <Info size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={22} className="text-violet-600" />
                        Featured Products Selection
                      </h3>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Bestsellers products</label>
                        <input
                          value={(settings.homepage.featuredSection.bestsellersProductIds || []).join(', ')}
                          onChange={e =>
                            updateNested(
                              'homepage.featuredSection.bestsellersProductIds',
                              e.target.value.split(',').map(value => value.trim()).filter(Boolean)
                            )
                          }
                          placeholder="IDs or slugs, comma separated"
                          className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Best choice products</label>
                        <input
                          value={(settings.homepage.featuredSection.bestchoiceProductIds || []).join(', ')}
                          onChange={e =>
                            updateNested(
                              'homepage.featuredSection.bestchoiceProductIds',
                              e.target.value.split(',').map(value => value.trim()).filter(Boolean)
                            )
                          }
                          placeholder="IDs or slugs, comma separated"
                          className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">On sale products</label>
                        <input
                          value={(settings.homepage.featuredSection.onsaleProductIds || []).join(', ')}
                          onChange={e =>
                            updateNested(
                              'homepage.featuredSection.onsaleProductIds',
                              e.target.value.split(',').map(value => value.trim()).filter(Boolean)
                            )
                          }
                          placeholder="IDs or slugs, comma separated"
                          className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Enter approved live product IDs or slugs to control exactly which products appear in Bestsellers, Best Choice, and On Sale. If left empty, ExShopi will keep auto-filling from the live catalog.
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <LayoutPanelTop size={22} className="text-violet-600" />
                        All Products Section
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.homepage.allProductsSection.show}
                          onChange={e => updateNested('homepage.allProductsSection.show', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={settings.homepage.allProductsSection.title}
                        onChange={e => updateNested('homepage.allProductsSection.title', e.target.value)}
                        placeholder="Section title"
                        className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                      />
                      <input
                        value={settings.homepage.allProductsSection.subtitle}
                        onChange={e => updateNested('homepage.allProductsSection.subtitle', e.target.value)}
                        placeholder="Section subtitle"
                        className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm"
                      />
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      This section sits right above the footer and shows the full mixed live catalog without removing any existing listed products.
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Settings2 size={22} className="text-violet-600" />
                        Campaign Section
                      </h3>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.homepage.campaignSection.badgeText} onChange={e => updateNested('homepage.campaignSection.badgeText', e.target.value)} placeholder="Badge text" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={settings.homepage.campaignSection.expiresLabel} onChange={e => updateNested('homepage.campaignSection.expiresLabel', e.target.value)} placeholder="Countdown label" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input type="datetime-local" value={settings.homepage.campaignSection.endAt ? settings.homepage.campaignSection.endAt.slice(0, 16) : ''} onChange={e => updateNested('homepage.campaignSection.endAt', e.target.value ? `${e.target.value}:00+04:00` : '')} className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={(settings.homepage.campaignSection.featuredProductIds || []).join(', ')} onChange={e => updateNested('homepage.campaignSection.featuredProductIds', e.target.value.split(',').map(value => value.trim()).filter(Boolean))} placeholder="Campaign product IDs or slugs, comma separated" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={settings.homepage.campaignSection.moreCtaText} onChange={e => updateNested('homepage.campaignSection.moreCtaText', e.target.value)} placeholder="More button text" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={settings.homepage.campaignSection.allPromotionsText} onChange={e => updateNested('homepage.campaignSection.allPromotionsText', e.target.value)} placeholder="All promotions button text" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={settings.homepage.campaignSection.moreCtaLink} onChange={e => updateNested('homepage.campaignSection.moreCtaLink', e.target.value)} placeholder="More button link" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                      <input value={settings.homepage.campaignSection.allPromotionsLink} onChange={e => updateNested('homepage.campaignSection.allPromotionsLink', e.target.value)} placeholder="All promotions link" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Text Block Color</span>
                        <div className="flex items-center gap-3">
                          <input type="color" value={settings.homepage.campaignSection.panelBgColor} onChange={e => updateNested('homepage.campaignSection.panelBgColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer" />
                          <input value={settings.homepage.campaignSection.panelBgColor} onChange={e => updateNested('homepage.campaignSection.panelBgColor', e.target.value)} className="flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                        </div>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Section Color</span>
                        <div className="flex items-center gap-3">
                          <input type="color" value={settings.homepage.campaignSection.sectionBgColor} onChange={e => updateNested('homepage.campaignSection.sectionBgColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer" />
                          <input value={settings.homepage.campaignSection.sectionBgColor} onChange={e => updateNested('homepage.campaignSection.sectionBgColor', e.target.value)} className="flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                        </div>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Product Rail Color</span>
                        <div className="flex items-center gap-3">
                          <input type="color" value={settings.homepage.campaignSection.productRailBgColor.startsWith('#') ? settings.homepage.campaignSection.productRailBgColor : '#4f46e5'} onChange={e => updateNested('homepage.campaignSection.productRailBgColor', e.target.value)} className="h-12 w-12 rounded-xl cursor-pointer" />
                          <input value={settings.homepage.campaignSection.productRailBgColor} onChange={e => updateNested('homepage.campaignSection.productRailBgColor', e.target.value)} className="flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                        </div>
                      </label>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Add approved live product IDs or slugs here to control exactly which products appear in the campaign section. If left empty, ExShopi will show live discounted products automatically.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Plus size={24} className="text-violet-600" />
                      Promotion Boxes
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateNested('homepage.promoBoxes', [
                          ...settings.homepage.promoBoxes,
                          {
                            id: `promo-${Date.now()}`,
                            badge: 'Seasonal Event',
                            title: 'New Promotion',
                            description: 'Describe this event or festival promotion.',
                            ctaText: 'Open Promotion',
                            ctaLink: '/promotions',
                            imageUrl: '',
                            tone: 'light',
                            show: true,
                          },
                        ])
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-violet-600"
                    >
                      <Plus size={16} />
                      Add Promo Box
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.homepage.promoBoxes.map((box, idx) => (
                      <div key={box.id} className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-6">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Promo Box {idx + 1}</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={box.show}
                              onChange={e => {
                                const next = [...settings.homepage.promoBoxes];
                                next[idx] = { ...box, show: e.target.checked };
                                updateNested('homepage.promoBoxes', next);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-violet-600 peer-checked:after:translate-x-full"></div>
                          </label>
                        </div>
                        <input value={box.badge} onChange={e => {
                          const next = [...settings.homepage.promoBoxes];
                          next[idx] = { ...box, badge: e.target.value };
                          updateNested('homepage.promoBoxes', next);
                        }} placeholder="Badge" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                        <input value={box.title} onChange={e => {
                          const next = [...settings.homepage.promoBoxes];
                          next[idx] = { ...box, title: e.target.value };
                          updateNested('homepage.promoBoxes', next);
                        }} placeholder="Title" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                        <textarea value={box.description} onChange={e => {
                          const next = [...settings.homepage.promoBoxes];
                          next[idx] = { ...box, description: e.target.value };
                          updateNested('homepage.promoBoxes', next);
                        }} placeholder="Description" className="w-full h-24 bg-white border border-slate-100 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input value={box.ctaText} onChange={e => {
                            const next = [...settings.homepage.promoBoxes];
                            next[idx] = { ...box, ctaText: e.target.value };
                            updateNested('homepage.promoBoxes', next);
                          }} placeholder="CTA text" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                          <input value={box.ctaLink} onChange={e => {
                            const next = [...settings.homepage.promoBoxes];
                            next[idx] = { ...box, ctaLink: e.target.value };
                            updateNested('homepage.promoBoxes', next);
                          }} placeholder="CTA link" className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                        </div>
                        <div className="space-y-3 rounded-[24px] border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Collection image</p>
                              <p className="mt-1 text-xs text-slate-500">Upload T-shirts, shoes, or any promo visual from your PC.</p>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-violet-600">
                              {isUploading === `promo-box-${idx}` ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              Upload image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploading(`promo-box-${idx}`);
                                  try {
                                    const url = await uploadImageFile(file, {
                                      folder: 'homepage/promotions',
                                      fileName: `${box.id}-${file.name}`,
                                    });
                                    const next = [...settings.homepage.promoBoxes];
                                    next[idx] = { ...box, imageUrl: url };
                                    updateNested('homepage.promoBoxes', next);
                                  } catch (error) {
                                    console.error('Promo image upload failed:', error);
                                    setMessage({ type: 'error', text: 'Failed to upload promo image. Please try again.' });
                                  } finally {
                                    setIsUploading(null);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input value={box.imageUrl || ''} onChange={e => {
                            const next = [...settings.homepage.promoBoxes];
                            next[idx] = { ...box, imageUrl: e.target.value };
                            updateNested('homepage.promoBoxes', next);
                          }} placeholder="Uploaded image URL" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm" />
                          {box.imageUrl ? (
                            <div className="overflow-hidden rounded-[20px] border border-slate-100">
                              <img src={box.imageUrl} alt={box.title} className="h-40 w-full object-cover" />
                            </div>
                          ) : null}
                        </div>
                        <select value={box.tone} onChange={e => {
                          const next = [...settings.homepage.promoBoxes];
                          next[idx] = { ...box, tone: e.target.value as 'dark' | 'light' };
                          updateNested('homepage.promoBoxes', next);
                        }} className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm">
                          <option value="dark">Dark card</option>
                          <option value="light">Light card</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.homepage.promoBoxes.filter((_, itemIndex) => itemIndex !== idx);
                            updateNested('homepage.promoBoxes', next);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={15} />
                          Remove Box
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'header' && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900">Announcement Bar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4 md:col-span-2">
                      <label className="text-sm font-black text-slate-900">Show Announcement Bar</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.header.announcementBar.show}
                          onChange={e => updateNested('header.announcementBar.show', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Text</label>
                      <input
                        type="text"
                        value={settings.header.announcementBar.text}
                        onChange={e => updateNested('header.announcementBar.text', e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Background Color</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={settings.header.announcementBar.bgColor}
                          onChange={e => updateNested('header.announcementBar.bgColor', e.target.value)}
                          className="w-12 h-12 rounded-xl border-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.header.announcementBar.bgColor}
                          onChange={e => updateNested('header.announcementBar.bgColor', e.target.value)}
                          className="flex-1 bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Text Color</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={settings.header.announcementBar.textColor}
                          onChange={e => updateNested('header.announcementBar.textColor', e.target.value)}
                          className="w-12 h-12 rounded-xl border-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.header.announcementBar.textColor}
                          onChange={e => updateNested('header.announcementBar.textColor', e.target.value)}
                          className="flex-1 bg-white border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Delivery Message</label>
                    <input
                      type="text"
                      value={settings.header.deliveryMessage}
                      onChange={e => updateNested('header.deliveryMessage', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Search Placeholder</label>
                    <input
                      type="text"
                      value={settings.header.searchPlaceholder}
                      onChange={e => updateNested('header.searchPlaceholder', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Footer Description</label>
                    <textarea
                      value={settings.footer.description}
                      onChange={e => updateNested('footer.description', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
                    <input
                      type="email"
                      value={settings.footer.email}
                      onChange={e => updateNested('footer.email', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                    <input
                      type="text"
                      value={settings.footer.phone}
                      onChange={e => updateNested('footer.phone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Social Links</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={settings.footer.socialLinks.facebook}
                          onChange={e => updateNested('footer.socialLinks.facebook', e.target.value)}
                          placeholder="Facebook URL"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                      <div className="relative">
                        <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          value={settings.footer.socialLinks.instagram}
                          onChange={e => updateNested('footer.socialLinks.instagram', e.target.value)}
                          placeholder="Instagram URL"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-8">
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Global Defaults</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Marketplace SEO Identity</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Set the fallback metadata ExShopi should use across pages where a more specific SEO record is not provided.
                  </p>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Title</label>
                        <input
                          type="text"
                          value={settings.seo.metaTitle}
                          onChange={e => updateNested('seo.metaTitle', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                        <p className={`text-[11px] font-black uppercase tracking-widest ${getSeoLengthStatus(settings.seo.metaTitle, 50, 60) === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {settings.seo.metaTitle.trim().length}/60 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                        <textarea
                          value={settings.seo.metaDescription}
                          onChange={e => updateNested('seo.metaDescription', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold min-h-[120px]"
                        />
                        <p className={`text-[11px] font-black uppercase tracking-widest ${getSeoLengthStatus(settings.seo.metaDescription, 150, 160) === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {settings.seo.metaDescription.trim().length}/160 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Keywords (comma separated)</label>
                        <input
                          type="text"
                          value={settings.seo.keywords}
                          onChange={e => updateNested('seo.keywords', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">OG Title</label>
                        <input
                          type="text"
                          value={settings.seo.ogTitle}
                          onChange={e => updateNested('seo.ogTitle', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">OG Description</label>
                        <textarea
                          value={settings.seo.ogDescription}
                          onChange={e => updateNested('seo.ogDescription', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">OG Image URL</label>
                        <input
                          type="text"
                          value={settings.seo.ogImage}
                          onChange={e => updateNested('seo.ogImage', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-100 bg-white p-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Homepage SEO</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">Homepage Search Settings</h3>
                    <div className="mt-5 space-y-4">
                      <input value={settings.seo.homepage.metaTitle} onChange={e => updateNested('seo.homepage.metaTitle', e.target.value)} placeholder="Homepage title" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <textarea value={settings.seo.homepage.metaDescription} onChange={e => updateNested('seo.homepage.metaDescription', e.target.value)} placeholder="Homepage meta description" className="w-full min-h-[120px] bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.homepage.keywords} onChange={e => updateNested('seo.homepage.keywords', e.target.value)} placeholder="Homepage keywords" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.homepage.ogTitle} onChange={e => updateNested('seo.homepage.ogTitle', e.target.value)} placeholder="Homepage OG title" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <textarea value={settings.seo.homepage.ogDescription} onChange={e => updateNested('seo.homepage.ogDescription', e.target.value)} placeholder="Homepage OG description" className="w-full min-h-[110px] bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.homepage.ogImage} onChange={e => updateNested('seo.homepage.ogImage', e.target.value)} placeholder="Homepage OG image URL" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-white p-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Blog SEO</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">Blog Search Defaults</h3>
                    <div className="mt-5 space-y-4">
                      <input value={settings.seo.blog.metaTitle} onChange={e => updateNested('seo.blog.metaTitle', e.target.value)} placeholder="Blog title" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <textarea value={settings.seo.blog.metaDescription} onChange={e => updateNested('seo.blog.metaDescription', e.target.value)} placeholder="Blog meta description" className="w-full min-h-[120px] bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.blog.keywords} onChange={e => updateNested('seo.blog.keywords', e.target.value)} placeholder="Blog keywords" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.blog.slug} onChange={e => updateNested('seo.blog.slug', e.target.value)} placeholder="blog" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                      <input value={settings.seo.blog.ogImage} onChange={e => updateNested('seo.blog.ogImage', e.target.value)} placeholder="Blog OG image URL" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
