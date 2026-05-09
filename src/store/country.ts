import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
  getDefaultShippingOption,
  isSupportedCountryCode,
  type SupportedCountryCode,
} from '../lib/countryConfig';

type CountryState = {
  selectedCountry: SupportedCountryCode;
  selectedCity: string;
  selectedShippingOption: string;
  hasExplicitSelection: boolean;
  setCountry: (country: SupportedCountryCode) => void;
  setCity: (city: string) => void;
  setShippingOption: (shippingOption: string) => void;
  markCountryConfirmed: () => void;
  autoDetectCountry: () => void;
};

function detectCountryFromBrowser(): SupportedCountryCode {
  if (typeof navigator === 'undefined') return DEFAULT_COUNTRY_CODE;
  const signals = [
    navigator.language,
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const region = signals.match(/[-_]([A-Z]{2})\b/)?.[1] || '';
  if (isSupportedCountryCode(region)) return region;
  if (['FR', 'DE', 'ES', 'IT', 'NL', 'IE', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL'].includes(region)) return 'EU';
  return DEFAULT_COUNTRY_CODE;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set, get) => ({
      selectedCountry: DEFAULT_COUNTRY_CODE,
      selectedCity: getCountryConfig(DEFAULT_COUNTRY_CODE).defaultCity,
      selectedShippingOption: getDefaultShippingOption(DEFAULT_COUNTRY_CODE).id,
      hasExplicitSelection: false,
      setCountry: (country) => {
        const nextCountry = isSupportedCountryCode(country) ? country : DEFAULT_COUNTRY_CODE;
        const nextConfig = getCountryConfig(nextCountry);
        set({
          selectedCountry: nextCountry,
          selectedCity: nextConfig.defaultCity,
          selectedShippingOption: nextConfig.shippingOptions[0].id,
          hasExplicitSelection: true,
        });
      },
      setCity: (city) => {
        set({ selectedCity: city });
      },
      setShippingOption: (selectedShippingOption) => {
        set({ selectedShippingOption });
      },
      markCountryConfirmed: () => {
        set({ hasExplicitSelection: true });
      },
      autoDetectCountry: () => {
        if (get().hasExplicitSelection) return;
        const nextCountry = detectCountryFromBrowser();
        const nextConfig = getCountryConfig(nextCountry);
        set({
          selectedCountry: nextCountry,
          selectedCity: nextConfig.defaultCity,
          selectedShippingOption: nextConfig.shippingOptions[0].id,
        });
      },
    }),
    {
      name: 'exshopi-country',
      merge: (persisted, current) => {
        const state = (persisted as Partial<CountryState>) || {};
        const selectedCountry = isSupportedCountryCode(state.selectedCountry)
          ? state.selectedCountry
          : DEFAULT_COUNTRY_CODE;
        const countryConfig = getCountryConfig(selectedCountry);
        const selectedCity =
          typeof state.selectedCity === 'string' && countryConfig.cities.includes(state.selectedCity)
            ? state.selectedCity
            : countryConfig.defaultCity;
        const selectedShippingOption =
          typeof state.selectedShippingOption === 'string' &&
          countryConfig.shippingOptions.some((option) => option.id === state.selectedShippingOption)
            ? state.selectedShippingOption
            : countryConfig.shippingOptions[0].id;

        return {
          ...current,
          ...state,
          selectedCountry,
          selectedCity,
          selectedShippingOption,
          hasExplicitSelection: Boolean(state.hasExplicitSelection),
        };
      },
      partialize: (state) => ({
        selectedCountry: state.selectedCountry,
        selectedCity: state.selectedCity,
        selectedShippingOption: state.selectedShippingOption,
        hasExplicitSelection: state.hasExplicitSelection,
      }),
    }
  )
);
