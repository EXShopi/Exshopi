export type SupportedCountryCode = 'AE' | 'SA';

export type CountryAwarePriced = {
  price?: number | string | null;
  originalPrice?: number | string | null;
  oldPrice?: number | string | null;
  priceUae?: number | string | null;
  priceKsa?: number | string | null;
  compareAtPriceUae?: number | string | null;
  compareAtPriceKsa?: number | string | null;
};

export type ShippingOption = {
  id: string;
  label: string;
  fee: number;
  baseFeeAed: number;
  eta: string;
  description: string;
};

type ShippingOptionConfig = Omit<ShippingOption, 'fee'>;

export type CountryConfig = {
  code: SupportedCountryCode;
  displayCode: 'UAE' | 'KSA';
  name: string;
  shortName: string;
  currency: 'AED' | 'SAR';
  currencySymbol: 'AED' | 'SAR';
  locale: string;
  vatRate: number;
  phonePrefix: '+971' | '+966';
  fallbackExchangeRateFromAed: number;
  defaultShippingChargeAed: number;
  announcement: string;
  trustLabel: string;
  availabilityLabel: string;
  shippingOptions: ShippingOptionConfig[];
  cities: string[];
  defaultCity: string;
  addressLabels: {
    city: string;
    area: string;
    building: string;
    address: string;
    landmark: string;
    postalCode: string;
  };
};

export const COUNTRY_CONFIG: Record<SupportedCountryCode, CountryConfig> = {
  AE: {
    code: 'AE',
    displayCode: 'UAE',
    name: 'United Arab Emirates',
    shortName: 'UAE',
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    vatRate: 0.05,
    phonePrefix: '+971',
    fallbackExchangeRateFromAed: 1,
    defaultShippingChargeAed: 10,
    announcement: 'Now serving UAE & Saudi Arabia',
    trustLabel: 'Trusted across UAE',
    availabilityLabel: 'Available in UAE',
    shippingOptions: [
      {
        id: 'standard_ae',
        label: 'Standard UAE Delivery',
        baseFeeAed: 10,
        eta: '2-4 business days across UAE',
        description: 'Reliable UAE-wide delivery coverage.',
      },
      {
        id: 'express_ae',
        label: 'Express UAE Delivery',
        baseFeeAed: 25,
        eta: 'Next business day in Dubai, Sharjah, and Ajman',
        description: 'Fast delivery for major UAE cities.',
      },
    ],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    defaultCity: 'Dubai',
    addressLabels: {
      city: 'Emirate',
      area: 'Area',
      building: 'Building / Villa',
      address: 'Full Address',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
  },
  SA: {
    code: 'SA',
    displayCode: 'KSA',
    name: 'Saudi Arabia',
    shortName: 'KSA',
    currency: 'SAR',
    currencySymbol: 'SAR',
    locale: 'en-SA',
    vatRate: 0.15,
    phonePrefix: '+966',
    fallbackExchangeRateFromAed: 1.02,
    defaultShippingChargeAed: 85,
    announcement: 'Now serving UAE & Saudi Arabia',
    trustLabel: 'Trusted across Saudi Arabia',
    availabilityLabel: 'Available in Saudi Arabia',
    shippingOptions: [
      {
        id: 'standard_sa',
        label: 'Standard KSA Delivery',
        baseFeeAed: 85,
        eta: '3-5 business days across Saudi Arabia',
        description: 'Country-wide shipping for Riyadh, Jeddah, Dammam, and more.',
      },
      {
        id: 'priority_sa',
        label: 'Priority KSA Delivery',
        baseFeeAed: 120,
        eta: '2-3 business days in major Saudi cities',
        description: 'Faster delivery for high-demand metro routes.',
      },
    ],
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Taif'],
    defaultCity: 'Riyadh',
    addressLabels: {
      city: 'City',
      area: 'District',
      building: 'Building Number',
      address: 'Street',
      landmark: 'Additional Directions',
      postalCode: 'Postal Code',
    },
  },
};

export const SUPPORTED_COUNTRY_CODES = Object.keys(COUNTRY_CONFIG) as SupportedCountryCode[];
export const DEFAULT_COUNTRY_CODE: SupportedCountryCode = 'AE';

function toSafeAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function isSupportedCountryCode(value: string | null | undefined): value is SupportedCountryCode {
  return value === 'AE' || value === 'SA';
}

export function getCountryConfig(countryCode?: string | null): CountryConfig {
  if (countryCode && isSupportedCountryCode(countryCode)) {
    return COUNTRY_CONFIG[countryCode];
  }
  return COUNTRY_CONFIG[DEFAULT_COUNTRY_CODE];
}

export function convertFromAed(amountAed: number | string | null | undefined, countryCode?: string | null) {
  const safeAmount = toSafeAmount(amountAed);
  const config = getCountryConfig(countryCode);
  return Number((safeAmount * config.fallbackExchangeRateFromAed).toFixed(2));
}

export function getDefaultShippingOption(countryCode?: string | null): ShippingOption {
  const config = getCountryConfig(countryCode);
  const option = config.shippingOptions[0];
  return {
    ...option,
    fee: convertFromAed(option.baseFeeAed, config.code),
  };
}

export function getShippingOption(countryCode: string | null | undefined, optionId?: string | null): ShippingOption {
  const config = getCountryConfig(countryCode);
  const option = config.shippingOptions.find((entry) => entry.id === optionId) || config.shippingOptions[0];
  return {
    ...option,
    fee: convertFromAed(option.baseFeeAed, config.code),
  };
}

export function getShippingChargeByCountry(countryCode?: string | null, optionId?: string | null) {
  return getShippingOption(countryCode, optionId).fee;
}

export function getShippingChargeBusinessAed(countryCode?: string | null, optionId?: string | null) {
  const config = getCountryConfig(countryCode);
  const option = config.shippingOptions.find((entry) => entry.id === optionId) || config.shippingOptions[0];
  return option.baseFeeAed;
}

export function getTaxRateByCountry(countryCode?: string | null) {
  return getCountryConfig(countryCode).vatRate;
}

export function calculateVat(amount: number, countryCode?: string | null) {
  return toSafeAmount(amount) * getTaxRateByCountry(countryCode);
}

export function getProductCountryPrice(product: CountryAwarePriced | null | undefined, countryCode?: string | null) {
  if (!product) return 0;
  const config = getCountryConfig(countryCode);
  const priceUae = toSafeAmount(product.priceUae ?? product.price);
  const priceKsa =
    product.priceKsa != null && String(product.priceKsa).trim() !== ''
      ? toSafeAmount(product.priceKsa)
      : undefined;

  return config.code === 'SA' ? priceKsa ?? priceUae : priceUae;
}

export function getProductCountryCompareAtPrice(product: CountryAwarePriced | null | undefined, countryCode?: string | null) {
  if (!product) return 0;
  const config = getCountryConfig(countryCode);
  const compareAtUae = toSafeAmount(
    product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice ?? product.price ?? product.priceUae
  );
  const compareAtKsa =
    product.compareAtPriceKsa != null && String(product.compareAtPriceKsa).trim() !== ''
      ? toSafeAmount(product.compareAtPriceKsa)
      : undefined;

  return config.code === 'SA' ? compareAtKsa ?? compareAtUae : compareAtUae;
}

export function normalizeCountryAwarePricing<T extends Record<string, any>>(product: T) {
  const priceUae = toSafeAmount(product.priceUae ?? product.price);
  const originalPriceUae = toSafeAmount(
    product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice ?? product.price ?? product.priceUae
  );

  return {
    ...product,
    price: priceUae,
    originalPrice: originalPriceUae,
    priceUae,
    priceKsa:
      product.priceKsa != null && String(product.priceKsa).trim() !== ''
        ? toSafeAmount(product.priceKsa)
        : undefined,
    compareAtPriceUae: originalPriceUae > priceUae ? originalPriceUae : undefined,
    compareAtPriceKsa:
      product.compareAtPriceKsa != null && String(product.compareAtPriceKsa).trim() !== ''
        ? toSafeAmount(product.compareAtPriceKsa)
        : undefined,
  };
}

export function normalizePhoneForCountry(phone: string, countryCode?: string | null) {
  const raw = String(phone || '').replace(/[^\d+]/g, '');
  const country = getCountryConfig(countryCode);

  if (country.code === 'AE') {
    if (raw.startsWith('+971')) return raw;
    if (raw.startsWith('971')) return `+${raw}`;
    if (raw.startsWith('05')) return `+971${raw.slice(1)}`;
    if (raw.startsWith('5')) return `+971${raw}`;
    return raw;
  }

  if (raw.startsWith('+966')) return raw;
  if (raw.startsWith('966')) return `+${raw}`;
  if (raw.startsWith('05')) return `+966${raw.slice(1)}`;
  if (raw.startsWith('5')) return `+966${raw}`;
  return raw;
}

export function isValidPhoneForCountry(phone: string, countryCode?: string | null) {
  const normalized = normalizePhoneForCountry(phone, countryCode);
  const country = getCountryConfig(countryCode);

  if (country.code === 'AE') {
    return /^\+971(5\d{8}|[234679]\d{7,8})$/.test(normalized);
  }

  return /^\+9665\d{8}$/.test(normalized);
}

export function getAvailabilityText(countryCode?: string | null) {
  return getCountryConfig(countryCode).availabilityLabel;
}

export function getDualCountryTrustText() {
  return 'Fast delivery across UAE and KSA';
}
