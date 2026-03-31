import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useLanguageStore } from '../store/language';
import { storefrontT } from '../lib/storefrontCopy';

export default function Footer() {
  const { lang } = useLanguageStore();
  return (
    <footer className="mt-16 bg-[#06101f] text-white">
      
      {/* SMALL TRUST STRIP (COMPACT) */}
      <div className="border-b border-white/10 bg-[#0b1933]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm md:px-6">
          
          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            🚚 <span>{storefrontT(lang, "fast_delivery")}</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            🔁 <span>Easy Returns</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            🔒 <span>Secure Shopping</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            💳 <span>Flexible Payments</span>
          </div>

        </div>
      </div>

      {/* MAIN FOOTER (COMPACT GRID) */}
      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5">

          {/* BRAND */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-black hover:text-blue-400 transition-colors">
              Exshopi
            </Link>
            <p className="text-xs text-slate-400 leading-6">
              Premium UAE marketplace for electronics, accessories & daily use products.
            </p>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
                📍 Dubai, UAE
              </div>
              <a href="tel:+971522608063" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Phone className="h-3 w-3" /> +971 52 260 8063
              </a>
              <a href="mailto:exshopi@exshopi.com?subject=ExShopi%20Support" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Mail className="h-3 w-3" /> exshopi@exshopi.com
              </a>
            </div>
          </div>

          {/* LINKS */}
          {[
            {
              title: storefrontT(lang, "customer_service"),
              links: [
                { name: storefrontT(lang, "contact"), to: "/contact" },
                { name: storefrontT(lang, "track_order"), to: "/order-tracking" },
                { name: storefrontT(lang, "returns"), to: "/return-policy" },
                { name: storefrontT(lang, "warranty"), to: "/warranty" },
              ],
            },
            {
              title: storefrontT(lang, "shop"),
              links: [
                { name: storefrontT(lang, "laptops"), to: "/category/laptops" },
                { name: storefrontT(lang, "mobiles"), to: "/category/mobiles" },
                { name: storefrontT(lang, "accessories"), to: "/category/accessories" },
                { name: "Electronics", to: "/category/electronics" },
              ],
            },
            {
              title: storefrontT(lang, "seller"),
              links: [
                { name: storefrontT(lang, "sell_with_exshopi"), to: "/seller/register" },
              ],
            },
            {
              title: storefrontT(lang, "company"),
              links: [
                { name: storefrontT(lang, "about"), to: "/about" },
                { name: storefrontT(lang, "privacy"), to: "/privacy-policy" },
                { name: storefrontT(lang, "terms"), to: "/terms-conditions" },
                { name: storefrontT(lang, "faq"), to: "/faq" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                {col.title}
              </h3>
              <div className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="block text-xs text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* PAYMENT & APP DOWNLOAD */}
        <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6">
          
          {/* PAYMENT METHODS */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">{storefrontT(lang, "we_accept")}</h4>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "COD", color: "bg-slate-600" },
              ].map((payment) => (
                <div
                  key={payment.name}
                  className={`${payment.color} px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg hover:scale-105 transition-transform`}
                >
                  {payment.name}
                </div>
              ))}
            </div>
          </div>

          {/* APP DOWNLOAD */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">{storefrontT(lang, "download_app")}</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-white/20 px-4 py-2 rounded-lg text-xs font-bold text-white hover:bg-white hover:text-black transition-all"
              >
                🍎 App Store
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-white/20 px-4 py-2 rounded-lg text-xs font-bold text-white hover:bg-white hover:text-black transition-all"
              >
                🤖 Google Play
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10 bg-[#040b16]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
          
          <div>© 2026 Exshopi</div>

          <div className="flex gap-4">
            <Link to="/terms-conditions">Terms</Link>
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/faq">FAQ</Link>
          </div>

        </div>
      </div>

    </footer>
  );
}
