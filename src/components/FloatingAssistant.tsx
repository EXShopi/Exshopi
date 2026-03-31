import React, { useState } from "react";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  AlertCircle,
  Phone,
  Mail,
  HelpCircle,
  ChevronDown,
  Upload,
  Headphones,
  Sparkles,
} from "lucide-react";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
};

type ComplaintType =
  | "Order not received"
  | "Wrong product delivered"
  | "Damaged product"
  | "Refund issue"
  | "Seller issue"
  | "Payment issue"
  | "Website issue"
  | "Other";

const quickQuestions = [
  "How can I track my order?",
  "What are delivery charges in UAE?",
  "What is your return policy?",
  "How can I become a seller?",
  "How can I contact support?",
];

const faqItems = [
  {
    question: "How do I place an order?",
    answer:
      "Browse products, add your item to cart, proceed to checkout, enter your address, and choose your payment method to place the order.",
  },
  {
    question: "How can I track my order?",
    answer:
      "You can track your order from your account order history or contact ExShopi support with your order number.",
  },
  {
    question: "What are delivery charges?",
    answer:
      "UAE delivery charges start from 10 AED. GCC delivery charges may vary based on destination and product type.",
  },
  {
    question: "What is the return policy?",
    answer:
      "Eligible products can be returned within the return window if they meet the return conditions. Some used or special items may have different rules.",
  },
];

const knowledgeBase: Record<string, string> = {
  order:
    "To track your order, go to your account order section or contact ExShopi support with your order number.",
  tracking:
    "Order tracking is available through your account or by contacting support with your order number.",
  delivery:
    "UAE delivery charges start from 10 AED. Other GCC delivery charges can vary depending on destination and product.",
  return:
    "Eligible items can be returned within the allowed return period if they meet return conditions.",
  refund:
    "Refund timelines depend on payment method and product type. Support can help review your specific case.",
  seller:
    "To become a seller, register through the seller onboarding page and submit the required documents for approval.",
  contact:
    "You can contact ExShopi through WhatsApp, email, phone, or the complaint section inside this assistant.",
  payment:
    "Supported payment methods may include Cash on Delivery, card payments, and other region-based options.",
  complaint:
    "You can submit a complaint in the Complaint tab with your order number and issue details.",
};

function getAIReply(input: string) {
  const lower = input.toLowerCase();

  for (const key of Object.keys(knowledgeBase)) {
    if (lower.includes(key)) {
      return knowledgeBase[key];
    }
  }

  return "I can help with orders, delivery, returns, refunds, seller registration, complaints, payment methods, and contact details.";
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "complaint" | "contact" | "help">("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "bot",
      text: "Welcome to ExShopi Assistant. I can help with orders, delivery, returns, complaints, contact details, seller support, and general marketplace questions.",
    },
  ]);

  const [complaintForm, setComplaintForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    orderNumber: "",
    complaintType: "Order not received" as ComplaintType,
    message: "",
    fileName: "",
  });

  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const sendMessage = (text?: string) => {
    const finalText = (text ?? chatInput).trim();
    if (!finalText) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: finalText,
    };

    const botMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "bot",
      text: getAIReply(finalText),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setChatInput("");
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !complaintForm.fullName ||
      !complaintForm.phone ||
      !complaintForm.email ||
      !complaintForm.message
    ) {
      alert("Please fill all required complaint fields.");
      return;
    }

    console.log("Complaint submitted:", complaintForm);
    setComplaintSubmitted(true);

    setComplaintForm({
      fullName: "",
      phone: "",
      email: "",
      orderNumber: "",
      complaintType: "Order not received",
      message: "",
      fileName: "",
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 via-blue-600 to-slate-900 text-white shadow-[0_20px_60px_rgba(37,99,235,0.35)] transition hover:scale-105"
        aria-label="Open ExShopi Assistant"
      >
        <Headphones className="h-7 w-7" />
      </button>

      {isOpen && (
        <div className="fixed bottom-19 right-5 z-[99999] flex h-[640px] w-[390px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-900 to-sky-700 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold tracking-wide">ExShopi Assistant</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                    <Sparkles className="h-3.5 w-3.5" />
                    Chat, complaint, contact and help
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 border-b border-slate-200 bg-white px-2 py-2">
            {[
              { key: "chat", label: "Chat", icon: MessageCircle },
              { key: "complaint", label: "Complaint", icon: AlertCircle },
              { key: "contact", label: "Contact", icon: Phone },
              { key: "help", label: "Help", icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as "chat" | "complaint" | "contact" | "help")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50">
            {activeTab === "chat" && (
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-3 px-4 py-4">
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Ask ExShopi AI anything</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Products, delivery, returns, sellers, contact, complaints and support.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickQuestions.map((question) => (
                        <button
                          key={question}
                          onClick={() => sendMessage(question)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          message.role === "user"
                            ? "rounded-br-md bg-slate-900 text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                      placeholder="Type your question..."
                      className="h-10 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => sendMessage()}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:scale-105"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "complaint" && (
              <div className="px-4 py-4">
                <div className="mb-4 rounded-2xl border border-red-100 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900">Submit a Complaint</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Report order, refund, seller, delivery or payment issues.
                  </p>
                </div>

                {complaintSubmitted && (
                  <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    Your complaint has been received. ExShopi support will contact you soon.
                  </div>
                )}

                <form onSubmit={handleComplaintSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={complaintForm.fullName}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Phone Number *"
                    value={complaintForm.phone}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={complaintForm.email}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Order Number"
                    value={complaintForm.orderNumber}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, orderNumber: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <select
                    value={complaintForm.complaintType}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        complaintType: e.target.value as ComplaintType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option>Order not received</option>
                    <option>Wrong product delivered</option>
                    <option>Damaged product</option>
                    <option>Refund issue</option>
                    <option>Seller issue</option>
                    <option>Payment issue</option>
                    <option>Website issue</option>
                    <option>Other</option>
                  </select>

                  <textarea
                    placeholder="Write your complaint here *"
                    rows={5}
                    value={complaintForm.message}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                    <Upload className="h-4 w-4" />
                    <span>{complaintForm.fileName || "Upload screenshot or image"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          fileName: e.target.files?.[0]?.name || "",
                        }))
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Submit Complaint
                  </button>
                </form>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-4 px-4 py-4">
                <a
                  href="https://wa.me/971000000000"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">WhatsApp Support</p>
                    <p className="text-xs text-slate-500">Chat now with ExShopi team</p>
                  </div>
                </a>

                <a
                  href="mailto:support@exshopi.com"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email Support</p>
                    <p className="text-xs text-slate-500">support@exshopi.com</p>
                  </div>
                </a>

                <a
                  href="tel:+971000000000"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phone Support</p>
                    <p className="text-xs text-slate-500">+971 00 000 0000</p>
                  </div>
                </a>
              </div>
            )}

            {activeTab === "help" && (
              <div className="space-y-3 px-4 py-4">
                {faqItems.map((item, index) => {
                  const isOpenItem = openFAQ === index;

                  return (
                    <div
                      key={item.question}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        onClick={() => setOpenFAQ(isOpenItem ? null : index)}
                        className="flex w-full items-center justify-between px-4 py-4 text-left"
                      >
                        <span className="pr-3 text-sm font-semibold text-slate-900">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-500 transition ${
                            isOpenItem ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpenItem && (
                        <div className="border-t border-slate-100 px-4 py-4 text-sm leading-6 text-slate-600">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}