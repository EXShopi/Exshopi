import { getCountryConfig } from './countryConfig';

const DEFAULT_WHATSAPP_NUMBER = '971522608063';

export function getExShopiWhatsAppNumber() {
  return DEFAULT_WHATSAPP_NUMBER;
}

export function buildCountryAwareWhatsAppMessage(countryCode?: string | null, productTitle?: string | null) {
  const country = getCountryConfig(countryCode);
  const countryLabel = country.code === 'SA' ? 'Saudi Arabia' : 'UAE';
  if (productTitle) {
    return `Hi, I am from ${countryLabel} and I want to order this product from Exshopi: ${productTitle}`;
  }
  return `Hi, I am from ${countryLabel} and I need help with my order on Exshopi.`;
}
