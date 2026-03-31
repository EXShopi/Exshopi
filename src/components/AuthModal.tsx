import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Phone, Calendar, User, MapPin, CheckCircle, 
  Apple, Chrome, Github, Smartphone, ChevronRight, 
  Lock, Eye, EyeOff, Monitor, ArrowRight, ArrowLeft,
  ShieldCheck, Sparkles, Globe, Heart
} from 'lucide-react';
import AuthService from '../lib/authService';
import { getAuthHeaders, userAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { auth, db, doc, getDoc } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'login' | 'register' | 'email-otp' | 'phone-otp' | 'profile' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [profileData, setProfileData] = useState({
    fullName: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    country: 'UAE',
    location: null as { lat: number, lng: number } | null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { setUser, setRole, setAccessToken, setSellerApplication } = useAuthStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (auth.currentUser && step === 'login') {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists() || !userDoc.data().fullName) {
          setStep('profile');
        }
      }
    };
    if (isOpen) {
      checkProfile();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    setIsLoading(true);
    try {
      alert('Social login is temporarily unavailable. Please use Email & Password login.');
    } catch (error) {
      console.error('Social login stub error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resp = await AuthService.signIn(email, password);
      if (resp?.user) {
        setUser(resp.user);
        setRole((resp.role as any) || 'customer');
        setAccessToken((resp as any).accessToken || useAuthStore.getState().accessToken || null);
        setSellerApplication(resp.sellerApplication || null);
        try {
          const profile = await userAPI.get(resp.user.id);
          if (!profile || !profile.name) {
            setStep('profile');
          } else {
            setStep('success');
            setTimeout(() => onClose(), 1500);
          }
        } catch (err) {
          setStep('success');
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resp = await AuthService.signUp(email, password, profileData.fullName || '');
      if (resp?.user) {
        setUser(resp.user);
        setRole((resp.role as any) || 'customer');
        setAccessToken((resp as any).accessToken || useAuthStore.getState().accessToken || null);
        setSellerApplication(resp.sellerApplication || null);
        setStep('profile');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfileData({
            ...profileData,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please check your browser permissions.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userId = useAuthStore.getState().user?.id as string | undefined;
      if (userId) {
        try {
          const res = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify({
              ...profileData,
              phone,
            })
          });
          if (res.ok) {
            const updated = await res.json();
            setUser(updated);
          } else {
            const updated = { ...(useAuthStore.getState().user || {}), ...profileData, phone };
            setUser(updated);
          }
        } catch (err) {
          const updated = { ...(useAuthStore.getState().user || {}), ...profileData, phone };
          setUser(updated);
        }
      } else {
        const updated = { ...(useAuthStore.getState().user || {}), ...profileData, phone };
        setUser(updated);
      }
      setStep('success');
      setTimeout(() => onClose(), 2000);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      alert('Failed to save profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <motion.div 
        ref={modalRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white w-full max-w-5xl h-[700px] rounded-[2.5rem] shadow-2xl overflow-hidden flex relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Branding/Atmospheric */}
        <div className="hidden lg:flex w-2/5 bg-slate-900 relative overflow-hidden p-12 flex-col justify-between">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/30 via-transparent to-transparent blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">EXSHOPI.</span>
            </div>
            
            <h1 className="text-4xl font-black text-white leading-tight mb-6">
              Elevate Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Shopping Experience</span>
            </h1>
            
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: 'Secure & Encrypted Payments' },
                { icon: Globe, text: 'Worldwide Express Delivery' },
                { icon: Heart, text: 'Personalized Recommendations' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <item.icon size={16} className="text-violet-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400">Joined by 50k+ shoppers</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                "The best shopping platform I've used. Fast delivery and amazing support!"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto relative bg-slate-50/50">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all z-20 shadow-sm border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait" custom={1}>
            {step === 'login' && (
              <motion.div 
                key="login"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-sm mx-auto space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                  <p className="text-slate-500 font-medium">Sign in to continue your journey</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'google', icon: Chrome, color: 'text-blue-500' },
                    { id: 'apple', icon: Apple, color: 'text-slate-900' },
                    { id: 'microsoft', icon: Monitor, color: 'text-blue-600' }
                  ].map(provider => (
                    <button 
                      key={provider.id}
                      onClick={() => handleSocialLogin(provider.id as any)}
                      className="flex items-center justify-center py-3.5 bg-white border border-slate-200 rounded-2xl hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/5 transition-all active:scale-95"
                    >
                      <provider.icon size={22} className={provider.color} />
                    </button>
                  ))}
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative px-4 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or use email</span>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all font-medium text-sm"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <button type="button" className="text-[10px] font-bold text-violet-600 hover:underline uppercase tracking-widest">Forgot Password?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all font-medium text-sm"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Sign In <ArrowRight size={18} />
                  </button>
                </form>

                <p className="text-center text-sm font-medium text-slate-500">
                  New to EXSHOPI? {' '}
                  <button onClick={() => setStep('register')} className="text-violet-600 font-bold hover:underline">Create Account</button>
                </p>
              </motion.div>
            )}

            {step === 'register' && (
              <motion.div 
                key="register"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-sm mx-auto space-y-8"
              >
                <div className="space-y-2">
                  <button onClick={() => setStep('login')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-4">
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
                  <p className="text-slate-500 font-medium">Join our community of smart shoppers</p>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all font-medium text-sm"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Create Password</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all font-medium text-sm"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                    <span className="text-xs text-slate-500 leading-relaxed font-medium">
                      I agree to the <button type="button" className="text-violet-600 font-bold hover:underline">Terms of Service</button> and <button type="button" className="text-violet-600 font-bold hover:underline">Privacy Policy</button>.
                    </span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-500/10 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Get Started <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'email-otp' && (
              <motion.div 
                key="email-otp"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-sm mx-auto space-y-8 py-4"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <Mail size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Email</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Enter the 6-digit code sent to <br />
                      <span className="text-slate-900 font-bold">{email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-16 text-center text-2xl font-black bg-white border-2 border-slate-100 rounded-2xl focus:border-violet-500 focus:bg-white focus:shadow-lg focus:shadow-violet-500/5 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setStep('phone-otp')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    Verify Email
                  </button>
                  <button className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                    Resend Code <span className="text-violet-600 ml-1">0:59</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'phone-otp' && (
              <motion.div 
                key="phone-otp"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-sm mx-auto space-y-8 py-4"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <Smartphone size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Phone Verification</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Enter the code sent to your phone <br />
                      <span className="text-slate-900 font-bold">+971 ••• ••• 45</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-phone-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-16 text-center text-2xl font-black bg-white border-2 border-slate-100 rounded-2xl focus:border-cyan-500 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/5 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setStep('profile')}
                    className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/10 hover:bg-cyan-700 active:scale-[0.98] transition-all"
                  >
                    Verify Phone
                  </button>
                  <button className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                    Resend SMS <span className="text-cyan-600 ml-1">0:59</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div 
                key="profile"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="max-w-md mx-auto space-y-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Almost There!</h2>
                  <p className="text-slate-500 font-medium">Complete your profile to start shopping</p>
                </div>

                <form className="space-y-5" onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500" size={18} />
                        <input 
                          type="text" 
                          required
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 outline-none transition-all font-medium text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                      <input 
                        type="date" 
                        required
                        value={profileData.dob}
                        onChange={(e) => setProfileData({...profileData, dob: e.target.value})}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 outline-none transition-all font-medium text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                      <select 
                        required
                        value={profileData.gender}
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 outline-none transition-all font-medium text-sm appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500" size={18} />
                      <input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 outline-none transition-all font-medium text-sm"
                        placeholder="+971 50 000 0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Address</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-violet-500" size={18} />
                      <textarea 
                        required
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-violet-500 outline-none transition-all font-medium text-sm resize-none h-24"
                        placeholder="Street, Building, Apartment..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pin Location</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all ${
                        profileData.location 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      {isLocating ? (
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                      ) : profileData.location ? (
                        <>
                          <CheckCircle size={18} /> Location Pinned ({profileData.location.lat.toFixed(4)}, {profileData.location.lng.toFixed(4)})
                        </>
                      ) : (
                        <>
                          <MapPin size={18} /> Pin My Current Location
                        </>
                      )}
                    </button>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:from-violet-500 hover:to-cyan-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Complete Setup <CheckCircle size={20} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm mx-auto text-center space-y-6 py-12"
              >
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem]"
                  ></motion.div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h2>
                  <p className="text-slate-500 font-medium">Your account is ready. Redirecting you to the shop...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
