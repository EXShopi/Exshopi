import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import type {
  Banner,
  Category,
  MarketplaceSettings,
  Order,
  OrderLineItem,
  Payout,
  PayoutRequest,
  Product,
  Review,
  Seller,
  SellerApplication,
  SellerApplicationStatus,
  SiteSettings,
  SupportTicket,
  SupportTicketMessage,
  User,
  UserRole,
  UserStatus,
} from './database';
import { db } from './database';

const enabled =
  process.env.USE_PRISMA_RUNTIME === 'true' ||
  process.env.EXSHOPI_DB_MODE === 'prisma';

const toNumber = (value: any) => {
  if (value == null) return 0;
  const raw = typeof value === 'object' && typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
  return Number.isFinite(raw) ? raw : 0;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'store';

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const CORE_SUPER_ADMIN = {
  id: 'user_super_admin',
  name: 'ExShopi Admin',
  email: 'ahsansajid295@gmail.com',
  password: 'T7&fD!2q',
  phone: '+971522608063',
  role: 'super_admin' as UserRole,
  status: 'active' as UserStatus,
  country: 'AE',
  emailVerified: true,
};

const CORE_OFFICIAL_USER = {
  id: 'user_exshopi_official',
  name: 'ExShopi Official',
  email: 'official@exshopi.com',
  password: 'exshopi-official',
  phone: '+971522608063',
  role: 'admin' as UserRole,
  status: 'active' as UserStatus,
  country: 'AE',
  emailVerified: true,
};

const CORE_OFFICIAL_STORE_ID = 'exshopi_official';

async function hashSeedPasswordIfNeeded(password: string) {
  const value = String(password || '');
  if (!value) return value;

  const looksHashed =
    value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');

  return looksHashed ? value : bcrypt.hash(value, 12);
}

function mapUser(user: any): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.passwordHash,
    phone: user.phone || '',
    role: user.role as UserRole,
    status: user.status as UserStatus,
    country: user.country || 'AE',
    emailVerified: Boolean(user.emailVerified),
    sellerApplicationStatus: (user.sellerApplicationStatus || null) as SellerApplicationStatus | null,
    lastLoginAt: user.lastLoginAt?.toISOString?.() || user.lastLoginAt || undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapCategoryTree(categories: any[]): Category[] {
  const staticCategories = db.getCategories();
  const staticBySlug = new Map(staticCategories.map((category) => [category.slug, category]));
  const childrenByParent = new Map<string, any[]>();

  for (const category of categories) {
    if (!category.parentId) continue;
    const group = childrenByParent.get(category.parentId) || [];
    group.push(category);
    childrenByParent.set(category.parentId, group);
  }

  return categories
    .filter((category) => !category.parentId)
    .map((category) => {
      const staticCategory = staticBySlug.get(category.slug);
      const childCategories = (childrenByParent.get(category.id) || []).map((child) => {
        const staticChild = staticCategories
          .flatMap((entry) => entry.subcategories || [])
          .find((entry) => entry.slug === child.slug);

        return {
          name: child.name,
          arabicName: staticChild?.arabicName || child.name,
          slug: child.slug,
        };
      });

      return {
        id: category.id,
        name: category.name,
        arabicName: staticCategory?.arabicName || category.name,
        slug: category.slug,
        icon: staticCategory?.icon || 'LayoutGrid',
        specs: staticCategory?.specs || {},
        subcategories: childCategories,
        createdAt: category.createdAt?.toISOString?.() || category.createdAt || '',
        updatedAt: category.updatedAt?.toISOString?.() || category.updatedAt || '',
      };
    });
}

function mapSellerApplication(application: any): SellerApplication {
  return {
    id: application.id,
    userId: application.userId,
    businessName: application.businessName,
    ownerName: application.ownerName,
    email: application.user?.email || '',
    phone: application.user?.phone || '',
    businessType: 'company',
    country: application.country,
    city: application.city,
    warehouseAddress: application.warehouseAddress || '',
    vatTrn: application.vatTrn || '',
    monthlyFeeAed: 99,
    commissionRate: 6,
    documents: [],
    logo: '',
    banner: '',
    about: application.about || '',
    policies: {},
    bankDetails: {
      iban: application.iban || '',
      bankName: application.bankName || '',
      accountHolder: application.accountHolder || '',
    },
    status: application.status as SellerApplicationStatus,
    adminNotes: application.adminNotes || '',
    rejectionReason: application.rejectionReason || '',
    reviewedAt: application.reviewedAt?.toISOString?.() || application.reviewedAt || '',
    reviewedBy: application.reviewedBy || '',
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

function mapSeller(store: any): Seller {
  return {
    id: store.id,
    userId: store.sellerUserId,
    storeName: store.storeName,
    storeSlug: store.slug,
    description: store.description || '',
    logo: store.logoUrl || '',
    banner: store.bannerUrl || '',
    city: store.city || '',
    country: store.country || 'UAE',
    phone: store.supportPhone || store.sellerUser?.phone || '',
    email: store.email || store.supportEmail || store.sellerUser?.email || '',
    website: store.website || '',
    warehouseAddress: store.warehouseAddress || '',
    vatTrn: store.vatTrn || '',
    supportInfo: store.supportInfo || '',
    policies: (store.policiesJson as Record<string, string>) || {},
    socialLinks: (store.socialLinksJson as Record<string, string>) || {},
    bankAccount: store.bankAccount || '',
    bankName: store.bankName || '',
    accountHolder: store.accountHolder || '',
    iban: store.iban || '',
    commissionRate: 6,
    totalProducts: typeof store._count?.products === 'number' ? store._count.products : 0,
    totalOrders: typeof store._count?.orders === 'number' ? store._count.orders : 0,
    totalSales: toNumber(store.totalSales || 0),
    status: (store.status || 'active') as Seller['status'],
    isOfficial: Boolean(store.isOfficial),
    monthlyFeeAed: store.monthlyFeeAed || 99,
    subscriptionStatus: (store.subscriptionStatus || 'active') as Seller['subscriptionStatus'],
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

function mapProduct(product: any): Product {
  const images = Array.isArray(product.images) ? product.images : [];
  const orderedImages = images
    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((image: any) => image.imageUrl);
  const primaryImage =
    images.find((image: any) => image.isPrimary)?.imageUrl ||
    orderedImages[0] ||
    '';

  // Merge explicit DB slug fields into the specs object for compatibility
  const specs = (product.specsJson as Record<string, any>) || {};
  const deletionMeta = (specs.__deletion as Record<string, any>) || {};
  if (!specs.metaTitle && product.metaTitle) specs.metaTitle = product.metaTitle;
  if (!specs.metaDescription && product.metaDescription) specs.metaDescription = product.metaDescription;
  if (!specs.metaKeywords && product.metaKeywords) specs.metaKeywords = product.metaKeywords;
  if (!specs.canonicalUrl && product.canonicalUrl) specs.canonicalUrl = product.canonicalUrl;
  if (!specs.ogTitle && product.ogTitle) specs.ogTitle = product.ogTitle;
  if (!specs.ogDescription && product.ogDescription) specs.ogDescription = product.ogDescription;
  if (!specs.ogImage && product.ogImage) specs.ogImage = product.ogImage;
  if (!specs.parentCategorySlug && product.parentCategorySlug) specs.parentCategorySlug = product.parentCategorySlug;
  if (!specs.categorySlug && product.categorySlug) specs.categorySlug = product.categorySlug;
  if (!specs.subcategorySlug && product.subcategorySlug) specs.subcategorySlug = product.subcategorySlug;
  if (!specs.childCategorySlug && product.childCategorySlug) specs.childCategorySlug = product.childCategorySlug;
  if (!specs.categoryPath && product.categoryPathJson) specs.categoryPath = product.categoryPathJson;

  return {
    id: product.id,
    slug: product.slug || "",
    metaTitle: product.metaTitle || specs.metaTitle || "",
    metaDescription: product.metaDescription || specs.metaDescription || "",
    metaKeywords: product.metaKeywords || specs.metaKeywords || "",
    canonicalUrl: product.canonicalUrl || specs.canonicalUrl || "",
    ogTitle: product.ogTitle || specs.ogTitle || "",
    ogDescription: product.ogDescription || specs.ogDescription || "",
    ogImage: product.ogImage || specs.ogImage || "",
    sellerId: product.storeId,
    storeId: product.storeId,
    categoryId: product.categoryId,
    title: product.title,
    description: product.description || '',
    price: toNumber(product.price),
    originalPrice: toNumber(product.originalPrice || product.salePrice || product.price),
    salePrice: product.salePrice ? toNumber(product.salePrice) : undefined,
    image: primaryImage,
    images: orderedImages.slice(primaryImage ? 1 : 0),
    stock: product.stock,
    rating: Number(product.rating || 0),
    reviews: Number(product.reviewsCount || 0),
    sku: product.sku || '',
    brand: product.brand || '',
    specs,
    status:
      product.status === 'pending_approval'
        ? 'pending'
        : (product.status as Product['status']),
    approvalStatus: product.approvalStatus as Product['approvalStatus'],
    productStatus: product.status as Product['productStatus'],
    visibilityStatus: product.visibilityStatus as Product['visibilityStatus'],
    ownership: (product.ownership || 'seller') as Product['ownership'],
    createdByRole: (product.createdByRole || 'seller') as Product['createdByRole'],
    approvalNotes: product.approvalNotes || '',
    rejectionReason: product.rejectionReason || '',
    approvalRequestedAt: product.approvalRequestedAt?.toISOString?.() || product.approvalRequestedAt || '',
    approvedAt: product.approvedAt?.toISOString?.() || product.approvedAt || '',
    rejectedAt: product.rejectedAt?.toISOString?.() || product.rejectedAt || '',
    views: Number(product.views || 0),
    wishlistCount: Number(product.wishlistCount || 0),
    isDeleted: Boolean(deletionMeta.isDeleted),
    deletedAt: deletionMeta.deletedAt ? String(deletionMeta.deletedAt) : '',
    badges: Array.isArray(product.badgesJson) ? product.badgesJson : [],
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function withDeletionMeta(specs: Record<string, any> | undefined, nextMeta: Record<string, any>) {
  return {
    ...(specs || {}),
    __deletion: {
      ...(((specs || {}).__deletion as Record<string, any>) || {}),
      ...nextMeta,
    },
  };
}

function isSoftDeletedProduct(product: any) {
  const specs = (product?.specs || product?.specsJson || {}) as Record<string, any>;
  const deletionMeta = (specs.__deletion as Record<string, any>) || {};
  return Boolean(product?.isDeleted || product?.deletedAt || deletionMeta.isDeleted || deletionMeta.deletedAt);
}

function mapOrderItem(item: any): OrderLineItem {
  return {
    id: item.id,
    productId: item.productId,
    title: item.productTitle,
    quantity: Number(item.quantity || 1),
    unitPrice: toNumber(item.salePrice ?? item.unitPrice),
    subtotal: toNumber(item.lineTotal),
    vatAmount: toNumber(item.vatAmount),
    commission: toNumber(item.commissionAmount),
    sellerAmount: toNumber(item.sellerNetAmount),
    sku: item.sku || '',
    image: item.product?.images?.find((image: any) => image.isPrimary)?.imageUrl || item.product?.images?.[0]?.imageUrl || '',
  };
}

function mapOrder(order: any): Order {
  const items = Array.isArray(order.items) ? order.items.map(mapOrderItem) : [];
  return {
    id: order.id,
    orderId: order.orderNumber,
    customerId: order.customerId,
    sellerId: order.storeId,
    productId: items[0]?.productId || order.items?.[0]?.productId || '',
    items,
    products: items.map((item) => ({
      id: item.productId,
      title: item.title,
      quantity: item.quantity,
      price: item.unitPrice,
      image: item.image,
      sku: item.sku,
    })),
    customerName: order.customerName || '',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1,
    unitPrice: Number(items[0]?.unitPrice || 0),
    subtotal: toNumber(order.subtotal),
    commission: toNumber(order.commissionAmount),
    sellerAmount: toNumber(order.sellerAmount),
    vatAmount: toNumber(order.vatAmount),
    totalAmount: toNumber(order.totalAmount),
    shippingCost: toNumber(order.deliveryFee),
    shippingAddress:
      order.shippingAddressJson || {
        emirate: order.emirate || '',
        area: order.area || '',
        building: order.building || '',
        flat: order.flat || '',
        addressLine: order.addressLine || '',
      },
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider || order.paymentMethod || 'cod',
    deliveryCountry: order.deliveryCountry || 'AE',
    deliveryEta: order.deliveryEta || '',
    refundStatus: (order.refundStatus || 'none') as Order['refundStatus'],
    refundReason: order.refundReason || '',
    refundAmount: toNumber(order.refundAmount),
    dispatchSlotDate: order.dispatchSlotDate?.toISOString?.() || order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '',
    dispatchNotes: order.dispatchNotes || '',
    courierPartner: order.courierPartner || '',
    deliveredAt: order.deliveredAt?.toISOString?.() || order.deliveredAt || '',
    trackingCode: order.trackingCode || '',
    pickupQrCode: order.pickupQrCode || '',
    status:
      order.status === 'pending'
        ? 'placed'
        : order.status === 'shipped'
        ? 'in_transit'
        : order.status === 'cancelled'
        ? 'failed'
        : order.status,
    paymentStatus: (order.paymentStatus || 'pending') as Order['paymentStatus'],
    paymentReference: order.paymentReference || '',
    paymentSessionId: order.paymentSessionId || '',
    paidAt: order.paidAt?.toISOString?.() || order.paidAt || '',
    payoutStatus: (order.payoutStatus || 'pending') as Order['payoutStatus'],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function mapReview(review: any): Review {
  return {
    id: review.id,
    productId: review.productId,
    vendorId: review.product?.storeId || '',
    orderId: review.orderItem?.orderId,
    orderItemId: review.orderItemId,
    verifiedPurchase: Boolean(review.verifiedPurchase),
    customerId: review.customerId,
    customerName: review.customer?.name || '',
    rating: Number(review.rating || 0),
    comment: review.comment || '',
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.createdAt.toISOString(),
  };
}

function mapPayout(payout: any, seller?: any): Payout & { sellerName?: string; seller?: Seller | null } {
  const sellerName = seller?.storeName || 'Unknown Seller';
  return {
    id: payout.id,
    sellerId: seller?.id || payout.sellerUser?.stores?.[0]?.id || '',
    weekStart: payout.periodStart.toISOString(),
    weekEnd: payout.periodEnd.toISOString(),
    totalOrders: Number(payout.totalOrders || 0),
    grossSales: toNumber(payout.grossSales),
    commission: toNumber(payout.commissionTotal),
    netAmount: toNumber(payout.netPayout),
    status: payout.status,
    paidAt: payout.paidAt?.toISOString?.() || payout.paidAt || '',
    bankTransactionId: payout.bankReference || '',
    createdAt: payout.createdAt.toISOString(),
    updatedAt: payout.createdAt.toISOString(),
    sellerName,
    seller: seller ? mapSeller(seller) : null,
  } as any;
}

function mapPayoutRequest(request: any, seller?: any): PayoutRequest & { sellerName?: string; sellerStoreSlug?: string } {
  return {
    id: request.id,
    sellerId: seller?.id || '',
    amount: toNumber(request.amount),
    status: request.status,
    notes: request.notes || '',
    bankDetails: (request.bankDetailsJson as any) || {},
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    sellerName: seller?.storeName || 'Unknown Seller',
    sellerStoreSlug: seller?.storeSlug || '',
  } as any;
}

function mapSupportMessage(message: any): SupportTicketMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    senderRole: message.senderRole,
    message: message.message,
    attachmentUrl: message.attachmentUrl || '',
    createdAt: message.createdAt.toISOString(),
  };
}

function mapSupportTicket(ticket: any): SupportTicket {
  return {
    id: ticket.id,
    createdById: ticket.createdById || ticket.customerId || '',
    createdByRole: (ticket.createdByRole || 'customer') as UserRole,
    sellerId: ticket.sellerId || undefined,
    customerId: ticket.customerId || undefined,
    orderId: ticket.orderId || undefined,
    productId: ticket.productId || undefined,
    payoutRequestId: ticket.payoutRequestId || undefined,
    subject: ticket.subject,
    description: ticket.description,
    priority: (ticket.priority === 'normal' ? 'medium' : ticket.priority) as SupportTicket['priority'],
    status: ticket.status as SupportTicket['status'],
    assignedTo: ticket.assignedTo || '',
    messages: Array.isArray(ticket.messages) ? ticket.messages.map(mapSupportMessage) : [],
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export const prismaRuntime = {
  enabled,

  async getUserByEmail(email: string) {
    if (!enabled) return null;
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizeEmail(email),
          mode: 'insensitive',
        },
      },
    });
    return user ? mapUser(user) : null;
  },

  async getUser(id: string) {
    if (!enabled) return null;
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  },

  async getAllUsers() {
    if (!enabled) return [];
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(mapUser);
  },

  async getSiteSettings() {
    if (!enabled) return null;
    const record = await prisma.setting.findUnique({ where: { key: 'site_settings' } });
    return (record?.valueJson as unknown as SiteSettings) || db.getSiteSettings();
  },

  async updateSiteSettings(settings: Partial<SiteSettings>) {
    if (!enabled) return null;
    const current =
      ((await prisma.setting.findUnique({ where: { key: 'site_settings' } }))?.valueJson as unknown as SiteSettings) ||
      db.getSiteSettings();
    const merged: SiteSettings = {
      ...current,
      ...settings,
      general: { ...current.general, ...(settings.general || {}) },
      branding: { ...current.branding, ...(settings.branding || {}) },
      homepage: {
        ...current.homepage,
        ...(settings.homepage || {}),
        hero: { ...current.homepage.hero, ...(settings.homepage?.hero || {}) },
        videoSection: { ...current.homepage.videoSection, ...(settings.homepage?.videoSection || {}) },
        trustBanner: { ...current.homepage.trustBanner, ...(settings.homepage?.trustBanner || {}) },
        sections: settings.homepage?.sections || current.homepage.sections,
      },
      header: {
        ...current.header,
        ...(settings.header || {}),
        announcementBar: { ...current.header.announcementBar, ...(settings.header?.announcementBar || {}) },
      },
      footer: {
        ...current.footer,
        ...(settings.footer || {}),
        socialLinks: { ...current.footer.socialLinks, ...(settings.footer?.socialLinks || {}) },
      },
      seo: { ...current.seo, ...(settings.seo || {}) },
    };
    await prisma.setting.upsert({
      where: { key: 'site_settings' },
      update: { valueJson: merged as any },
      create: { key: 'site_settings', valueJson: merged as any },
    });
    return merged;
  },

  async getMarketplaceSettings() {
    if (!enabled) return null;
    const record = await prisma.setting.findUnique({ where: { key: 'marketplace_settings' } });
    return (record?.valueJson as unknown as MarketplaceSettings) || db.getMarketplaceSettings();
  },

  async updateMarketplaceSettings(settings: Partial<MarketplaceSettings>) {
    if (!enabled) return null;
    const current =
      ((await prisma.setting.findUnique({ where: { key: 'marketplace_settings' } }))?.valueJson as unknown as MarketplaceSettings) ||
      db.getMarketplaceSettings();
    const merged: MarketplaceSettings = {
      ...current,
      ...settings,
      countries: settings.countries || current.countries,
    };
    await prisma.setting.upsert({
      where: { key: 'marketplace_settings' },
      update: { valueJson: merged as any },
      create: { key: 'marketplace_settings', valueJson: merged as any },
    });
    return merged;
  },

  async getBanners() {
    if (!enabled) return [];
    const record = await prisma.setting.findUnique({ where: { key: 'banners' } });
    const fallback = db.getBanners();
    const banners = (record?.valueJson as unknown as Banner[]) || fallback;
    return [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async saveBanners(banners: Banner[]) {
    if (!enabled) return [];
    await prisma.setting.upsert({
      where: { key: 'banners' },
      update: { valueJson: banners as any },
      create: { key: 'banners', valueJson: banners as any },
    });
    return banners;
  },

  async createBanner(input: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const banners = await this.getBanners();
    const banner: Banner = {
      ...input,
      id: `banner_${Date.now()}`,
      clicks: input.clicks || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.saveBanners([...banners, banner]);
    return banner;
  },

  async updateBanner(id: string, updates: Partial<Banner>) {
    if (!enabled) return null;
    const banners = await this.getBanners();
    const next = banners.map((banner) =>
      banner.id === id ? { ...banner, ...updates, updatedAt: new Date().toISOString() } : banner
    );
    const updated = next.find((banner) => banner.id === id) || null;
    if (!updated) return null;
    await this.saveBanners(next);
    return updated;
  },

  async deleteBanner(id: string) {
    if (!enabled) return false;
    const banners = await this.getBanners();
    const next = banners.filter((banner) => banner.id !== id);
    if (next.length === banners.length) return false;
    await this.saveBanners(next);
    return true;
  },

  async incrementBannerClicks(id: string) {
    if (!enabled) return null;
    const banners = await this.getBanners();
    const next = banners.map((banner) =>
      banner.id === id
        ? { ...banner, clicks: Number(banner.clicks || 0) + 1, updatedAt: new Date().toISOString() }
        : banner
    );
    const updated = next.find((banner) => banner.id === id) || null;
    if (!updated) return null;
    await this.saveBanners(next);
    return updated;
  },

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    country: string;
    emailVerified: boolean;
    sellerApplicationStatus?: SellerApplicationStatus | null;
  }) {
    if (!enabled) return null;
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: normalizeEmail(input.email),
        passwordHash: input.password,
        phone: input.phone,
        role: input.role as any,
        status: input.status as any,
        country: input.country,
        emailVerified: input.emailVerified,
        sellerApplicationStatus: (input.sellerApplicationStatus || null) as any,
      },
    });
    return mapUser(user);
  },

  async ensureCoreAuthRecords() {
    if (!enabled) return;

    const ensureUser = async (seed: typeof CORE_SUPER_ADMIN | typeof CORE_OFFICIAL_USER) => {
      const normalizedEmail = normalizeEmail(seed.email);
      const passwordHash = await hashSeedPasswordIfNeeded(seed.password);
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { id: seed.id },
            {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      if (existing) {
        return prisma.user.update({
          where: { id: existing.id },
          data: {
            name: existing.name || seed.name,
            email: normalizedEmail,
            phone: existing.phone || seed.phone,
            role: seed.role as any,
            status: seed.status as any,
            country: existing.country || seed.country,
            emailVerified: seed.emailVerified,
            // Keep the built-in core admin credentials recoverable in production.
            passwordHash,
          },
        });
      }

      return prisma.user.create({
        data: {
          id: seed.id,
          name: seed.name,
          email: normalizedEmail,
          passwordHash,
          phone: seed.phone,
          role: seed.role as any,
          status: seed.status as any,
          country: seed.country,
          emailVerified: seed.emailVerified,
        },
      });
    };

    const officialUser = await ensureUser(CORE_OFFICIAL_USER);
    await ensureUser(CORE_SUPER_ADMIN);

    const existingOfficialStore = await prisma.store.findFirst({
      where: {
        OR: [
          { id: CORE_OFFICIAL_STORE_ID },
          { sellerUserId: officialUser.id },
          { slug: 'exshopi-official' },
        ],
      },
    });

    if (existingOfficialStore) {
      await prisma.store.update({
        where: { id: existingOfficialStore.id },
        data: {
          sellerUserId: officialUser.id,
          storeName: existingOfficialStore.storeName || 'ExShopi Official',
          slug: existingOfficialStore.slug || 'exshopi-official',
          description:
            existingOfficialStore.description ||
            'Official ExShopi storefront for first-party marketplace products and curated launches.',
          supportEmail: existingOfficialStore.supportEmail || 'exshopi@exshopi.com',
          supportPhone: existingOfficialStore.supportPhone || CORE_OFFICIAL_USER.phone,
          email: existingOfficialStore.email || 'exshopi@exshopi.com',
          city: existingOfficialStore.city || 'Dubai',
          country: existingOfficialStore.country || 'UAE',
          warehouseAddress: existingOfficialStore.warehouseAddress || '',
          verified: existingOfficialStore.verified ?? true,
          isOfficial: true,
          status: existingOfficialStore.status || 'active',
        },
      });
      return;
    }

    await prisma.store.create({
      data: {
        id: CORE_OFFICIAL_STORE_ID,
        sellerUserId: officialUser.id,
        storeName: 'ExShopi Official',
        slug: 'exshopi-official',
        description: 'Official ExShopi storefront for first-party marketplace products and curated launches.',
        logoUrl: '/logo.png',
        bannerUrl: '/hero/hero-1.png',
        supportEmail: 'exshopi@exshopi.com',
        supportPhone: CORE_OFFICIAL_USER.phone,
        email: 'exshopi@exshopi.com',
        city: 'Dubai',
        country: 'UAE',
        warehouseAddress: '',
        verified: true,
        isOfficial: true,
        status: 'active',
      },
    });
  },

  async updateUser(id: string, data: Partial<User>) {
    if (!enabled) return null;
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role as any,
        status: data.status as any,
        country: data.country,
        emailVerified: data.emailVerified,
        sellerApplicationStatus: (data.sellerApplicationStatus || undefined) as any,
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
        passwordHash: data.password,
      },
    });
    return mapUser(user);
  },

  async getCategories() {
    if (!enabled) return db.getCategories();
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return mapCategoryTree(categories);
  },

  async getSellerByUserId(userId: string) {
    if (!enabled) return null;
    const store = await prisma.store.findFirst({
      where: { sellerUserId: userId },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    return store ? mapSeller(store) : null;
  },

  async getSeller(id: string) {
    if (!enabled) return null;
    const store = await prisma.store.findUnique({
      where: { id },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    return store ? mapSeller(store) : null;
  },

  async getSellerBySlug(slug: string) {
    if (!enabled) return null;
    const store = await prisma.store.findUnique({
      where: { slug },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    return store ? mapSeller(store) : null;
  },

  async getAllSellers() {
    if (!enabled) return [];
    const stores = await prisma.store.findMany({
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return stores.map(mapSeller);
  },

  async updateSeller(id: string, updates: Partial<Seller>) {
    if (!enabled) return null;
    const store = await prisma.store.update({
      where: { id },
      data: {
        storeName: updates.storeName,
        slug: updates.storeSlug ? slugify(updates.storeSlug) : undefined,
        description: updates.description,
        logoUrl: updates.logo,
        bannerUrl: updates.banner,
        email: updates.email,
        supportEmail: updates.email,
        supportPhone: updates.phone,
        supportInfo: updates.supportInfo,
        website: updates.website,
        city: updates.city,
        country: updates.country,
        warehouseAddress: updates.warehouseAddress,
        vatTrn: updates.vatTrn,
        bankName: updates.bankName,
        bankAccount: updates.bankAccount,
        accountHolder: updates.accountHolder,
        iban: updates.iban,
        policiesJson: updates.policies as any,
        socialLinksJson: updates.socialLinks as any,
        status: updates.status,
      },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    return mapSeller(store);
  },

  async getSellerApplicationByUserId(userId: string) {
    if (!enabled) return null;
    const application = await prisma.sellerApplication.findFirst({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return application ? mapSellerApplication(application) : null;
  },

  async getSellerApplication(id: string) {
    if (!enabled) return null;
    const application = await prisma.sellerApplication.findUnique({
      where: { id },
      include: { user: true },
    });
    return application ? mapSellerApplication(application) : null;
  },

  async getSellerApplications() {
    if (!enabled) return [];
    const applications = await prisma.sellerApplication.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return applications.map(mapSellerApplication);
  },

  async createSellerApplication(input: Omit<SellerApplication, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const application = await prisma.sellerApplication.create({
      data: {
        userId: input.userId,
        businessName: input.businessName,
        ownerName: input.ownerName,
        country: input.country,
        city: input.city,
        warehouseAddress: input.warehouseAddress,
        vatTrn: input.vatTrn,
        iban: input.bankDetails?.iban || '',
        bankName: input.bankDetails?.bankName || '',
        accountHolder: input.bankDetails?.accountHolder || '',
        about: input.about,
        status: input.status as any,
        adminNotes: input.adminNotes,
        rejectionReason: input.rejectionReason,
        reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : undefined,
        reviewedBy: input.reviewedBy || undefined,
      },
      include: { user: true },
    });
    return mapSellerApplication(application);
  },

  async updateSellerApplication(id: string, updates: Partial<SellerApplication>) {
    if (!enabled) return null;
    const application = await prisma.sellerApplication.update({
      where: { id },
      data: {
        businessName: updates.businessName,
        ownerName: updates.ownerName,
        country: updates.country,
        city: updates.city,
        warehouseAddress: updates.warehouseAddress,
        vatTrn: updates.vatTrn,
        iban: updates.bankDetails?.iban || undefined,
        bankName: updates.bankDetails?.bankName || undefined,
        accountHolder: updates.bankDetails?.accountHolder || undefined,
        about: updates.about,
        status: updates.status as any,
        adminNotes: updates.adminNotes,
        rejectionReason: updates.rejectionReason,
        reviewedAt: updates.reviewedAt ? new Date(updates.reviewedAt) : undefined,
        reviewedBy: updates.reviewedBy || undefined,
      },
      include: { user: true },
    });
    return mapSellerApplication(application);
  },

  async ensureSellerFromApplication(applicationId: string) {
    if (!enabled) return null;
    const application = await prisma.sellerApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });
    if (!application) return null;

    const existing = await prisma.store.findFirst({
      where: { sellerUserId: application.userId },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    if (existing) return mapSeller(existing);

    const baseSlug = slugify(application.businessName);
    let nextSlug = baseSlug;
    let suffix = 1;
    while (await prisma.store.findUnique({ where: { slug: nextSlug } })) {
      nextSlug = `${baseSlug}-${suffix++}`;
    }

    const store = await prisma.store.create({
      data: {
        sellerUserId: application.userId,
        storeName: application.businessName,
        slug: nextSlug,
        description: application.about || application.businessName,
        supportEmail: application.user.email,
        supportPhone: application.user.phone || '',
        email: application.user.email,
        city: application.city,
        country: application.country,
        warehouseAddress: application.warehouseAddress || '',
        vatTrn: application.vatTrn || '',
        bankName: application.bankName || '',
        accountHolder: application.accountHolder || '',
        iban: application.iban || '',
        verified: true,
        status: 'active',
      },
      include: { sellerUser: true, _count: { select: { products: true, orders: true } } },
    });
    return mapSeller(store);
  },

  async createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { slug?: string }) {
  if (!enabled) return null;

  const baseSlug = slugify(input.title);
  let nextSlug = input.slug || baseSlug;
  let suffix = 1;

  while (await prisma.product.findUnique({ where: { slug: nextSlug } })) {
    nextSlug = `${baseSlug}-${suffix++}`;
  }

  const storeId = input.storeId || input.sellerId;
  const store = storeId
    ? await prisma.store.findUnique({ where: { id: storeId } })
    : null;

  const createdByRole = input.createdByRole || 'seller';
  const isAdminCreated = createdByRole === 'admin';

  const finalApprovalStatus = isAdminCreated
    ? 'approved'
    : ((input.approvalStatus || 'pending') as any);

  const requestedStatus = (input.productStatus || input.status || 'pending') as string;

  const finalStatus = isAdminCreated
    ? 'live'
    : requestedStatus === 'pending'
    ? 'pending_approval'
    : requestedStatus;

  const finalVisibilityStatus = isAdminCreated ? 'live' : (input.visibilityStatus || 'hidden');

  const imageList = [input.image, ...(input.images || [])].filter(Boolean);
    const categoryExtras: any = {};
    const baseSpecs: any = withDeletionMeta(input.specs || {}, {
      isDeleted: Boolean(input.isDeleted),
      deletedAt: input.deletedAt || '',
    });
    if (baseSpecs) {
      categoryExtras.parentCategorySlug = baseSpecs?.parentCategorySlug || baseSpecs?.categorySlug || undefined;
      categoryExtras.categorySlug = baseSpecs?.categorySlug || undefined;
      categoryExtras.subcategorySlug = baseSpecs?.subcategorySlug || undefined;
      categoryExtras.childCategorySlug = baseSpecs?.childCategorySlug || undefined;
      categoryExtras.categoryPathJson = baseSpecs?.categoryPath
        ? (Array.isArray(baseSpecs.categoryPath) ? baseSpecs.categoryPath : String(baseSpecs.categoryPath).split('/').filter(Boolean))
        : undefined;
    }

   const product = await prisma.product.create({
  data: {
    storeId: input.storeId || input.sellerId || "",
    sellerUserId:
      (
        await prisma.store.findUnique({
          where: { id: input.storeId || input.sellerId },
        })
      )?.sellerUserId || "",

    categoryId: input.categoryId,
    title: input.title,
    slug: nextSlug,
    metaTitle: input.metaTitle || input.specs?.metaTitle || null,
    metaDescription: input.metaDescription || input.specs?.metaDescription || null,
    metaKeywords: input.metaKeywords || input.specs?.metaKeywords || null,
    canonicalUrl: input.canonicalUrl || input.specs?.canonicalUrl || null,
    ogTitle: input.ogTitle || input.specs?.ogTitle || null,
    ogDescription: input.ogDescription || input.specs?.ogDescription || null,
    ogImage: input.ogImage || input.specs?.ogImage || null,
    shortDescription: input.specs?.shortDescription || "",
    description: input.description,
    sku: input.sku,
    brand: input.brand || "",
    price: input.price,
    originalPrice: input.originalPrice,
    salePrice: input.salePrice,
    currency: "AED",
    stock: input.stock,
    rating: input.rating || 0,
    reviewsCount: input.reviews || 0,
    specsJson: baseSpecs as any,
    ...categoryExtras,
    badgesJson: input.badges as any,
    views: input.views || 0,
    wishlistCount: input.wishlistCount || 0,
    ownership: input.ownership || "seller",
    createdByRole: input.createdByRole || "seller",

    approvalStatus: finalApprovalStatus as any,

    status: finalStatus as any,

    visibilityStatus: finalVisibilityStatus as any,

    approvalRequestedAt: new Date(),
    rejectionReason: "",
    approvalNotes: "",

    approvedAt:
      input.createdByRole === "admin" ? new Date() : undefined,

    rejectedAt: undefined,

    images: {
      create: [input.image, ...(input.images || [])]
        .filter(Boolean)
        .map((url, index) => ({
          imageUrl: url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
    },
  },
  include: {
    images: true,
  },
});

  return mapProduct(product);
},

  async getProduct(id: string) {
    if (!enabled) return null;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    return product ? mapProduct(product) : null;
  },

  async getProductBySlug(slug: string) {
    if (!enabled) return null;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: true },
    });
    return product ? mapProduct(product) : null;
  },

  async getAllProducts() {
  if (!enabled) return [];

  const products = await prisma.product.findMany({
    where: {
      approvalStatus: 'approved',
      status: 'live',
      visibilityStatus: 'live',
    },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });

  return products.map(mapProduct).filter((product) => !isSoftDeletedProduct(product));
},

  async getProductsByCategorySlugs(parentSlug?: string | null, categorySlug?: string | null, subcategorySlug?: string | null) {
    if (!enabled) return [];
    const where: any = {
      approvalStatus: 'approved',
      status: 'live',
      visibilityStatus: 'live',
    };

    // If only a single categorySlug is provided, treat it as a match across any level (parent/category/subcategory)
    if (categorySlug && !parentSlug && !subcategorySlug) {
      where.OR = [
        { parentCategorySlug: categorySlug },
        { categorySlug: categorySlug },
        { subcategorySlug: categorySlug },
      ];
    } else if (parentSlug && !categorySlug && !subcategorySlug) {
      // explicit parent-only match
      where.parentCategorySlug = parentSlug;
    } else {
      const andClauses: any[] = [];
      if (parentSlug) andClauses.push({ parentCategorySlug: parentSlug });
      if (categorySlug) andClauses.push({ categorySlug });
      if (subcategorySlug) andClauses.push({ subcategorySlug });
      if (andClauses.length) where.AND = andClauses;
    }

    const products = await prisma.product.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(mapProduct).filter((product) => !isSoftDeletedProduct(product));
  },

  async getSellerProducts(sellerId: string) {
    if (!enabled) return [];
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { storeId: sellerId },
          { sellerUserId: sellerId },
        ],
      },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(mapProduct).filter((product) => !isSoftDeletedProduct(product));
  },

  async getAllProductsForAdmin() {
    if (!enabled) return [];
    const products = await prisma.product.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(mapProduct);
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    if (!enabled) return null;
    const current = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!current) return null;
    if (updates.image || updates.images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
    }
    const updateExtras: any = {};
    const nextSpecs: any = withDeletionMeta(
      {
        ...(((current.specsJson as Record<string, any>) || {})),
        ...(updates.specs || {}),
      },
      {
        isDeleted: updates.isDeleted ?? (((current.specsJson as Record<string, any>) || {}).__deletion?.isDeleted) ?? false,
        deletedAt: updates.deletedAt ?? (((current.specsJson as Record<string, any>) || {}).__deletion?.deletedAt) ?? '',
      }
    );
    if (nextSpecs) {
      updateExtras.parentCategorySlug = nextSpecs?.parentCategorySlug || nextSpecs?.categorySlug || undefined;
      updateExtras.categorySlug = nextSpecs?.categorySlug || undefined;
      updateExtras.subcategorySlug = nextSpecs?.subcategorySlug || undefined;
      updateExtras.childCategorySlug = nextSpecs?.childCategorySlug || undefined;
      updateExtras.categoryPathJson = nextSpecs?.categoryPath
        ? (Array.isArray(nextSpecs.categoryPath) ? nextSpecs.categoryPath : String(nextSpecs.categoryPath).split('/').filter(Boolean))
        : undefined;
    }
    const product = await prisma.product.update({
      where: { id },
      data: {
        categoryId: updates.categoryId,
        title: updates.title,
        slug: updates.slug,
        metaTitle: updates.metaTitle || updates.specs?.metaTitle,
        metaDescription: updates.metaDescription || updates.specs?.metaDescription,
        metaKeywords: updates.metaKeywords || updates.specs?.metaKeywords,
        canonicalUrl: updates.canonicalUrl || updates.specs?.canonicalUrl,
        ogTitle: updates.ogTitle || updates.specs?.ogTitle,
        ogDescription: updates.ogDescription || updates.specs?.ogDescription,
        ogImage: updates.ogImage || updates.specs?.ogImage,
        shortDescription: updates.specs?.shortDescription,
        description: updates.description,
        sku: updates.sku,
        brand: updates.brand,
        price: updates.price,
        originalPrice: updates.originalPrice,
        salePrice: updates.salePrice,
        stock: updates.stock,
          // keep explicit canonical slug columns in sync with specs
          ...updateExtras,
        specsJson: nextSpecs as any,
        badgesJson: updates.badges as any,
        views: updates.views,
        wishlistCount: updates.wishlistCount,
        ownership: updates.ownership,
        createdByRole: updates.createdByRole,
        approvalRequestedAt: updates.approvalRequestedAt ? new Date(updates.approvalRequestedAt) : undefined,
        approvalStatus: updates.approvalStatus as any,
        status: ((updates.productStatus || updates.status) === 'pending' ? 'pending_approval' : (updates.productStatus || updates.status || undefined)) as any,
        visibilityStatus: updates.visibilityStatus as any,
        rejectionReason: updates.rejectionReason,
        approvalNotes: updates.approvalNotes,
        approvedAt: updates.approvedAt ? new Date(updates.approvedAt) : undefined,
        rejectedAt: updates.rejectedAt ? new Date(updates.rejectedAt) : undefined,
        images:
          updates.image || updates.images
            ? {
                create: [updates.image, ...(updates.images || [])]
                  .filter(Boolean)
                  .map((imageUrl, index) => ({
                    imageUrl,
                    isPrimary: index === 0,
                    sortOrder: index,
                  })),
              }
            : undefined,
      },
      include: { images: true },
    });
    return mapProduct(product);
  },

  async deleteProduct(id: string) {
    if (!enabled) return false;
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return false;
    const specs = withDeletionMeta((current.specsJson as Record<string, any>) || {}, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
    await prisma.product.update({
      where: { id },
      data: {
        status: 'archived',
        visibilityStatus: 'hidden',
        specsJson: specs as any,
      },
    });
    return true;
  },

  async createOrder(input: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const storeId = input.sellerId;
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return null;
    const order = await prisma.order.create({
      data: {
        orderNumber: input.orderId,
        customerId: input.customerId,
        storeId,
        sellerUserId: store.sellerUserId,
        subtotal: input.subtotal,
        vatAmount: input.vatAmount || 0,
        deliveryFee: input.shippingCost || 0,
        discountAmount: 0,
        totalAmount: input.totalAmount || input.subtotal,
        currency: 'AED',
        paymentMethod: input.paymentMethod || 'cod',
        paymentProvider: input.paymentProvider || input.paymentMethod || 'cod',
        paymentStatus: input.paymentStatus || 'pending',
        paymentReference: input.paymentReference || '',
        paymentSessionId: input.paymentSessionId || '',
        paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
        payoutStatus: input.payoutStatus || 'pending',
        commissionAmount: input.commission || 0,
        sellerAmount: input.sellerAmount || 0,
        status:
          input.status === 'placed'
            ? 'pending'
            : input.status === 'in_transit' || input.status === 'handed_to_partner' || input.status === 'out_for_delivery'
            ? 'shipped'
            : input.status === 'failed'
            ? 'cancelled'
            : input.status === 'returned'
            ? 'returned'
            : input.status === 'delivered'
            ? 'delivered'
            : (input.status as any),
        customerName: input.customerName || '',
        customerEmail: input.customerEmail || '',
        customerPhone: input.customerPhone || '',
        shippingAddressJson: input.shippingAddress as any,
        deliveryCountry: input.deliveryCountry || 'AE',
        deliveryEta: input.deliveryEta || '',
        refundStatus: input.refundStatus || 'none',
        refundReason: input.refundReason || '',
        refundAmount: input.refundAmount || 0,
        dispatchSlotDate: input.dispatchSlotDate ? new Date(input.dispatchSlotDate) : undefined,
        dispatchSlotWindow: input.dispatchSlotWindow || '',
        dispatchNotes: input.dispatchNotes || '',
        courierPartner: input.courierPartner || '',
        trackingCode: input.trackingCode || '',
        pickupQrCode: input.pickupQrCode || '',
        emirate: input.shippingAddress?.emirate || '',
        area: input.shippingAddress?.area || '',
        building: input.shippingAddress?.building || '',
        flat: input.shippingAddress?.flat || '',
        addressLine: input.shippingAddress?.addressLine || '',
        deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : undefined,
        items: {
          create: (input.items || []).map((item) => ({
            productId: item.productId,
            productTitle: item.title,
            sku: item.sku || '',
            unitPrice: item.unitPrice,
            salePrice: item.unitPrice,
            quantity: item.quantity,
            vatAmount: item.vatAmount,
            lineTotal: item.subtotal,
            commissionAmount: item.commission,
            sellerNetAmount: item.sellerAmount,
            status: input.status || 'placed',
          })),
        },
      },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    return mapOrder(order);
  },

  async getOrder(id: string) {
    if (!enabled) return null;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    return order ? mapOrder(order) : null;
  },

  async getAllOrders() {
    if (!enabled) return [];
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapOrder);
  },

  async getCustomerOrders(customerId: string) {
    if (!enabled) return [];
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapOrder);
  },

  async getSellerOrders(storeId: string) {
    if (!enabled) return [];
    const orders = await prisma.order.findMany({
      where: { storeId },
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapOrder);
  },

  async updateOrder(id: string, updates: Partial<Order>) {
    if (!enabled) return null;
    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: updates.paymentStatus,
        paymentReference: updates.paymentReference,
        paymentSessionId: updates.paymentSessionId,
        paidAt: updates.paidAt ? new Date(updates.paidAt) : undefined,
        payoutStatus: updates.payoutStatus,
        commissionAmount: updates.commission,
        sellerAmount: updates.sellerAmount,
        refundStatus: updates.refundStatus,
        refundReason: updates.refundReason,
        refundAmount: updates.refundAmount,
        dispatchSlotDate: updates.dispatchSlotDate ? new Date(updates.dispatchSlotDate) : undefined,
        dispatchSlotWindow: updates.dispatchSlotWindow,
        dispatchNotes: updates.dispatchNotes,
        courierPartner: updates.courierPartner,
        deliveredAt: updates.deliveredAt ? new Date(updates.deliveredAt) : undefined,
        trackingCode: updates.trackingCode,
        pickupQrCode: updates.pickupQrCode,
        status:
          updates.status === 'placed'
            ? 'pending'
            : updates.status === 'in_transit' || updates.status === 'handed_to_partner' || updates.status === 'out_for_delivery'
            ? 'shipped'
            : updates.status === 'failed'
            ? 'cancelled'
            : updates.status === 'returned'
            ? 'returned'
            : updates.status === 'delivered'
            ? 'delivered'
            : (updates.status as any),
      },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    return mapOrder(order);
  },

  async addTrackingEvent(orderId: string, status: string, timestamp: string, notes: string, location?: string) {
    if (!enabled) return null;
    return prisma.trackingEvent.create({
      data: {
        orderId,
        status,
        timestamp: new Date(timestamp),
        notes,
        location,
      },
    });
  },

  async getOrderTracking(orderId: string) {
    if (!enabled) return [];
    const events = await prisma.trackingEvent.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
    return events.map((event) => ({
      id: event.id,
      orderId: event.orderId,
      status: event.status,
      timestamp: event.timestamp.toISOString(),
      notes: event.notes || '',
      location: event.location || '',
    }));
  },

  async getOrderByTrackingCode(trackingCode: string) {
    if (!enabled) return null;
    const order = await prisma.order.findFirst({
      where: { trackingCode },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    return order ? mapOrder(order) : null;
  },

  async createReview(input: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const order = input.orderId ? await prisma.order.findUnique({ where: { id: input.orderId } }) : null;
    const review = await prisma.review.create({
      data: {
        orderItemId: input.orderItemId || '',
        productId: input.productId,
        customerId: input.customerId || '',
        sellerUserId: order?.sellerUserId || '',
        rating: input.rating,
        comment: input.comment,
        verifiedPurchase: Boolean(input.verifiedPurchase),
      },
      include: {
        customer: true,
        product: true,
        orderItem: true,
      },
    });
    return mapReview(review);
  },

  async getReviewByOrderItem(orderItemId: string, customerId: string) {
    if (!enabled) return null;
    const review = await prisma.review.findFirst({
      where: { orderItemId, customerId },
      include: { customer: true, product: true, orderItem: true },
    });
    return review ? mapReview(review) : null;
  },

  async getOrderItemWithOrder(orderItemId: string) {
    if (!enabled) return null;
    return prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true, product: true },
    });
  },

  async getProductReviews(productId: string) {
    if (!enabled) return [];
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { customer: true, product: true, orderItem: true },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map(mapReview);
  },

  async getVendorReviews(storeId: string) {
    if (!enabled) return [];
    const reviews = await prisma.review.findMany({
      where: { product: { storeId } },
      include: { customer: true, product: true, orderItem: true },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map(mapReview);
  },

  async getSellerPayouts(storeId: string) {
    if (!enabled) return [];
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return [];
    const payouts = await prisma.payout.findMany({
      where: { sellerUserId: store.sellerUserId },
      orderBy: { createdAt: 'desc' },
    });
    return payouts.map((payout) => mapPayout(payout, store as any));
  },

  async getAllPayouts() {
    if (!enabled) return [];
    const payouts = await prisma.payout.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const stores = await prisma.store.findMany();
    return payouts.map((payout) => {
      const store = stores.find((item) => item.sellerUserId === payout.sellerUserId);
      return mapPayout(payout, store as any);
    });
  },

  async getPayout(id: string) {
    if (!enabled) return null;
    const payout = await prisma.payout.findUnique({
      where: { id },
    });
    if (!payout) return null;
    const store = await prisma.store.findFirst({ where: { sellerUserId: payout.sellerUserId } });
    return mapPayout(payout, store as any);
  },

  async updatePayout(id: string, updates: Partial<Payout>) {
    if (!enabled) return null;
    const payout = await prisma.payout.update({
      where: { id },
      data: {
        status: updates.status,
        paidAt: updates.paidAt ? new Date(updates.paidAt) : undefined,
        bankReference: updates.bankTransactionId,
      },
    });
    const store = await prisma.store.findFirst({ where: { sellerUserId: payout.sellerUserId } });
    return mapPayout(payout, store as any);
  },

  async calculateWeeklyPayouts() {
    if (!enabled) return [];
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        status: 'delivered',
        payoutStatus: { in: ['pending', 'processed'] },
        refundStatus: { not: 'refunded' },
        deliveredAt: { gte: weekStart, lte: weekEnd },
      },
      include: { store: true },
    });

    const grouped = new Map<string, any[]>();
    for (const order of orders) {
      const key = order.storeId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(order);
    }

    const created: any[] = [];
    for (const [storeId, storeOrders] of grouped.entries()) {
      const store = storeOrders[0].store;
      const existing = await prisma.payout.findFirst({
        where: {
          sellerUserId: store.sellerUserId,
          periodStart: weekStart,
          periodEnd: weekEnd,
        },
      });
      if (existing) continue;

      const grossSales = storeOrders.reduce((sum, order) => sum + toNumber(order.subtotal), 0);
      const commissionTotal = storeOrders.reduce((sum, order) => sum + toNumber(order.commissionAmount), 0);
      const netPayout = storeOrders.reduce((sum, order) => sum + toNumber(order.sellerAmount), 0);

      const payout = await prisma.payout.create({
        data: {
          sellerUserId: store.sellerUserId,
          periodStart: weekStart,
          periodEnd: weekEnd,
          grossSales,
          commissionTotal,
          refundDeductions: 0,
          netPayout,
          status: 'processed',
        },
      });

      await prisma.order.updateMany({
        where: { id: { in: storeOrders.map((order) => order.id) } },
        data: { payoutStatus: 'processed' },
      });

      created.push({
        ...mapPayout(payout, store),
        totalOrders: storeOrders.length,
      });
    }

    return created;
  },

  async createPayoutRequest(input: Omit<PayoutRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const store = await prisma.store.findUnique({ where: { id: input.sellerId } });
    if (!store) return null;
    const request = await prisma.payoutRequest.create({
      data: {
        sellerUserId: store.sellerUserId,
        amount: input.amount,
        status: input.status,
        notes: input.notes || '',
        bankDetailsJson: input.bankDetails as any,
      },
    });
    return mapPayoutRequest(request, store as any);
  },

  async getSellerPayoutRequests(storeId: string) {
    if (!enabled) return [];
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return [];
    const requests = await prisma.payoutRequest.findMany({
      where: { sellerUserId: store.sellerUserId },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((request) => mapPayoutRequest(request, store as any));
  },

  async getAllPayoutRequests() {
    if (!enabled) return [];
    const requests = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const stores = await prisma.store.findMany();
    return requests.map((request) => {
      const store = stores.find((item) => item.sellerUserId === request.sellerUserId);
      return mapPayoutRequest(request, store as any);
    });
  },

  async updatePayoutRequest(id: string, updates: Partial<PayoutRequest>) {
    if (!enabled) return null;
    const request = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: updates.status,
        notes: updates.notes,
        bankDetailsJson: updates.bankDetails as any,
      },
    });
    const store = await prisma.store.findFirst({ where: { sellerUserId: request.sellerUserId } });
    return mapPayoutRequest(request, store as any);
  },

  async createSupportTicket(input: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!enabled) return null;
    const store = input.sellerId ? await prisma.store.findUnique({ where: { id: input.sellerId } }) : null;
    const ticket = await prisma.supportTicket.create({
      data: {
        createdById: input.createdById,
        createdByRole: input.createdByRole,
        customerId: input.customerId,
        sellerUserId: store?.sellerUserId || null,
        orderId: input.orderId,
        productId: input.productId,
        payoutRequestId: input.payoutRequestId,
        subject: input.subject,
        description: input.description,
        priority: input.priority,
        status: input.status as any,
        assignedTo: input.assignedTo || null,
        messages: {
          create: (input.messages || []).map((message) => ({
            senderId: message.senderId,
            senderRole: message.senderRole,
            message: message.message,
            attachmentUrl: message.attachmentUrl || '',
          })),
        },
      },
      include: { messages: true },
    });
    return mapSupportTicket(ticket);
  },

  async getSupportTicket(id: string) {
    if (!enabled) return null;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: true },
    });
    return ticket ? mapSupportTicket(ticket) : null;
  },

  async getSupportTicketsForUser(userId: string, role: UserRole) {
    if (!enabled) return [];
    const store = role === 'seller' ? await prisma.store.findFirst({ where: { sellerUserId: userId } }) : null;
    const tickets = await prisma.supportTicket.findMany({
      where:
        role === 'seller'
          ? { OR: [{ sellerUserId: userId }, { createdById: userId }] }
          : role === 'customer'
          ? { OR: [{ customerId: userId }, { createdById: userId }] }
          : {},
      include: { messages: true },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets
      .filter((ticket) => (role === 'seller' ? !store || !ticket.sellerUserId || ticket.sellerUserId === store.sellerUserId : true))
      .map(mapSupportTicket);
  },

  async getAllSupportTickets() {
    if (!enabled) return [];
    const tickets = await prisma.supportTicket.findMany({
      include: { messages: true },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets.map(mapSupportTicket);
  },

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>) {
    if (!enabled) return null;
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: updates.status as any,
        assignedTo: updates.assignedTo || null,
      },
      include: { messages: true },
    });
    return mapSupportTicket(ticket);
  },

  async addSupportTicketMessage(id: string, message: Omit<SupportTicketMessage, 'id' | 'createdAt'>) {
    if (!enabled) return null;
    await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        message: message.message,
        attachmentUrl: message.attachmentUrl || '',
      },
    });
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: true },
    });
    return ticket ? mapSupportTicket(ticket) : null;
  },
};
