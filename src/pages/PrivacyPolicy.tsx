import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, ShieldCheck, Database, BellRing } from "lucide-react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | ExShopi";
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
      <div className="mb-8 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-slate-900">Privacy Policy</span>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Data Protection
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-3xl text-slate-500">
              ExShopi collects user information such as name, email, and phone number for
              order processing, account management, support, and secure marketplace operations.
              We do not share your data with third parties without consent except when needed
              for fulfillment, compliance, or trusted platform operations.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg">
            <LockKeyhole size={32} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Database className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">Information We Collect</h2>
          <p className="mt-2 text-slate-500">
            We may collect your name, email address, phone number, delivery details,
            order history, account activity, and customer support messages required
            to operate ExShopi safely and efficiently.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">How We Protect It</h2>
          <p className="mt-2 text-slate-500">
            We use access controls, secure infrastructure, and operational safeguards
            to help reduce unauthorized access, misuse, or accidental exposure of personal data.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <BellRing className="h-6 w-6 text-slate-900" />
          <h2 className="mt-4 text-xl font-black text-slate-900">Your Choices</h2>
          <p className="mt-2 text-slate-500">
            You can contact ExShopi support to request account updates, review
            personal details, or ask privacy-related questions.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h2 className="text-2xl font-black text-slate-900">How We Use Information</h2>

        <div className="mt-6 space-y-5 text-slate-600">
          <p>
            ExShopi uses personal information to process orders, manage customer accounts,
            send order updates, support buyer and seller communication, prevent fraud,
            and improve the overall marketplace experience.
          </p>
          <p>
            ExShopi may use technical data such as device, browser, and session
            information to keep the platform secure and improve performance.
          </p>
          <p>
            We do not sell customer personal information. Data may be shared only
            when required for order fulfillment, platform operations, legal compliance,
            or trusted service providers acting on our behalf.
          </p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">Marketplace Communications</h3>
        <div className="mt-4 space-y-4 text-slate-600">
          <p>• Order confirmations and delivery updates may be sent by email or phone.</p>
          <p>• Customer support may contact you regarding orders, disputes, or account safety.</p>
          <p>• Promotional messages should remain optional where applicable.</p>
        </div>

        <h3 className="mt-10 text-xl font-black text-slate-900">Contact for Privacy Requests</h3>
        <p className="mt-4 text-slate-600">
          For any privacy request or concern, contact ExShopi at
          {" "}
          <a className="font-semibold text-blue-600" href="mailto:exshopi@exshopi.com">
            exshopi@exshopi.com
          </a>
          {" "}
          or call
          {" "}
          <a className="font-semibold text-blue-600" href="tel:+971522608063">
            +971 52 260 8063
          </a>
          .
        </p>

        <h3 className="mt-10 text-xl font-black text-slate-900">Cookie Declaration</h3>
        <div className="mt-4">
          {/* CookieHub declaration embed */}
          <div className="cookiehub-declaration"></div>
        </div>
      </div>
    </div>
  );
}
