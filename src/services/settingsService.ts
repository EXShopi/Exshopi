import { getAuthHeaders, safeFetchApi } from './api';

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
    featuredSection: {
      bestsellersProductIds: string[];
      bestchoiceProductIds: string[];
      onsaleProductIds: string[];
    };
    mostPopularSection: {
      featuredProductIds: string[];
    };
    campaignSection: {
      badgeText: string;
      expiresLabel: string;
      moreCtaText: string;
      moreCtaLink: string;
      allPromotionsText: string;
      allPromotionsLink: string;
      endAt: string;
      panelBgColor: string;
      sectionBgColor: string;
      productRailBgColor: string;
      featuredProductIds: string[];
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
      imageUrl: string;
      tone: 'dark' | 'light';
      show: boolean;
    }>;
    allProductsSection: {
      show: boolean;
      title: string;
      subtitle: string;
    };
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
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    homepage: {
      metaTitle: string;
      metaDescription: string;
      keywords: string;
      ogTitle: string;
      ogDescription: string;
      ogImage: string;
    };
    blog: {
      metaTitle: string;
      metaDescription: string;
      keywords: string;
      slug: string;
      ogImage: string;
    };
  };
}

export const defaultSettings: SiteSettings = {
  general: {
    siteName: 'ExShopi',
    tagline: "UAE & Saudi Arabia's trusted marketplace",
    supportEmail: 'exshopi@exshopi.com',
    supportPhone: '+971522608063',
    address: 'Dubai, United Arab Emirates · Riyadh, Saudi Arabia',
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
      // Use WebP for better performance and to match public/hero/*.webp
      productImageUrl: '/hero/hero-1.webp',
    },
    featuredSection: {
      bestsellersProductIds: [],
      bestchoiceProductIds: [],
      onsaleProductIds: [],
    },
    mostPopularSection: {
      featuredProductIds: [],
    },
    campaignSection: {
      badgeText: 'Campaign',
      expiresLabel: 'Promotion expires within:',
      moreCtaText: 'More',
      moreCtaLink: '/campaigns/current',
      allPromotionsText: 'All promotions',
      allPromotionsLink: '/promotions',
      endAt: '2026-04-15T23:59:59+04:00',
      panelBgColor: '#4338ca',
      sectionBgColor: '#1d4ed8',
      productRailBgColor: 'rgba(255,255,255,0.10)',
      featuredProductIds: [],
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
        title: 'T-Shirts Deals This Week',
        description: 'Explore fresh T-shirts, everyday wardrobe picks, and marketplace fashion deals selected for fast-moving apparel sales.',
        ctaText: 'Shop Deals',
        ctaLink: '/category/fashion/men-clothing',
        imageUrl: '',
        tone: 'dark',
        show: true,
      },
      {
        id: 'promo-2',
        badge: 'Featured Collection',
        title: 'Trending Shoes & Daily Essentials',
        description: 'Discover standout shoes, daily footwear picks, and customer favorites in one curated collection built for style and comfort.',
        ctaText: 'Explore Products',
        ctaLink: '/category/fashion/footwear',
        imageUrl: '',
        tone: 'light',
        show: true,
      },
    ],
    allProductsSection: {
      show: true,
      title: 'All Products',
      subtitle: 'Browse the full live ExShopi catalog before the footer.',
    },
    videoSection: {
      show: true,
      badgeText: 'Featured',
      title: 'Discover the ExShopi Experience',
        description: 'Fast delivery, premium products, and a modern shopping experience across UAE and Saudi Arabia.',
      ctaText: 'Watch Video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/Banners/banner1.jpg',
    },
    trustBanner: {
      show: true,
      items: [
        { icon: 'truck', title: 'Fast Delivery', desc: 'Across UAE & KSA' },
        { icon: 'shield', title: 'Secure Shopping', desc: 'Protected checkout' },
        { icon: 'zap', title: 'Great Deals', desc: 'Best value' },
        { icon: 'check', title: 'Trusted Quality', desc: 'Verified products' },
      ],
    },
  },
  header: {
    announcementBar: {
      show: true,
      text: 'Now serving UAE & Saudi Arabia',
      bgColor: '#0f172a',
      textColor: '#ffffff',
    },
    deliveryMessage: 'Fast delivery across UAE and KSA',
    searchPlaceholder: 'Search for laptops, phones, accessories, sellers...',
  },
  footer: {
    description: 'Premium UAE and Saudi Arabia marketplace for electronics, accessories, and daily use products.',
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
    ogTitle: 'ExShopi | Premium UAE Marketplace',
    ogDescription: 'Shop electronics, daily-use products, and trusted sellers across ExShopi in the UAE.',
    ogImage: '',
    homepage: {
      metaTitle: 'Buy Electronics in UAE | Refurbished Laptops, iPhones & COD | ExShopi',
      metaDescription: 'Shop refurbished laptops, used MacBook deals, cheap iPhones, and premium electronics in UAE with COD checkout and fast delivery.',
      keywords: 'buy electronics UAE, refurbished laptops UAE, used MacBook Dubai, cheap iPhone UAE, ExShopi',
      ogTitle: 'Buy Electronics in UAE | ExShopi',
      ogDescription: 'Premium UAE marketplace for electronics, mobiles, laptops, and COD-friendly deals.',
      ogImage: '',
    },
    blog: {
      metaTitle: 'ExShopi Blog | Shopping Guides for UAE Buyers',
      metaDescription: 'Read ExShopi buying guides, marketplace tips, and product advice tailored for UAE and GCC shoppers.',
      keywords: 'ExShopi blog, UAE shopping guide, electronics buying guide UAE',
      slug: 'blog',
      ogImage: '',
    },
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await safeFetchApi('/settings/site', {
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
        featuredSection: {
          ...defaultSettings.homepage.featuredSection,
          ...(remote?.homepage?.featuredSection || {}),
          bestsellersProductIds: Array.isArray(remote?.homepage?.featuredSection?.bestsellersProductIds)
            ? remote.homepage.featuredSection.bestsellersProductIds.map((value: unknown) => String(value))
            : defaultSettings.homepage.featuredSection.bestsellersProductIds,
          bestchoiceProductIds: Array.isArray(remote?.homepage?.featuredSection?.bestchoiceProductIds)
            ? remote.homepage.featuredSection.bestchoiceProductIds.map((value: unknown) => String(value))
            : defaultSettings.homepage.featuredSection.bestchoiceProductIds,
          onsaleProductIds: Array.isArray(remote?.homepage?.featuredSection?.onsaleProductIds)
            ? remote.homepage.featuredSection.onsaleProductIds.map((value: unknown) => String(value))
            : defaultSettings.homepage.featuredSection.onsaleProductIds,
        },
        mostPopularSection: {
          ...defaultSettings.homepage.mostPopularSection,
          ...(remote?.homepage?.mostPopularSection || {}),
          featuredProductIds: Array.isArray(remote?.homepage?.mostPopularSection?.featuredProductIds)
            ? remote.homepage.mostPopularSection.featuredProductIds.map((value: unknown) => String(value))
            : defaultSettings.homepage.mostPopularSection.featuredProductIds,
        },
        campaignSection: {
          ...defaultSettings.homepage.campaignSection,
          ...(remote?.homepage?.campaignSection || {}),
          featuredProductIds: Array.isArray(remote?.homepage?.campaignSection?.featuredProductIds)
            ? remote.homepage.campaignSection.featuredProductIds.map((value: unknown) => String(value))
            : defaultSettings.homepage.campaignSection.featuredProductIds,
        },
        allProductsSection: {
          ...defaultSettings.homepage.allProductsSection,
          ...(remote?.homepage?.allProductsSection || {}),
        },
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
      seo: {
        ...defaultSettings.seo,
        ...(remote?.seo || {}),
        homepage: {
          ...defaultSettings.seo.homepage,
          ...(remote?.seo?.homepage || {}),
        },
        blog: {
          ...defaultSettings.seo.blog,
          ...(remote?.seo?.blog || {}),
        },
      },
    };
  } catch (error) {
    console.error('Settings fetch error:', error);
    return defaultSettings;
  }
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  const res = await safeFetchApi('/settings/site', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || payload?.message || 'Failed to update site settings');
  }
}
