import React, { useState } from "react";
import { User, ChevronDown } from "lucide-react";
import AccountDropdown from "./AccountDropdown";
import { AuthModal } from "../AuthModal";
import { useAuthStore } from "../../store/auth";

interface PremiumAccountButtonProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export default function PremiumAccountButton({
  isLoggedIn,
  userName,
}: PremiumAccountButtonProps) {
  const authUser = useAuthStore((state) => state.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const effectiveLoggedIn = isLoggedIn ?? Boolean(authUser?.id || authUser?.uid);
  const effectiveUserName =
    userName ||
    authUser?.name ||
    authUser?.fullName ||
    authUser?.displayName ||
    authUser?.email ||
    undefined;

  return (
    <>
      <div className="relative">
        {/* Account Button */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="group flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))] px-3 py-2.5 shadow-[0_12px_26px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.10)]"
        >
          {/* Avatar */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-blue-600 text-white shadow-md transition-shadow group-hover:shadow-lg">
            {effectiveLoggedIn && effectiveUserName ? (
              <span className="font-bold text-sm">
                {effectiveUserName?.split(" ")[0]?.[0] || "U"}
              </span>
            ) : (
              <User className="h-5 w-5" />
            )}
            {effectiveLoggedIn && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border border-white" />
            )}
          </div>

          {/* Label */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              My Account
            </span>
            <span className="text-sm font-bold leading-tight text-slate-900">
              {effectiveLoggedIn ? "Account" : "Sign In"}
            </span>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`h-4 w-4 text-slate-600 transition-transform duration-300 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        <AccountDropdown
          isOpen={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
          onSignInClick={() => {
            setDropdownOpen(false);
            setAuthModalOpen(true);
          }}
          isLoggedIn={effectiveLoggedIn}
        />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
