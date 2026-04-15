export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  keywords: string[];
  publishedAt: string;
  category: string;
  content: string[];
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
};

import { getCategoryPath } from './seo';

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-laptops-uae",
    title: "Best Laptops in UAE: How to Choose the Right One in 2026",
    excerpt:
      "A buyer-first guide to choosing business, student, creator, and refurbished laptops in UAE without overspending.",
    metaDescription:
      "Learn how to choose the best laptops in UAE, compare refurbished and premium options, and shop smarter with trusted marketplace tips from ExShopi.",
    keywords: [
      "best laptops UAE",
      "refurbished laptops UAE",
      "used MacBook Dubai",
      "buy electronics UAE COD",
    ],
    publishedAt: "2026-04-12",
    category: "Buying Guide",
    content: [
      "Laptop buyers in UAE usually balance three things at once: budget, condition, and long-term reliability. That makes the market ideal for clear product specifications, verified seller information, and honest pricing. On ExShopi, the goal is to make those buying signals much easier to compare than in generic classifieds or scattered social listings.",
      "If you need a student or office machine, focus first on processor generation, RAM, SSD storage, and battery condition. For creative work, display size, color accuracy, graphics, and thermal performance matter more. Refurbished MacBook buyers in Dubai often get the best value by comparing year, chipset, storage tier, and cosmetic condition before looking at accessories or bundled offers.",
      "Shoppers searching for refurbished laptops UAE should also pay attention to delivery support, return clarity, and whether the product listing includes structured specifications. Clear specs are not just useful for buyers. They also help search engines understand the product, which improves discovery and makes the marketplace easier to trust.",
    ],
      relatedLinks: [
      { label: "Shop laptops", href: getCategoryPath('electronics', 'laptops') },
      { label: "Browse all products", href: "/products" },
    ],
  },
  {
    slug: "macbook-buying-guide",
    title: "MacBook Buying Guide for Dubai Shoppers: Used vs Refurbished",
    excerpt:
      "Understand the difference between used and refurbished MacBooks, what specs actually matter, and how to avoid bad listings.",
    metaDescription:
      "Compare used and refurbished MacBooks in Dubai, learn what specs matter most, and discover safer ways to shop premium Apple laptops on ExShopi.",
    keywords: [
      "used MacBook Dubai",
      "refurbished MacBook UAE",
      "cheap laptops Dubai",
      "Apple laptop UAE",
    ],
    publishedAt: "2026-04-12",
    category: "Apple Guide",
    content: [
      "A used MacBook can still be an excellent purchase in Dubai if the listing makes the right details visible. Buyers should always check model year, processor family, storage, RAM, battery health if available, and whether the machine comes with a genuine charger. Refurbished listings are usually more dependable when the seller provides clear condition notes and structured product specifications.",
      "The difference between used and refurbished is not only cosmetic. Refurbished machines are generally cleaned, tested, and listed with more confidence around components and seller policies. Used devices may still be a good deal, but the buyer has to work harder unless the marketplace standardizes the listing format. That is exactly why structured specifications matter on ExShopi.",
      "For search-driven shoppers looking for used MacBook Dubai or refurbished laptops UAE, strong metadata, clean product URLs, and related category links also make discovery easier. Better SEO and better product clarity often support the same outcome: higher trust and higher conversions.",
    ],
    relatedLinks: [
      { label: "See MacBook-ready laptop deals", href: getCategoryPath('electronics', 'laptops') },
      { label: "Read all ExShopi blog posts", href: "/blog" },
    ],
  },
];

export function getBlogPostBySlug(slug?: string) {
  return BLOG_POSTS.find((post) => post.slug === slug) || null;
}
