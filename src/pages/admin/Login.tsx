import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import AuthService from '../../lib/authService';
import { useAuthStore } from '../../store/auth';

export function AdminLogin() {
  const navigate = useNavigate();
  const { setRole, setUser, setAccessToken, setRefreshToken, setSellerApplication, resetAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const result = await AuthService.signIn(normalizedEmail, password);
      const backendAdminRoles = ['admin', 'super_admin', 'finance_manager', 'support_agent'];

      if (!result.accessToken || !backendAdminRoles.includes(String(result.role || '').toLowerCase())) {
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminEmail');
        resetAuth();
        throw new Error('Admin sign-in did not create a valid backend session. Please sign in again.');
      }

      const forcedRole =
        result.role === 'admin' ||
        result.role === 'super_admin' ||
        result.role === 'finance_manager' ||
        result.role === 'support_agent'
          ? result.role
          : 'admin';

      const userData = {
        id: result.user.id,
        uid: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        name: result.user.name || result.user.displayName || '',
        fullName: result.user.fullName || result.user.name || result.user.displayName || '',
        phone: result.user.phone || '',
        status: result.user.status || 'active',
        country: result.user.country || 'AE',
        sellerApplicationStatus: result.user.sellerApplicationStatus || null,
      };

      setUser(userData);
      setRole(forcedRole as any);
      setAccessToken((result as any).accessToken || null);
      setRefreshToken(null);
      setSellerApplication((result as any).sellerApplication || null);

      localStorage.setItem('adminId', result.user.id);
      localStorage.setItem('adminEmail', normalizedEmail);

      setSuccess('Login successful. Redirecting...');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Admin Login Error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-slate-800/40 backdrop-blur-xl p-12 rounded-5xl border border-slate-700/50 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-violet-600/40 mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Admin Access</h2>
          <p className="text-slate-400 font-medium mt-2">Enterprise Control Center</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-300 text-sm font-bold">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm font-bold">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Admin Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/50 rounded-2xl focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all font-bold text-white placeholder-slate-500"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/50 rounded-2xl focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all font-bold text-white placeholder-slate-500 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white py-6 rounded-3xl font-black text-sm shadow-2xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Grant Admin Access
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/50 space-y-3">
          <a
            href="/admin/forgot-password"
            className="block text-center text-slate-400 hover:text-violet-400 text-sm font-bold transition-colors"
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}
