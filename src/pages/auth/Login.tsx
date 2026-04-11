import React, { useState } from 'react';
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
  ArrowLeft,
  Loader2
} from 'lucide-react';
import AuthService from '../../lib/authService';
import { userAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';

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
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError(err.message || 'Invalid email or password');
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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
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
      <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-white relative">
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black text-white">E</span>
            </div>
            <span className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Exshopi</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">Sign In</h2>
            <p className="text-slate-500 font-medium">Enter your credentials to access your account</p>
          </div>

          <AnimatePresence mode="wait">
            {!error && loginReason === 'checkout_requires_customer_login' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3 text-blue-700 text-sm font-bold"
              >
                <CheckCircle2 size={18} />
                Sign in to your customer account to continue checkout and phone verification.
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-600 text-sm font-bold"
              >
                <CheckCircle2 size={18} />
                Success! Redirecting you...
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" title="Reset password" className="text-xs font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest">Forgot?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-slate-950/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center py-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
            >
              <Chrome size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center py-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
            >
              <Apple size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center py-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
            >
              <Github size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <p className="text-center text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 font-black hover:underline">Create Account</Link>
          </p>
        </div>

        <div className="mt-auto pt-12 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>© 2026 Exshopi UAE</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
