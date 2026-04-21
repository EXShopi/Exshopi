import { storefrontT, type StorefrontLanguage } from './storefrontCopy';

export type UiLanguageCode = 'en' | 'ar';

export const LANGUAGE_CODE_BY_LABEL: Record<string, UiLanguageCode> = {
  English: 'en',
  Arabic: 'ar',
  en: 'en',
  ar: 'ar',
};

export function getUiLanguageCode(language?: string | null): UiLanguageCode {
  return LANGUAGE_CODE_BY_LABEL[String(language || '').trim()] || 'en';
}

export function getStorefrontLanguage(language?: string | null): StorefrontLanguage {
  return getUiLanguageCode(language) === 'ar' ? 'Arabic' : 'English';
}

export function t(language: string | null | undefined, key: Parameters<typeof storefrontT>[1]) {
  return storefrontT(getStorefrontLanguage(language), key);
}
