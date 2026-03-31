import { useState } from "react";
import { PhoneCall, Mail, MessageCircle, Send, FileText, HelpCircle } from "lucide-react";

export default function Support() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "",
    message: "",
  });

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              Exshopi Support
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              We’re Here to Help
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/80">
              Get help with orders, delivery, returns, refunds, seller support,
              account issues and general questions.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <PhoneCall className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Call Support</h3>
              <p className="mt-2 text-sm text-slate-600">
                Speak directly with our support team.
              </p>
              <a
                href="tel:+971522608063"
                className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                +971 52 260 8063
              </a>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 ring-1 ring-slate-200">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Email Support</h3>
              <p className="mt-2 text-sm text-slate-600">
                Send us your issue and we will respond as soon as possible.
              </p>
              <a
                href="mailto:exshopi@exshopi.com"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                exshopi@exshopi.com
              </a>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">WhatsApp</h3>
              <p className="mt-2 text-sm text-slate-600">
                Chat with Exshopi support for quick assistance.
              </p>
              <a
                href="https://wa.me/971522608063"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Open WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-6 border-t border-slate-200 px-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Contact Form</h3>
                  <p className="text-sm text-slate-500">
                    Send your support request directly from this page.
                  </p>
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />

                <input
                  type="text"
                  placeholder="Order Number (Optional)"
                  value={form.orderNumber}
                  onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />

                <input
                  type="text"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white md:col-span-2"
                />

                <textarea
                  placeholder="Write your message..."
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white md:col-span-2"
                />

                <button
                  type="submit"
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 md:col-span-2"
                >
                  Submit Request
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Common Help Topics</h3>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>• Order tracking</p>
                  <p>• Delivery issues</p>
                  <p>• Return and refund requests</p>
                  <p>• Seller support and onboarding</p>
                  <p>• Product warranty questions</p>
                  <p>• Account login issues</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Support Hours</h3>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>Monday to Saturday</p>
                  <p>9:00 AM – 9:00 PM</p>
                  <p>Sunday</p>
                  <p>10:00 AM – 6:00 PM</p>
                  <p className="pt-2 font-medium text-slate-900">
                    UAE Based Customer Assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
