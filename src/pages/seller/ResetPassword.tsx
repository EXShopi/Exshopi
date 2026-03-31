import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Store, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import AuthService from '../../lib/authService';

export function SellerResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || 'dev-token';

  useEffect(() => {
    if (!email) {
      setError('Invalid reset link. Redirecting to forgot password...');
      setTimeout(() => navigate('/seller/forgot-password'), 2000);
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.resetPassword(token, password);
      
      if (result.success) {
        setSuccess(result.message);
        setResetComplete(true);
        setTimeout(() => {
          navigate('/seller/login');
        }, 2000);
      } else {
        setError(result.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-5xl shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-violet-600/20 mx-auto mb-6">
            <Store size={32} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">New Password</h2>
          <p className="text-slate-500 font-medium mt-2">Create a strong password for your account</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {!resetComplete ? (
          <>
            {email && <p className="text-slate-600 text-xs text-center font-medium">Resetting password for: <strong>{email}</strong></p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">New Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-violet-600 transition-all font-bold text-slate-900 pr-12"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 ml-4">At least 8 characters recommended</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Confirm Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-violet-600 transition-all font-bold text-slate-900 pr-12"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-violet-600 text-white py-6 rounded-3xl font-black text-sm shadow-xl shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Reset Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-emerald-600 text-4xl">✓</div>
            <p className="text-slate-600 font-bold">
              Your password has been reset successfully!
            </p>
            <p className="text-slate-500 text-sm">
              You'll be redirected to the login page...
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-100">
          <Link 
            to="/seller/login"
            className="text-violet-600 hover:underline font-bold text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
