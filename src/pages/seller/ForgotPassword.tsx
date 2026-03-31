import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import AuthService from '../../lib/authService';

export function SellerForgotPassword() {
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
          navigate(`/seller/reset-password?email=${encodeURIComponent(email)}`);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-5xl shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-violet-600/20 mx-auto mb-6">
            <Store size={32} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-slate-500 font-medium mt-2">Recover your seller account</p>
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

        {!submitted ? (
          <>
            <p className="text-slate-600 text-sm font-medium text-center">
              Enter the email address associated with your seller account. We'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Business Email</label>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-violet-600 transition-all font-bold text-slate-900"
                  placeholder="business@example.com"
                  disabled={loading}
                />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-violet-600 text-white py-6 rounded-3xl font-black text-sm shadow-xl shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
            <p className="text-slate-600 font-medium">
              Check your email for password reset instructions. You'll be redirected shortly.
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-100">
          <Link 
            to="/seller/login"
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-bold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
