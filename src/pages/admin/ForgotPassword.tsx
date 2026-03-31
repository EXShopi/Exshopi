import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import AuthService from '../../lib/authService';

export function AdminForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.requestPasswordReset(email);
      
      if (result.success) {
        setSuccess(result.message);
        setSubmitted(true);
        // After 2 seconds, redirect to reset password page
        setTimeout(() => {
          navigate(`/admin/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setError(result.message || 'Failed to process reset request. Please try again.');
      }
    } catch (err: any) {
      console.error('Forgot Password Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
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
          <h2 className="text-4xl font-black text-white tracking-tight">Reset Password</h2>
          <p className="text-slate-400 font-medium mt-2">Recover admin access</p>
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

        {!submitted ? (
          <>
            <p className="text-slate-400 text-sm font-medium text-center">
              Enter the email address associated with your admin account. We'll send you instructions to reset your password.
            </p>

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
                  disabled={loading}
                />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white py-6 rounded-3xl font-black text-sm shadow-2xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Send Reset Link
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-slate-400 font-medium">
              Check your email for password reset instructions. You'll be redirected shortly.
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-700/50">
          <Link 
            to="/admin/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-400 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
