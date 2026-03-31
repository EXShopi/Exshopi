import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import AuthService from '../../lib/authService';

export function SellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const { setUser, setRole, setSellerApplication, setAccessToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await AuthService.signIn(email, password);
      
      const userData = {
        uid: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        status: result.user.status,
        sellerApplicationStatus: result.user.sellerApplicationStatus,
      };
      
      setUser(userData);
      setRole((result.role as any) || 'seller');
      setAccessToken((result as any).accessToken || null);
      setSellerApplication(result.sellerApplication || null);
      
      // Set localStorage for dashboard checks
      if (result.seller?.id) {
        localStorage.setItem('sellerId', result.seller.id);
      }
      localStorage.setItem('sellerEmail', result.user.email);

      if (result.sellerApplication && result.sellerApplication.status !== 'approved') {
        navigate('/seller/pending-approval', { replace: true });
      } else {
        navigate('/seller/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Seller Login Error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 lg:p-12 rounded-3xl shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Seller Login</h1>
          <p className="text-slate-500 font-medium">Manage your EXSHOPI store</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-1">Business Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all font-medium text-slate-900 placeholder:text-slate-400"
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all font-medium text-slate-900 placeholder:text-slate-400"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              to="/seller/forgot-password"
              className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:to-violet-800 text-white py-3 px-4 rounded-xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-slate-600 font-medium text-sm">
            Don't have a store yet?{' '}
            <Link to="/seller/register" className="text-violet-600 hover:underline font-bold">
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
