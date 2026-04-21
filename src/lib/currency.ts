import { getCountryConfig, type SupportedCountryCode } from './countryConfig';

type FormatOptions = {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

const toSafeAmount = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatCurrencyForCountry = (
  value: number | string | null | undefined,
  countryCode: SupportedCountryCode | string = 'AE',
  options?: FormatOptions
) => {
  const safeAmount = toSafeAmount(value);
  const config = getCountryConfig(countryCode);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    currencyDisplay: 'code',
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(safeAmount);
};

export const formatCurrencyPlainForCountry = (
  value: number | string | null | undefined,
  countryCode: SupportedCountryCode | string = 'AE',
  options?: FormatOptions
) => {
  const safeAmount = toSafeAmount(value);
  const config = getCountryConfig(countryCode);

  return `${config.currency} ${safeAmount.toLocaleString(config.locale, {
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  })}`;
};

export const formatAED = (
  value: number | string | null | undefined,
  options?: FormatOptions
) => formatCurrencyForCountry(value, 'AE', options);

export const formatAEDPlain = (
  value: number | string | null | undefined,
  options?: FormatOptions
) => formatCurrencyPlainForCountry(value, 'AE', options);
