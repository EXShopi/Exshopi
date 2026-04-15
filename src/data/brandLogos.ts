// Centralized brand logo mapping and helpers
export const BRAND_LOGOS: Record<string, string> = {
  apple: '/Banners/apple',
  samsung: '/Banners/samsung',
  dell: '/Banners/dell',
  hp: '/Banners/hp.png',
  lenovo: '/Banners/lenovo',
  gaming: '/Banners/gaming',
  acer: '/Banners/acer',
  asus: '/Banners/asus',
};

export function normalizeBrandKey(input?: string) {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

export function getBrandLogoForName(name?: string) {
  const key = normalizeBrandKey(name);
  return BRAND_LOGOS[key] || null;
}

export function getBrandSlugFromName(name?: string) {
  return normalizeBrandKey(name) || '';
}

export default BRAND_LOGOS;
