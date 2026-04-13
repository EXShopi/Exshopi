import React, { useRef, useState } from "react";
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
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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
      <div className="relative z-[300] overflow-visible">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          className="group flex items-center gap-1.5 rounded-[18px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95))] px-2 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.10)] sm:gap-3 sm:rounded-[24px] sm:px-3 sm:py-2.5"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-blue-600 text-white shadow-md transition-shadow group-hover:shadow-lg sm:h-11 sm:w-11">
            {effectiveLoggedIn && effectiveUserName ? (
              <span className="font-bold text-xs sm:text-sm">
                {effectiveUserName.split(" ")[0]?.[0] || "U"}
              </span>
            ) : (
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            )}

            {effectiveLoggedIn && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-green-400 sm:h-3 sm:w-3" />
            )}
          </div>

          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              My Account
            </span>
            <span className="text-sm font-bold leading-tight text-slate-900">
              {effectiveLoggedIn ? "Account" : "Sign In"}
            </span>
          </div>

          <ChevronDown
            className={`hidden h-4 w-4 text-slate-600 transition-transform duration-300 sm:block ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AccountDropdown
          isOpen={dropdownOpen}
          anchorRef={buttonRef}
          onClose={() => setDropdownOpen(false)}
          onSignInClick={() => {
            setDropdownOpen(false);
            setAuthModalOpen(true);
          }}
          isLoggedIn={effectiveLoggedIn}
        />
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}