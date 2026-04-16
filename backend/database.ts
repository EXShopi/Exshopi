import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');

// Database Schema Types
export type UserRole = 'customer' | 'seller' | 'admin' | 'super_admin' | 'finance_manager' | 'support_agent';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type SellerApplicationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_more_info';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  country?: string;
  emailVerified?: boolean;
  sellerApplicationStatus?: SellerApplicationStatus | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  description: string;
  logo: string;
  banner: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  warehouseAddress?: string;
  vatTrn?: string;
  supportInfo?: string;
  policies?: Record<string, string>;
  socialLinks?: Record<string, string>;
  bankAccount: string;
  bankName: string;
  accountHolder: string;
  iban?: string;
  commissionRate: number; // 6% for all sellers
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  status: 'active' | 'suspended' | 'pending' | 'pending_review' | 'rejected' | 'needs_more_info';
  isOfficial?: boolean;
  monthlyFeeAed?: number;
  subscriptionStatus?: 'active' | 'pending' | 'unpaid' | 'cancelled';
  statusHistory?: { id?: string; status: string; reason?: string; updatedAt?: string; updatedBy?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SellerApplication {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  country: string;
  city: string;
  warehouseAddress?: string;
  vatTrn?: string;
  monthlyFeeAed: number;
  commissionRate: number;
  documents: string[];
  logo?: string;
  banner?: string;
  about?: string;
  policies?: Record<string, string>;
  bankDetails?: Record<string, string>;
  status: SellerApplicationStatus;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorRole: UserRole | 'system';
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  role?: UserRole | 'guest';
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MarketplaceSettings {
  sellerCommissionPercent: number;
  monthlySellerFeeAed: number;
  defaultCountry: string;
  lowStockThreshold: number;
  maintenanceMode: boolean;
  countries: {
    code: string;
    name: string;
    currency: string;
    vatPercent: number;
    deliveryBaseAed: number;
    codEnabled: boolean;
  }[];
}

export interface Product {
  id: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  sellerId: string;
  storeId?: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  salePrice?: number;
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviews: number;
  sku: string;
  brand?: string;
  specs: Record<string, any>;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'live';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  productStatus?: 'draft' | 'pending_approval' | 'live' | 'rejected' | 'archived' | 'out_of_stock';
  visibilityStatus?: 'hidden' | 'live' | 'archived';
  ownership?: 'seller' | 'official';
  createdByRole?: 'seller' | 'admin';
  approvalNotes?: string;
  rejectionReason?: string;
  approvalRequestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  views?: number;
  wishlistCount?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  cta?: string;
  link?: string;
  color?: string;
  badge?: string;
  order: number;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

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
    sections: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      show: boolean;
      order: number;
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

export interface Review {
  id: string;
  productId: string;
  vendorId: string;
  orderId?: string;
  orderItemId?: string;
  verifiedPurchase?: boolean;
  customerId?: string;
  customerName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  vatAmount: number;
  commission: number;
  sellerAmount: number;
  sku?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderId: string; // Readable order number
  customerId: string;
  sellerId: string;
  productId: string;
  items?: OrderLineItem[];
  products?: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
    sku?: string;
  }>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commission: number; // 6% of subtotal
  sellerAmount: number; // subtotal - commission
  vatAmount?: number;
  totalAmount?: number;
  shippingCost: number;
  shippingAddress: any;
  paymentMethod?: 'cod' | 'card' | 'tabby' | 'tamara' | 'bank_transfer';
  paymentProvider?: 'cod' | 'stripe' | 'tabby' | 'tamara' | 'bank_transfer';
  deliveryCountry?: string;
  deliveryEta?: string;
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';
  refundReason?: string;
  refundAmount?: number;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  packedAt?: string;
  dispatchRequestedAt?: string;
  handedToCourierAt?: string;
  deliveredAt?: string;
  trackingCode: string;
  pickupQrCode: string;
  status:
    | 'placed'
    | 'pending_confirmation'
    | 'confirmed'
    | 'preparing'
    | 'packed'
    | 'ready_for_pickup'
    | 'waiting_for_pickup'
    | 'pickup_scheduled'
    | 'picked_up'
    | 'handed_to_partner'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'return_requested'
    | 'return_approved'
    | 'returned'
    | 'refund_review'
    | 'refunded'
    | 'failed';
  paymentStatus: 'pending' | 'awaiting_payment' | 'cod_pending' | 'completed' | 'paid' | 'failed';
  paymentReference?: string;
  paymentSessionId?: string;
  paidAt?: string;
  payoutStatus: 'pending' | 'processed' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  weekStart: string;
  weekEnd: string;
  totalOrders: number;
  grossSales: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'processed' | 'paid';
  paidAt?: string;
  bankTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  bankDetails?: any;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: string;
  timestamp: string;
  notes: string;
  location?: string;
}

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderRole: UserRole | 'system';
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  createdById: string;
  createdByRole: UserRole;
  sellerId?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  payoutRequestId?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'pending' | 'waiting_for_user' | 'resolved' | 'escalated';
  assignedTo?: string;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  arabicName: string;
  slug: string;
  icon: string;
  specs: Record<string, string[]>; // Category-specific spec options
  subcategories: { name: string; arabicName: string; slug: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    introText?: string;
  };
  active?: boolean;
  comingSoonMessage?: string;
  bannerImage?: string;
  interestCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Translation {
  key: string;
  en: string;
  ar: string;
  ur?: string;
  hi?: string;
  fr?: string;
  de?: string;
}

interface DatabaseSchema {
  users: User[];
  sellers: Seller[];
  sellerApplications: SellerApplication[];
  products: Product[];
  banners: Banner[];
  reviews: Review[];
  orders: Order[];
  payouts: Payout[];
  payoutRequests: PayoutRequest[];
  supportTickets: SupportTicket[];
  trackingEvents: TrackingEvent[];
  categories: Category[];
  translations: Translation[];
  activityLogs: ActivityLog[];
  analyticsEvents: AnalyticsEvent[];
  marketplaceSettings: MarketplaceSettings;
  siteSettings: SiteSettings;
}

// Initialize database
function initializeDatabase(): DatabaseSchema {
  const defaultDb: DatabaseSchema = {
    users: [],
    sellers: [],
    sellerApplications: [],
    products: [],
    banners: [],
    reviews: [],
    orders: [],
    payouts: [],
    payoutRequests: [],
    supportTickets: [],
    trackingEvents: [],
    categories: defaultCategories(),
    translations: defaultTranslations(),
    activityLogs: [],
    analyticsEvents: [],
    marketplaceSettings: defaultMarketplaceSettings(),
    siteSettings: defaultSiteSettings(),
  };
  return defaultDb;
}

function defaultSiteSettings(): SiteSettings {
  return {
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
        productImageUrl: '/hero/hero-5.png',
      },
      sections: [
        { id: 'featured-products', title: 'Featured Products', subtitle: 'Curated marketplace picks', type: 'products', show: true, order: 1 },
        { id: 'brands', title: 'Popular Brands', subtitle: 'Trusted marketplace names', type: 'brands', show: true, order: 2 },
        { id: 'most-popular', title: 'Most popular this month', subtitle: 'Products with strong shopper momentum', type: 'products', show: true, order: 3 },
        { id: 'flash-deals', title: 'Eid Offers', subtitle: 'Seasonal marketplace deals and campaign picks', type: 'campaign', show: true, order: 4 },
        { id: 'promo', title: 'Marketplace Offers', subtitle: 'Curated promos and feature callouts', type: 'promo', show: true, order: 5 },
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
}

function defaultMarketplaceSettings(): MarketplaceSettings {
  return {
    sellerCommissionPercent: 6,
    monthlySellerFeeAed: 99,
    defaultCountry: 'AE',
    lowStockThreshold: 5,
    maintenanceMode: false,
    countries: [
      { code: 'AE', name: 'United Arab Emirates', currency: 'AED', vatPercent: 5, deliveryBaseAed: 10, codEnabled: true },
      { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', vatPercent: 15, deliveryBaseAed: 100, codEnabled: true },
      { code: 'KW', name: 'Kuwait', currency: 'KWD', vatPercent: 0, deliveryBaseAed: 100, codEnabled: true },
      { code: 'QA', name: 'Qatar', currency: 'QAR', vatPercent: 0, deliveryBaseAed: 100, codEnabled: true },
      { code: 'BH', name: 'Bahrain', currency: 'BHD', vatPercent: 10, deliveryBaseAed: 100, codEnabled: true },
      { code: 'OM', name: 'Oman', currency: 'OMR', vatPercent: 5, deliveryBaseAed: 100, codEnabled: true },
    ],
  };
}

function defaultCategories(): Category[] {
  return [
    {
      id: 'cat1',
      name: 'Electronics',
      arabicName: 'إلكترونيات',
      slug: 'electronics',
      icon: 'Smartphone',
      specs: {
        'Mobiles': ['brand', 'model', 'storage', 'ram', 'screen_size', 'camera', 'battery', 'sim_type', 'color', 'version'],
        'Laptops': ['brand', 'model', 'processor', 'ram', 'storage', 'screen_size', 'graphics', 'os', 'condition', 'warranty'],
        'Tablets': ['brand', 'model', 'storage', 'ram', 'screen_size', 'processor', 'os'],
      },
      seo: {
        metaTitle: 'Buy Electronics in UAE | Best Prices | ExShopi',
        metaDescription: 'Shop mobiles, laptops, tablets, and more electronics in UAE with premium marketplace listings and trusted product details.',
        keywords: 'electronics UAE, mobiles Dubai, laptops UAE, ExShopi electronics',
        introText: 'Explore electronics on ExShopi with structured specifications, trusted offers, and marketplace-ready detail pages built for UAE shoppers.',
      },
      subcategories: [
        { name: 'Mobiles', arabicName: 'موبايلات', slug: 'mobiles' },
        { name: 'Laptops', arabicName: 'لابتوبات', slug: 'laptops' },
        { name: 'Tablets', arabicName: 'تابلت', slug: 'tablets' },
      ],
    },
    {
      id: 'cat2',
      name: 'Fashion',
      arabicName: 'الأزياء',
      slug: 'fashion',
      icon: 'ShoppingBag',
      specs: {
        'Shirts': ['brand', 'gender', 'size', 'color', 'fabric_type', 'sleeve_type', 'fit', 'pattern', 'care_instructions'],
        'Pants': ['brand', 'gender', 'size', 'color', 'fit', 'material', 'style'],
      },
      seo: {
        metaTitle: 'Buy Fashion in UAE | Best Prices | ExShopi',
        metaDescription: 'Shop fashion, footwear, and wardrobe essentials in UAE with premium marketplace listings on ExShopi.',
        keywords: 'fashion UAE, clothing Dubai, shoes UAE, ExShopi fashion',
        introText: 'Discover fashion categories with cleaner content, stronger search visibility, and premium category presentation for UAE shoppers.',
      },
      subcategories: [
        { name: 'Shirts', arabicName: 'قمصان', slug: 'shirts' },
        { name: 'Pants', arabicName: 'بنطلونات', slug: 'pants' },
        { name: 'Dresses', arabicName: 'فساتين', slug: 'dresses' },
      ],
    },
    {
      id: 'cat3',
      name: 'Home & Kitchen',
      arabicName: 'المنزل والمطبخ',
      slug: 'home-kitchen',
      icon: 'Home',
      specs: {
        'Kitchen Appliances': ['brand', 'type', 'capacity', 'material', 'color', 'warranty', 'energy_rating'],
        'Furniture': ['type', 'material', 'color', 'dimensions', 'style', 'assembly_required'],
      },
      seo: {
        metaTitle: 'Buy Home and Kitchen in UAE | Best Prices | ExShopi',
        metaDescription: 'Shop home and kitchen products in UAE with curated marketplace listings, trusted details, and premium product discovery.',
        keywords: 'home and kitchen UAE, furniture Dubai, kitchen appliances UAE, ExShopi',
        introText: 'Browse home and kitchen products with structured details, buyer-friendly category intros, and SEO-ready content for the ExShopi marketplace.',
      },
      subcategories: [
        { name: 'Kitchen Appliances', arabicName: 'أجهزة المطبخ', slug: 'kitchen-appliances' },
        { name: 'Furniture', arabicName: 'أثاث', slug: 'furniture' },
      ],
    },
  ];
}

function defaultTranslations(): Translation[] {
  return [
    // Navigation
    { key: 'nav.home', en: 'Home', ar: 'الرئيسية' },
    { key: 'nav.products', en: 'Products', ar: 'المنتجات' },
    { key: 'nav.sellers', en: 'Sellers', ar: 'البائعون' },
    { key: 'nav.cart', en: 'Cart', ar: 'السلة' },
    { key: 'nav.account', en: 'Account', ar: 'الحساب' },
    
    // Buttons
    { key: 'btn.add_to_cart', en: 'Add to Cart', ar: 'أضف إلى السلة' },
    { key: 'btn.buy_now', en: 'Buy Now', ar: 'اشترِ الآن' },
    { key: 'btn.approve', en: 'Approve', ar: 'وافق' },
    { key: 'btn.reject', en: 'Reject', ar: 'رفض' },
    { key: 'btn.edit', en: 'Edit', ar: 'تعديل' },
    { key: 'btn.delete', en: 'Delete', ar: 'حذف' },
    { key: 'btn.save', en: 'Save', ar: 'حفظ' },
    { key: 'btn.cancel', en: 'Cancel', ar: 'إلغاء' },
    
    // Common labels
    { key: 'label.seller', en: 'Seller', ar: 'البائع' },
    { key: 'label.price', en: 'Price', ar: 'السعر' },
    { key: 'label.status', en: 'Status', ar: 'الحالة' },
    { key: 'label.order_id', en: 'Order ID', ar: 'رقم الطلب' },
    { key: 'label.tracking', en: 'Tracking', ar: 'التتبع' },
    { key: 'label.commission', en: 'Commission', ar: 'العمولة' },
    { key: 'label.payout', en: 'Payout', ar: 'الدفع' },
  ];
}

// Database Operations
export class Database {
private data!: DatabaseSchema;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = this.normalizeDatabase(JSON.parse(content));
      } else {
        this.data = this.normalizeDatabase(initializeDatabase());
        this.save();
      }
    } catch (error) {
      console.error('Database load error:', error);
      this.data = this.normalizeDatabase(initializeDatabase());
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  private slugifyStoreName(value: string): string {
    const base = String(value || 'store')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || `store-${Date.now()}`;
  }

  private generateUniqueStoreSlug(value: string, excludeSellerId?: string): string {
    const base = this.slugifyStoreName(value);
    let candidate = base;
    let index = 1;

    while (
      this.data.sellers.some(
        (seller) => seller.storeSlug === candidate && seller.id !== excludeSellerId
      )
    ) {
      candidate = `${base}-${index++}`;
    }

    return candidate;
  }

  private normalizeDatabase(raw: Partial<DatabaseSchema>): DatabaseSchema {
    const defaults = initializeDatabase();
    const merged: DatabaseSchema = {
      ...defaults,
      ...raw,
      users: (raw.users || []).map((user) => ({
        ...user,
        role: (user.role || 'customer') as UserRole,
        status: user.status || 'active',
        sellerApplicationStatus: user.sellerApplicationStatus || null,
        emailVerified: user.emailVerified ?? true,
      })),
      sellers: (raw.sellers || []).map((seller) => ({
        ...seller,
        status: seller.status || 'pending_review',
        monthlyFeeAed: seller.monthlyFeeAed ?? defaults.marketplaceSettings.monthlySellerFeeAed,
        subscriptionStatus: seller.subscriptionStatus || 'pending',
        isOfficial: seller.isOfficial ?? false,
        website: seller.website || '',
        warehouseAddress: seller.warehouseAddress || '',
        vatTrn: seller.vatTrn || '',
        supportInfo: seller.supportInfo || '',
        policies: seller.policies || {},
        socialLinks: seller.socialLinks || {},
        iban: seller.iban || '',
      })),
      sellerApplications: raw.sellerApplications || [],
      activityLogs: raw.activityLogs || [],
      analyticsEvents: raw.analyticsEvents || [],
      banners: (raw.banners || []).map((banner) => ({
        ...banner,
        clicks: banner.clicks ?? 0,
      })),
      orders: (raw.orders || []).map((order) => ({
        ...order,
        customerPhone: order.customerPhone || '',
        quantity: Number(order.quantity || 1),
        unitPrice: Number(order.unitPrice || 0),
        subtotal: Number(order.subtotal || 0),
        commission: Number(order.commission || 0),
        sellerAmount: Number(order.sellerAmount || 0),
        totalAmount: Number(order.totalAmount || 0),
        refundAmount: Number(order.refundAmount || 0),
        refundStatus: order.refundStatus || 'none',
        refundReason: order.refundReason || '',
        dispatchSlotDate: order.dispatchSlotDate || '',
        dispatchSlotWindow: order.dispatchSlotWindow || '',
        dispatchNotes: order.dispatchNotes || '',
        courierPartner: order.courierPartner || '',
        items: Array.isArray(order.items) && order.items.length
          ? order.items.map((item) => ({
              ...item,
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
              subtotal: Number(item.subtotal || 0),
              vatAmount: Number(item.vatAmount || 0),
              commission: Number(item.commission || 0),
              sellerAmount: Number(item.sellerAmount || 0),
            }))
          : [
              {
                id: `item_${order.id || order.orderId || Date.now()}`,
                productId: order.productId,
                title: order.productId || 'Marketplace Product',
                quantity: Number(order.quantity || 1),
                unitPrice: Number(order.unitPrice || 0),
                subtotal: Number(order.subtotal || 0),
                vatAmount: Number(order.vatAmount || 0),
                commission: Number(order.commission || 0),
                sellerAmount: Number(order.sellerAmount || 0),
              },
            ],
      })),
      supportTickets: (raw.supportTickets || []).map((ticket) => ({
        ...ticket,
        messages: Array.isArray(ticket.messages) ? ticket.messages : [],
      })),
      products: (raw.products || []).map((product) => ({
        ...product,
        storeId: product.storeId || product.sellerId,
        salePrice: product.salePrice ?? product.price ?? 0,
      price: Number(product.price || 0),
      originalPrice: Number(product.originalPrice || product.price || 0),
      stock: Number(product.stock || 0),
      slug: product.slug || '',
      rating: Number(product.rating || 0),
        reviews: Number(product.reviews || 0),
        approvalStatus:
          product.approvalStatus ||
          (product.status === 'rejected' ? 'rejected' : product.status === 'live' || product.status === 'approved' ? 'approved' : 'pending'),
        productStatus:
          product.productStatus ||
          (product.status === 'rejected'
            ? 'rejected'
            : product.status === 'live' || product.status === 'approved'
            ? 'live'
            : product.stock === 0
            ? 'out_of_stock'
            : 'pending_approval'),
        visibilityStatus:
          product.visibilityStatus ||
          (product.status === 'live' || product.status === 'approved' ? 'live' : product.status === 'rejected' ? 'hidden' : 'hidden'),
        ownership: product.ownership || (product.sellerId === 'exshopi_official' ? 'official' : 'seller'),
        createdByRole: product.createdByRole || (product.sellerId === 'exshopi_official' ? 'admin' : 'seller'),
        approvalRequestedAt: product.approvalRequestedAt || product.createdAt,
        approvedAt: product.approvedAt || '',
        rejectedAt: product.rejectedAt || '',
        views: Number(product.views || 0),
        wishlistCount: Number(product.wishlistCount || 0),
        brand: product.brand || product.specs?.attributes?.brand || '',
      })),
      marketplaceSettings: {
        ...defaults.marketplaceSettings,
        ...(raw.marketplaceSettings || {}),
        countries: raw.marketplaceSettings?.countries || defaults.marketplaceSettings.countries,
      },
      siteSettings: raw.siteSettings || defaults.siteSettings,
    };

    this.seedCoreRecords(merged);
    return merged;
  }

  private seedCoreRecords(data: DatabaseSchema): void {
    const adminEmail = 'ahsansajid295@gmail.com';
    let admin = data.users.find((user) => user.email === adminEmail);
    if (!admin) {
      admin = {
        id: 'user_super_admin',
        name: 'ExShopi Admin',
        email: adminEmail,
        password: 'T7&fD!2q',
        phone: '+971522608063',
        role: 'super_admin',
        status: 'active',
        country: 'AE',
        emailVerified: true,
        sellerApplicationStatus: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.users.push(admin);
    }

    const officialUserId = 'user_exshopi_official';
    if (!data.users.find((user) => user.id === officialUserId)) {
      data.users.push({
        id: officialUserId,
        name: 'ExShopi Official',
        email: 'official@exshopi.com',
        password: 'exshopi-official',
        phone: '+971522608063',
        role: 'admin',
        status: 'active',
        country: 'AE',
        emailVerified: true,
        sellerApplicationStatus: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (!data.sellers.find((seller) => seller.id === 'exshopi_official')) {
      data.sellers.push({
        id: 'exshopi_official',
        userId: officialUserId,
        storeName: 'ExShopi Official',
        storeSlug: 'exshopi-official',
        description: 'Official ExShopi storefront for first-party marketplace products and curated launches.',
        logo: '/logo.png',
        banner: '/hero/hero-5.png',
        city: 'Dubai',
        country: 'UAE',
        phone: '+971522608063',
        email: 'exshopi@exshopi.com',
        bankAccount: '',
        bankName: '',
        accountHolder: 'ExShopi Official',
        commissionRate: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalSales: 0,
        status: 'active',
        isOfficial: true,
        monthlyFeeAed: 0,
        subscriptionStatus: 'active',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // User operations
  listUsers(): User[] {
    return this.data.users;
  }

  getAllUsers(): User[] {
    return this.listUsers();
  }

  getUser(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return this.data.users.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      email: String(user.email || '').trim().toLowerCase(),
      role: (user.role || 'customer') as UserRole,
      status: user.status || 'active',
      emailVerified: user.emailVerified ?? true,
      sellerApplicationStatus: user.sellerApplicationStatus || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.recordActivity({
      actorId: newUser.id,
      actorRole: newUser.role,
      entityType: 'user',
      entityId: newUser.id,
      action: 'created',
      summary: `User ${newUser.email} registered as ${newUser.role}`,
    });
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return user;
  }

  // Seller application operations
  createSellerApplication(application: Omit<SellerApplication, 'id' | 'createdAt' | 'updatedAt'>): SellerApplication {
    const newApplication: SellerApplication = {
      ...application,
      id: `seller_app_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.sellerApplications.push(newApplication);
    this.updateUser(application.userId, {
      role: 'seller',
      status: 'pending',
      sellerApplicationStatus: newApplication.status,
    });
    this.recordActivity({
      actorId: application.userId,
      actorRole: 'seller',
      entityType: 'seller_application',
      entityId: newApplication.id,
      action: 'submitted',
      summary: `Seller application submitted for ${application.businessName}`,
    });
    this.save();
    return newApplication;
  }

  getSellerApplication(id: string): SellerApplication | undefined {
    return this.data.sellerApplications.find((application) => application.id === id);
  }

  getSellerApplicationByUserId(userId: string): SellerApplication | undefined {
    return this.data.sellerApplications.find((application) => application.userId === userId);
  }

  getSellerApplications(): SellerApplication[] {
    return [...this.data.sellerApplications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateSellerApplication(id: string, updates: Partial<SellerApplication>): SellerApplication | undefined {
    const application = this.getSellerApplication(id);
    if (!application) return undefined;
    Object.assign(application, updates, { updatedAt: new Date().toISOString() });
    if (updates.status) {
      this.updateUser(application.userId, {
        sellerApplicationStatus: updates.status,
        status: updates.status === 'approved' ? 'active' : updates.status === 'pending_review' ? 'pending' : application.status === 'rejected' ? 'suspended' : 'pending',
      });
    }
    this.recordActivity({
      actorId: updates.reviewedBy || application.userId,
      actorRole: updates.reviewedBy ? 'admin' : 'seller',
      entityType: 'seller_application',
      entityId: application.id,
      action: updates.status ? `status_${updates.status}` : 'updated',
      summary: `Seller application ${application.businessName} updated${updates.status ? ` to ${updates.status}` : ''}`,
    });
    this.save();
    return application;
  }

  // Seller operations
  getSeller(id: string): Seller | undefined {
    return this.data.sellers.find(s => s.id === id);
  }

  getSellerBySlug(storeSlug: string): Seller | undefined {
    return this.data.sellers.find((seller) => seller.storeSlug === storeSlug);
  }

  getSellerByUserId(userId: string): Seller | undefined {
    return this.data.sellers.find(s => s.userId === userId);
  }

  createSeller(seller: Omit<Seller, 'id' | 'createdAt' | 'updatedAt'>): Seller {
    const newSeller: Seller = {
      ...seller,
      id: `seller_${Date.now()}`,
      storeSlug: this.generateUniqueStoreSlug(seller.storeSlug || seller.storeName),
      monthlyFeeAed: seller.monthlyFeeAed ?? this.data.marketplaceSettings.monthlySellerFeeAed,
      subscriptionStatus: seller.subscriptionStatus || 'pending',
      isOfficial: seller.isOfficial ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.sellers.push(newSeller);
    this.recordActivity({
      actorId: newSeller.userId,
      actorRole: 'seller',
      entityType: 'seller',
      entityId: newSeller.id,
      action: 'created',
      summary: `Store ${newSeller.storeName} created`,
    });
    this.save();
    return newSeller;
  }

  getAllSellers(): Seller[] {
    return this.data.sellers;
  }

  updateSeller(id: string, updates: Partial<Seller>): Seller | undefined {
    const seller = this.data.sellers.find(s => s.id === id);
    if (seller) {
      // If status is changing, append to statusHistory for audit
      if (updates.status && updates.status !== seller.status) {
        seller.statusHistory = seller.statusHistory || [];
        seller.statusHistory.unshift({
          id: `hist_${Date.now()}`,
          status: updates.status as string,
          reason: (updates as any).rejectionReason || '',
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
        });
      }
      const nextSlug = updates.storeSlug || (updates.storeName ? this.generateUniqueStoreSlug(updates.storeName, id) : seller.storeSlug);
      Object.assign(seller, updates, { storeSlug: nextSlug, updatedAt: new Date().toISOString() });
      this.save();
    }
    return seller;
  }

  ensureSellerFromApplication(applicationId: string, reviewedBy = 'system'): Seller | undefined {
    const application = this.getSellerApplication(applicationId);
    if (!application) return undefined;

    let existing = this.getSellerByUserId(application.userId);
    if (existing) {
      return existing;
    }

    existing = this.createSeller({
      userId: application.userId,
      storeName: application.businessName,
      storeSlug: application.businessName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
      description: application.about || application.businessName,
      logo: application.logo || '',
      banner: application.banner || '',
      city: application.city,
      country: application.country,
      phone: application.phone,
      email: application.email,
      website: '',
      warehouseAddress: application.warehouseAddress || '',
      vatTrn: application.vatTrn || '',
      supportInfo: application.policies?.supportInfo || '',
      policies: application.policies || {},
      socialLinks: {},
      bankAccount: application.bankDetails?.accountNumber || '',
      bankName: application.bankDetails?.bankName || '',
      accountHolder: application.bankDetails?.accountHolder || application.ownerName,
      iban: application.bankDetails?.iban || '',
      commissionRate: application.commissionRate,
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0,
      status: 'active',
      isOfficial: false,
      monthlyFeeAed: application.monthlyFeeAed,
      subscriptionStatus: 'active',
      statusHistory: [{
        id: `hist_${Date.now()}`,
        status: 'active',
        reason: 'Application approved',
        updatedAt: new Date().toISOString(),
        updatedBy: reviewedBy,
      }],
    });

    this.recordActivity({
      actorId: reviewedBy,
      actorRole: 'admin',
      entityType: 'seller',
      entityId: existing.id,
      action: 'approved_from_application',
      summary: `Seller ${existing.storeName} activated from application ${application.id}`,
    });
    return existing;
  }

  getMarketplaceSettings(): MarketplaceSettings {
    return this.data.marketplaceSettings;
  }

  updateMarketplaceSettings(settings: Partial<MarketplaceSettings>): MarketplaceSettings {
    this.data.marketplaceSettings = {
      ...this.data.marketplaceSettings,
      ...settings,
      countries: settings.countries || this.data.marketplaceSettings.countries,
    };
    this.save();
    return this.data.marketplaceSettings;
  }

  getSiteSettings(): SiteSettings {
    return this.data.siteSettings;
  }

  updateSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
    this.data.siteSettings = {
      ...this.data.siteSettings,
      ...settings,
      general: {
        ...this.data.siteSettings.general,
        ...(settings.general || {}),
      },
      branding: {
        ...this.data.siteSettings.branding,
        ...(settings.branding || {}),
      },
      homepage: {
        ...this.data.siteSettings.homepage,
        ...(settings.homepage || {}),
        hero: {
          ...this.data.siteSettings.homepage.hero,
          ...(settings.homepage?.hero || {}),
        },
        videoSection: {
          ...this.data.siteSettings.homepage.videoSection,
          ...(settings.homepage?.videoSection || {}),
        },
        trustBanner: {
          ...this.data.siteSettings.homepage.trustBanner,
          ...(settings.homepage?.trustBanner || {}),
        },
        sections: settings.homepage?.sections || this.data.siteSettings.homepage.sections,
      },
      header: {
        ...this.data.siteSettings.header,
        ...(settings.header || {}),
        announcementBar: {
          ...this.data.siteSettings.header.announcementBar,
          ...(settings.header?.announcementBar || {}),
        },
      },
      footer: {
        ...this.data.siteSettings.footer,
        ...(settings.footer || {}),
        socialLinks: {
          ...this.data.siteSettings.footer.socialLinks,
          ...(settings.footer?.socialLinks || {}),
        },
      },
      seo: {
        ...this.data.siteSettings.seo,
        ...(settings.seo || {}),
        homepage: {
          ...this.data.siteSettings.seo.homepage,
          ...(settings.seo?.homepage || {}),
        },
        blog: {
          ...this.data.siteSettings.seo.blog,
          ...(settings.seo?.blog || {}),
        },
      },
    };
    this.save();
    return this.data.siteSettings;
  }

  recordActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const log: ActivityLog = {
      ...entry,
      id: `activity_${Date.now()}_${Math.round(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(log);
    this.data.activityLogs = this.data.activityLogs.slice(0, 2000);
    return log;
  }

  getActivityLogs(): ActivityLog[] {
    return this.data.activityLogs;
  }

  createAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): AnalyticsEvent {
    const entry: AnalyticsEvent = {
      ...event,
      id: `analytics_${Date.now()}_${Math.round(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.analyticsEvents.unshift(entry);
    this.data.analyticsEvents = this.data.analyticsEvents.slice(0, 10000);
    this.save();
    return entry;
  }

  getAnalyticsEvents(): AnalyticsEvent[] {
    return this.data.analyticsEvents;
  }

  // Product operations
  getProduct(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  private isSoftDeletedProduct(product?: Product | null): boolean {
    if (!product) return false;
    return Boolean(product.isDeleted || product.deletedAt);
  }

  getProductsByStatus(status: string): Product[] {
    return this.data.products.filter(
      (p) =>
        !this.isSoftDeletedProduct(p) &&
        (
          p.status === status ||
          p.approvalStatus === status ||
          p.productStatus === status
        )
    );
  }

  getSellerProducts(sellerId: string): Product[] {
    return this.data.products.filter(p => p.sellerId === sellerId && !this.isSoftDeletedProduct(p));
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      slug: product.slug || `product-${Date.now()}`,
      storeId: product.storeId || product.sellerId,
      salePrice: product.salePrice ?? product.price,
      approvalStatus: product.approvalStatus || 'pending',
      productStatus: product.productStatus || (Number(product.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval'),
      visibilityStatus: product.visibilityStatus || 'hidden',
      ownership: product.ownership || (product.sellerId === 'exshopi_official' ? 'official' : 'seller'),
      createdByRole: product.createdByRole || (product.sellerId === 'exshopi_official' ? 'admin' : 'seller'),
      approvalRequestedAt: product.approvalRequestedAt || new Date().toISOString(),
      approvedAt: product.approvedAt || '',
      rejectedAt: product.rejectedAt || '',
      views: Number(product.views || 0),
      wishlistCount: Number(product.wishlistCount || 0),
      isDeleted: Boolean(product.isDeleted),
      deletedAt: product.deletedAt || '',
      brand: product.brand || product.specs?.attributes?.brand || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    const seller = this.getSeller(newProduct.sellerId);
    if (seller) {
      seller.totalProducts = this.getSellerProducts(seller.id).length;
      seller.updatedAt = new Date().toISOString();
    }
    this.recordActivity({
      actorId: newProduct.sellerId,
      actorRole: newProduct.createdByRole === 'admin' ? 'admin' : 'seller',
      entityType: 'product',
      entityId: newProduct.id,
      action: 'submitted',
      summary: `Product ${newProduct.title} submitted with ${newProduct.approvalStatus} approval status`,
    });
    this.save();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const product = this.data.products.find(p => p.id === id);
    if (product) {
      Object.assign(product, updates, { updatedAt: new Date().toISOString() });
      if (product.sellerId) {
        const seller = this.getSeller(product.sellerId);
        if (seller) {
          seller.totalProducts = this.getSellerProducts(seller.id).length;
          seller.updatedAt = new Date().toISOString();
        }
      }
      this.save();
    }
    return product;
  }

  // Banner operations
  getBanners(): Banner[] {
    return this.data.banners.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Review operations
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Review {
    const newReview: Review = {
      ...review,
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.reviews.push(newReview);

    // Update product aggregates if product exists
    const product = this.getProduct(review.productId);
    if (product) {
      const prevCount = product.reviews || 0;
      const prevRating = product.rating || 0;
      const newCount = prevCount + 1;
      const newAvg = ((prevRating * prevCount) + review.rating) / newCount;
      product.reviews = newCount;
      product.rating = Math.round(newAvg * 10) / 10;
    }

    this.save();
    return newReview;
  }

  hasCustomerReviewedOrderItem(customerId: string, orderId: string, productId: string): boolean {
    return this.data.reviews.some(
      (review) =>
        review.customerId === customerId &&
        review.orderId === orderId &&
        review.productId === productId
    );
  }

  getEligibleDeliveredOrderForReview(customerId: string, productId: string): Order | undefined {
    return this.data.orders.find((order) => {
      if (order.customerId !== customerId || order.status !== 'delivered') return false;
      const items = order.items || [];
      return items.some((item) => item.productId === productId);
    });
  }

  getReviewsByVendorId(vendorId: string): Review[] {
    return this.data.reviews.filter(r => r.vendorId === vendorId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReviewsByProductId(productId: string): Review[] {
    return this.data.reviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createBanner(banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Banner {
    const newB: Banner = {
      ...banner,
      id: `banner_${Date.now()}`,
      clicks: banner.clicks ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.banners.push(newB);
    this.save();
    return newB;
  }

  updateBanner(id: string, updates: Partial<Banner>): Banner | undefined {
    const banner = this.data.banners.find(b => b.id === id);
    if (banner) {
      Object.assign(banner, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return banner;
  }

  incrementBannerClicks(id: string): Banner | undefined {
    const banner = this.data.banners.find(b => b.id === id);
    if (banner) {
      banner.clicks = (banner.clicks || 0) + 1;
      banner.updatedAt = new Date().toISOString();
      this.save();
    }
    return banner;
  }

  deleteBanner(id: string): boolean {
    const idx = this.data.banners.findIndex(b => b.id === id);
    if (idx >= 0) {
      this.data.banners.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  getAllProducts(): Product[] {
    return this.data.products.filter(p => p.status === 'live' && !this.isSoftDeletedProduct(p));
  }

  getAllProductsForAdmin(): Product[] {
    return [...this.data.products];
  }

  deleteProduct(id: string): boolean {
    const product = this.data.products.find(p => p.id === id);
    if (product) {
      const deletedAt = new Date().toISOString();
      Object.assign(product, {
        isDeleted: true,
        deletedAt,
        status: 'draft',
        productStatus: 'archived',
        visibilityStatus: 'hidden',
        updatedAt: deletedAt,
      });
      this.save();
      return true;
    }
    return false;
  }

  // Order operations
  getOrder(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  getSellerOrders(sellerId: string): Order[] {
    return this.data.orders.filter(o => o.sellerId === sellerId);
  }

  getCustomerOrders(customerId: string): Order[] {
    return this.data.orders.filter(o => o.customerId === customerId);
  }

  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const newOrder: Order = {
      ...order,
      id: `ord_${Date.now()}`,
      items: (order.items || []).map((item, index) => ({
        ...item,
        id: item.id || `item_${Date.now()}_${index}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  updateOrder(orderId: string, updates: Partial<Order>): Order | undefined {
    const order = this.data.orders.find((entry) => entry.id === orderId);
    if (!order) return undefined;

    Object.assign(order, updates, {
      updatedAt: new Date().toISOString(),
    });

    this.save();
    return order;
  }

  updateOrderStatus(orderId: string, status: string): Order | undefined {
    const order = this.data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status as any;
      order.updatedAt = new Date().toISOString();
      if (status === 'packed') order.packedAt = new Date().toISOString();
      if (status === 'pickup_scheduled') order.dispatchRequestedAt = new Date().toISOString();
      if (status === 'handed_to_partner') order.handedToCourierAt = new Date().toISOString();
      if (status === 'delivered') {
        order.deliveredAt = new Date().toISOString();
        order.paymentStatus = order.paymentStatus === 'pending' ? 'completed' : order.paymentStatus;
      }
      this.addTrackingEvent(orderId, status, new Date().toISOString());
      this.save();
    }
    return order;
  }

  updateOrderDispatch(
    orderId: string,
    updates: {
      dispatchSlotDate?: string;
      dispatchSlotWindow?: string;
      dispatchNotes?: string;
      courierPartner?: string;
      status?: string;
    }
  ): Order | undefined {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return undefined;

    order.dispatchSlotDate = updates.dispatchSlotDate ?? order.dispatchSlotDate ?? '';
    order.dispatchSlotWindow = updates.dispatchSlotWindow ?? order.dispatchSlotWindow ?? '';
    order.dispatchNotes = updates.dispatchNotes ?? order.dispatchNotes ?? '';
    order.courierPartner = updates.courierPartner ?? order.courierPartner ?? '';
    order.updatedAt = new Date().toISOString();

    if (updates.status) {
      order.status = updates.status as any;
      if (updates.status === 'pickup_scheduled') {
        order.dispatchRequestedAt = new Date().toISOString();
      }
      this.addTrackingEvent(
        orderId,
        updates.status,
        new Date().toISOString(),
        `Dispatch scheduled for ${order.dispatchSlotDate || 'next available'} ${order.dispatchSlotWindow || ''}`.trim(),
        order.courierPartner || ''
      );
    }

    this.save();
    return order;
  }

  getAllOrders(): Order[] {
    return this.data.orders;
  }

  // Tracking operations
  addTrackingEvent(orderId: string, status: string, timestamp: string, notes = '', location = ''): void {
    this.data.trackingEvents.push({
      id: `track_${Date.now()}`,
      orderId,
      status,
      timestamp,
      notes,
      location,
    });
    this.save();
  }

  getOrderTracking(orderId: string): TrackingEvent[] {
    return this.data.trackingEvents.filter(t => t.orderId === orderId);
  }

  // Payout operations
  createPayout(payout: Omit<Payout, 'id' | 'createdAt' | 'updatedAt'>): Payout {
    const newPayout: Payout = {
      ...payout,
      id: `payout_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.payouts.push(newPayout);
    this.save();
    return newPayout;
  }

  getSellerPayouts(sellerId: string): Payout[] {
    return this.data.payouts.filter(p => p.sellerId === sellerId);
  }

  getAllPayouts(): Payout[] {
    return this.data.payouts;
  }

  getPayout(id: string): Payout | undefined {
    return this.data.payouts.find((p) => p.id === id);
  }

  updatePayout(id: string, updates: Partial<Payout>): Payout | undefined {
    const payout = this.getPayout(id);
    if (!payout) return undefined;
    Object.assign(payout, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return payout;
  }

  createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): SupportTicket {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.supportTickets.push(newTicket);
    this.recordActivity({
      actorId: ticket.createdById,
      actorRole: ticket.createdByRole,
      entityType: 'support_ticket',
      entityId: newTicket.id,
      action: 'created',
      summary: `Support ticket created: ${ticket.subject}`,
    });
    this.save();
    return newTicket;
  }

  getSupportTicket(id: string): SupportTicket | undefined {
    return this.data.supportTickets.find((ticket) => ticket.id === id);
  }

  getSupportTickets(): SupportTicket[] {
    return [...this.data.supportTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  updateSupportTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | undefined {
    const ticket = this.getSupportTicket(id);
    if (!ticket) return undefined;
    Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return ticket;
  }

  addSupportTicketMessage(
    ticketId: string,
    message: Omit<SupportTicketMessage, 'id' | 'createdAt'>
  ): SupportTicket | undefined {
    const ticket = this.getSupportTicket(ticketId);
    if (!ticket) return undefined;
    ticket.messages.push({
      ...message,
      id: `ticket_msg_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    ticket.updatedAt = new Date().toISOString();
    this.save();
    return ticket;
  }

  // Payout Request operations (manual requests by sellers)
  createPayoutRequest(req: Omit<PayoutRequest, 'id' | 'createdAt' | 'updatedAt'>): PayoutRequest {
    const newReq: PayoutRequest = {
      ...req,
      id: `preq_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.payoutRequests.push(newReq);
    this.save();
    return newReq;
  }

  getSellerPayoutRequests(sellerId: string): PayoutRequest[] {
    return this.data.payoutRequests.filter(p => p.sellerId === sellerId);
  }

  getAllPayoutRequests(): PayoutRequest[] {
    return this.data.payoutRequests;
  }

  updatePayoutRequest(id: string, updates: Partial<PayoutRequest>): PayoutRequest | undefined {
    const req = this.data.payoutRequests.find(p => p.id === id);
    if (!req) return undefined;
    Object.assign(req, updates, { updatedAt: new Date().toISOString() });
    // if marking as paid, set paidAt field in updates if provided
    this.save();
    return req;
  }

  // Translation operations
  getTranslations(): Translation[] {
    return this.data.translations;
  }

  getTranslation(key: string): Translation | undefined {
    return this.data.translations.find(t => t.key === key);
  }

  getCategories(): Category[] {
    return this.data.categories;
  }

  getCategory(id: string): Category | undefined {
    return this.data.categories.find(c => c.id === id);
  }

  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const newCat: Category = {
      ...category,
      id: `cat_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const cat = this.data.categories.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return cat;
  }

  deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.data.categories.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  getEligibleOrdersForPayout(sellerId: string, weekStart: Date, weekEnd: Date): Order[] {
    return this.data.orders.filter((order) => {
      const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
      return (
        order.sellerId === sellerId &&
        order.status === 'delivered' &&
        order.refundStatus !== 'refunded' &&
        order.refundStatus !== 'approved' &&
        order.payoutStatus === 'pending' &&
        !!deliveredAt &&
        deliveredAt >= weekStart &&
        deliveredAt <= weekEnd
      );
    });
  }

  calculateWeeklyPayouts(referenceDate = new Date()): Payout[] {
    const ref = new Date(referenceDate);
    const weekStart = new Date(ref);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(ref.getDate() - ref.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const createdPayouts: Payout[] = [];

    for (const seller of this.data.sellers) {
      const existingPayout = this.data.payouts.find(
        (payout) =>
          payout.sellerId === seller.id &&
          payout.weekStart === weekStart.toISOString() &&
          payout.weekEnd === weekEnd.toISOString()
      );
      if (existingPayout) continue;

      const weekOrders = this.getEligibleOrdersForPayout(seller.id, weekStart, weekEnd);
      if (!weekOrders.length) continue;

      const grossSales = weekOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
      const commission = weekOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0);
      const netAmount = Math.max(grossSales - commission, 0);

      const payout = this.createPayout({
        sellerId: seller.id,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalOrders: weekOrders.length,
        grossSales,
        commission,
        netAmount,
        status: 'pending',
      });

      weekOrders.forEach((order) => {
        order.payoutStatus = 'processed';
        order.updatedAt = new Date().toISOString();
      });

      createdPayouts.push(payout);
    }

    this.save();
    return createdPayouts;
  }
}

export const db = new Database(dbPath);
