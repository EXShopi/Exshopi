import {
  calculateVat,
  convertFromAed,
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
  getProductCountryPrice,
  getShippingChargeByCountry,
  type CountryAwarePriced,
  type SupportedCountryCode,
} from './countryConfig';
import { formatCurrencyForCountry } from './currency';

export function getSelectedCountry(countryCode?: string | null): SupportedCountryCode {
  return getCountryConfig(countryCode).code;
}

export function getCurrencyForCountry(countryCode?: string | null) {
  return getCountryConfig(countryCode).currency;
}

export function formatGccPrice(amount: number | string | null | undefined, countryCode?: string | null) {
  return formatCurrencyForCountry(amount, getSelectedCountry(countryCode));
}

export function convertFromAED(amountAED: number | string | null | undefined, countryCode?: string | null) {
  return convertFromAed(amountAED, countryCode || DEFAULT_COUNTRY_CODE);
}

export function getCountryVatRate(countryCode?: string | null) {
  return getCountryConfig(countryCode).vatRate;
}

export function getCountryShippingFee(countryCode?: string | null) {
  return getShippingChargeByCountry(countryCode || DEFAULT_COUNTRY_CODE);
}

export function getCountryProductPrice(product: CountryAwarePriced | null | undefined, countryCode?: string | null) {
  return getProductCountryPrice(product, countryCode || DEFAULT_COUNTRY_CODE);
}

export function calculateGccVat(amount: number, countryCode?: string | null) {
  return calculateVat(amount, countryCode || DEFAULT_COUNTRY_CODE);
}
