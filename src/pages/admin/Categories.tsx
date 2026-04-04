import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ChevronRight, 
  LayoutGrid, Smartphone, Laptop, Shirt, Home as HomeIcon, 
  Sparkles, Gamepad2, Watch, Headphones, Camera, Coffee, 
  Baby, Dumbbell, Save, X, Settings, Zap, AlertCircle
} from 'lucide-react';
import { categoryAPI } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { OrbitLoader } from '../../components/ui/OrbitLoader';

const ICON_OPTIONS = [
  { id: 'Headphones', icon: Headphones },
  { id: 'Smartphone', icon: Smartphone },
  { id: 'Laptop', icon: Laptop },
  { id: 'Shirt', icon: Shirt },
  { id: 'HomeIcon', icon: HomeIcon },
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Gamepad2', icon: Gamepad2 },
  { id: 'Watch', icon: Watch },
  { id: 'Camera', icon: Camera },
  { id: 'Coffee', icon: Coffee },
  { id: 'Baby', icon: Baby },
  { id: 'Dumbbell', icon: Dumbbell },
  { id: 'LayoutGrid', icon: LayoutGrid },
];

const COLOR_OPTIONS = [
  { id: 'blue', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'emerald', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'violet', color: 'text-violet-500', bg: 'bg-violet-50' },
  { id: 'rose', color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'amber', color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'pink', color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'indigo', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'slate', color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'cyan', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'orange', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'yellow', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'lime', color: 'text-lime-500', bg: 'bg-lime-50' },
];

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  active?: boolean;
  comingSoonMessage?: string;
  bannerImage?: string;
  interestCount?: number;
  customFields: CustomField[];
  order: number;
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({
    name: '',
    icon: 'LayoutGrid',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    active: true,
    comingSoonMessage: "We're preparing amazing products in this category",
    bannerImage: '',
    customFields: [],
    order: 0
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const cats = await categoryAPI.getAll();
        setCategories(cats || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!currentCategory.name) return;
    
    try {
      if (currentCategory.id) {
        const { id, ...data } = currentCategory as any;
        await categoryAPI.update(id as string, data);
      } else {
        await categoryAPI.create({
          ...currentCategory,
          order: categories.length
        });
      }
      setIsEditing(false);
        setCurrentCategory({
          name: '',
          icon: 'LayoutGrid',
          color: 'text-slate-500',
          bg: 'bg-slate-50',
          active: true,
          comingSoonMessage: "We're preparing amazing products in this category",
          bannerImage: '',
          customFields: [],
          order: 0
        });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
      try {
        await categoryAPI.delete(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const addCustomField = () => {
    const name = window.prompt('Enter field name (e.g. ram_size)');
    const label = window.prompt('Enter field label (e.g. RAM Size)');
    if (name && label) {
      setCurrentCategory({
        ...currentCategory,
        customFields: [
          ...(currentCategory.customFields || []),
          { name, label, type: 'text', required: false }
        ]
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Category Management</h2>
          <p className="text-slate-500 font-medium">Define product categories and their dynamic listing fields.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentCategory({
              name: '',
              icon: 'LayoutGrid',
              color: 'text-slate-500',
              bg: 'bg-slate-50',
              active: true,
              comingSoonMessage: "We're preparing amazing products in this category",
              bannerImage: '',
              customFields: [],
              order: categories.length
            });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-24 bg-white rounded-3xl border border-slate-100">
              <OrbitLoader label="Loading categories..." size={28} />
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center shadow-inner`}>
                      {React.createElement(ICON_OPTIONS.find(i => i.id === cat.icon)?.icon || LayoutGrid, { size: 28 })}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setCurrentCategory(cat);
                          setIsEditing(true);
                        }}
                        className="p-3 bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-3 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{cat.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${cat.active === false ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {cat.active === false ? 'Coming Soon' : 'Active'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {cat.customFields?.length || 0} Fields
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                      {cat.interestCount || 0} Requests
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-24 rounded-3xl border border-slate-100 shadow-sm text-center">
              <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No categories defined yet.</p>
            </div>
          )}
        </div>

        {/* Edit/Add Panel */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl h-fit sticky top-24"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentCategory.id ? 'Edit Category' : 'New Category'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category Name</label>
                  <input 
                    type="text"
                    value={currentCategory.name}
                    onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-bold"
                    placeholder="e.g. Electronics"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{currentCategory.active === false ? 'Coming Soon' : 'Live Category'}</span>
                      <input
                        type="checkbox"
                        checked={currentCategory.active !== false}
                        onChange={(e) => setCurrentCategory({ ...currentCategory, active: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Interest Requests</p>
                    <p className="mt-3 text-2xl font-black text-slate-900">{currentCategory.interestCount || 0}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Coming Soon Message</label>
                  <textarea
                    value={currentCategory.comingSoonMessage || ''}
                    onChange={e => setCurrentCategory({ ...currentCategory, comingSoonMessage: e.target.value })}
                    className="w-full min-h-[108px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                    placeholder="We're preparing amazing products in this category"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Coming Soon Banner Image</label>
                  <input
                    type="text"
                    value={currentCategory.bannerImage || ''}
                    onChange={e => setCurrentCategory({ ...currentCategory, bannerImage: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-bold"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setCurrentCategory({...currentCategory, icon: opt.id})}
                        className={`p-3 rounded-xl border transition-all ${currentCategory.icon === opt.id ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-violet-200'}`}
                      >
                        <opt.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Color Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setCurrentCategory({...currentCategory, color: opt.color, bg: opt.bg})}
                        className={`h-10 rounded-xl border transition-all ${currentCategory.color === opt.color ? 'ring-2 ring-violet-500 ring-offset-2' : 'border-slate-100'}`}
                        style={{ backgroundColor: opt.id }}
                      >
                        <div className={`w-full h-full rounded-lg ${opt.bg}`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Custom Fields</label>
                    <button 
                      onClick={addCustomField}
                      className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {currentCategory.customFields?.map((field, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 group relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{field.label}</span>
                          <button 
                            onClick={() => {
                              const newFields = [...(currentCategory.customFields || [])];
                              newFields.splice(idx, 1);
                              setCurrentCategory({...currentCategory, customFields: newFields});
                            }}
                            className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            value={field.type}
                            onChange={e => {
                              const newFields = [...(currentCategory.customFields || [])];
                              newFields[idx].type = e.target.value as any;
                              setCurrentCategory({...currentCategory, customFields: newFields});
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                          >
                            <option value="text">Text Input</option>
                            <option value="number">Number</option>
                            <option value="select">Dropdown</option>
                          </select>
                          <div className="flex items-center gap-2 px-2">
                            <input 
                              type="checkbox"
                              checked={field.required}
                              onChange={e => {
                                const newFields = [...(currentCategory.customFields || [])];
                                newFields[idx].required = e.target.checked;
                                setCurrentCategory({...currentCategory, customFields: newFields});
                              }}
                              className="w-3 h-3 accent-violet-600"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Required</span>
                          </div>
                        </div>
                        {field.type === 'select' && (
                          <input 
                            type="text"
                            placeholder="Options (comma separated)"
                            value={field.options?.join(', ') || ''}
                            onChange={e => {
                              const newFields = [...(currentCategory.customFields || [])];
                              newFields[idx].options = e.target.value.split(',').map(s => s.trim());
                              setCurrentCategory({...currentCategory, customFields: newFields});
                            }}
                            className="w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                          />
                        )}
                      </div>
                    ))}
                    {(!currentCategory.customFields || currentCategory.customFields.length === 0) && (
                      <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No custom fields defined</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-violet-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {currentCategory.id ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
