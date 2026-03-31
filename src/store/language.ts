import { create } from 'zustand';

interface LanguageState {
  lang: string;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: string) => void;
  toggleLang: () => void;
}

const applyLanguage = (language: string): Pick<LanguageState, 'lang' | 'direction'> => {
  const isArabic = language.toLowerCase() === 'arabic' || language === 'ar';
  const direction: 'rtl' | 'ltr' = 'ltr';
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  localStorage.setItem('exshopi-language', language);
  return { lang: language, direction };
};

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: typeof window !== 'undefined' ? localStorage.getItem('exshopi-language') || 'English' : 'English',
  direction:
    'ltr',
  setLanguage: (language) => set(() => applyLanguage(language)),
  toggleLang: () =>
    set((state) => applyLanguage(state.lang.toLowerCase() === 'arabic' || state.lang === 'ar' ? 'English' : 'Arabic')),
}));
