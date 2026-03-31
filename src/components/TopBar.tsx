import { useState } from "react";
import { ChevronDown, MapPin, Globe } from "lucide-react";
import { useLanguageStore } from "../store/language";
import { storefrontT } from "../lib/storefrontCopy";

export default function TopBar() {
  const [city, setCity] = useState("Dubai");
  const [cityOpen, setCityOpen] = useState(false);

  const [langOpen, setLangOpen] = useState(false);
  const { lang: language, setLanguage } = useLanguageStore();

  const cities = [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Ras Al Khaimah",
    "Fujairah",
    "Umm Al Quwain",
  ];

  const languages = [
    "English",
    "Arabic",
    "Hindi",
    "Persian",
    "Russian",
    "Urdu",
  ];

  return (
    <div className="relative z-[9999] w-full border-b border-slate-300/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-[12px] shadow-[0_12px_32px_rgba(15,23,42,0.2)]">
      {/* Premium decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
      
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4 text-white/80 font-medium">
          <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            ✓ {storefrontT(language, "deliver_uae_only")}
          </span>
          <span className="text-white/25">•</span>
          <span className="text-white/70">{storefrontT(language, "fast_delivery")} • {storefrontT(language, "trusted_sellers")}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => {
                setCityOpen(!cityOpen);
                setLangOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/85 bg-white/10 backdrop-blur-sm border border-white/20 transition-all hover:bg-white/15 hover:text-white hover:border-white/30"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{city}</span>
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
                      city === c 
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

          <div className="h-5 w-px bg-white/20"></div>

          <div className="relative">
            <button
              onClick={() => {
                setLangOpen(!langOpen);
                setCityOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/85 bg-white/10 backdrop-blur-sm border border-white/20 transition-all hover:bg-white/15 hover:text-white hover:border-white/30"
            >
              <Globe className="h-4 w-4" />
              <span className="font-semibold">{language}</span>
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
    </div>
  );
}
