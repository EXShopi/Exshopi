export type PhoneCountryCode =
  | 'AE'
  | 'SA'
  | 'QA'
  | 'KW'
  | 'BH'
  | 'OM'
  | 'US'
  | 'GB'
  | 'EU'
  | 'CA'
  | 'AU'
  | 'NZ'
  | 'JP'
  | 'CN'
  | 'HK'
  | 'IN'
  | 'SG'
  | 'ZA'
  | 'NG'
  | 'KE'
  | 'WORLD';

const DEFAULT_PHONE_COUNTRY: PhoneCountryCode = 'AE';

type PhoneCountryConfig = {
  code: PhoneCountryCode;
  label: string;
  prefix: string;
  placeholder: string;
  nationalPrefixes?: string[];
  validator: RegExp;
};

const PHONE_CONFIG: Record<PhoneCountryCode, PhoneCountryConfig> = {
  AE: {
    code: 'AE',
    label: 'United Arab Emirates',
    prefix: '+971',
    placeholder: '+971 50 123 4567',
    nationalPrefixes: ['05', '5'],
    validator: /^\+9715\d{8}$/,
  },
  SA: {
    code: 'SA',
    label: 'Saudi Arabia',
    prefix: '+966',
    placeholder: '+966 5X XXX XXXX',
    nationalPrefixes: ['05', '5'],
    validator: /^\+9665\d{8}$/,
  },
  QA: {
    code: 'QA',
    label: 'Qatar',
    prefix: '+974',
    placeholder: '+974 XXXX XXXX',
    validator: /^\+974[3567]\d{7}$/,
  },
  KW: {
    code: 'KW',
    label: 'Kuwait',
    prefix: '+965',
    placeholder: '+965 XXXX XXXX',
    validator: /^\+965[569]\d{7}$/,
  },
  BH: {
    code: 'BH',
    label: 'Bahrain',
    prefix: '+973',
    placeholder: '+973 XXXX XXXX',
    validator: /^\+973(3|6)\d{7}$/,
  },
  OM: {
    code: 'OM',
    label: 'Oman',
    prefix: '+968',
    placeholder: '+968 XXXX XXXX',
    validator: /^\+968(7|9)\d{7}$/,
  },
  US: { code: 'US', label: 'United States', prefix: '+1', placeholder: '+1 555 123 4567', validator: /^\+1\d{10}$/ },
  GB: { code: 'GB', label: 'United Kingdom', prefix: '+44', placeholder: '+44 7XXX XXXXXX', nationalPrefixes: ['07', '7'], validator: /^\+447\d{9}$/ },
  EU: { code: 'EU', label: 'Europe', prefix: '+', placeholder: '+33 6 12 34 56 78', validator: /^\+[1-9]\d{7,14}$/ },
  CA: { code: 'CA', label: 'Canada', prefix: '+1', placeholder: '+1 416 555 0199', validator: /^\+1\d{10}$/ },
  AU: { code: 'AU', label: 'Australia', prefix: '+61', placeholder: '+61 4XX XXX XXX', nationalPrefixes: ['04', '4'], validator: /^\+614\d{8}$/ },
  NZ: { code: 'NZ', label: 'New Zealand', prefix: '+64', placeholder: '+64 2X XXX XXXX', nationalPrefixes: ['02', '2'], validator: /^\+642\d{7,9}$/ },
  JP: { code: 'JP', label: 'Japan', prefix: '+81', placeholder: '+81 90 XXXX XXXX', validator: /^\+81\d{9,10}$/ },
  CN: { code: 'CN', label: 'China', prefix: '+86', placeholder: '+86 1XX XXXX XXXX', validator: /^\+861\d{10}$/ },
  HK: { code: 'HK', label: 'Hong Kong', prefix: '+852', placeholder: '+852 XXXX XXXX', validator: /^\+852\d{8}$/ },
  IN: { code: 'IN', label: 'India', prefix: '+91', placeholder: '+91 9XXXX XXXXX', validator: /^\+91[6-9]\d{9}$/ },
  SG: { code: 'SG', label: 'Singapore', prefix: '+65', placeholder: '+65 XXXX XXXX', validator: /^\+65[689]\d{7}$/ },
  ZA: { code: 'ZA', label: 'South Africa', prefix: '+27', placeholder: '+27 7X XXX XXXX', validator: /^\+27\d{9}$/ },
  NG: { code: 'NG', label: 'Nigeria', prefix: '+234', placeholder: '+234 80X XXX XXXX', validator: /^\+234\d{10}$/ },
  KE: { code: 'KE', label: 'Kenya', prefix: '+254', placeholder: '+254 7XX XXX XXX', validator: /^\+254\d{9}$/ },
  WORLD: { code: 'WORLD', label: 'international', prefix: '+', placeholder: '+1 555 123 4567', validator: /^\+[1-9]\d{7,14}$/ },
};

function toSupportedCountryCode(countryCode?: string | null): PhoneCountryCode {
  const normalized = String(countryCode || '').toUpperCase();
  if (normalized in PHONE_CONFIG) return normalized as PhoneCountryCode;
  return DEFAULT_PHONE_COUNTRY;
}

function sanitizePhone(raw: string) {
  return String(raw || '').replace(/[^\d+]/g, '');
}

export function getPhoneCountryConfig(countryCode?: string | null) {
  return PHONE_CONFIG[toSupportedCountryCode(countryCode)];
}

export function getPhonePlaceholder(countryCode?: string | null) {
  return getPhoneCountryConfig(countryCode).placeholder;
}

export function getPhonePrefix(countryCode?: string | null) {
  return getPhoneCountryConfig(countryCode).prefix;
}

export function normalizePhoneByCountry(raw: string, countryCode?: string | null) {
  const phone = sanitizePhone(raw);
  const country = getPhoneCountryConfig(countryCode);

  if (!phone) return '';
  if (phone.startsWith(country.prefix)) return phone;
  if (phone.startsWith(country.prefix.replace('+', ''))) return `+${phone}`;

  for (const prefix of country.nationalPrefixes || []) {
    if (phone.startsWith(prefix)) {
      const stripped = prefix === '5' ? phone : phone.slice(prefix.length - 1);
      return `${country.prefix}${stripped.startsWith('5') ? stripped : phone.slice(prefix.length)}`;
    }
  }

  if (!phone.startsWith('+') && /^\d+$/.test(phone)) {
    return `${country.prefix}${phone}`;
  }

  return phone;
}

export function isValidPhoneForCountry(phone: string, countryCode?: string | null) {
  const normalized = normalizePhoneByCountry(phone, countryCode);
  return getPhoneCountryConfig(countryCode).validator.test(normalized);
}

export function getPhoneCountryLabel(countryCode?: string | null) {
  return getPhoneCountryConfig(countryCode).label;
}

export function getInvalidPhoneMessage(countryCode?: string | null) {
  return `Enter a valid ${getPhoneCountryLabel(countryCode)} mobile number.`;
}
