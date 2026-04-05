import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Phone,
  User,
  MapPin,
  CheckCircle,
  Apple,
  Chrome,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Monitor,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Globe,
  Heart,
} from 'lucide-react';
import AuthService from '../lib/authService';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { auth } from '../supabaseClient';

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
    location: null as { lat: number; lng: number } | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { user, setUser, setRole, setAccessToken, setSellerApplication } = useAuthStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isOpen || step !== 'login') return;

      const currentUserId =
        user?.id || auth.currentUser?.id || auth.currentUser?.uid || null;

      if (!currentUserId) return;

      try {
        const profile = await userAPI.get(currentUserId);
        const hasProfileName = Boolean(profile?.name || profile?.fullName);

        if (!hasProfileName) {
          setStep('profile');
        }
      } catch (error) {
        console.error('Profile check failed:', error);
      }
    };

    void checkProfile();
  }, [isOpen, step, user?.id]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
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
      console.log(`Social login requested for ${provider}`);
      alert('Social login is temporarily unavailable. Please use Email & Password login.');
    } catch (error) {
      console.error('Social login stub error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || Number.isNaN(Number(value))) return;

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

          if (!profile || (!profile.name && !profile.fullName)) {
            setStep('profile');
          } else {
            setStep('success');
            setTimeout(() => onClose(), 1500);
          }
        } catch (err) {
          console.error('Profile fetch after login failed:', err);
          setStep('success');
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      alert(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const fullName = profileData.fullName.trim();
      const normalizedPhone = phone.trim();
      const fallbackName =
        email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'ExShopi Customer';

      const resp = await AuthService.signUp(
        email,
        password,
        fullName || fallbackName,
        normalizedPhone
      );

      if (resp?.user) {
        setUser(resp.user);
        setRole((resp.role as any) || 'customer');
        setAccessToken((resp as any).accessToken || useAuthStore.getState().accessToken || null);
        setSellerApplication(resp.sellerApplication || null);

        setProfileData((current) => ({
          ...current,
          fullName: fullName || resp.user.fullName || resp.user.name || fallbackName,
        }));

        setPhone(resp.user.phone || normalizedPhone);
        setStep('profile');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfileData((current) => ({
          ...current,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your location. Please check your browser permissions.');
        setIsLocating(false);
      }
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = useAuthStore.getState().user?.id as string | undefined;

      const mergedUser = {
        ...(useAuthStore.getState().user || {}),
        ...profileData,
        phone,
        name: profileData.fullName,
        fullName: profileData.fullName,
      };

      if (userId) {
        try {
          const updated = await userAPI.update(userId, {
            name: profileData.fullName,
            fullName: profileData.fullName,
            phone,
            country: profileData.country,
            address: profileData.address,
            city: profileData.city,
            dob: profileData.dob,
            gender: profileData.gender,
            location: profileData.location,
          });

          setUser(updated || mergedUser);
        } catch (err) {
          console.error('Profile API update failed:', err);
          setUser(mergedUser);
        }
      } else {
        setUser(mergedUser);
      }

      setStep('success');
      setTimeout(() => onClose(), 2000);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      alert(`Failed to save profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex h-[700px] w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-[-10%] top-[-10%] h-[120%] w-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/30 via-transparent to-transparent blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] h-[120%] w-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">EXSHOPI.</span>
            </div>

            <h1 className="mb-6 text-4xl font-black leading-tight text-white">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Shopping Experience
              </span>
            </h1>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: 'Secure & Encrypted Payments' },
                { icon: Globe, text: 'Worldwide Express Delivery' },
                { icon: Heart, text: 'Personalized Recommendations' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-medium text-slate-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <item.icon size={16} className="text-violet-400" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-[10px] font-bold text-white"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Joined by 50k+ shoppers
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                "The best shopping platform I&apos;ve used. Fast delivery and amazing support!"
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto bg-slate-50/50 p-8 lg:p-12">
          <button
            onClick={onClose}
            className="absolute right-8 top-8 z-20 rounded-2xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all hover:border-slate-100 hover:bg-white hover:text-slate-900"
            type="button"
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
                className="mx-auto max-w-sm space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Welcome Back
                  </h2>
                  <p className="font-medium text-slate-500">
                    Sign in to continue your journey
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'google', icon: Chrome, color: 'text-blue-500' },
                    { id: 'apple', icon: Apple, color: 'text-slate-900' },
                    { id: 'microsoft', icon: Monitor, color: 'text-blue-600' },
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleSocialLogin(provider.id as any)}
                      className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 transition-all hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/5 active:scale-95"
                      type="button"
                    >
                      <provider.icon size={22} className={provider.color} />
                    </button>
                  ))}
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative bg-slate-50/50 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Or use email
                  </span>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Email Address
                    </label>
                    <div className="group relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                        size={18}
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Password
                      </label>
                      <button
                        type="button"
                        className="text-[10px] font-bold uppercase tracking-widest text-violet-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="group relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                        size={18}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-sm font-medium outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
                  >
                    Sign In <ArrowRight size={18} />
                  </button>
                </form>

                <p className="text-center text-sm font-medium text-slate-500">
                  New to EXSHOPI?{' '}
                  <button
                    onClick={() => setStep('register')}
                    className="font-bold text-violet-600 hover:underline"
                    type="button"
                  >
                    Create Account
                  </button>
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
                className="mx-auto max-w-sm space-y-8"
              >
                <div className="space-y-2">
                  <button
                    onClick={() => setStep('login')}
                    className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-slate-600"
                    type="button"
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Create Account
                  </h2>
                  <p className="font-medium text-slate-500">
                    Join our community of smart shoppers
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData((current) => ({ ...current, fullName: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Create Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={7}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                      placeholder="+971 50 000 0000"
                    />
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs font-medium leading-relaxed text-slate-500">
                      I agree to the{' '}
                      <a
                        href="/terms-conditions"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-violet-600 hover:underline"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-violet-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-violet-500/10 transition-all hover:bg-violet-700 active:scale-[0.98]"
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
                className="mx-auto max-w-sm space-y-8 py-4"
              >
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-violet-50 text-violet-600 shadow-inner">
                    <Mail size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      Verify Email
                    </h2>
                    <p className="font-medium leading-relaxed text-slate-500">
                      Enter the 6-digit code sent to <br />
                      <span className="font-bold text-slate-900">{email}</span>
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
                      className="h-16 w-12 rounded-2xl border-2 border-slate-100 bg-white text-center text-2xl font-black outline-none transition-all focus:border-violet-500 focus:bg-white focus:shadow-lg focus:shadow-violet-500/5"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setStep('phone-otp')}
                    className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
                    type="button"
                  >
                    Verify Email
                  </button>
                  <button
                    className="w-full text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600"
                    type="button"
                  >
                    Resend Code <span className="ml-1 text-violet-600">0:59</span>
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
                className="mx-auto max-w-sm space-y-8 py-4"
              >
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-cyan-50 text-cyan-600 shadow-inner">
                    <Smartphone size={36} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                      Phone Verification
                    </h2>
                    <p className="font-medium leading-relaxed text-slate-500">
                      Enter the code sent to your phone <br />
                      <span className="font-bold text-slate-900">+971 ••• ••• 45</span>
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
                      className="h-16 w-12 rounded-2xl border-2 border-slate-100 bg-white text-center text-2xl font-black outline-none transition-all focus:border-cyan-500 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/5"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setStep('profile')}
                    className="w-full rounded-2xl bg-cyan-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-cyan-500/10 transition-all hover:bg-cyan-700 active:scale-[0.98]"
                    type="button"
                  >
                    Verify Phone
                  </button>
                  <button
                    className="w-full text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600"
                    type="button"
                  >
                    Resend SMS <span className="ml-1 text-cyan-600">0:59</span>
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
                className="mx-auto max-w-md space-y-8"
              >
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Almost There!
                  </h2>
                  <p className="font-medium text-slate-500">
                    Complete your profile to start shopping
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Full Name
                      </label>
                      <div className="group relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500"
                          size={18}
                        />
                        <input
                          type="text"
                          required
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData({ ...profileData, fullName: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-violet-500"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        required
                        value={profileData.dob}
                        onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Gender
                      </label>
                      <select
                        required
                        value={profileData.gender}
                        onChange={(e) =>
                          setProfileData({ ...profileData, gender: e.target.value })
                        }
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-violet-500"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Phone Number
                    </label>
                    <div className="group relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500"
                        size={18}
                      />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-violet-500"
                        placeholder="+971 50 000 0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Delivery Address
                    </label>
                    <div className="group relative">
                      <MapPin
                        className="absolute left-4 top-4 text-slate-400 group-focus-within:text-violet-500"
                        size={18}
                      />
                      <textarea
                        required
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                        className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-violet-500"
                        placeholder="Street, Building, Apartment..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Pin Location
                    </label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 transition-all ${
                        profileData.location
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      {isLocating ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-slate-600"></div>
                      ) : profileData.location ? (
                        <>
                          <CheckCircle size={18} /> Location Pinned (
                          {profileData.location.lat.toFixed(4)},{' '}
                          {profileData.location.lng.toFixed(4)})
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-cyan-500 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
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
                className="mx-auto max-w-sm space-y-6 py-12 text-center"
              >
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-50 text-emerald-500 shadow-inner">
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
                    className="absolute inset-0 rounded-[2.5rem] bg-emerald-500/20"
                  ></motion.div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Success!
                  </h2>
                  <p className="font-medium text-slate-500">
                    Your account is ready. Redirecting you to the shop...
                  </p>
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

export default AuthModal;