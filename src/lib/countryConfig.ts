import {
  getPhonePlaceholder,
  getPhonePrefix,
  isValidPhoneForCountry as isValidSharedPhoneForCountry,
  normalizePhoneByCountry,
} from '../utils/phone';

export type SupportedCountryCode = 'AE' | 'SA' | 'QA' | 'KW' | 'BH' | 'OM';
export type SupportedCurrencyCode = 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR';

export type CountryAwarePriced = {
  price?: number | string | null;
  originalPrice?: number | string | null;
  oldPrice?: number | string | null;
  priceUae?: number | string | null;
  priceKsa?: number | string | null;
  priceQatar?: number | string | null;
  priceKuwait?: number | string | null;
  priceBahrain?: number | string | null;
  priceOman?: number | string | null;
  compareAtPriceUae?: number | string | null;
  compareAtPriceKsa?: number | string | null;
  compareAtPriceQatar?: number | string | null;
  compareAtPriceKuwait?: number | string | null;
  compareAtPriceBahrain?: number | string | null;
  compareAtPriceOman?: number | string | null;
  basePriceAED?: number | string | null;
  pricesByCountry?: Partial<
    Record<
      SupportedCountryCode,
      {
        currency?: SupportedCurrencyCode;
        price?: number | string | null;
        compareAtPrice?: number | string | null;
      }
    >
  > | null;
  specs?: {
    pricesByCountry?: CountryAwarePriced['pricesByCountry'];
    basePriceAED?: number | string | null;
  } | null;
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
  displayCode: string;
  name: string;
  shortName: string;
  currency: SupportedCurrencyCode;
  currencySymbol: SupportedCurrencyCode;
  locale: string;
  vatRate: number;
  phonePrefix: string;
  phonePlaceholder: string;
  fallbackExchangeRateFromAed: number;
  defaultShippingChargeAed: number;
  announcement: string;
  trustLabel: string;
  trustMessage: string;
  deliveryMessage: string;
  availabilityLabel: string;
  shippingOptions: ShippingOptionConfig[];
  cities: string[];
  defaultCity: string;
  addressLabels: {
    country: string;
    city: string;
    area: string;
    flat: string;
    building: string;
    address: string;
    landmark: string;
    postalCode: string;
  };
  addressPlaceholders: {
    address: string;
    area: string;
    building: string;
    flat: string;
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
    phonePrefix: getPhonePrefix('AE'),
    phonePlaceholder: getPhonePlaceholder('AE'),
    fallbackExchangeRateFromAed: 1,
    defaultShippingChargeAed: 10,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Trusted across the UAE',
    trustMessage: 'Fast premium electronics delivery across the UAE',
    deliveryMessage: 'Same-day and next-day delivery options across the UAE',
    availabilityLabel: 'Available in the UAE',
    shippingOptions: [
      { id: 'standard_ae', label: 'Standard UAE Delivery', baseFeeAed: 10, eta: '2-4 business days', description: 'Reliable UAE-wide delivery coverage.' },
      { id: 'express_ae', label: 'Express UAE Delivery', baseFeeAed: 25, eta: 'Next business day in major UAE cities', description: 'Fast delivery for major UAE cities.' },
    ],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
    defaultCity: 'Dubai',
    addressLabels: {
      country: 'Country',
      city: 'Emirate / City',
      area: 'Area / Community',
      flat: 'Apartment / Office No.',
      building: 'Building / Villa',
      address: 'Street / Building',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
    addressPlaceholders: {
      address: 'Street address, building, etc.',
      area: 'Al Barsha, Deira, Khalidiya...',
      building: 'Building 9, Villa 14, Tower B',
      flat: 'Apartment 1204, Office 22',
      landmark: 'Near Metro, Opposite Mall...',
      postalCode: 'Optional postal code',
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
    phonePrefix: getPhonePrefix('SA'),
    phonePlaceholder: getPhonePlaceholder('SA'),
    fallbackExchangeRateFromAed: 1.02,
    defaultShippingChargeAed: 98.04,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Trusted across Saudi Arabia',
    trustMessage: 'Premium electronics delivered across Saudi Arabia',
    deliveryMessage: 'Delivery available across Saudi Arabia',
    availabilityLabel: 'Available in Saudi Arabia',
    shippingOptions: [
      { id: 'standard_sa', label: 'Standard KSA Delivery', baseFeeAed: 98.04, eta: '3-5 business days', description: 'Country-wide shipping for Riyadh, Jeddah, Dammam, and more.' },
      { id: 'priority_sa', label: 'Priority KSA Delivery', baseFeeAed: 117.65, eta: '2-3 business days in major Saudi cities', description: 'Faster delivery for metro routes.' },
    ],
    cities: ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Tabuk', 'Abha', 'Khamis Mushait', 'Jizan', 'Hail', 'Al Qassim', 'Najran', 'Al Ahsa', 'Jubail', 'Yanbu'],
    defaultCity: 'Riyadh',
    addressLabels: {
      country: 'Country',
      city: 'Region / City',
      area: 'District / Area',
      flat: 'Apartment / Villa / Unit',
      building: 'Street / Building',
      address: 'Street Address',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
    addressPlaceholders: {
      address: 'Street name and nearby address details',
      area: 'Al Olaya, Al Rawdah, Al Malqa...',
      building: 'Street 24, Building 18',
      flat: 'Unit 9, Villa 12, Apartment 5A',
      landmark: 'Near mosque, opposite mall...',
      postalCode: '12345',
    },
  },
  QA: {
    code: 'QA',
    displayCode: 'QATAR',
    name: 'Qatar',
    shortName: 'Qatar',
    currency: 'QAR',
    currencySymbol: 'QAR',
    locale: 'en-QA',
    vatRate: 0,
    phonePrefix: getPhonePrefix('QA'),
    phonePlaceholder: getPhonePlaceholder('QA'),
    fallbackExchangeRateFromAed: 0.99,
    defaultShippingChargeAed: 101.01,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Available across Qatar',
    trustMessage: 'Premium electronics delivery across Qatar',
    deliveryMessage: 'Delivery available across Qatar',
    availabilityLabel: 'Available in Qatar',
    shippingOptions: [
      { id: 'standard_qa', label: 'Standard Qatar Delivery', baseFeeAed: 101.01, eta: '3-5 business days', description: 'Reliable delivery across Qatar.' },
    ],
    cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail', 'Umm Salal', 'Mesaieed', 'Dukhan'],
    defaultCity: 'Doha',
    addressLabels: {
      country: 'Country',
      city: 'City / Municipality',
      area: 'Area / Zone',
      flat: 'Apartment / Unit',
      building: 'Building / Villa',
      address: 'Street / Building',
      landmark: 'Landmark',
      postalCode: 'Zone / Postal Code',
    },
    addressPlaceholders: {
      address: 'Street and building details',
      area: 'West Bay, The Pearl, Al Sadd...',
      building: 'Building 18, Villa 7',
      flat: 'Apartment 804, Unit B',
      landmark: 'Near mall, opposite mosque...',
      postalCode: 'Zone number if available',
    },
  },
  KW: {
    code: 'KW',
    displayCode: 'KUWAIT',
    name: 'Kuwait',
    shortName: 'Kuwait',
    currency: 'KWD',
    currencySymbol: 'KWD',
    locale: 'en-KW',
    vatRate: 0,
    phonePrefix: getPhonePrefix('KW'),
    phonePlaceholder: getPhonePlaceholder('KW'),
    fallbackExchangeRateFromAed: 0.083,
    defaultShippingChargeAed: 96.39,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Available across Kuwait',
    trustMessage: 'Premium electronics delivery across Kuwait',
    deliveryMessage: 'Delivery available across Kuwait',
    availabilityLabel: 'Available in Kuwait',
    shippingOptions: [
      { id: 'standard_kw', label: 'Standard Kuwait Delivery', baseFeeAed: 96.39, eta: '3-5 business days', description: 'Reliable delivery across Kuwait.' },
    ],
    cities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Ahmadi', 'Jahra', 'Fahaheel', 'Mangaf', 'Mahboula'],
    defaultCity: 'Kuwait City',
    addressLabels: {
      country: 'Country',
      city: 'City / Governorate',
      area: 'Area / Block',
      flat: 'Apartment / Floor / Unit',
      building: 'Building / House',
      address: 'Street Address',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
    addressPlaceholders: {
      address: 'Street and avenue details',
      area: 'Salmiya Block 10, Hawalli...',
      building: 'Building 21, House 9',
      flat: 'Floor 3, Apartment 11',
      landmark: 'Near co-op, opposite school...',
      postalCode: 'Optional postal code',
    },
  },
  BH: {
    code: 'BH',
    displayCode: 'BAHRAIN',
    name: 'Bahrain',
    shortName: 'Bahrain',
    currency: 'BHD',
    currencySymbol: 'BHD',
    locale: 'en-BH',
    vatRate: 0.1,
    phonePrefix: getPhonePrefix('BH'),
    phonePlaceholder: getPhonePlaceholder('BH'),
    fallbackExchangeRateFromAed: 0.102,
    defaultShippingChargeAed: 98.04,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Available across Bahrain',
    trustMessage: 'Premium electronics delivery across Bahrain',
    deliveryMessage: 'Delivery available across Bahrain',
    availabilityLabel: 'Available in Bahrain',
    shippingOptions: [
      { id: 'standard_bh', label: 'Standard Bahrain Delivery', baseFeeAed: 98.04, eta: '3-5 business days', description: 'Reliable delivery across Bahrain.' },
    ],
    cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra', 'Budaiya', 'Juffair'],
    defaultCity: 'Manama',
    addressLabels: {
      country: 'Country',
      city: 'City / Governorate',
      area: 'Area / Block',
      flat: 'Apartment / Unit',
      building: 'Building / Villa',
      address: 'Road / Block / Building',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
    addressPlaceholders: {
      address: 'Road, block, and building details',
      area: 'Juffair, Seef, Adliya...',
      building: 'Building 103, Villa 12',
      flat: 'Apartment 6B',
      landmark: 'Near mall, next to petrol station...',
      postalCode: 'Optional postal code',
    },
  },
  OM: {
    code: 'OM',
    displayCode: 'OMAN',
    name: 'Oman',
    shortName: 'Oman',
    currency: 'OMR',
    currencySymbol: 'OMR',
    locale: 'en-OM',
    vatRate: 0.05,
    phonePrefix: getPhonePrefix('OM'),
    phonePlaceholder: getPhonePlaceholder('OM'),
    fallbackExchangeRateFromAed: 0.105,
    defaultShippingChargeAed: 95.24,
    announcement: 'Now serving the full GCC',
    trustLabel: 'Available across Oman',
    trustMessage: 'Premium electronics delivery across Oman',
    deliveryMessage: 'Delivery available across Oman',
    availabilityLabel: 'Available in Oman',
    shippingOptions: [
      { id: 'standard_om', label: 'Standard Oman Delivery', baseFeeAed: 95.24, eta: '3-6 business days', description: 'Reliable delivery across Oman.' },
    ],
    cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Seeb', 'Barka', 'Ibri', 'Rustaq'],
    defaultCity: 'Muscat',
    addressLabels: {
      country: 'Country',
      city: 'City / Governorate',
      area: 'Area / Wilaya',
      flat: 'Apartment / Unit',
      building: 'Building / Villa',
      address: 'Street / Building',
      landmark: 'Landmark',
      postalCode: 'Postal Code',
    },
    addressPlaceholders: {
      address: 'Street and building details',
      area: 'Al Khuwair, Qurum, Seeb...',
      building: 'Building 10, Villa 4',
      flat: 'Apartment 301',
      landmark: 'Near mosque, opposite mall...',
      postalCode: 'Optional postal code',
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
  return SUPPORTED_COUNTRY_CODES.includes(String(value || '').toUpperCase() as SupportedCountryCode);
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
  return { ...option, fee: convertFromAed(option.baseFeeAed, config.code) };
}

export function getShippingOption(countryCode: string | null | undefined, optionId?: string | null): ShippingOption {
  const config = getCountryConfig(countryCode);
  const option = config.shippingOptions.find((entry) => entry.id === optionId) || config.shippingOptions[0];
  return { ...option, fee: convertFromAed(option.baseFeeAed, config.code) };
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
  return Number((toSafeAmount(amount) * getTaxRateByCountry(countryCode)).toFixed(2));
}

function readCountryPrice(product: CountryAwarePriced, countryCode: SupportedCountryCode) {
  const explicitMap = product.pricesByCountry || product.specs?.pricesByCountry || {};
  const fromMap = explicitMap?.[countryCode]?.price;
  if (fromMap != null && String(fromMap).trim() !== '') return toSafeAmount(fromMap);

  switch (countryCode) {
    case 'AE':
      return toSafeAmount(product.priceUae ?? product.basePriceAED ?? product.price);
    case 'SA':
      return product.priceKsa != null && String(product.priceKsa).trim() !== ''
        ? toSafeAmount(product.priceKsa)
        : undefined;
    case 'QA':
      return product.priceQatar != null && String(product.priceQatar).trim() !== ''
        ? toSafeAmount(product.priceQatar)
        : undefined;
    case 'KW':
      return product.priceKuwait != null && String(product.priceKuwait).trim() !== ''
        ? toSafeAmount(product.priceKuwait)
        : undefined;
    case 'BH':
      return product.priceBahrain != null && String(product.priceBahrain).trim() !== ''
        ? toSafeAmount(product.priceBahrain)
        : undefined;
    case 'OM':
      return product.priceOman != null && String(product.priceOman).trim() !== ''
        ? toSafeAmount(product.priceOman)
        : undefined;
  }
}

function readCountryCompareAtPrice(product: CountryAwarePriced, countryCode: SupportedCountryCode) {
  const explicitMap = product.pricesByCountry || product.specs?.pricesByCountry || {};
  const fromMap = explicitMap?.[countryCode]?.compareAtPrice;
  if (fromMap != null && String(fromMap).trim() !== '') return toSafeAmount(fromMap);

  switch (countryCode) {
    case 'AE':
      return toSafeAmount(product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice ?? product.basePriceAED ?? product.price);
    case 'SA':
      return product.compareAtPriceKsa != null && String(product.compareAtPriceKsa).trim() !== ''
        ? toSafeAmount(product.compareAtPriceKsa)
        : undefined;
    case 'QA':
      return product.compareAtPriceQatar != null && String(product.compareAtPriceQatar).trim() !== ''
        ? toSafeAmount(product.compareAtPriceQatar)
        : undefined;
    case 'KW':
      return product.compareAtPriceKuwait != null && String(product.compareAtPriceKuwait).trim() !== ''
        ? toSafeAmount(product.compareAtPriceKuwait)
        : undefined;
    case 'BH':
      return product.compareAtPriceBahrain != null && String(product.compareAtPriceBahrain).trim() !== ''
        ? toSafeAmount(product.compareAtPriceBahrain)
        : undefined;
    case 'OM':
      return product.compareAtPriceOman != null && String(product.compareAtPriceOman).trim() !== ''
        ? toSafeAmount(product.compareAtPriceOman)
        : undefined;
  }
}

export function getProductCountryPrice(product: CountryAwarePriced | null | undefined, countryCode?: string | null) {
  if (!product) return 0;
  const config = getCountryConfig(countryCode);
  const baseAed = toSafeAmount(product.basePriceAED ?? product.priceUae ?? product.price);
  const explicit = readCountryPrice(product, config.code);
  return explicit != null ? explicit : convertFromAed(baseAed, config.code);
}

export function getProductCountryCompareAtPrice(product: CountryAwarePriced | null | undefined, countryCode?: string | null) {
  if (!product) return 0;
  const config = getCountryConfig(countryCode);
  const baseAed = toSafeAmount(
    product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice ?? product.basePriceAED ?? product.priceUae ?? product.price
  );
  const explicit = readCountryCompareAtPrice(product, config.code);
  return explicit != null ? explicit : convertFromAed(baseAed, config.code);
}

export function normalizeCountryAwarePricing<T extends Record<string, any>>(product: T) {
  const priceUae = toSafeAmount(product.priceUae ?? product.basePriceAED ?? product.price);
  const originalPriceUae = toSafeAmount(
    product.compareAtPriceUae ?? product.originalPrice ?? product.oldPrice ?? product.basePriceAED ?? product.priceUae ?? product.price
  );

  const pricesByCountry = {
    AE: { currency: 'AED' as const, price: priceUae, compareAtPrice: originalPriceUae > priceUae ? originalPriceUae : undefined },
    SA: { currency: 'SAR' as const, price: readCountryPrice(product, 'SA') ?? convertFromAed(priceUae, 'SA'), compareAtPrice: readCountryCompareAtPrice(product, 'SA') ?? convertFromAed(originalPriceUae, 'SA') },
    QA: { currency: 'QAR' as const, price: readCountryPrice(product, 'QA') ?? convertFromAed(priceUae, 'QA'), compareAtPrice: readCountryCompareAtPrice(product, 'QA') ?? convertFromAed(originalPriceUae, 'QA') },
    KW: { currency: 'KWD' as const, price: readCountryPrice(product, 'KW') ?? convertFromAed(priceUae, 'KW'), compareAtPrice: readCountryCompareAtPrice(product, 'KW') ?? convertFromAed(originalPriceUae, 'KW') },
    BH: { currency: 'BHD' as const, price: readCountryPrice(product, 'BH') ?? convertFromAed(priceUae, 'BH'), compareAtPrice: readCountryCompareAtPrice(product, 'BH') ?? convertFromAed(originalPriceUae, 'BH') },
    OM: { currency: 'OMR' as const, price: readCountryPrice(product, 'OM') ?? convertFromAed(priceUae, 'OM'), compareAtPrice: readCountryCompareAtPrice(product, 'OM') ?? convertFromAed(originalPriceUae, 'OM') },
  };

  return {
    ...product,
    price: priceUae,
    basePriceAED: priceUae,
    originalPrice: originalPriceUae,
    priceUae,
    priceKsa: readCountryPrice(product, 'SA'),
    priceQatar: readCountryPrice(product, 'QA'),
    priceKuwait: readCountryPrice(product, 'KW'),
    priceBahrain: readCountryPrice(product, 'BH'),
    priceOman: readCountryPrice(product, 'OM'),
    compareAtPriceUae: originalPriceUae > priceUae ? originalPriceUae : undefined,
    compareAtPriceKsa: readCountryCompareAtPrice(product, 'SA'),
    compareAtPriceQatar: readCountryCompareAtPrice(product, 'QA'),
    compareAtPriceKuwait: readCountryCompareAtPrice(product, 'KW'),
    compareAtPriceBahrain: readCountryCompareAtPrice(product, 'BH'),
    compareAtPriceOman: readCountryCompareAtPrice(product, 'OM'),
    pricesByCountry: pricesByCountry,
  };
}

export function normalizePhoneForCountry(phone: string, countryCode?: string | null) {
  return normalizePhoneByCountry(phone, countryCode);
}

export function isValidPhoneForCountry(phone: string, countryCode?: string | null) {
  return isValidSharedPhoneForCountry(phone, countryCode);
}

export function getAvailabilityText(countryCode?: string | null) {
  return getCountryConfig(countryCode).availabilityLabel;
}

export function getDualCountryTrustText() {
  return 'Fast delivery across the GCC';
}

export function getCountryTrustMessage(countryCode?: string | null) {
  return getCountryConfig(countryCode).trustMessage;
}

export function getCountryDeliveryMessage(countryCode?: string | null) {
  return getCountryConfig(countryCode).deliveryMessage;
}

export function getCountrySeoMarketLabel(countryCode?: string | null) {
  return getCountryConfig(countryCode).name;
}

export function getCountryFlag(countryCode?: string | null) {
  switch (getCountryConfig(countryCode).code) {
    case 'SA':
      return '🇸🇦';
    case 'QA':
      return '🇶🇦';
    case 'KW':
      return '🇰🇼';
    case 'BH':
      return '🇧🇭';
    case 'OM':
      return '🇴🇲';
    default:
      return '🇦🇪';
  }
}
