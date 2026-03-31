import { getAuthHeaders } from './api';
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:3101/api';

export interface SiteSettings {
  general: {
    siteName: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    defaultLanguage: string;
    vatPercentage: number;
  };
  branding: {
    siteName: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    accentColor: string;
  };
  homepage: {
    hero: {
      title: string;
      subtitle: string;
      primaryCtaText: string;
      primaryCtaLink: string;
      productImageUrl: string;
    };
    uaeStrip: {
      show: boolean;
      leftTitle: string;
      leftSubtitle: string;
      rightTitle: string;
      rightSubtitle: string;
    };
    sections: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      show: boolean;
      order: number;
    }>;
    promoBoxes: Array<{
      id: string;
      badge: string;
      title: string;
      description: string;
      ctaText: string;
      ctaLink: string;
      tone: 'dark' | 'light';
      show: boolean;
    }>;
    videoSection: {
      show: boolean;
      badgeText: string;
      title: string;
      description: string;
      ctaText: string;
      videoUrl: string;
      thumbnailUrl: string;
    };
    trustBanner: {
      show: boolean;
      items: Array<{
        icon: string;
        title: string;
        desc: string;
      }>;
    };
  };
  header: {
    announcementBar: {
      show: boolean;
      text: string;
      bgColor: string;
      textColor: string;
    };
    deliveryMessage: string;
    searchPlaceholder: string;
  };
  footer: {
    description: string;
    email: string;
    phone: string;
    socialLinks: {
      instagram: string;
      facebook: string;
    };
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
}

export const defaultSettings: SiteSettings = {
  general: {
    siteName: 'ExShopi',
    tagline: "UAE's trusted marketplace",
    supportEmail: 'exshopi@exshopi.com',
    supportPhone: '+971522608063',
    address: 'Dubai, United Arab Emirates',
    defaultLanguage: 'en',
    vatPercentage: 5,
  },
  branding: {
    siteName: 'ExShopi',
    logoUrl: '/logo.png',
    faviconUrl: '/logo.png',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
  },
  homepage: {
    hero: {
      title: 'Premium Marketplace',
      subtitle: 'Shop top electronics, gadgets, and more.',
      primaryCtaText: 'Shop Now',
      primaryCtaLink: '/products',
      productImageUrl: '/hero/hero-1.png',
    },
    uaeStrip: {
      show: true,
      leftTitle: 'OUR PRIDE',
      leftSubtitle: 'OUR UAE',
      rightTitle: 'إماراتنا',
      rightSubtitle: 'فخرنا',
    },
    sections: [
      { id: 'featured-products', title: 'Featured Products', subtitle: 'Curated marketplace picks', type: 'products', show: true, order: 1 },
      { id: 'brands', title: 'Popular Brands', subtitle: 'Trusted marketplace names', type: 'brands', show: true, order: 2 },
      { id: 'most-popular', title: 'Most popular this month', subtitle: 'Products with strong shopper momentum', type: 'products', show: true, order: 3 },
      { id: 'flash-deals', title: 'Eid Offers', subtitle: 'Seasonal marketplace deals and campaign picks', type: 'campaign', show: true, order: 4 },
      { id: 'promo', title: 'Marketplace Offers', subtitle: 'Curated promos and feature callouts', type: 'promo', show: true, order: 5 },
    ],
    promoBoxes: [
      {
        id: 'promo-1',
        badge: 'Marketplace Offer',
        title: 'Electronics Deals This Week',
        description: 'Explore featured electronics, accessories and top marketplace picks with competitive weekly deals.',
        ctaText: 'Shop Deals',
        ctaLink: '/deals',
        tone: 'dark',
        show: true,
      },
      {
        id: 'promo-2',
        badge: 'Featured Collection',
        title: 'Trending Accessories & Daily Essentials',
        description: 'Discover fast-moving marketplace products, everyday essentials and customer favorites in one curated collection.',
        ctaText: 'Explore Products',
        ctaLink: '/categories',
        tone: 'light',
        show: true,
      },
    ],
    videoSection: {
      show: true,
      badgeText: 'Featured',
      title: 'Discover the ExShopi Experience',
      description: 'Fast delivery, premium products, and a modern shopping experience.',
      ctaText: 'Watch Video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/Banners/banner1.jpg',
    },
    trustBanner: {
      show: true,
      items: [
        { icon: 'truck', title: 'Fast Delivery', desc: 'Across UAE' },
        { icon: 'shield', title: 'Secure Shopping', desc: 'Protected checkout' },
        { icon: 'zap', title: 'Great Deals', desc: 'Best value' },
        { icon: 'check', title: 'Trusted Quality', desc: 'Verified products' },
      ],
    },
  },
  header: {
    announcementBar: {
      show: true,
      text: 'Delivering across UAE only',
      bgColor: '#0f172a',
      textColor: '#ffffff',
    },
    deliveryMessage: 'Fast Delivery · Trusted Sellers',
    searchPlaceholder: 'Search for laptops, phones, accessories, sellers...',
  },
  footer: {
    description: 'Premium UAE marketplace for electronics, accessories, and daily use products.',
    email: 'exshopi@exshopi.com',
    phone: '+971 52 260 8063',
    socialLinks: {
      instagram: 'https://instagram.com/exshopi',
      facebook: 'https://facebook.com/exshopi',
    },
  },
  seo: {
    metaTitle: 'ExShopi | Premium UAE Marketplace',
    metaDescription: 'Shop electronics, daily-use products, and trusted sellers across ExShopi in the UAE.',
    keywords: 'ExShopi, UAE marketplace, electronics, mobiles, laptops, deals',
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings/site`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to load settings');
    const remote = await res.json();
    return {
      ...defaultSettings,
      ...remote,
      general: { ...defaultSettings.general, ...(remote?.general || {}) },
      branding: { ...defaultSettings.branding, ...(remote?.branding || {}) },
      homepage: {
        ...defaultSettings.homepage,
        ...(remote?.homepage || {}),
        hero: { ...defaultSettings.homepage.hero, ...(remote?.homepage?.hero || {}) },
        uaeStrip: { ...defaultSettings.homepage.uaeStrip, ...(remote?.homepage?.uaeStrip || {}) },
        sections: Array.isArray(remote?.homepage?.sections) ? remote.homepage.sections : defaultSettings.homepage.sections,
        promoBoxes: Array.isArray(remote?.homepage?.promoBoxes) ? remote.homepage.promoBoxes : defaultSettings.homepage.promoBoxes,
        videoSection: { ...defaultSettings.homepage.videoSection, ...(remote?.homepage?.videoSection || {}) },
        trustBanner: {
          ...defaultSettings.homepage.trustBanner,
          ...(remote?.homepage?.trustBanner || {}),
          items: Array.isArray(remote?.homepage?.trustBanner?.items)
            ? remote.homepage.trustBanner.items
            : defaultSettings.homepage.trustBanner.items,
        },
      },
      header: {
        ...defaultSettings.header,
        ...(remote?.header || {}),
        announcementBar: { ...defaultSettings.header.announcementBar, ...(remote?.header?.announcementBar || {}) },
      },
      footer: {
        ...defaultSettings.footer,
        ...(remote?.footer || {}),
        socialLinks: { ...defaultSettings.footer.socialLinks, ...(remote?.footer?.socialLinks || {}) },
      },
      seo: { ...defaultSettings.seo, ...(remote?.seo || {}) },
    };
  } catch (error) {
    console.error('Settings fetch error:', error);
    return defaultSettings;
  }
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/site`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error('Failed to update site settings');
  }
}
