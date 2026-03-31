import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Upload, 
  X, 
  Save, 
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { bannerAPI } from '../../services/api';
import { uploadImageFile } from '../../lib/uploadClient';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  link: string;
  color: string;
  badge: string;
  order: number;
  clicks?: number;
  clickEvents?: number;
  lastClickedAt?: string | null;
}

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerAnalytics, setBannerAnalytics] = useState<Record<string, { clicks: number; lastClickedAt: string | null }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    cta: 'Shop Now',
    link: '/category/all',
    color: 'from-indigo-900 via-violet-800 to-purple-900',
    badge: 'Limited Time Offer',
    order: 0
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const [data, analytics] = await Promise.all([
        bannerAPI.getAll(),
        bannerAPI.getAnalytics().catch(() => []),
      ]);
      const analyticsMap = Object.fromEntries(
        (analytics || []).map((banner: Banner) => [
          banner.id,
          {
            clicks: banner.clickEvents ?? banner.clicks ?? 0,
            lastClickedAt: banner.lastClickedAt ?? null,
          },
        ])
      );
      setBannerAnalytics(analyticsMap);
      setBanners((data || []).sort((a: Banner, b: Banner) => (a.order || 0) - (b.order || 0)));
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageFile(file, {
        folder: 'banners',
        fileName: formData.title || file.name,
      });
      setFormData({ ...formData, image: url });
      setIsUploading(false);
    } catch (error) {
      console.error('Error handling file:', error);
      alert('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Please upload an image first.');
      return;
    }

    try {
      if (editingBanner) {
        await bannerAPI.update(editingBanner.id, { ...formData });
      } else {
        await bannerAPI.create({ ...formData, order: banners.length });
      }
      await loadBanners();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner.');
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      await bannerAPI.delete(banner.id);
      await loadBanners();
      // No remote storage deletion implemented yet; local data-URLs require no action.
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const banner1 = banners[index];
    const banner2 = banners[newIndex];

    try {
      await Promise.all([
        bannerAPI.update(banner1.id, { order: newIndex }),
        bannerAPI.update(banner2.id, { order: index }),
      ]);
      await loadBanners();
    } catch (error) {
      console.error('Error reordering banners:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      cta: 'Shop Now',
      link: '/category/all',
      color: 'from-indigo-900 via-violet-800 to-purple-900',
      badge: 'Limited Time Offer',
      order: 0
    });
    setEditingBanner(null);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      cta: banner.cta,
      link: banner.link,
      color: banner.color,
      badge: banner.badge,
      order: banner.order
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Banner Management</h2>
          <p className="text-slate-500 font-medium">Manage your homepage hero slideshow banners</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200"
        >
          <Plus size={18} /> Add New Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all">
            <div className="md:w-72 h-48 md:h-auto relative group overflow-hidden bg-slate-100">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.color} opacity-20`}></div>
            </div>
            <div className="flex-1 p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-100">
                    {banner.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-slate-400 hover:text-violet-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={20} />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === banners.length - 1}
                      className="p-2 text-slate-400 hover:text-violet-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{banner.title}</h3>
                  <p className="text-slate-500 font-medium text-sm">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1"><ArrowRight size={14} /> {banner.cta}</span>
                  <span className="flex items-center gap-1"><ArrowRight size={14} /> {banner.link}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banner Clicks</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{bannerAnalytics[banner.id]?.clicks ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Click</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {bannerAnalytics[banner.id]?.lastClickedAt
                        ? new Date(bannerAnalytics[banner.id].lastClickedAt as string).toLocaleString()
                        : 'No clicks yet'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => openEditModal(banner)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-violet-50 hover:text-violet-600 transition-all"
                >
                  <Edit2 size={14} /> Edit Banner
                </button>
                <button 
                  onClick={() => handleDelete(banner)}
                  className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <ImageIcon size={40} />
            </div>
            <div>
              <p className="text-slate-900 font-black text-lg">No banners found</p>
              <p className="text-slate-400 font-medium">Add your first hero banner to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">Fill in the details for your homepage banner</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm"
                    placeholder="e.g. Big Payday Sale"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge Text</label>
                  <input
                    type="text"
                    required
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm"
                    placeholder="e.g. Limited Time Offer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtitle / Description</label>
                <textarea
                  required
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm min-h-[100px]"
                  placeholder="Describe the offer..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CTA Button Text</label>
                  <input
                    type="text"
                    required
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CTA Link URL</label>
                  <input
                    type="text"
                    required
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Gradient (Tailwind Classes)</label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-violet-500 transition-all font-bold text-sm"
                  placeholder="from-indigo-900 via-violet-800 to-purple-900"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Image</label>
                <div className="flex items-center gap-6">
                  {formData.image ? (
                    <div className="relative w-40 h-24 rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={formData.image} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-violet-300 transition-all group">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-600 transition-all">
                        {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">Click to upload from PC</p>
                        <p className="text-xs text-slate-400">PNG, JPG or WEBP (Max 5MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingBanner ? 'Update Banner' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
