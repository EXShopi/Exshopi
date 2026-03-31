import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Sparkles, Search, ShoppingBag, Truck, HelpCircle, Phone, Mail, ArrowUpRight } from "lucide-react";

/**
 * Premium ExShopi AI Assistant Chat Widget
 * Luxury ecommerce AI shopping assistant with modern, branded design
 */
export default function FloatingChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 I'm ExShopi AI Assistant. I'm here to help you find products, track orders, answer questions, and make your shopping experience amazing.",
      type: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("openExshopiChat", openChat);
    return () => window.removeEventListener("openExshopiChat", openChat);
  }, []);

  // Quick action categories
  const quickActions = [
    {
      icon: <Search className="w-5 h-5" />,
      label: "Find Products",
      description: "Search & discover items",
      queries: [
        "Find laptops under 2000 AED",
        "Show me today's deals",
        "Best gaming products",
      ],
    },
    {
      icon: <Truck className="w-5 h-5" />,
      label: "Track Order",
      description: "Check delivery status",
      queries: [
        "Track my order",
        "What's the delivery time?",
        "How do I track orders?",
      ],
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: "Product Help",
      description: "Questions about items",
      queries: [
        "What's the warranty?",
        "Comparison: iPhone vs Samsung",
        "Returns policy",
      ],
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Support",
      description: "General assistance",
      queries: [
        "Contact customer support",
        "Report an issue",
        "How can I help?",
      ],
    },
  ];

  const handleSendMessage = (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Great question! Let me help you with that. 🎯",
        "I found some helpful information for you. 💡",
        "That's a popular question! Here's what I found... ✨",
        "Let me connect you with the right solution. 🚀",
      ];

      const botMessage = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        type: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 600);
  };

  const handleQuickAction = (query: string) => {
    handleSendMessage(query);
  };

  const supportShortcuts = [
    {
      icon: Phone,
      label: "Call",
      value: "+971 52 260 8063",
      action: () => {
        window.location.href = "tel:+971522608063";
      },
    },
    {
      icon: Mail,
      label: "Email",
      value: "exshopi@exshopi.com",
      action: () => {
        window.location.href = "mailto:exshopi@exshopi.com";
      },
    },
    {
      icon: HelpCircle,
      label: "Help Center",
      value: "Browse FAQs",
      action: () => {
        setIsOpen(false);
        navigate("/faq");
      },
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[99980] group"
        aria-label="Open ExShopi AI Assistant"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-40 blur-xl transition-all duration-300 scale-125" />

        {/* Main button */}
        <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-110 active:scale-95 flex items-center justify-center">
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

          {/* Border ring */}
          <div className="absolute inset-1 rounded-full border border-blue-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
            <Sparkles className="w-4 h-4 text-blue-200 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>

        {/* Floating label */}
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 pointer-events-none">
          ExShopi AI
          <div className="absolute top-full right-4 w-2 h-2 bg-slate-900 transform rotate-45 -translate-y-1" />
        </div>
      </button>
    );
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99970] bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Chat Panel */}
      <div
        className="fixed bottom-6 right-6 z-[99980] flex max-h-[620px] w-[400px] flex-col overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.96))] shadow-[0_30px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl"
        style={{
          animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* ===== HEADER ===== */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2563eb,#3257ff,#1d4ed8)] px-6 py-5 text-white">
          {/* Decorative gradient blob */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-80 h-80 bg-white opacity-5 rounded-full" />
          </div>

          {/* Header content */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight leading-tight">ExShopi AI</h2>
                <p className="text-xs text-blue-100 font-medium">Smart Shopping Assistant</p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-90"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs font-semibold text-blue-50">Always available • AI Powered</span>
          </div>
        </div>

        {/* ===== MESSAGES AREA ===== */}
        <div className="flex-1 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50 to-white p-4">
          {messages.length === 1 ? (
            <>
              {/* Welcome Message */}
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl rounded-bl-none p-4 border border-slate-200/50 shadow-sm max-w-xs">
                  <p className="text-sm text-slate-900 font-medium leading-relaxed">
                    {messages[0].text}
                  </p>
                </div>
              </div>

              {/* Quick Action Categories Grid */}
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">How can I help?</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => handleQuickAction(action.queries[0])}
                        className="w-full group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
                      >
                        {/* Hover highlight */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                              {action.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              →
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {action.label}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Contact instantly
                </p>
                <div className="grid gap-2">
                  {supportShortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.value}</div>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 font-medium transition-all ${
                      msg.type === "user"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-md hover:shadow-lg"
                        : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900 rounded-bl-none border border-slate-200/50 shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ===== INPUT AREA ===== */}
        <div className="border-t border-slate-200/50 bg-white p-4 space-y-3">
          {/* Input field */}
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about products, orders, deals…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200"
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim()}
              className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 group"
            >
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <Send className="w-5 h-5 relative z-10 group-active:scale-90 transition-transform" />
            </button>
          </div>

          {/* Confidence text */}
          <p className="text-xs text-slate-500 font-medium text-center">
            Powered by ExShopi AI • Instant Responses
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>,
    document.body
  );
}
