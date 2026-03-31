import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Wallet,
  X,
  DollarSign,
  Percent,
  Plus,
} from 'lucide-react';
import AuthService from '../lib/authService';
import { useAuthStore } from '../store/auth';

export function SellerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();

  useEffect(() => {
    if (!user || role !== 'seller') {
      navigate('/seller/login', { replace: true });
    }
  }, [user, role, navigate]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
    { icon: ShoppingBag, label: 'My Products', path: '/seller/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/seller/orders' },
    { icon: DollarSign, label: 'Earnings', path: '/seller/earnings' },
    { icon: Percent, label: 'Commissions', path: '/seller/commissions' },
    { icon: Wallet, label: 'Payouts', path: '/seller/payouts' },
    { icon: Star, label: 'Reviews', path: '/seller/reviews' },
    { icon: Tag, label: 'Offers', path: '/seller/offers' },
    { icon: Settings, label: 'Store Settings', path: '/seller/settings' },
    { icon: HelpCircle, label: 'Support', path: '/seller/support' },
  ];

  const activeItem = useMemo(
    () => menuItems.find((item) => location.pathname.startsWith(item.path)),
    [location.pathname]
  );

  const handleLogout = async () => {
    const { setUser, setRole } = useAuthStore.getState();
    await AuthService.signOut();
    setUser(null);
    setRole(null);
    localStorage.removeItem('sellerId');
    localStorage.removeItem('sellerEmail');
    navigate('/seller/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_48%,#eef4ff_100%)] text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-md lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[300px] transform border-r border-white/60 bg-white/85 backdrop-blur-2xl transition-transform duration-300 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-7 py-7">
              <Link to="/seller/dashboard" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25">
                  <Store size={24} />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight text-slate-900">ExShopi Seller</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">UAE Marketplace</p>
                </div>
              </Link>
              <button className="text-slate-400 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="px-5 pt-5">
              <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#1d4ed8] px-5 py-5 text-white shadow-xl shadow-blue-500/15">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-200">Seller Center</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">{user?.displayName || 'Your Store'}</h3>
                <p className="mt-2 text-sm text-blue-100">Manage catalog, fulfillment, payouts, and quality like a premium marketplace operator.</p>
                <Link
                  to="/seller/add-product"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur hover:bg-white/20"
                >
                  <Plus size={16} />
                  Add Product
                </Link>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                      }`}
                    >
                      <item.icon size={19} />
                      <span>{item.label}</span>
                      <ChevronRight
                        size={16}
                        className={`ml-auto transition-transform ${isActive ? 'opacity-100' : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100'}`}
                      />
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-slate-200/70 px-4 py-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur-2xl lg:px-8">
            <div className="flex items-center gap-4">
              <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={22} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Seller Workspace</p>
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-900">
                  {activeItem?.label || 'Seller Dashboard'}
                </h1>
              </div>

              <div className="hidden flex-1 justify-center xl:flex">
                <div className="flex w-full max-w-xl items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Search size={18} className="text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                    placeholder="Search products, orders, SKUs, payouts..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition hover:text-blue-600">
                  <Bell size={20} />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
                </button>
                <div className="hidden items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{user?.displayName || 'Seller Account'}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Verified Store</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-500 font-black text-white shadow-lg shadow-blue-500/20">
                    {user?.email?.[0]?.toUpperCase() || 'S'}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
