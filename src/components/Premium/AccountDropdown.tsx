import React, { useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Package,
  Heart,
  Headphones,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../lib/authService";
import { useAuthStore } from "../../store/auth";

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInClick: () => void;
  isLoggedIn?: boolean;
}

export default function AccountDropdown({
  isOpen,
  onClose,
  onSignInClick,
  isLoggedIn = false,
}: AccountDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const displayName =
    authUser?.fullName ||
    authUser?.name ||
    authUser?.displayName ||
    authUser?.email ||
    "ExShopi Customer";
  const membershipLabel =
    authUser?.status === "active" ? "Verified Account" : "Marketplace Member";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isLoggedIn) {
    const handleNavigate = (path: string) => {
      onClose();
      navigate(path);
    };

    const handleSignOut = async () => {
      await AuthService.signOut();
      resetAuth();
      onClose();
      navigate("/");
    };

    return (
      <div
        ref={dropdownRef}
className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[9999]"      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">
          <p className="text-sm opacity-90">Welcome back</p>
          <p className="text-xl font-black">{displayName}</p>
          <p className="text-xs opacity-75 mt-1">{membershipLabel}</p>
        </div>

        {/* Menu Items */}
        <div className="border-t border-slate-200">
          {[
            {
              icon: Package,
              label: "My Orders",
              desc: "Track your purchases",
              action: () => handleNavigate("/account?tab=orders"),
            },
            {
              icon: Heart,
              label: "Wishlist",
              desc: "Your saved items",
              action: () => handleNavigate("/account?tab=wishlist"),
            },
            {
              icon: User,
              label: "Account Settings",
              desc: "Manage your profile",
              action: () => handleNavigate("/account?tab=profile"),
            },
            {
              icon: Headphones,
              label: "Support Center",
              desc: "Get help anytime",
              action: () => handleNavigate("/support"),
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full px-6 py-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 transition-colors border-t border-slate-200"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>

        {/* Security Info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Secure • Your account is protected</span>
        </div>
      </div>
    );
  }

  // Not logged in view
  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-4 w-[320px] overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2"
    >
      <div className="bg-[linear-gradient(135deg,#2563eb,#3257ff,#1d4ed8)] px-6 py-6 text-white">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-90">
          Welcome to
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 shadow-inner" />
          <p className="text-2xl font-black">ExShopi</p>
        </div>
        <p className="text-sm opacity-90">
          Your premium shopping destination for endless deals
        </p>
      </div>

      <div className="border-t border-slate-100 p-3">
        {[
          { icon: Package, label: "Browse Orders", desc: "View marketplace", action: () => navigate("/order-tracking") },
          {
            icon: Heart,
            label: "Explore Wishlist",
            desc: "Save your favorites",
            action: () => navigate("/wishlist"),
          },
          {
            icon: Headphones,
            label: "Support Center",
            desc: "We're here to help",
            action: () => navigate("/support"),
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="mb-2 flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 transition-colors hover:border-blue-100 hover:bg-blue-50/50 last:mb-0"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-4">
        <button
          onClick={onSignInClick}
          className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Sign In
        </button>
        <button
          onClick={onSignInClick}
          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3.5 font-bold text-blue-600 transition-all hover:bg-blue-50"
        >
          Create Account
        </button>
      </div>

      <div className="border-t border-slate-100 px-6 py-3 text-center text-xs text-slate-500">
        🔒 256-bit SSL Encryption • Your data is secure
      </div>
    </div>
  );
}
