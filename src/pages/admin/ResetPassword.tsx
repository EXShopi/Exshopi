import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import AuthService from '../../lib/authService';

function getSafeErrorMessage(err: unknown): string {
  const fallback = 'An unexpected error occurred. Please try again.';

  if (!err) return fallback;

  const raw =
    typeof err === 'string'
      ? err
      : err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: unknown }).message ?? fallback)
      : fallback;

  const normalized = raw.trim();

  if (!normalized) return fallback;

  if (
    normalized.includes('<!DOCTYPE html') ||
    normalized.includes('<html') ||
    normalized.includes('</html>') ||
    normalized.includes("Unexpected token '<'") ||
    normalized.includes('Unexpected non-JSON response')
  ) {
    return 'Password reset service is not configured correctly yet. Please check auth configuration.';
  }

  return normalized;
}

export function AdminResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    let mounted = true;

    const setupRecoverySession = async () => {
      try {
        setError('');
        setPageLoading(true);

        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);

        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');

        if (hashError) {
          if (!mounted) return;
          setError(
            decodeURIComponent(
              hashErrorDescription || 'This password reset link is invalid or has expired.'
            )
          );
          setLinkValid(false);
          setPageLoading(false);
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            if (!mounted) return;
            setError(sessionError.message || 'Invalid or expired reset link.');
            setLinkValid(false);
            setPageLoading(false);
            return;
          }

          if (!mounted) return;
          setLinkValid(true);
          setPageLoading(false);

          // Clean hash from URL after session is set
          window.history.replaceState({}, document.title, '/admin/reset-password');
          return;
        }

        // Fallback: maybe session is already restored
        const { data, error: sessionReadError } = await supabase.auth.getSession();

        if (sessionReadError) {
          if (!mounted) return;
          setError(sessionReadError.message || 'Unable to validate reset session.');
          setLinkValid(false);
          setPageLoading(false);
          return;
        }

        if (data.session) {
          if (!mounted) return;
          setLinkValid(true);
          setPageLoading(false);
          return;
        }

        if (!mounted) return;
        setError('Invalid or expired reset link. Please request a new password reset email.');
        setLinkValid(false);
        setPageLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getSafeErrorMessage(err));
        setLinkValid(false);
        setPageLoading(false);
      }
    };

    setupRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading || !linkValid) return;

    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

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
      const result = await AuthService.resetPassword('', password);

      if (result?.success) {
        setSuccess(result.message || 'Password reset successful.');
        setResetComplete(true);

        setTimeout(() => {
          navigate('/admin/login', { replace: true });
        }, 2000);
      } else {
        setError(result?.message || 'Failed to reset password. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Reset Password Error:', err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8 rounded-[32px] border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-2xl shadow-violet-600/40">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            New Password
          </h2>
          <p className="mt-2 font-medium text-slate-400">
            Create a strong password for admin access
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {pageLoading ? (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-violet-400" size={28} />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Verifying your reset link...
            </p>
          </div>
        ) : resetComplete ? (
          <div className="space-y-4 py-4 text-center">
            <div className="text-emerald-500 text-4xl">✓</div>
            <p className="font-bold text-white">
              Your password has been reset successfully!
            </p>
            <p className="text-sm text-slate-400">
              You will be redirected to the login page...
            </p>
          </div>
        ) : linkValid ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-600/50 bg-slate-700/30 px-6 py-4 pr-12 font-bold text-white placeholder-slate-500 transition-all focus:border-transparent focus:ring-2 focus:ring-violet-600 disabled:opacity-60"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="ml-4 text-[10px] text-slate-400">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-600/50 bg-slate-700/30 px-6 py-4 pr-12 font-bold text-white placeholder-slate-500 transition-all focus:border-transparent focus:ring-2 focus:ring-violet-600 disabled:opacity-60"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-300"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-violet-600 to-violet-700 py-5 text-sm font-black text-white shadow-2xl shadow-violet-600/30 transition-all hover:scale-[1.02] hover:shadow-violet-600/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-slate-400">
              This reset link is invalid, expired, or already used.
            </p>
            <Link
              to="/admin/forgot-password"
              className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500"
            >
              Request New Reset Link
            </Link>
          </div>
        )}

        <div className="border-t border-slate-700/50 pt-4 text-center">
          <Link
            to="/admin/login"
            className="text-sm font-bold text-slate-400 transition-colors hover:text-violet-400"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminResetPassword;