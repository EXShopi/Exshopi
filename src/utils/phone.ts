export type PhoneCountryCode = 'AE' | 'SA' | 'QA' | 'KW' | 'BH' | 'OM';

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
