export type PhoneCountryCode = 'AE' | 'SA';

const DEFAULT_PHONE_COUNTRY: PhoneCountryCode = 'AE';

function toSupportedCountryCode(countryCode?: string | null): PhoneCountryCode {
  return countryCode === 'SA' ? 'SA' : DEFAULT_PHONE_COUNTRY;
}

function sanitizePhone(raw: string) {
  return String(raw || '').replace(/[^\d+]/g, '');
}

export function normalizePhoneByCountry(raw: string, countryCode?: string | null) {
  const phone = sanitizePhone(raw);
  const country = toSupportedCountryCode(countryCode);

  if (!phone) return '';

  if (country === 'AE') {
    if (phone.startsWith('+971')) return phone;
    if (phone.startsWith('971')) return `+${phone}`;
    if (phone.startsWith('05')) return `+971${phone.slice(1)}`;
    if (phone.startsWith('5')) return `+971${phone}`;
    return phone;
  }

  if (phone.startsWith('+966')) return phone;
  if (phone.startsWith('966')) return `+${phone}`;
  if (phone.startsWith('05')) return `+966${phone.slice(1)}`;
  if (phone.startsWith('5')) return `+966${phone}`;
  return phone;
}

export function isValidPhoneForCountry(phone: string, countryCode?: string | null) {
  const normalized = normalizePhoneByCountry(phone, countryCode);
  const country = toSupportedCountryCode(countryCode);

  if (country === 'AE') {
    return /^\+9715\d{8}$/.test(normalized);
  }

  return /^\+9665\d{8}$/.test(normalized);
}

export function getPhoneCountryLabel(countryCode?: string | null) {
  return toSupportedCountryCode(countryCode) === 'SA' ? 'Saudi Arabia' : 'UAE';
}

export function getInvalidPhoneMessage(countryCode?: string | null) {
  return `Enter a valid ${getPhoneCountryLabel(countryCode)} mobile number.`;
}
