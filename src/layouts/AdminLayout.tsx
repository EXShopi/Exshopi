import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  UserCircle,
  Users,
  Wallet,
  X,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import AuthService from '../lib/authService';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { getAdminRoleLabel, hasAdminPermission } from '../lib/adminPermissions';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_manager', 'support_agent'];

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { settings, fetchSettings } = useSettingsStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, role, isLoading, resetAuth } = useAuthStore();

  const runtimeRole = String(role || '').toLowerCase();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auth has already been bootstrapped at App level
  // Just check if user has admin access
  useEffect(() => {
    if (isLoading) return;

    const persistedAdminId =
      typeof window !== 'undefined' ? localStorage.getItem('adminId') || '' : '';
    const persistedAdminEmail =
      typeof window !== 'undefined'
        ? (localStorage.getItem('adminEmail') || '').trim().toLowerCase()
        : '';

    const currentEmail = (user?.email || '').trim().toLowerCase();

    const canAccessAdmin =
      ADMIN_ROLES.includes(runtimeRole) ||
      (!!persistedAdminId && !!persistedAdminEmail && persistedAdminEmail === currentEmail);

    if (!canAccessAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [runtimeRole, user?.email, isLoading, navigate]);

  const effectiveRole = (
    ADMIN_ROLES.includes(runtimeRole) ? runtimeRole : 'admin'
  ) as 'admin' | 'super_admin' | 'finance_manager' | 'support_agent';

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard',
      permission: 'dashboard:view' as const,
    },
    {
      icon: Users,
      label: 'Vendors',
      path: '/admin/vendors',
      permission: 'vendors:view' as const,
    },
    {
      icon: ShoppingBag,
      label: 'Products',
      path: '/admin/products',
      permission: 'catalog:view' as const,
    },
    {
      icon: Package,
      label: 'Inventory',
      path: '/admin/inventory',
      permission: 'inventory:view' as const,
    },
    {
      icon: ShoppingCart,
      label: 'Orders',
      path: '/admin/orders',
      permission: 'orders:view' as const,
    },
    {
      icon: RotateCcw,
      label: 'Returns',
      path: '/admin/returns',
      permission: 'returns:view' as const,
    },
    {
      icon: UserCircle,
      label: 'Customers',
      path: '/admin/customers',
      permission: 'customers:view' as const,
    },
    {
      icon: Percent,
      label: 'Commissions',
      path: '/admin/commissions',
      permission: 'commissions:view' as const,
    },
    {
      icon: Wallet,
      label: 'Payouts',
      path: '/admin/payouts',
      permission: 'payouts:view' as const,
    },
    {
      icon: Layers,
      label: 'Categories',
      path: '/admin/categories',
      permission: 'categories:manage' as const,
    },
    {
      icon: ImageIcon,
      label: 'Banners',
      path: '/admin/banners',
      permission: 'banners:manage' as const,
    },
    {
      icon: Tag,
      label: 'Offers',
      path: '/admin/offers',
      permission: 'offers:manage' as const,
    },
    {
      icon: BarChart3,
      label: 'Reports',
      path: '/admin/reports',
      permission: 'reports:view' as const,
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
      permission: 'settings:manage' as const,
    },
    {
      icon: HelpCircle,
      label: 'Support',
      path: '/admin/support',
      permission: 'support:view' as const,
    },
  ].filter((item) => hasAdminPermission(effectiveRole, item.permission));

  const activeItem = useMemo(() => {
    return menuItems.find((item) => location.pathname.startsWith(item.path));
  }, [location.pathname, menuItems]);

  const handleLogout = async () => {
    await AuthService.signOut();
    resetAuth();
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login', { replace: true });
  };

  const siteName = settings?.branding?.siteName || 'ExShopi';
  const logoUrl = settings?.branding?.logoUrl || '';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_24%),linear-gradient(180deg,#f7faff_0%,#f8fafc_48%,#eef2ff_100%)] text-slate-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-md lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[308px] transform border-r border-white/50 bg-slate-950 text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col bg-[linear-gradient(180deg,#020617_0%,#0f172a_44%,#111827_100%)]">
            <div className="flex items-center justify-between border-b border-white/5 px-7 py-7">
              <Link to="/admin/dashboard" className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-11 w-auto rounded-2xl object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 via-violet-600 to-cyan-400 shadow-xl shadow-blue-500/20">
                    <ShieldCheck size={24} />
                  </div>
                )}

                <div>
                  <p className="text-lg font-black tracking-tight text-white">
                    {siteName} Admin
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    Marketplace Control
                  </p>
                </div>
              </Link>

              <button
                className="text-slate-400 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-5 pt-5">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent px-5 py-5 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-200">
                  Executive Access
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Marketplace HQ
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Manage sellers, approvals, campaigns, payouts, analytics, and the public
                  ExShopi website from one command layer.
                </p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                      <ChevronRight
                        size={16}
                        className={`ml-auto transition-transform ${
                          isActive
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100'
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/5 px-4 py-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/10"
                type="button"
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
              <button
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                type="button"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  Admin Workspace
                </p>
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-900">
                  {activeItem?.label || 'Dashboard'}
                </h1>
              </div>

              <div className="hidden flex-1 justify-center xl:flex">
                <div className="flex w-full max-w-xl items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Search size={18} className="text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                    placeholder="Search sellers, products, orders, banners..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition hover:text-blue-600"
                  type="button"
                >
                  <Bell size={20} />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
                </button>

                <div className="hidden items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      {getAdminRoleLabel(effectiveRole)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">
                      {user?.email}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-blue-600 font-black text-white shadow-lg shadow-slate-900/20">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
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

export default AdminLayout;
