import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Clock,
  Gift,
  MessageCircle,
} from "lucide-react";

interface PremiumAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = "signin" | "signup";

export default function PremiumAuthModal({
  isOpen,
  onClose,
}: PremiumAuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Sign in with:", signInForm);
      // onClose(); // Uncomment after connecting to auth API
    }, 2000);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Sign up with:", signUpForm);
      // onClose(); // Uncomment after connecting to auth API
    }, 2000);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      {/* Modal Container */}
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.3s ease-out",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[600px]">
          {/* LEFT PANEL - Brand & Benefits (Hidden on Mobile) */}
          <div className="hidden lg:flex flex-col justify-between rounded-l-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-12 text-white relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-20 right-20 h-72 w-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 h-56 w-56 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* ExShopi Logo */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="font-bold text-white text-sm">E</span>
                  </div>
                  <span className="text-3xl font-black">ExShopi</span>
                </div>
                <p className="text-slate-300 text-xs font-medium tracking-wider uppercase">
                  Premium Marketplace
                </p>
              </div>

              {/* Welcome Text */}
              <div>
                <h2 className="text-5xl font-black mb-3 leading-tight">
                  Welcome Back
                </h2>
                <p className="text-slate-300 text-base font-light leading-relaxed">
                  Access your account to enjoy exclusive deals, track orders, and faster checkout
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="relative z-10 space-y-5">
              {[
                {
                  icon: Clock,
                  title: "Real-time Tracking",
                  desc: "Know exactly where your order is",
                },
                {
                  icon: Heart,
                  title: "Save Collections",
                  desc: "Keep your favorite items safe",
                },
                {
                  icon: Zap,
                  title: "Fast Checkout",
                  desc: "One-click purchase experience",
                },
                {
                  icon: Gift,
                  title: "Exclusive Deals",
                  desc: "Member-only offers daily",
                },
                {
                  icon: Shield,
                  title: "Secure Shopping",
                  desc: "Your data is always protected",
                },
              ].map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <Icon className="h-6 w-6 text-blue-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        {benefit.title}
                      </p>
                      <p className="text-slate-300 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Badge */}
            <div className="relative z-10 pt-8 border-t border-white/10 flex items-center gap-2 text-slate-300 text-sm">
              <Shield className="h-4 w-4" />
              <span>256-bit SSL • Privacy Protected</span>
            </div>
          </div>

          {/* RIGHT PANEL - Forms */}
          <div className="flex flex-col justify-between p-8 lg:p-12 rounded-r-3xl lg:rounded-r-3xl">
            {/* Tab Switcher */}
            <div>
              <div className="mb-8 inline-flex bg-slate-100 rounded-full p-1.5">
                {[
                  { id: "signin", label: "Sign In" },
                  { id: "signup", label: "Create Account" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AuthTab)}
                    className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.1)]"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SIGN IN FORM */}
              {activeTab === "signin" && (
                <div className="space-y-5 animate-fadeInUp">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">
                      Welcome back
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Sign in to your ExShopi account
                    </p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={signInForm.email}
                          onChange={(e) =>
                            setSignInForm({
                              ...signInForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signInForm.password}
                          onChange={(e) =>
                            setSignInForm({
                              ...signInForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signInForm.rememberMe}
                          onChange={(e) =>
                            setSignInForm({
                              ...signInForm,
                              rememberMe: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-600">
                          Remember me
                        </span>
                      </label>
                      <a
                        href="#"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        Forgot password?
                      </a>
                    </div>

                    {/* Sign In Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-500 font-medium">
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button className="py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center text-xl">
                      🔵
                    </button>
                    <button className="py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center text-xl">
                      🍎
                    </button>
                    <button className="py-3 px-4 border border-green-200 bg-green-50 rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </button>
                  </div>

                  {/* Sign Up Link */}
                  <p className="text-center text-slate-600 text-sm">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setActiveTab("signup")}
                      className="font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              )}

              {/* SIGN UP FORM */}
              {activeTab === "signup" && (
                <div className="space-y-4 animate-fadeInUp">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">
                      Join ExShopi
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Create your account to get started
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Ahmed Al Mazrouei"
                          value={signUpForm.fullName}
                          onChange={(e) =>
                            setSignUpForm({
                              ...signUpForm,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={signUpForm.email}
                          onChange={(e) =>
                            setSignUpForm({
                              ...signUpForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signUpForm.password}
                          onChange={(e) =>
                            setSignUpForm({
                              ...signUpForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signUpForm.confirmPassword}
                          onChange={(e) =>
                            setSignUpForm({
                              ...signUpForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={signUpForm.acceptTerms}
                        onChange={(e) =>
                          setSignUpForm({
                            ...signUpForm,
                            acceptTerms: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 mt-0.5"
                      />
                      <span className="text-sm text-slate-600">
                        I agree to ExShopi's{" "}
                        <a href="#" className="font-semibold text-blue-600 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="font-semibold text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>

                    {/* Create Account Button */}
                    <button
                      type="submit"
                      disabled={isLoading || !signUpForm.acceptTerms}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sign In Link */}
                  <p className="text-center text-slate-600 text-sm">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("signin")}
                      className="font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Brand Info */}
            <div className="lg:hidden mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                🔒 256-bit SSL Encryption • Secure & Private
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
