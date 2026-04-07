import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Package, Tag, Settings, LogOut, Search, Bell, TrendingUp, DollarSign, ShoppingCart, Plus, Image as ImageIcon, Loader2, Trash2, X, ChevronRight, Store, Database, Upload, CheckCircle2, Shield, Filter, Edit, Pencil, Eye } from 'lucide-react';
import { Product } from '../store/cart';
import { GoogleGenAI } from "@google/genai";
import { compressImage } from '../lib/imageUtils';
import { dashboardAPI, productAPI, sellerAPI, categoryAPI, adminOpsAPI, adminProductAPI, orderAPI, customerAPI, getAuthHeaders } from '../services/api';
import { useAuthStore } from '../store/auth';

interface Vendor {
  id: string;
  name: string;
  email: string;
  role: string;
  productsCount: number;
  totalSales: number;
  status: 'Active' | 'Pending' | 'Suspended';
}

export function AdminDashboard() {
  const { user: authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  
  const initialProductState = {
    title: '',
    subtitle: '',
    brand: '',
    category: 'Electronics',
    subcategory: 'Mobiles',
    productType: '',
    condition: 'New',
    sku: '',
    barcode: '',
    slug: '',
    status: 'Active',
    price: '',
    salePrice: '',
    costPrice: '',
    originalPrice: '',
    taxIncluded: true,
    discountType: 'Percentage',
    discountAmount: '',
    offerStartDate: '',
    offerEndDate: '',
    stockQuantity: '',
    lowStockAlert: '5',
    stockStatus: 'In Stock',
    unlimitedStock: false,
    serialNumber: '',
    warehouseLocation: '',
    image: '',
    gallery: [] as string[],
    videoUrl: '',
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [] as string[],
    specifications: {} as Record<string, string>,
    whatsInBox: '',
    warrantyDetails: '',
    returnPolicy: '15 Days Returnable',
    deliveryNotes: 'Standard delivery in 2-3 days',
    installationNotes: '',
    isFeatured: false,
    isBestseller: false,
    isBestChoice: false,
    isOnSale: false,
    isTrending: false,
    isNewArrival: false,
    isRecommended: false,
    isFlashDeal: false,
    isBlackFriday: false,
    isOfferCampaign: false,
    isBundleOffer: false,
    isHotDeals: false,
    isLimitedTime: false,
    isTodaysDeal: false,
    isMostPopular: false,
    isCategorySpotlight: false,
    isEditorsPick: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    searchTags: '',
    deliveryCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain', 'Al Ain'],
    isSameDayDelivery: false,
    isCodAvailable: true,
    vatHandling: '5% VAT Included',
    isWarrantyUAE: true,
    sellerLocationUAE: 'Dubai',
    arabicName: '',
    arabicDescription: '',
    arabicKeyFeatures: [] as string[],
    arabicSpecifications: {} as Record<string, string>,
  };

  const [newProduct, setNewProduct] = useState(initialProductState);

  const [formTab, setFormTab] = useState('basic');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error("Fetch Categories Error:", error);
    }
  };

  const handleGenerateAIContent = async () => {
    if (!newProduct.title || !newProduct.category) {
      setErrorMsg("Please enter a title and category first.");
      return;
    }
    setIsGeneratingContent(true);
    try {
      const data = await adminOpsAPI.generateContent({
        title: newProduct.title,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        condition: newProduct.condition,
      });

      setNewProduct(prev => ({
        ...prev,
        subtitle: data.subtitle || prev.subtitle,
        shortDescription: data.shortDescription || prev.shortDescription,
        fullDescription: data.fullDescription || prev.fullDescription,
        keyFeatures: data.keyFeatures || prev.keyFeatures,
        specifications: data.specifications || prev.specifications,
        whatsInBox: data.whatsInBox || prev.whatsInBox,
        arabicName: data.arabicName || prev.arabicName,
        arabicDescription: data.arabicDescription || prev.arabicDescription,
        arabicKeyFeatures: data.arabicKeyFeatures || prev.arabicKeyFeatures,
      }));
      setSuccessMsg("AI Content generated successfully!");
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to generate content.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  useEffect(() => {
    setCurrentUser(authUser || null);
  }, [authUser]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'vendors') {
      fetchVendors();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getAdminDashboard({ range: '30d' });
      setStats({
        revenue: data?.totalSales || stats.revenue,
        orders: data?.totalOrders || stats.orders,
        customers: data?.totalCustomers || stats.customers,
        products: data?.totalProducts || stats.products,
      });
    } catch (error) {
      console.error("Fetch Stats Error:", error);
    }
  };

  const [stats, setStats] = useState({
    revenue: 124500,
    orders: 1245,
    customers: 8432,
    products: 0
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    (c.fullName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getAllOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerAPI.getAllAdmin();
      setCustomers(data || []);
    } catch (error) {
      console.error("Fetch Customers Error:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const apiProducts = await productAPI.getAll();
      setProducts(apiProducts || []);
    } catch (error) {
      console.error("Fetch Products Error:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await sellerAPI.getAll();
      setVendors(data || []);
    } catch (error) {
      console.error("Fetch Vendors Error:", error);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerateImage = async () => {
    if (!newProduct.title) {
      setErrorMsg("Please enter a product title first to generate an accurate image.");
      return;
    }
    
    setIsGeneratingImage(true);
    setErrorMsg('');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('TODO')) {
        throw new Error('GEMINI_API_KEY is missing or invalid. Please set it in the Secrets panel in AI Studio.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Professional product photography of ${newProduct.title}, high-end ecommerce style, clean white background, soft studio lighting, ultra-realistic 8K, sharp focus, premium marketing visual.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        }
      });

      let base64Image = '';
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (base64Image) {
        setNewProduct(prev => ({ ...prev, image: base64Image }));
      } else {
        setErrorMsg("Failed to generate image. No image data returned.");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "An error occurred while generating the image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const compressed = await compressImage(base64String, 800, 800, 0.6);
        setNewProduct(prev => ({ ...prev, image: compressed }));
      } catch (err) {
        console.error('Compression failed:', err);
        setErrorMsg('Failed to process image. Try a smaller file.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    setErrorMsg('');
    
    const editing = editingProduct as any;
    const productData = {
      ...newProduct,
      price: Number(newProduct.price),
      originalPrice: Number(newProduct.originalPrice) || Number(newProduct.price),
      discount: newProduct.originalPrice && Number(newProduct.originalPrice) > Number(newProduct.price) 
        ? Math.round((1 - Number(newProduct.price) / Number(newProduct.originalPrice)) * 100) 
        : 0,
      rating: editing?.rating || 5.0,
      reviews: editing?.reviews || 0,
      delivery: editing?.delivery || "Tomorrow, 24 Mar",
      stock: editing?.stock || "In Stock",
      vendorId: editing?.vendorId || "v1",
      image: newProduct.image || '',
    };

    try {
      if (editingProduct) {
        await adminProductAPI.update(editingProduct.id, productData);
      } else {
        await adminProductAPI.create(productData);
      }

      setIsAddingProduct(false);
      setEditingProduct(null);
      setNewProduct(initialProductState);
      fetchProducts();
      setSuccessMsg(editingProduct ? "Product updated successfully!" : "Product saved successfully!");
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error: any) {
      console.error("Save Error Details:", error);
      setErrorMsg(error.message || "Failed to save product.");
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      // Delete via API
      await adminProductAPI.delete(id);
      
      fetchProducts();
      setSuccessMsg("Product deleted successfully!");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Delete Error:", error);
      setErrorMsg("Failed to delete product.");
    }
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEditProduct = (product: Product) => {
    const editing = product as any;
    setEditingProduct(product);
    setNewProduct({
      ...initialProductState,
      ...editing,
      price: String(editing.price ?? ''),
      salePrice: String(editing.salePrice || ''),
      costPrice: String(editing.costPrice || ''),
      originalPrice: String(editing.originalPrice || editing.price || ''),
      discountAmount: String(editing.discountAmount || ''),
      stockQuantity: String(editing.stockQuantity || ''),
      lowStockAlert: String(editing.lowStockAlert || '5'),
    });
    setIsAddingProduct(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      alert('Launch mode is active. Use live seller onboarding, product approval, and marketplace workflows.');
    } catch (error) {
      console.error("Launch mode notice:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'vendors', icon: Store, label: 'Vendors' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'offers', icon: Tag, label: 'Offers & Coupons' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-slate-400 flex flex-col hidden md:flex border-r border-slate-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="p-8 border-b border-slate-800/50 relative z-10">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-blue-400 transition-all">
              EXSHOPI<span className="text-violet-500">.</span>
            </span>
            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-violet-500/20 ml-2">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 relative z-10 custom-scrollbar overflow-y-auto">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 px-4">Menu</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-bold text-sm group ${
                activeTab === item.id 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                  : 'hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-violet-400 transition-colors'} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight size={16} className="text-violet-300" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50 relative z-10">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-colors font-bold text-sm">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="glass border-b border-slate-200/50 h-20 flex items-center justify-between px-8 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{activeTab}</h1>
            <button 
              onClick={handleSeedData}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors disabled:opacity-50"
            >
              {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              Seed Data
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search products, orders..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl text-sm font-medium transition-all outline-none w-72"
              />
            </div>
            
            <button className="relative p-2.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200 cursor-pointer group">
              {currentUser ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white flex items-center justify-center font-black shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    {currentUser.email?.[0].toUpperCase() || 'A'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-violet-600 transition-colors">
                      {currentUser.email}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Super Admin</p>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => navigate('/admin/login')}
                  className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-shadow neon-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <DollarSign size={28} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <TrendingUp size={14} /> +12.5%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Revenue</h3>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">AED {stats.revenue.toLocaleString()}</p>
                </div>
                
                <div className="glass p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-shadow neon-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <ShoppingCart size={28} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <TrendingUp size={14} /> +8.2%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Orders</h3>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.orders}</p>
                </div>
 
                <div className="glass p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-shadow neon-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                      <Users size={28} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <TrendingUp size={14} /> +15.3%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Active Customers</h3>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.customers.toLocaleString()}</p>
                </div>

                <div className="glass p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-shadow neon-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Package size={28} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200">
                      <TrendingUp size={14} className="rotate-180" /> -2.4%
                    </span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Products</h3>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{products.length}</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] overflow-hidden neon-border">
                  <div className="p-8 border-b border-slate-200/50 flex items-center justify-between bg-white/30 backdrop-blur-md">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Orders</h2>
                    <button className="text-sm font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-4 py-2 rounded-xl transition-colors">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/30 backdrop-blur-md text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/50">
                        <tr>
                          <th className="px-8 py-5">Order ID</th>
                          <th className="px-8 py-5">Customer</th>
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5">Amount</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                              No orders matching "{searchTerm}"
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/50 transition-colors group">
                              <td className="px-8 py-5 font-black text-slate-900">#EXS-{order.id}</td>
                              <td className="px-8 py-5 font-medium text-slate-700">{order.customerName}</td>
                              <td className="px-8 py-5 text-slate-500 font-medium">{order.date}</td>
                              <td className="px-8 py-5 font-black text-slate-900">AED {order.amount.toLocaleString()}</td>
                              <td className="px-8 py-5">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                                  order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button className="text-violet-600 hover:text-violet-800 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                  <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] neon-border">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => {
                          setActiveTab('products');
                          setIsAddingProduct(true);
                        }}
                        className="flex items-center gap-4 p-4 bg-violet-50 text-violet-700 rounded-2xl hover:bg-violet-100 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Add New Product</p>
                          <p className="text-xs text-violet-500 font-medium">Create a new listing</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ShoppingBag size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Manage Orders</p>
                          <p className="text-xs text-blue-500 font-medium">Process pending orders</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('vendors')}
                        className="flex items-center gap-4 p-4 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Store size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Vendor Requests</p>
                          <p className="text-xs text-amber-500 font-medium">Approve new sellers</p>
                        </div>
                      </button>

                      <button 
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group disabled:opacity-50"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          {isSeeding ? <Loader2 size={24} className="animate-spin" /> : <Database size={24} />}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Sync Website Data</p>
                          <p className="text-xs text-emerald-500 font-medium">Refresh storefront products</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] neon-border">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">System Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Firestore Sync</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Gemini AI API</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Server Status</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 size={12} /> Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Management</h2>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-0.5"
                >
                  <Plus size={20} /> Add New Product
                </button>
              </div>

              {isAddingProduct && (
                <div ref={formRef} className="glass p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.15)] relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <button 
                    onClick={() => setIsAddingProduct(false)}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
                  >
                    <X size={20} />
                  </button>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight relative z-10">Add New Product</h3>
                  
                  {errorMsg && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold relative z-10 flex items-center gap-2">
                      <X size={16} className="shrink-0" /> {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm font-bold relative z-10 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-8 border-b border-slate-100 overflow-x-auto pb-2 scrollbar-hide">
                    {['basic', 'pricing', 'inventory', 'media', 'content', 'specifications', 'classification', 'seo', 'uae'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFormTab(tab)}
                        className={`px-4 py-2 text-sm font-bold capitalize whitespace-nowrap transition-all border-b-2 ${
                          formTab === tab ? 'text-violet-600 border-violet-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-8 relative z-10">
                    {formTab === 'basic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Product Title</label>
                          <input 
                            type="text" required value={newProduct.title}
                            onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="e.g. Apple iPhone 15 Pro Max 256GB Natural Titanium"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subtitle / Catchphrase</label>
                          <input 
                            type="text" value={newProduct.subtitle}
                            onChange={e => setNewProduct({...newProduct, subtitle: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="e.g. Titanium. So strong. So light. So Pro."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Brand</label>
                          <input 
                            type="text" required value={newProduct.brand}
                            onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                          <select 
                            value={newProduct.category}
                            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subcategory</label>
                          <select 
                            value={newProduct.subcategory}
                            onChange={e => setNewProduct({...newProduct, subcategory: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            {categories.find(c => c.name === newProduct.category)?.subcategories.map((sub: any) => (
                              <option key={sub.slug} value={sub.name}>{sub.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Condition</label>
                          <select 
                            value={newProduct.condition}
                            onChange={e => setNewProduct({...newProduct, condition: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Used - Excellent">Used - Excellent</option>
                            <option value="Used - Good">Used - Good</option>
                            <option value="Used - Fair">Used - Fair</option>
                            <option value="Refurbished">Refurbished</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SKU</label>
                          <input 
                            type="text" value={newProduct.sku}
                            onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status</label>
                          <select 
                            value={newProduct.status}
                            onChange={e => setNewProduct({...newProduct, status: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formTab === 'pricing' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Regular Price (AED)</label>
                          <input 
                            type="number" required value={newProduct.price}
                            onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sale Price (AED)</label>
                          <input 
                            type="number" value={newProduct.salePrice}
                            onChange={e => setNewProduct({...newProduct, salePrice: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Discount Type</label>
                          <select 
                            value={newProduct.discountType}
                            onChange={e => setNewProduct({...newProduct, discountType: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Fixed Amount">Fixed Amount (AED)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Discount Amount</label>
                          <input 
                            type="number" value={newProduct.discountAmount}
                            onChange={e => setNewProduct({...newProduct, discountAmount: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Offer Start Date</label>
                          <input 
                            type="date" value={newProduct.offerStartDate}
                            onChange={e => setNewProduct({...newProduct, offerStartDate: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Offer End Date</label>
                          <input 
                            type="date" value={newProduct.offerEndDate}
                            onChange={e => setNewProduct({...newProduct, offerEndDate: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" checked={newProduct.taxIncluded}
                            onChange={e => setNewProduct({...newProduct, taxIncluded: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <label className="text-sm font-bold text-slate-700">Tax Included in Price (5% VAT)</label>
                        </div>
                      </div>
                    )}

                    {formTab === 'inventory' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Stock Quantity</label>
                          <input 
                            type="number" value={newProduct.stockQuantity}
                            onChange={e => setNewProduct({...newProduct, stockQuantity: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Low Stock Alert</label>
                          <input 
                            type="number" value={newProduct.lowStockAlert}
                            onChange={e => setNewProduct({...newProduct, lowStockAlert: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Stock Status</label>
                          <select 
                            value={newProduct.stockStatus}
                            onChange={e => setNewProduct({...newProduct, stockStatus: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="In Stock">In Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                            <option value="On Backorder">On Backorder</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Serial Number / Batch No.</label>
                          <input 
                            type="text" value={newProduct.serialNumber}
                            onChange={e => setNewProduct({...newProduct, serialNumber: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Warehouse Location</label>
                          <input 
                            type="text" value={newProduct.warehouseLocation}
                            onChange={e => setNewProduct({...newProduct, warehouseLocation: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" checked={newProduct.unlimitedStock}
                            onChange={e => setNewProduct({...newProduct, unlimitedStock: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <label className="text-sm font-bold text-slate-700">Unlimited Stock</label>
                        </div>
                      </div>
                    )}

                    {formTab === 'media' && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Main Product Image (Cover)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 min-h-[240px] relative group hover:border-violet-400 transition-colors cursor-pointer overflow-hidden">
                              {newProduct.image ? (
                                <img src={newProduct.image} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                              ) : (
                                <div className="text-center">
                                  <ImageIcon size={48} className="text-slate-300 mx-auto mb-3" />
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Click to upload main image</p>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage} className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                                  {isGeneratingImage ? <Loader2 className="animate-spin" size={16} /> : 'AI Generate'}
                                </button>
                                <button type="button" onClick={() => document.getElementById('main-img-upload')?.click()} className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                                  Upload
                                </button>
                              </div>
                              <input id="main-img-upload" type="file" className="hidden" onChange={handleFileUpload} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Video Presentation (URL)</label>
                            <div className="space-y-4">
                              <input 
                                type="url" value={newProduct.videoUrl}
                                onChange={e => setNewProduct({...newProduct, videoUrl: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                                placeholder="https://youtube.com/watch?v=..."
                              />
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Video Preview Placeholder</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Product Gallery (Min 10 images recommended)</label>
                            <button 
                              type="button" 
                              onClick={() => document.getElementById('gallery-upload')?.click()}
                              className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                            >
                              <Plus size={14} /> Add Images
                            </button>
                            <input id="gallery-upload" type="file" multiple className="hidden" onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const newUrls = Array.from(files).map(f => URL.createObjectURL(f as Blob));
                                setNewProduct({ ...newProduct, gallery: [...newProduct.gallery, ...newUrls] });
                              }
                            }} />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {newProduct.gallery.map((img, idx) => (
                              <div key={idx} className="aspect-square rounded-xl border border-slate-200 bg-white p-1 relative group overflow-hidden">
                                <img src={img} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <button 
                                    type="button" 
                                    onClick={() => setNewProduct({ ...newProduct, image: img })}
                                    className="text-[10px] font-bold text-white bg-violet-600 px-2 py-1 rounded-md hover:bg-violet-700"
                                  >
                                    Set Cover
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const newGallery = [...newProduct.gallery];
                                      newGallery.splice(idx, 1);
                                      setNewProduct({ ...newProduct, gallery: newGallery });
                                    }}
                                    className="text-[10px] font-bold text-white bg-rose-600 px-2 py-1 rounded-md hover:bg-rose-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="absolute top-1 left-1 bg-slate-900/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                  {idx + 1}
                                </div>
                              </div>
                            ))}
                            <button 
                              type="button"
                              onClick={() => document.getElementById('gallery-upload')?.click()}
                              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-all"
                            >
                              <Plus size={24} />
                              <span className="text-[10px] font-bold uppercase mt-1">Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {formTab === 'content' && (
                      <div className="space-y-6">
                        <div className="flex justify-end">
                          <button 
                            type="button" 
                            onClick={handleGenerateAIContent}
                            disabled={isGeneratingContent}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50"
                          >
                            {isGeneratingContent ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                            Generate Unique AI Content
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Short Description</label>
                            <textarea 
                              rows={2} value={newProduct.shortDescription}
                              onChange={e => setNewProduct({...newProduct, shortDescription: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Description</label>
                            <textarea 
                              rows={5} value={newProduct.fullDescription}
                              onChange={e => setNewProduct({...newProduct, fullDescription: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Key Features (One per line)</label>
                            <textarea 
                              rows={4} value={newProduct.keyFeatures.join('\n')}
                              onChange={e => setNewProduct({...newProduct, keyFeatures: e.target.value.split('\n')})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">What's in the Box</label>
                            <textarea 
                              rows={4} value={newProduct.whatsInBox}
                              onChange={e => setNewProduct({...newProduct, whatsInBox: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formTab === 'specifications' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-900">Product Specifications</h3>
                          <button
                            type="button"
                            onClick={() => {
                              const key = `Spec ${Object.keys(newProduct.specifications).length + 1}`;
                              setNewProduct({
                                ...newProduct,
                                specifications: { ...newProduct.specifications, [key]: '' }
                              });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                          >
                            <Plus size={16} />
                            Add Specification
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {Object.entries(newProduct.specifications).map(([key, value], index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 group">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spec Name</label>
                                  <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => {
                                      const newKey = e.target.value;
                                      const newSpecs = { ...newProduct.specifications };
                                      const val = newSpecs[key];
                                      delete newSpecs[key];
                                      newSpecs[newKey] = val;
                                      setNewProduct({ ...newProduct, specifications: newSpecs });
                                    }}
                                    placeholder="e.g. Processor"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spec Value</label>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => {
                                      setNewProduct({
                                        ...newProduct,
                                        specifications: { ...newProduct.specifications, [key]: e.target.value }
                                      });
                                    }}
                                    placeholder="e.g. AMD Ryzen 9 8945HS"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSpecs = { ...newProduct.specifications };
                                  delete newSpecs[key];
                                  setNewProduct({ ...newProduct, specifications: newSpecs });
                                }}
                                className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          
                          {Object.keys(newProduct.specifications).length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Database size={32} />
                              </div>
                              <p className="text-slate-500 font-medium">No specifications added yet.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewProduct({
                                    ...newProduct,
                                    specifications: { 'Processor': '', 'RAM': '', 'Storage': '' }
                                  });
                                }}
                                className="mt-4 text-violet-600 font-bold text-sm hover:underline"
                              >
                                Add common specs
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {formTab === 'classification' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[
                          { id: 'isFeatured', label: 'Featured Product' },
                          { id: 'isBestseller', label: 'Bestseller' },
                          { id: 'isTrending', label: 'Trending Now' },
                          { id: 'isNewArrival', label: 'New Arrival' },
                          { id: 'isHotDeals', label: 'Hot Deal' },
                          { id: 'isLimitedTime', label: 'Limited Time' },
                          { id: 'isOnSale', label: 'On Sale' },
                          { id: 'isFlashDeal', label: 'Flash Deal' },
                          { id: 'isBlackFriday', label: 'Black Friday' },
                          { id: 'isOfferCampaign', label: 'Offer Campaign' },
                          { id: 'isTodaysDeal', label: 'Today\'s Deal' },
                          { id: 'isMostPopular', label: 'Most Popular' },
                          { id: 'isCategorySpotlight', label: 'Category Spotlight' },
                          { id: 'isEditorsPick', label: 'Editor\'s Pick' },
                          { id: 'isBundleOffer', label: 'Bundle Offer' },
                          { id: 'isRecommended', label: 'Recommended' },
                        ].map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                            <input 
                              type="checkbox" checked={(newProduct as any)[item.id]}
                              onChange={e => setNewProduct({...newProduct, [item.id]: e.target.checked})}
                              className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                            <label className="text-sm font-bold text-slate-700 cursor-pointer group-hover:text-violet-600 transition-colors">{item.label}</label>
                          </div>
                        ))}
                      </div>
                    )}

                    {formTab === 'seo' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Title</label>
                          <input 
                            type="text" value={newProduct.metaTitle}
                            onChange={e => setNewProduct({...newProduct, metaTitle: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="SEO Title (max 60 chars)"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Description</label>
                          <textarea 
                            rows={3} value={newProduct.metaDescription}
                            onChange={e => setNewProduct({...newProduct, metaDescription: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="SEO Description (max 160 chars)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Meta Keywords</label>
                          <input 
                            type="text" value={newProduct.metaKeywords}
                            onChange={e => setNewProduct({...newProduct, metaKeywords: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="keyword1, keyword2, ..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Search Tags</label>
                          <input 
                            type="text" value={newProduct.searchTags}
                            onChange={e => setNewProduct({...newProduct, searchTags: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="Internal search tags"
                          />
                        </div>
                      </div>
                    )}

                    {formTab === 'uae' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-arabic">اسم المنتج (باللغة العربية)</label>
                          <input 
                            type="text" dir="rtl" value={newProduct.arabicName}
                            onChange={e => setNewProduct({...newProduct, arabicName: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-lg font-bold text-right font-arabic"
                            placeholder="مثال: ايفون 15 برو ماكس"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-arabic">وصف المنتج (باللغة العربية)</label>
                          <textarea 
                            rows={4} dir="rtl" value={newProduct.arabicDescription}
                            onChange={e => setNewProduct({...newProduct, arabicDescription: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-base font-medium text-right font-arabic"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">VAT Handling</label>
                          <select 
                            value={newProduct.vatHandling}
                            onChange={e => setNewProduct({...newProduct, vatHandling: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="5% VAT Included">5% VAT Included</option>
                            <option value="VAT Exempt">VAT Exempt</option>
                            <option value="Zero Rated">Zero Rated</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Seller Location (UAE)</label>
                          <select 
                            value={newProduct.sellerLocationUAE}
                            onChange={e => setNewProduct({...newProduct, sellerLocationUAE: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="Dubai">Dubai</option>
                            <option value="Abu Dhabi">Abu Dhabi</option>
                            <option value="Sharjah">Sharjah</option>
                            <option value="Ajman">Ajman</option>
                            <option value="Fujairah">Fujairah</option>
                            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                            <option value="Umm Al Quwain">Umm Al Quwain</option>
                            <option value="Al Ain">Al Ain</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Warranty Support</label>
                          <select 
                            value={newProduct.isWarrantyUAE ? 'UAE Warranty' : 'No Warranty'}
                            onChange={e => setNewProduct({...newProduct, isWarrantyUAE: e.target.value === 'UAE Warranty'})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                          >
                            <option value="UAE Warranty">Official UAE Warranty</option>
                            <option value="International Warranty">International Warranty</option>
                            <option value="No Warranty">No Warranty</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Return Policy</label>
                          <input 
                            type="text" value={newProduct.returnPolicy}
                            onChange={e => setNewProduct({...newProduct, returnPolicy: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                            placeholder="e.g. 15 Days Returnable"
                          />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <input 
                            type="checkbox" checked={newProduct.isSameDayDelivery}
                            onChange={e => setNewProduct({...newProduct, isSameDayDelivery: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <label className="text-sm font-bold text-slate-700">Same Day Delivery (Dubai/Sharjah)</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <input 
                            type="checkbox" checked={newProduct.isCodAvailable}
                            onChange={e => setNewProduct({...newProduct, isCodAvailable: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <label className="text-sm font-bold text-slate-700">Cash on Delivery (COD) Available</label>
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                      <button 
                        type="button" onClick={() => setIsAddingProduct(false)}
                        className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-slate-900 hover:bg-violet-600 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-900/20 hover:shadow-violet-600/30 hover:-translate-y-0.5"
                      >
                        {editingProduct ? 'Update Product' : 'Save Product'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="glass rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/30 backdrop-blur-md text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/50">
                      <tr>
                        <th className="px-8 py-5">Product</th>
                        <th className="px-8 py-5">Category</th>
                        <th className="px-8 py-5">Price</th>
                        <th className="px-8 py-5">Stock</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                            <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                              <Package size={24} className="text-slate-400" />
                            </div>
                            {searchTerm ? `No products matching "${searchTerm}"` : "No products found. Add a product to get started."}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-white/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-100 p-2 shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                <img src={product.image} alt={product.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-sm" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1 max-w-xs text-base group-hover:text-violet-600 transition-colors">{product.title}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-medium text-slate-600">{product.category}</td>
                          <td className="px-8 py-5 font-black text-slate-900 text-base">AED {product.price}</td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {(product as any).stock || ((product as any).stockQuantity ? `${(product as any).stockQuantity} units` : 'In Stock')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link 
                                to={`/product/${product.id}`}
                                target="_blank"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                                title="View on Website"
                              >
                                <Eye size={14} />
                                View
                              </Link>
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="flex items-center gap-2 text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
                                title="Edit Product"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-slate-400 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-50 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Management</h2>
                <button className="bg-slate-900 hover:bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
                  <Plus size={20} /> Add New Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredVendors.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                    No vendors matching "{searchTerm}"
                  </div>
                ) : (
                  filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="glass p-6 rounded-[2rem] border border-slate-200/50 hover:border-violet-300 transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-all">
                        {vendor.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{vendor.name}</h3>
                        <p className="text-xs font-medium text-slate-500">Verified Seller</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</p>
                        <p className="font-black text-slate-900">{vendor.productsCount}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales</p>
                        <p className="font-black text-emerald-600">AED {vendor.totalSales.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {vendor.status}
                      </span>
                      <button className="text-sm font-bold text-violet-600 hover:underline">Manage</button>
                    </div>
                  </div>
                )))}
                {vendors.length === 0 && !searchTerm && (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium">
                    No vendors found. Use "Seed Data" to populate.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Management</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search orders..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium text-slate-900 w-64 shadow-sm"
                    />
                  </div>
                  <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                    <Filter size={20} /> Filter
                  </button>
                </div>
              </div>

              <div className="glass rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/30 backdrop-blur-md text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/50">
                      <tr>
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-8 py-5">Customer</th>
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Amount</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                            No orders matching "{searchTerm}"
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/50 transition-colors group">
                          <td className="px-8 py-5 font-black text-slate-900">#{order.id}</td>
                          <td className="px-8 py-5 font-bold text-slate-700">{order.customerName}</td>
                          <td className="px-8 py-5 text-slate-500 font-medium">{order.date}</td>
                          <td className="px-8 py-5 font-black text-slate-900">AED {order.amount.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-sm font-bold text-violet-600 hover:underline">View Details</button>
                          </td>
                        </tr>
                      )))}
                      {orders.length === 0 && !searchTerm && (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Management</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search customers..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium text-slate-900 w-64 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="glass rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/30 backdrop-blur-md text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/50">
                      <tr>
                        <th className="px-8 py-5">Customer</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5">Total Orders</th>
                        <th className="px-8 py-5">Total Spent</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                            No customers matching "{searchTerm}"
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-white/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                {customer.photoURL ? (
                                  <img src={customer.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  (customer.fullName || customer.name || '?')[0].toUpperCase()
                                )}
                              </div>
                              <span className="font-bold text-slate-900">{customer.fullName || customer.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-slate-500 font-medium">{customer.email}</td>
                          <td className="px-8 py-5 font-bold text-slate-700">{customer.ordersCount || 0}</td>
                          <td className="px-8 py-5 font-black text-slate-900">AED {(customer.totalSpent || 0).toLocaleString()}</td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-sm font-bold text-violet-600 hover:underline">View Profile</button>
                          </td>
                        </tr>
                      )))}
                      {customers.length === 0 && !searchTerm && (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                            No customers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Offers & Coupons</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search coupons..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-sm font-medium text-slate-900 w-64 shadow-sm"
                    />
                  </div>
                  <button className="bg-slate-900 hover:bg-violet-600 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
                    <Plus size={20} /> Create New Coupon
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { code: 'WELCOME20', type: 'Percentage', value: '20%', status: 'Active', usage: '124/500' },
                  { code: 'RAMADAN24', type: 'Fixed Amount', value: 'AED 50', status: 'Active', usage: '892/1000' },
                  { code: 'FLASH50', type: 'Percentage', value: '50%', status: 'Expired', usage: '200/200' },
                ]
                .filter(coupon => coupon.code.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((coupon, i) => (
                  <div key={i} className="glass p-6 rounded-[2rem] border border-slate-200/50 hover:border-violet-300 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl font-black text-lg tracking-wider border border-violet-100">
                        {coupon.code}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${coupon.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {coupon.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Discount Type</span>
                        <span className="font-bold text-slate-900">{coupon.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Value</span>
                        <span className="font-black text-violet-600">{coupon.value}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Usage</span>
                        <span className="font-bold text-slate-700">{coupon.usage}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex gap-2">
                      <button className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-violet-600 transition-colors">Edit</button>
                      <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Store Settings</h2>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="glass p-8 rounded-[2rem] border border-slate-200/50">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-violet-600" /> General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Store Name</label>
                      <input type="text" defaultValue="Noon Clone" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Support Email</label>
                      <input type="email" defaultValue="support@noonclone.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Currency</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none">
                        <option>AED - UAE Dirham</option>
                        <option>SAR - Saudi Riyal</option>
                        <option>USD - US Dollar</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Rate (%)</label>
                      <input type="number" defaultValue="5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none" />
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                    <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-violet-600 transition-all shadow-lg shadow-slate-900/20">
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-slate-200/50">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-violet-600" /> Security & Access
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                      </div>
                      <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">Maintenance Mode</p>
                        <p className="text-xs text-slate-500">Temporarily disable the storefront for maintenance.</p>
                      </div>
                      <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'products' && activeTab !== 'vendors' && activeTab !== 'orders' && activeTab !== 'customers' && activeTab !== 'settings' && (
            <div className="glass rounded-[2rem] shadow-[0_8px_30px_rgba(139,92,246,0.05)] p-16 text-center max-w-3xl mx-auto mt-12 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="w-24 h-24 bg-white/50 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-violet-600 shadow-sm border border-slate-100 relative z-10">
                <Settings size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 capitalize tracking-tight relative z-10">{activeTab} Management</h2>
              <p className="text-slate-500 font-medium leading-relaxed text-lg relative z-10">This section is currently under development. It will include full CRUD operations, filtering, and reporting capabilities for {activeTab}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
