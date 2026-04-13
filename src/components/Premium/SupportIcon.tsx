import React, { useState } from "react";
import { Headphones, X, MessageSquare, Phone, Mail, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

export default function SupportIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: MessageSquare,
      label: "Chat with us",
      desc: "Average response: 2 min",
      color: "blue",
      action: () => {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent("openExshopiChat"));
      },
    },
    {
      icon: Phone,
      label: "Call us",
      desc: "+971522608063",
      color: "green",
      action: () => {
        window.location.href = "tel:+971522608063";
      },
    },
    {
      icon: Mail,
      label: "Email us",
      desc: "exshopi@exshopi.com",
      color: "purple",
      action: () => {
        window.location.href = "mailto:exshopi@exshopi.com";
      },
    },
    {
      icon: HelpCircle,
      label: "Help center",
      desc: "Browse FAQs",
      color: "orange",
      action: () => {
        setIsOpen(false);
        navigate("/faq");
      },
    },
  ];

  const supportContent = isOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99990] bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Support Panel */}
      <div
        className="fixed right-20 top-20 z-[99991] w-80 rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Headphones className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900">Need help?</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Support Options */}
        <div className="p-4 space-y-3">
          {supportOptions.map((option, idx) => {
            const Icon = option.icon;
            const colorClasses = {
              blue: "bg-blue-100 text-blue-600",
              green: "bg-green-100 text-green-600",
              purple: "bg-purple-100 text-purple-600",
              orange: "bg-orange-100 text-orange-600",
            };

            return (
              <button
                key={idx}
                onClick={option.action}
                className="w-full flex items-start gap-3 rounded-2xl p-3 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${colorClasses[option.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {option.label}
                  </p>
                  <p className="text-xs text-slate-500">{option.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-3xl">
          <p className="text-xs text-slate-600 text-center">
            Available Monday-Saturday, 9 AM - 7 PM GST
          </p>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close support panel' : 'Open support panel'}
        aria-expanded={isOpen}
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-all duration-300 hover:border-green-300 hover:shadow-md hover:bg-green-50 hover:-translate-y-0.5"
      >
        <Headphones className="h-5 w-5" />
      </button>

      {supportContent && createPortal(supportContent, document.body)}
    </>
  );
}
