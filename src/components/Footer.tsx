import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck, WalletCards } from 'lucide-react';
import { useLanguageStore } from '../store/language';
import { storefrontT } from '../lib/storefrontCopy';
import { getCategoryPath } from '../lib/seo';
import { getCheckoutPaymentOptions } from '../lib/countryConfig';
import { useCountryStore } from '../store/country';

export default function Footer() {
  const { lang } = useLanguageStore();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const paymentOptions = getCheckoutPaymentOptions(selectedCountry).map((option) => ({
    ...option,
    shortLabel: option.id === 'stripe_card' ? 'Cards' : option.label,
  }));
  return (
    <footer className="mt-8 bg-[#06101f] text-white md:mt-16">
      
      {/* SMALL TRUST STRIP (COMPACT) */}
      <div className="border-b border-white/10 bg-[#0b1933]">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-1.5 px-4 py-2 text-[10px] md:flex md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-6 md:py-4 md:text-sm">
          
          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            <Truck className="h-4 w-4" /> <span>{storefrontT(lang, "fast_delivery")}</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            <RotateCcw className="h-4 w-4" /> <span>Easy Returns</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            <ShieldCheck className="h-4 w-4" /> <span>Buyer Protection</span>
          </div>

          <div className="flex items-center gap-3 hover:text-blue-400 transition-colors">
            <WalletCards className="h-4 w-4" /> <span>Global Payments</span>
          </div>

        </div>
      </div>

      {/* MAIN FOOTER (COMPACT GRID) */}
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-6 md:py-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-2 md:gap-8 xl:grid-cols-5">

          {/* BRAND */}
          <div className="col-span-2 space-y-2.5">
            <Link to="/" className="text-lg font-black transition-colors hover:text-blue-400 md:text-2xl">
              Exshopi
            </Link>
            <p className="text-[10px] leading-4.5 text-slate-400 md:text-xs md:leading-6">
              Premium UAE-based worldwide marketplace for electronics, accessories, verified sellers, secure checkout, and international shipping.
            </p>

            <div className="space-y-1.5 text-[10px] text-slate-400 md:text-xs">
              <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
                <MapPin className="h-3 w-3" /> Dubai, UAE
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
                { name: storefrontT(lang, "laptops"), to: getCategoryPath('laptops') },
                { name: storefrontT(lang, "mobiles"), to: getCategoryPath('mobiles') },
                { name: storefrontT(lang, "accessories"), to: getCategoryPath('accessories') },
                { name: "Electronics", to: getCategoryPath('electronics') },
              ],
            },
            {
              title: storefrontT(lang, "seller"),
              links: [
                { name: "Sell on ExShopi", to: "/sell-on-exshopi" },
                { name: storefrontT(lang, "sell_with_exshopi"), to: "/seller/register" },
              ],
            },
            {
              title: storefrontT(lang, "company"),
              links: [
                { name: storefrontT(lang, "about"), to: "/about" },
                { name: "Privacy Policy", to: "/privacy" },
                { name: "Terms of Service", to: "/terms" },
                { name: storefrontT(lang, "faq"), to: "/faq" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white md:text-xs">
                {col.title}
              </h3>
              <div className="mt-2 space-y-1 md:mt-3 md:space-y-1.5">
                {col.links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="block text-[10px] text-slate-400 transition-colors hover:text-blue-400 md:text-xs"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* PAYMENT & APP DOWNLOAD */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 md:mt-6 md:flex md:flex-col md:gap-5 md:pt-5">
          
          {/* PAYMENT METHODS */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">{storefrontT(lang, "we_accept")}</h4>
            <div className="flex flex-wrap gap-2">
              {paymentOptions.map((payment) => (
                <div
                  key={payment.id}
                  className={`rounded-lg border px-3 py-2 text-[10px] font-bold shadow-lg transition-transform md:text-xs ${
                    payment.enabled
                      ? "border-white/15 bg-white/10 text-white hover:scale-105"
                      : "border-white/10 bg-white/[0.04] text-slate-400"
                  }`}
                  title={payment.enabled ? payment.description : `${payment.description} UI-ready; provider activation required.`}
                >
                  {payment.shortLabel}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Payment availability updates with your selected country.
            </p>
          </div>

          {/* APP DOWNLOAD */}
          <div>
            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-3">{storefrontT(lang, "download_app")}</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-white/20 px-3 py-2 rounded-lg text-[11px] font-bold text-white hover:bg-white hover:text-black transition-all"
              >App Store</a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black border border-white/20 px-3 py-2 rounded-lg text-[11px] font-bold text-white hover:bg-white hover:text-black transition-all"
              >Google Play</a>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10 bg-[#040b16]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-3 text-[11px] text-slate-400 md:flex-row md:items-center md:justify-between md:px-6 md:py-4 md:text-xs">
          
          <div>Copyright 2026 Exshopi</div>

          <div className="flex gap-4">
            <Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="/faq">FAQ</Link>
          </div>

        </div>
      </div>

    </footer>
  );
}
