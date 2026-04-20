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
  setCountry: (country: SupportedCountryCode) => void;
  setCity: (city: string) => void;
  setShippingOption: (shippingOption: string) => void;
};

export const useCountryStore = create<CountryState>()(
  persist(
    (set, get) => ({
      selectedCountry: DEFAULT_COUNTRY_CODE,
      selectedCity: getCountryConfig(DEFAULT_COUNTRY_CODE).defaultCity,
      selectedShippingOption: getDefaultShippingOption(DEFAULT_COUNTRY_CODE).id,
      setCountry: (country) => {
        const nextCountry = isSupportedCountryCode(country) ? country : DEFAULT_COUNTRY_CODE;
        const nextConfig = getCountryConfig(nextCountry);
        set({
          selectedCountry: nextCountry,
          selectedCity: nextConfig.defaultCity,
          selectedShippingOption: nextConfig.shippingOptions[0].id,
        });
      },
      setCity: (city) => {
        set({ selectedCity: city });
      },
      setShippingOption: (selectedShippingOption) => {
        set({ selectedShippingOption });
      },
    }),
    {
      name: 'exshopi-country',
      partialize: (state) => ({
        selectedCountry: state.selectedCountry,
        selectedCity: state.selectedCity,
        selectedShippingOption: state.selectedShippingOption,
      }),
    }
  )
);
