import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Github, 
  Chrome, 
  Apple, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AuthService from '../../lib/authService';
import { userAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { getFirebaseConfigStatus, logFirebaseAuthDebug } from '../../lib/firebase';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setRole, setSellerApplication, setAccessToken } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';
  const loginReason = (location.state as any)?.reason || '';

  useEffect(() => {
    console.info('[login] mounted', {
      from,
      reason: loginReason,
    });
    logFirebaseAuthDebug('login-page-mounted', {
      from,
      reason: loginReason,
      emailPasswordLoginPathEnabled: true,
    });
  }, [from, loginReason]);

  const handleAuthSuccess = async (user: any, authResult?: any) => {
    try {
      const session = authResult?.role ? authResult : await userAPI.getSession();
      const profile = session?.user?.id ? session.user : await userAPI.getUser(user.id || user.uid);
      if (profile && profile.id) {
        setRole(session?.role || profile.role || 'customer');
        setAccessToken(session?.accessToken || null);
        setSellerApplication(session?.sellerApplication || null);
        setUser({ id: profile.id, email: profile.email, name: profile.name || profile.fullName || user.displayName, status: profile.status, sellerApplicationStatus: profile.sellerApplicationStatus });
      } else {
        setUser({ id: user.id || user.uid, email: user.email || '', displayName: user.displayName || '' } as any);
      }
    } catch (err) {
      console.warn('Failed to fetch user profile after sign-in', err);
      setUser({ id: user.id || user.uid, email: user.email || '', displayName: user.displayName || '' } as any);
    }
    setSuccess(true);
    setTimeout(() => {
      if (authResult?.sellerApplication && authResult.sellerApplication.status !== 'approved') {
        navigate('/seller/pending-approval', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.signIn(email, password);
      await handleAuthSuccess(result.user, result);
    } catch (err: any) {
      console.error('Login error:', {
        code: err?.code || '',
        message: err?.message || '',
        ...getFirebaseConfigStatus(),
      });
      if (err.code === 'auth/configuration-not-available') {
        setError('Login is temporarily unavailable due to site configuration.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network issue detected. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/internal-error') {
        setError('Login is temporarily unavailable. Please try again shortly.');
      } else {
        setError(err.message || 'Login is temporarily unavailable. Please try again shortly.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      // Social login not supported in unified backend yet
      setError('Social login is not available. Please use email and password.');
    } catch (err: any) {
      console.error('Social login error:', err);
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Side - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent)]"></div>
        
        <div className="relative z-10 max-w-lg w-full space-y-12">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 group-hover:scale-110 transition-transform duration-500">
              <span className="text-2xl font-black text-slate-950">E</span>
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase">Exshopi</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Welcome back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Premium Shopping.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              Log in to access your personalized dashboard, track orders, and discover exclusive UAE deals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="text-3xl font-black text-white mb-1">50k+</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Users</div>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="text-3xl font-black text-white mb-1">100%</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Secure Pay</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col bg-white px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8 sm:pt-[max(1.25rem,env(safe-area-inset-top))] md:px-12 md:py-12 lg:justify-center lg:px-24 lg:py-16">
        <div className="lg:hidden flex justify-center pt-3 sm:pt-4">
          <Link to="/" className="inline-flex max-w-full items-center gap-2.5 rounded-2xl px-2 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 sm:h-11 sm:w-11">
              <span className="text-lg font-black text-white sm:text-xl">E</span>
            </div>
            <span className="truncate text-[1.65rem] font-black uppercase tracking-tighter text-slate-950 sm:text-[1.85rem]">
              Exshopi
            </span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-6 pt-8 sm:space-y-8 sm:pt-10 md:space-y-10 lg:pt-0">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sign In</h2>
            <p className="max-w-sm text-sm font-medium leading-6 text-slate-500 sm:text-base sm:leading-7">
              Enter your credentials to access your account
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!error && loginReason === 'checkout_requires_customer_login' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700 sm:items-center"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 sm:mt-0" />
                <span>Sign in to your customer account to continue checkout and phone verification.</span>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-600 sm:items-center"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 sm:mt-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-600 sm:items-center"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 sm:mt-0" />
                <span>Success! Redirecting you...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600 sm:left-5">
                    <Mail size={18} className="sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 sm:py-4 sm:pl-14 sm:pr-6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                  <Link to="/forgot-password" title="Reset password" className="shrink-0 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 sm:text-xs">Forgot?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-600 sm:left-5">
                    <Lock size={18} className="sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-12 text-sm font-bold text-slate-900 transition-all placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 sm:py-4 sm:pl-14 sm:pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 sm:right-5"
                  >
                    {showPassword ? <EyeOff size={18} className="sm:h-5 sm:w-5" /> : <Eye size={18} className="sm:h-5 sm:w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/20 transition-all hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 sm:py-5"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="relative py-2 sm:py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="group flex items-center justify-center rounded-2xl border border-slate-100 py-3.5 transition-all hover:bg-slate-50 sm:py-4"
            >
              <Chrome size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleSocialLogin('apple')}
              className="group flex items-center justify-center rounded-2xl border border-slate-100 py-3.5 transition-all hover:bg-slate-50 sm:py-4"
            >
              <Apple size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleSocialLogin('github')}
              className="group flex items-center justify-center rounded-2xl border border-slate-100 py-3.5 transition-all hover:bg-slate-50 sm:py-4"
            >
              <Github size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <p className="text-center text-sm font-medium leading-6 text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 font-black hover:underline">Create Account</Link>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:mt-10 sm:flex-row sm:gap-4 sm:pt-8 lg:mt-auto lg:pt-12">
          <span>© 2026 Exshopi UAE</span>
          <div className="flex items-center gap-5 sm:gap-6">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
