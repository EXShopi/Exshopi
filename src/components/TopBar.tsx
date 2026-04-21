import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Globe } from "lucide-react";
import { useLanguageStore } from "../store/language";
import { storefrontT } from "../lib/storefrontCopy";
import { COUNTRY_CONFIG, SUPPORTED_COUNTRY_CODES, getDualCountryTrustText } from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

export default function TopBar() {
  const [cityOpen, setCityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const { lang: language, setLanguage } = useLanguageStore();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const selectedCity = useCountryStore((state) => state.selectedCity);
  const setCountry = useCountryStore((state) => state.setCountry);
  const setCity = useCountryStore((state) => state.setCity);
  const countryConfig = COUNTRY_CONFIG[selectedCountry];
  const cities = countryConfig.cities;
  const [trustIndex, setTrustIndex] = useState(0);
  const [countryToast, setCountryToast] = useState("");
  const previousCountryRef = useRef(selectedCountry);
  const trustMessages = [
    "Cash on Delivery Available",
    "Fast Delivery UAE & KSA",
    "Trusted Marketplace",
    "Verified Sellers",
  ];

  const languages = [
    "English",
    "Arabic",
    "Hindi",
    "Persian",
    "Russian",
    "Urdu",
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTrustIndex((current) => (current + 1) % trustMessages.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [trustMessages.length]);

  useEffect(() => {
    if (previousCountryRef.current === selectedCountry) return;
    setCountryToast(
      selectedCountry === "SA"
        ? "Prices updated for Saudi Arabia (SAR)"
        : "Prices updated for UAE (AED)"
    );
    previousCountryRef.current = selectedCountry;
    const timer = window.setTimeout(() => setCountryToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [selectedCountry]);

  return (
    <div className="relative z-[9999] hidden w-full border-b border-slate-300/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-[11px] shadow-[0_12px_32px_rgba(15,23,42,0.2)] md:block md:text-[12px]">
      {/* Premium decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
      
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-1.5 md:gap-3 md:px-6 md:py-2">
        <div className="hidden min-w-0 items-center gap-3 text-white/80 font-medium sm:flex">
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur-sm">
            ✓ {trustMessages[trustIndex]}
          </span>
          <span className="hidden text-white/25 md:inline">•</span>
          <span className="hidden text-white/70 md:inline">
            {getDualCountryTrustText()} • {storefrontT(language, "trusted_sellers")}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-6">
          <div className="relative">
            <button
              onClick={() => {
                setCountryOpen(!countryOpen);
                setCityOpen(false);
                setLangOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-white/85 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 hover:text-white md:gap-2 md:px-3"
            >
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="max-w-[72px] truncate text-[11px] font-semibold md:max-w-none md:text-[12px]">
                {countryConfig.shortName}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${countryOpen ? "rotate-180" : ""}`}
              />
            </button>

            {countryOpen && (
              <div className="absolute right-0 top-full z-[99999] mt-3 w-56 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-2xl backdrop-blur-xl">
                {SUPPORTED_COUNTRY_CODES.map((countryCode, idx) => {
                  const option = COUNTRY_CONFIG[countryCode];
                  const isActive = selectedCountry === countryCode;

                  return (
                    <button
                      key={countryCode}
                      onClick={() => {
                        setCountry(countryCode);
                        setCountryOpen(false);
                      }}
                      className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-600 pl-3"
                          : "hover:bg-slate-50 border-l-4 border-transparent"
                      } ${idx !== SUPPORTED_COUNTRY_CODES.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setCityOpen(!cityOpen);
                setCountryOpen(false);
                setLangOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-white/85 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 hover:text-white md:gap-2 md:px-3"
            >
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="max-w-[54px] truncate text-[11px] font-semibold md:max-w-none md:text-[12px]">{selectedCity}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${cityOpen ? "rotate-180" : ""}`}
              />
            </button>

            {cityOpen && (
              <div className="absolute right-0 top-full z-[99999] mt-3 w-48 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-2xl backdrop-blur-xl">
                {cities.map((c, idx) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setCityOpen(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                      selectedCity === c 
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-600 pl-3" 
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    } ${idx !== cities.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden h-5 w-px bg-white/20 md:block"></div>

          <div className="relative">
            <button
              onClick={() => {
                setLangOpen(!langOpen);
                setCityOpen(false);
                setCountryOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-white/85 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 hover:text-white md:gap-2 md:px-3"
            >
              <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="max-w-[58px] truncate text-[11px] font-semibold md:max-w-none md:text-[12px]">{language}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full z-[99999] mt-3 w-48 overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-2xl backdrop-blur-xl">
                {languages.map((lang, idx) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                      language === lang 
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-l-4 border-blue-600 pl-3" 
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    } ${idx !== languages.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute right-6 top-full mt-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black tracking-[0.08em] text-emerald-700 shadow-[0_20px_40px_rgba(15,23,42,0.14)] transition-all duration-300 ${
          countryToast ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
      >
        {countryToast}
      </div>
    </div>
  );
}
