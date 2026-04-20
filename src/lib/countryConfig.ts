export type SupportedCountryCode = 'AE' | 'SA';

export type ShippingOption = {
  id: string;
  label: string;
  fee: number;
  eta: string;
  description: string;
};

export type CountryConfig = {
  code: SupportedCountryCode;
  name: string;
  shortName: string;
  currency: 'AED' | 'SAR';
  locale: string;
  vatRate: number;
  announcement: string;
  trustLabel: string;
  availabilityLabel: string;
  shippingOptions: ShippingOption[];
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
    name: 'United Arab Emirates',
    shortName: 'UAE',
    currency: 'AED',
    locale: 'en-AE',
    vatRate: 0.05,
    announcement: 'Now serving UAE & Saudi Arabia',
    trustLabel: 'Trusted across UAE',
    availabilityLabel: 'Available in UAE',
    shippingOptions: [
      {
        id: 'same_day_ae',
        label: 'Same Day UAE Delivery',
        fee: 25,
        eta: 'Next business day in Dubai, Sharjah, and Ajman',
        description: 'Fast delivery for major UAE cities.',
      },
      {
        id: 'standard_ae',
        label: 'Standard UAE Delivery',
        fee: 15,
        eta: '2-4 business days across UAE',
        description: 'Reliable UAE-wide delivery coverage.',
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
    name: 'Saudi Arabia',
    shortName: 'KSA',
    currency: 'SAR',
    locale: 'en-SA',
    vatRate: 0.15,
    announcement: 'Now serving UAE & Saudi Arabia',
    trustLabel: 'Trusted across Saudi Arabia',
    availabilityLabel: 'Available in Saudi Arabia',
    shippingOptions: [
      {
        id: 'standard_sa',
        label: 'Standard KSA Delivery',
        fee: 20,
        eta: '3-5 business days across Saudi Arabia',
        description: 'Country-wide shipping for Riyadh, Jeddah, Dammam, and more.',
      },
      {
        id: 'priority_sa',
        label: 'Priority KSA Delivery',
        fee: 35,
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

export function isSupportedCountryCode(value: string | null | undefined): value is SupportedCountryCode {
  return value === 'AE' || value === 'SA';
}

export function getCountryConfig(countryCode?: string | null): CountryConfig {
  if (countryCode && isSupportedCountryCode(countryCode)) {
    return COUNTRY_CONFIG[countryCode];
  }
  return COUNTRY_CONFIG[DEFAULT_COUNTRY_CODE];
}

export function getDefaultShippingOption(countryCode?: string | null): ShippingOption {
  return getCountryConfig(countryCode).shippingOptions[0];
}

export function getShippingOption(countryCode: string | null | undefined, optionId?: string | null): ShippingOption {
  const config = getCountryConfig(countryCode);
  return config.shippingOptions.find((option) => option.id === optionId) || config.shippingOptions[0];
}

export function calculateVat(amount: number, countryCode?: string | null) {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return safeAmount * getCountryConfig(countryCode).vatRate;
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
