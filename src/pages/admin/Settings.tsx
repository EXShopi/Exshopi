import React, { useState, useEffect } from 'react';
import { Save, Globe, Palette, Home, Layout, List, Search, Share2, Info, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Loader2, Video, Play, ShieldCheck, Upload, Settings2 } from 'lucide-react';
import { getSiteSettings, updateSiteSettings, SiteSettings, defaultSettings } from '../../services/settingsService';
import { adminOpsAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { uploadImageFile } from '../../lib/uploadClient';

export function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState({
    sellerCommissionPercent: 6,
    monthlySellerFeeAed: 99,
    defaultCountry: 'AE',
    lowStockThreshold: 5,
    maintenanceMode: false,
    countries: [] as Array<{ code: string; name: string; currency: string; vatPercent: number; deliveryBaseAed: number; codEnabled: boolean }>,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
        const marketplace = await adminOpsAPI.getMarketplaceSettings();
        setMarketplaceSettings(marketplace);
      } catch (error) {
        console.error('Error loading settings:', error);
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
      await Promise.all([
        updateSiteSettings(settings),
        adminOpsAPI.updateMarketplaceSettings(marketplaceSettings),
      ]);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
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
                    <input type="text" value={marketplaceSettings.defaultCountry} onChange={e => setMarketplaceSettings(prev => ({ ...prev, defaultCountry: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-violet-500/20" />
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
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900">Country Rules</h3>
                  {marketplaceSettings.countries.map((country, index) => (
                    <div key={country.code} className="grid grid-cols-1 md:grid-cols-5 gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
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
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Delivery Base AED</span>
                        <input type="number" value={country.deliveryBaseAed} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, deliveryBaseAed: parseFloat(e.target.value) || 0 } : item) }))} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 font-bold outline-none" />
                      </label>
                      <label className="flex items-center gap-3 pt-8 font-bold text-slate-700">
                        <input type="checkbox" checked={country.codEnabled} onChange={e => setMarketplaceSettings(prev => ({ ...prev, countries: prev.countries.map((item, itemIndex) => itemIndex === index ? { ...item, codEnabled: e.target.checked } : item) }))} />
                        COD enabled
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Plus size={24} className="text-violet-600" />
                      Promotion Boxes
                    </h3>
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
                        <select value={box.tone} onChange={e => {
                          const next = [...settings.homepage.promoBoxes];
                          next[idx] = { ...box, tone: e.target.value as 'dark' | 'light' };
                          updateNested('homepage.promoBoxes', next);
                        }} className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 font-bold outline-none focus:ring-2 focus:ring-violet-500/20 text-sm">
                          <option value="dark">Dark card</option>
                          <option value="light">Light card</option>
                        </select>
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Title</label>
                    <input
                      type="text"
                      value={settings.seo.metaTitle}
                      onChange={e => updateNested('seo.metaTitle', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                    <textarea
                      value={settings.seo.metaDescription}
                      onChange={e => updateNested('seo.metaDescription', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={settings.seo.keywords}
                      onChange={e => updateNested('seo.keywords', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
                    />
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
