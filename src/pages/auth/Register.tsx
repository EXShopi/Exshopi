import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  User,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { userAPI, sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { auth, googleProvider, signInWithPopup } from '../../supabaseClient';

const Register = () => {
  const navigate = useNavigate();
  const { setUser, setRole } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer' as 'customer'
  });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep(3);
    // In a real app, you'd call an API to send SMS here
    alert(`[MOCK SMS] Your Exshopi verification code is: ${code}`);
  };

  const handleAuthSuccess = async (sessionOrUser: any, role: 'customer' | 'seller' = 'customer', name?: string) => {
    const sessionUser = sessionOrUser?.user || sessionOrUser;
    const finalRole = sessionUser.email === 'ahsansajid295@gmail.com'
      ? ((sessionOrUser?.role || 'admin') as any)
      : (sessionOrUser?.role || role);

    // Set auth store and localStorage (userAPI.login already sets userId/userRole)
    setUser({
      id: sessionUser.id || sessionUser.uid,
      uid: sessionUser.uid || sessionUser.id,
      email: sessionUser.email,
      displayName: name || sessionUser.name || sessionUser.fullName || '',
      status: sessionUser.status,
      sellerApplicationStatus: sessionUser.sellerApplicationStatus,
    });
    setRole(finalRole as any);

    // If seller, ensure a seller profile exists (best-effort)
    if (finalRole === 'seller') {
      try {
        await sellerAPI.create({
          storeName: name ? `${name}'s Store` : 'My Store',
          description: '',
          logo: '',
          banner: '',
          city: '',
          country: '',
          phone: formData.phone || '',
          email: sessionUser.email,
          bankAccount: '',
          bankName: '',
          accountHolder: '',
        });
      } catch (err) {
        // non-fatal — seller can create later
        console.warn('Seller profile creation skipped or failed:', err);
      }
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      handleSendOtp();
      return;
    }

    if (step === 3) {
      if (otp !== generatedOtp) {
        setError('Invalid OTP code. Please try again.');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Register via backend API
        const registered = await userAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
        });

        // Auto-login after register to set localStorage and session
        const logged = await userAPI.login(formData.email, formData.password);
        await handleAuthSuccess(logged, formData.role, formData.name);
      } catch (err: any) {
        console.error('Registration error:', err);
        setError(err.message || 'Failed to create account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      if (provider === 'google') {
        const result = await signInWithPopup(auth, googleProvider);
        await handleAuthSuccess(result.user);
      } else {
        setError(`${provider} login is not implemented yet.`);
      }
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
              Join the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Elite Marketplace.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              Create an account to start shopping in the UAE's most premium e-commerce destination.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-6 group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-violet-400 border border-white/10 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-widest">Secure & Verified</h4>
                <p className="text-slate-500 text-sm font-medium">Advanced encryption for all your data</p>
              </div>
            </div>
            <div className="flex items-center gap-6 group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <User size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-widest">Personalized Experience</h4>
                <p className="text-slate-500 text-sm font-medium">AI-driven recommendations just for you</p>
              </div>
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

      {/* Right Side - Register Form */}
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
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">Create Account</h2>
            <p className="text-slate-500 font-medium">Join thousands of satisfied users in the UAE</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-violet-600' : 'w-6 bg-slate-100'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
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
                Account created! Welcome to Exshopi.
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                        <User size={20} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                        <Mail size={20} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors mb-4"
                  >
                    <ArrowLeft size={14} /> Back to details
                  </button>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                        <Phone size={20} />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+971 50 123 4567"
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                        <Lock size={20} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
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
                </motion.div>
              ) : (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors mb-4"
                  >
                    <ArrowLeft size={14} /> Back to password
                  </button>

                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Verify Phone</h3>
                    <p className="text-xs text-slate-500 font-medium">We've sent a 6-digit code to {formData.phone}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center text-3xl tracking-[0.5em] py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-black text-slate-900 placeholder:text-slate-200"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full text-xs font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                  >
                    Resend Code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-slate-950/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>{step === 1 ? 'Next Step' : step === 2 ? 'Send Code' : 'Verify & Create Account'} <ArrowRight size={18} /></>
              )}
            </button>
        </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">Or join with</span>
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
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-black hover:underline">Sign In</Link>
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

export default Register;
