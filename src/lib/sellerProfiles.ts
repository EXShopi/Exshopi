export type SellerProfile = {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  since: string;
  rating: number;
  reviewCount: number;
  positiveRate: number;
  onTimeDelivery: number;
  avatar: string;
  cover: string;
  categories: string[];
  verifiedLabel: string;
};

export function normalizeSellerSlug(name: string) {
  return (name || "seller")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const sellerProfiles: Record<string, SellerProfile> = {
  exshopi: {
    slug: "exshopi",
    name: "ExShopi Official",
    tagline: "Official marketplace collection",
    bio: "ExShopi Official curates verified electronics, accessories, and premium marketplace picks with UAE-focused delivery, support, and warranty standards.",
    since: "2018",
    rating: 4.9,
    reviewCount: 2340,
    positiveRate: 98,
    onTimeDelivery: 99,
    avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=300&q=80",
    cover: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80",
    categories: ["Electronics", "Mobiles", "Accessories", "Home Tech"],
    verifiedLabel: "Official Marketplace Seller",
  },
};

export function getSellerProfile(name: string): SellerProfile {
  const slug = normalizeSellerSlug(name);
  return (
    sellerProfiles[slug] || {
      slug,
      name,
      tagline: "Trusted marketplace seller",
      bio: `${name} is a trusted seller on ExShopi, offering curated marketplace products with support for secure checkout, UAE delivery, and verified order handling.`,
      since: "2021",
      rating: 4.7,
      reviewCount: 640,
      positiveRate: 96,
      onTimeDelivery: 97,
      avatar: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=300&q=80",
      cover: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
      categories: ["Electronics", "Accessories"],
      verifiedLabel: "Verified Seller",
    }
  );
}
