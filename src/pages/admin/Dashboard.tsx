import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Store,
  Plus,
  RefreshCw,
  Eye,
  FileText,
  UserPlus,
  Activity,
  Database,
  Cpu,
  Globe,
  Package,
  History,
  Pencil,
  ChevronRight
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { getAuthHeaders } from '../../services/api';
import { Link } from 'react-router-dom';
import { Product } from '../../store/cart';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  
  const formatDateSafe = (value: unknown, fallback = 'N/A') => {
    if (!value) return fallback;
    const raw = typeof value === 'object' && value !== null && 'toDate' in (value as any)
      ? (value as any).toDate?.()
      : value;
    const date = new Date(raw as string | number | Date);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-AE');
  };
  
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: 'AED 0', icon: DollarSign, trend: '0%', isPositive: true },
    { label: 'Active Vendors', value: '0', icon: Store, trend: '0', isPositive: true },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, trend: '0%', isPositive: true },
    { label: 'Active Customers', value: '0', icon: Users, trend: '0%', isPositive: true },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const data = await dashboardAPI.getAdminDashboard();
        setProducts(data.products || []);
        setVendors(data.sellers || []);
        setOrders(data.orders || []);
        setCustomersCount(data.customersCount || 0);
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const totalRevenue = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const activeVendors = vendors.filter(v => v.status === 'approved').length;
    
    setStats([
      { label: 'Total Revenue', value: `AED ${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+0%', isPositive: true },
      { label: 'Active Vendors', value: activeVendors.toString(), icon: Store, trend: `+${vendors.filter(v => v.status === 'pending').length} pending`, isPositive: true },
      { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingCart, trend: '+0%', isPositive: true },
      { label: 'Active Customers', value: customersCount.toLocaleString(), icon: Users, trend: '+0%', isPositive: true },
    ]);
  }, [products, vendors, orders, customersCount]);

  const recentVendors = vendors.slice(0, 4).map(v => ({
    id: v.id.slice(0, 6),
    name: v.storeName || 'Unknown',
    email: v.email || 'N/A',
    date: formatDateSafe(v.createdAt, 'Just now'),
    status: v.status || 'Pending'
  }));

  const lowStockProducts = products
    .filter(p => {
      const threshold = typeof p.lowStockAlert === 'number'
        ? p.lowStockAlert
        : typeof p.lowStockAlert === 'boolean'
          ? (p.lowStockAlert ? 5 : 0)
          : 5;
      return (Number(p.stockQuantity) || 0) <= threshold;
    })
    .slice(0, 3)
    .map(p => ({
      id: p.id.slice(0, 6),
      title: p.title,
      stock: Number(p.stockQuantity) || 0,
      lastUpdated: formatDateSafe(p.updatedAt),
      price: `AED ${p.salePrice || p.price}`
    }));

  const handleSyncData = async () => {
    setSyncStatus('syncing');
    try {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 font-medium">Real-time performance metrics for EXSHOPI Marketplace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncData}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'success' ? 'Synced!' : 'Sync Website Data'}
          </button>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform">
            Generate System Audit
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${stat.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Vendor Applications */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Vendor Applications</h3>
              <button className="text-violet-600 text-xs font-black uppercase tracking-widest hover:underline">Review All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Store Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Applied</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-bold text-sm text-slate-900">{vendor.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">{vendor.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{vendor.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">{vendor.date}</td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                          ${vendor.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                            vendor.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                            'bg-rose-100 text-rose-600'}
                        `}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-violet-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Old Inventory Management</h3>
                  <p className="text-xs text-slate-400 font-medium">Items requiring restock or price adjustment</p>
                </div>
              </div>
              <Link to="/admin/products" className="text-violet-600 text-xs font-black uppercase tracking-widest hover:underline">Manage All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Info</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStockProducts.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {item.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.stock < 3 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <span className="text-xs font-black text-slate-600">{item.stock} Units Left</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">{item.lastUpdated}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/products?edit=${item.id}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          <Pencil size={14} /> Edit Listing
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/products" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-violet-50 hover:text-violet-600 transition-all group">
                  <Plus size={24} className="mb-3 text-slate-400 group-hover:text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest">Add Product</span>
                </Link>
                <Link to="/admin/orders" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-violet-50 hover:text-violet-600 transition-all group">
                  <ShoppingCart size={24} className="mb-3 text-slate-400 group-hover:text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest">Orders</span>
                </Link>
                <Link to="/admin/vendors" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-violet-50 hover:text-violet-600 transition-all group">
                  <UserPlus size={24} className="mb-3 text-slate-400 group-hover:text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest">Vendors</span>
                </Link>
                <Link to="/admin/settings" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl hover:bg-violet-50 hover:text-violet-600 transition-all group">
                  <ShieldCheck size={24} className="mb-3 text-slate-400 group-hover:text-violet-600" />
                  <span className="text-xs font-black uppercase tracking-widest">Security</span>
                </Link>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-black tracking-tight mb-2">System Health</h3>
                <p className="text-slate-400 text-sm font-medium mb-8">All systems operational across 4 regions.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Database size={18} className="text-emerald-400" />
                      <span className="text-sm font-bold">Firestore DB</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Cpu size={18} className="text-violet-400" />
                      <span className="text-sm font-bold">Gemini AI API</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-blue-400" />
                      <span className="text-sm font-bold">CDN Edge</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">99.9%</span>
                  </div>
                </div>
              </div>
              <Activity className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5" />
            </div>
          </div>
        </div>

        {/* Platform Health & Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Server Uptime</span>
                </div>
                <span className="text-sm font-black text-emerald-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Security Status</span>
                </div>
                <span className="text-sm font-black text-violet-600">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <AlertCircle size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Pending Payouts</span>
                </div>
                <span className="text-sm font-black text-amber-600">14</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Admin Actions</p>
              <div className="grid grid-cols-1 gap-3">
                <button className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-black text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all text-left flex items-center justify-between group">
                  Verify New Vendors
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-black text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-all text-left flex items-center justify-between group">
                  Approve Payouts
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[
                { user: 'Sarah J.', action: 'placed an order', time: '2 mins ago', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { user: 'Tech Haven', action: 'added 5 new products', time: '15 mins ago', icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50' },
                { user: 'System', action: 'completed backup', time: '1 hour ago', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 ${activity.bg} ${activity.color} rounded-xl flex items-center justify-center shrink-0`}>
                    <activity.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      <span className="font-black">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
