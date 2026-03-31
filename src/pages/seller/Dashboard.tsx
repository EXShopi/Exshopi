import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export function SellerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const sellerId = user.id || (user as any).uid;
        const data = await dashboardAPI.getSellerDashboard(sellerId);
        setStats({
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          activeProducts: data.approvedProducts || 0,
          pendingOrders: data.pendingOrders || 0,
        });
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        console.error('Failed to load seller dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back!</h2>
          <p className="text-slate-500 font-medium mt-1">Here's what's happening with your store today.</p>
        </div>
        <Link 
          to="/seller/add-product"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 hover:-translate-y-1 transition-all shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm neon-border">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">${stats.totalSales.toFixed(2)}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm neon-border">
          <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6 text-violet-600" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalOrders}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm neon-border">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Products</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.activeProducts}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm neon-border">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Orders</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.pendingOrders}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm neon-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Orders</h3>
            <Link to="/seller/orders" className="text-xs font-black text-violet-600 uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Earning</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">No orders yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-mono text-xs text-slate-500">#{order.orderId?.slice(-6)}</td>
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{order.title}</p>
                      </td>
                      <td className="py-4 font-black text-slate-900">${order.vendorEarning?.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 neon-border">
            <h3 className="text-xl font-black mb-4 tracking-tight">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/seller/add-product" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors group">
                <span className="font-bold text-sm">Add New Product</span>
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </Link>
              <Link to="/seller/payouts" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors group">
                <span className="font-bold text-sm">Request Payout</span>
                <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/seller/settings" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors group">
                <span className="font-bold text-sm">Store Settings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-violet-50 p-8 rounded-[2.5rem] border border-violet-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Seller Tip</h3>
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              "High-quality images can increase your sales by up to 40%. Make sure your product photos are clear and well-lit."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
