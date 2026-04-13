import React, {
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSignInClick: () => void;
  isLoggedIn?: boolean;
}

type Position = {
  top: number;
  left: number;
};

export default function AccountDropdown({
  isOpen,
  anchorRef,
  onClose,
  onSignInClick,
  isLoggedIn = false,
}: AccountDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const resetAuth = useAuthStore((state) => state.resetAuth);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const displayName =
    authUser?.fullName ||
    authUser?.name ||
    authUser?.displayName ||
    authUser?.email ||
    "ExShopi Customer";

  const membershipLabel =
    authUser?.status === "active" ? "Verified Account" : "Marketplace Member";

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dropdownWidth = 320;
      const gap = 12;
      const viewportPadding = 12;

      let left = rect.right - dropdownWidth;
      left = Math.max(viewportPadding, left);
      left = Math.min(left, window.innerWidth - dropdownWidth - viewportPadding);

      const top = rect.bottom + gap;

      setPosition({ top, left });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!mounted || !isOpen) return null;

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

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[99999] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">
          <p className="text-sm opacity-90">Welcome back</p>
          <p className="text-xl font-black">{displayName}</p>
          <p className="mt-1 text-xs opacity-75">{membershipLabel}</p>
        </div>

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
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex w-full items-center gap-4 border-b border-slate-100 px-6 py-4 text-left transition-colors hover:bg-slate-50 last:border-0"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-6 py-4 font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Secure • Your account is protected</span>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[99999] w-[320px] overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
      }}
    >
      <div className="bg-[linear-gradient(135deg,#2563eb,#3257ff,#1d4ed8)] px-6 py-6 text-white">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-90">
          Welcome to
        </p>

        <div className="mb-3 flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-white/20 shadow-inner" />
          <p className="text-2xl font-black">ExShopi</p>
        </div>

        <p className="text-sm opacity-90">
          Your premium shopping destination for endless deals
        </p>
      </div>

      <div className="border-t border-slate-100 p-3">
        {[
          {
            icon: Package,
            label: "Browse Orders",
            desc: "View marketplace",
            action: () => navigate("/order-tracking"),
          },
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
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="mb-2 flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 transition-colors hover:border-blue-100 hover:bg-blue-50/50 last:mb-0"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-4">
        <button
          type="button"
          onClick={onSignInClick}
          className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={onSignInClick}
          className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3.5 font-bold text-blue-600 transition-all hover:bg-blue-50"
        >
          Create Account
        </button>
      </div>

      <div className="border-t border-slate-100 px-6 py-3 text-center text-xs text-slate-500">
        🔒 256-bit SSL Encryption • Your data is secure
      </div>
    </div>,
    document.body
  );
}