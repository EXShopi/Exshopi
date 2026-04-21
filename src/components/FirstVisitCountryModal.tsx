import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Globe2 } from 'lucide-react';
import { COUNTRY_CONFIG, SUPPORTED_COUNTRY_CODES, getCountryFlag } from '../lib/countryConfig';
import { t } from '../lib/localization';
import { useCountryStore } from '../store/country';
import { useLanguageStore } from '../store/language';

function readStoredCountrySelection() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('exshopi-country');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.hasExplicitSelection);
  } catch {
    return false;
  }
}

export default function FirstVisitCountryModal() {
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const setCountry = useCountryStore((state) => state.setCountry);
  const hasExplicitSelection = useCountryStore((state) => state.hasExplicitSelection);
  const markCountryConfirmed = useCountryStore((state) => state.markCountryConfirmed);
  const language = useLanguageStore((state) => state.lang);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const alreadySelected = readStoredCountrySelection();
    setVisible(!alreadySelected && !hasExplicitSelection);
    setReady(true);
  }, [hasExplicitSelection]);

  useEffect(() => {
    if (!visible) return;
    firstButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const countryOptions = useMemo(
    () =>
      SUPPORTED_COUNTRY_CODES.map((countryCode) => {
        const config = COUNTRY_CONFIG[countryCode];
        return {
          code: countryCode,
          title: config.name,
          shortTitle:
            countryCode === 'SA' ? t(language, 'saudi_arabia') : t(language, 'uae'),
          subtitle: `${config.currency} • ${config.deliveryMessage}`,
          flag: getCountryFlag(countryCode),
        };
      }),
    [language]
  );

  if (!ready || !visible) return null;

  const handleSelect = (countryCode: (typeof SUPPORTED_COUNTRY_CODES)[number]) => {
    setCountry(countryCode);
    markCountryConfirmed();
    setVisible(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[6px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-modal-title"
        className="w-full max-w-xl rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))] p-5 shadow-[0_35px_90px_rgba(15,23,42,0.22)] md:p-7"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">ExShopi</p>
            <h2 id="country-modal-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-[2rem]">
              {t(language, 'choose_country')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-[15px]">
              {t(language, 'choose_country_subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {countryOptions.map((option, index) => {
            const isActive = selectedCountry === option.code;
            return (
              <button
                key={option.code}
                ref={index === 0 ? firstButtonRef : null}
                type="button"
                onClick={() => handleSelect(option.code)}
                className={`group relative overflow-hidden rounded-[26px] border px-5 py-5 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-blue-300 bg-blue-50/85 shadow-[0_18px_34px_rgba(37,99,235,0.14)]'
                    : 'border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl leading-none">{option.flag}</div>
                    <h3 className="mt-4 text-lg font-black text-slate-950">{option.shortTitle}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">{option.title}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-700">{option.subtitle}</p>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      isActive ? 'border-blue-300 bg-white text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs font-semibold tracking-[0.08em] text-slate-500">
          {t(language, 'show_local_pricing')}
        </p>
      </div>
    </div>,
    document.body
  );
}
