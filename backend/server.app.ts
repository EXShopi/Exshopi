import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { z } from 'zod';
import { db } from './database';
import { prismaRuntime } from './prismaRuntime';
import { supabaseRuntime } from './supabaseRuntime';
import { ensureUploadDir, uploadDataUrl } from './uploadStorage';
import { createStripeCheckoutSession, verifyStripeWebhookSignature } from './stripeService';
import { sendTransactionalEmail } from './emailService';
import { sendNewOrderNotificationToAdmin, sendSellerSignupConfirmationEmail, sendSellerApplicationNotificationToAdmin } from './emailService.helpers';
import {
  addBlacklistEntry,
  calculateCodRisk,
  consumeCodOtpVerification,
  createCodOtpSession,
  getNotificationsForAudience,
  isBlacklisted,
  isValidPhoneForCountry,
  isValidUaePhone,
  listBlacklistEntries,
  normalizePhone,
  pushNotification,
  verifyCodOtpSession,
} from './codOps';
import {
  ADMIN_PERMISSION_MATRIX,
  hasAdminPermission,
  authMiddleware,
  canAccessFinance,
  canAccessSupport,
  hashPassword,
  isAdminLike,
  isBackofficeRole,
  signAccessToken,
  signRefreshToken,
  upgradeLegacyPasswordIfNeeded,
  verifyPassword,
  verifyRefreshToken,
  tryAuthenticateRequest,
} from './auth';
import { getPrismaEnvDiagnostics, probePrismaConnection } from './prisma';
import { ensureUniqueSlug, normalizeSlugInput, slugifyProduct } from './utils/slug';
import { generateProductSeoPayload, mergeProductSeoIntoSpecs, normalizeSeoText, uniqueSeoKeywords } from './utils/seo';
import { productSeoSchema, validateSeoForPublish } from './validators/productSeo';
import { normalizeProductSpecifications, validateProductSpecificationsForTemplate } from './validators/productSpecifications';
import { buildStoreOperationsAnalytics } from './adminAnalyticsService';
import { findProductRouteMatch } from '../src/lib/productRouteResolution';
import { MASTER_CATEGORIES, productMatchesCategoryAssignment, resolveCanonicalCategoryAssignment } from '../src/lib/masterCategories';
import { getCategoryPath } from '../src/lib/seo';
import { getProductLifecycleState, isCustomerVisibleProduct, isSoftDeletedProduct } from '../shared/productLifecycle';

console.log('[BOOT] boot started', {
  entry: 'backend/server.ts',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '10000',
});

const app: Express = express();
app.set('trust proxy', 1);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Render health checks must stay public, instant, and dependency-free.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

const SERVER_ENTRY = 'backend/server.ts';
const STARTED_AT = new Date().toISOString();
const prismaEnvDiagnostics = getPrismaEnvDiagnostics();
const connectionMode = prismaRuntime.enabled
  ? 'prisma'
  : supabaseRuntime.enabled
    ? 'supabase'
    : 'json-db';

const seoSlugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\bcopy\b/g, '')
    .replace(/-copy(?:-\d+)?$/g, '')
    .replace(/copy-\d+$/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// ==================== CORS CONFIGURATION ====================
const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');
const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const defaultAllowedOrigins = new Set([
  'https://exshopi-frontend.onrender.com',
  'https://exshopi.onrender.com',
  'https://exshopi.com',
  'https://www.exshopi.com',
  'https://exshopi-api.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:3000',
].map(normalizeOrigin));
const defaultAllowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const defaultAllowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
];

const addAllowedOrigin = (value?: string | null) => {
  String(value || '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean)
    .forEach((origin) => {
      defaultAllowedOrigins.add(origin);
      console.log(`[CORS] Added origin from env: ${origin}`);
    });
};

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return defaultAllowedOrigins.has(normalized) || LOCALHOST_ORIGIN_PATTERN.test(normalized);
};

const applyCorsHeaders = (req: Request, res: Response) => {
  const requestOrigin = String(req.headers.origin || '').trim();
  if (!requestOrigin || !isAllowedOrigin(requestOrigin)) return;

  const requestedHeaders = String(req.headers['access-control-request-headers'] || '')
    .split(',')
    .map((header) => header.trim())
    .filter(Boolean);

  res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(requestOrigin));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', defaultAllowedMethods.join(','));
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestedHeaders.length ? requestedHeaders.join(', ') : defaultAllowedHeaders.join(',')
  );
  res.setHeader('Access-Control-Max-Age', '86400');
};

addAllowedOrigin(process.env.APP_URL);
addAllowedOrigin(process.env.FRONTEND_URL);
addAllowedOrigin(process.env.CORS_ORIGIN);

console.log(`[CORS] Configured allowed origins:`, Array.from(defaultAllowedOrigins));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] 🚫 Blocked request from origin: ${origin}`);
    callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: defaultAllowedMethods,
  allowedHeaders: defaultAllowedHeaders,
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const PORT = Number(process.env.PORT || 10000);
const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5179';
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'ahsansajid295@gmail.com';
const COD_MAX_DAILY_ORDERS = Number(process.env.COD_MAX_DAILY_ORDERS || 3);
const ACTIVE_CATEGORY_SLUGS = new Set([
  'electronics',
  'mobiles',
  'laptops',
  'laptops-desktops',
  'accessories',
  'computer-accessories',
  'mobile-accessories',
  'tablets',
]);

const normalizeAuthEmail = (value: string) => String(value || '').trim().toLowerCase();

const CORE_BACKOFFICE_LOGIN_SEEDS = new Map<string, string>([
  [normalizeAuthEmail('ahsansajid295@gmail.com'), 'T7&fD!2q'],
  [normalizeAuthEmail('official@exshopi.com'), 'exshopi-official'],
]);

const isCoreBackofficeCredential = (email: string, password: string) =>
  CORE_BACKOFFICE_LOGIN_SEEDS.get(normalizeAuthEmail(email)) === String(password || '');

const OPERATIONAL_ORDER_STATUSES = new Set([
  'pending_confirmation',
  'confirmed',
  'preparing',
  'packed',
  'waiting_for_pickup',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'return_approved',
  'returned',
  'refund_review',
  'refunded',
]);

const getClientIp = (req: Request) =>
  String(
    req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      req.ip ||
      ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

const normalizeOperationalStatus = (status?: string) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'pending_confirmation';
  if (value === 'placed') return 'pending_confirmation';
  if (value === 'ready_for_pickup' || value === 'pickup_scheduled') return 'waiting_for_pickup';
  if (value === 'handed_to_partner') return 'picked_up';
  if (value === 'failed') return 'cancelled';
  return value;
};

const mapOperationalStatusToStoredStatus = (status?: string) => {
  const normalized = normalizeOperationalStatus(status);
  switch (normalized) {
    case 'pending_confirmation':
      return 'placed';
    case 'confirmed':
    case 'preparing':
      return 'confirmed';
    case 'packed':
      return 'packed';
    case 'waiting_for_pickup':
      return 'pickup_scheduled';
    case 'picked_up':
      return 'handed_to_partner';
    case 'in_transit':
      return 'in_transit';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'failed';
    case 'return_requested':
    case 'return_approved':
    case 'refund_review':
      return 'return_requested';
    case 'returned':
    case 'refunded':
      return 'returned';
    default:
      return 'placed';
  }
};

const deriveOperationalStatus = (order: any, trackingEvents: any[] = []) => {
  const latestTrackedStatus = [...trackingEvents]
    .reverse()
    .find((event) => OPERATIONAL_ORDER_STATUSES.has(normalizeOperationalStatus(event?.status)));

  if (latestTrackedStatus) {
    return normalizeOperationalStatus(latestTrackedStatus.status);
  }

  return normalizeOperationalStatus(order?.status);
};

const deriveDispatchState = (status: string) => {
  switch (status) {
    case 'pending_confirmation':
    case 'confirmed':
    case 'preparing':
      return 'awaiting_pack';
    case 'packed':
      return 'packed';
    case 'waiting_for_pickup':
      return 'pickup_scheduled';
    case 'picked_up':
    case 'in_transit':
      return 'in_transit';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'delivered':
      return 'delivered';
    default:
      return status;
  }
};

const recordMarketplaceActivity = (input: {
  actorId: string;
  actorRole: any;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
}) => {
  db.recordActivity({
    actorId: input.actorId,
    actorRole: input.actorRole,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    summary: input.summary,
  });
};

const getAdminAlertRecipients = async () => {
  const configured = String(ADMIN_ALERT_EMAIL || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length) {
    return configured;
  }

  const users = prismaRuntime.enabled ? await prismaRuntime.getAllUsers() : db.getAllUsers();
  return users
    .filter((user) => ['admin', 'super_admin', 'finance_manager', 'support_agent'].includes(String(user.role)))
    .map((user) => String(user.email || '').trim().toLowerCase())
    .filter(Boolean);
};

const formatOperationalStatusLabel = (status?: string) =>
  normalizeOperationalStatus(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const summarizeOrderItems = (order: any) =>
  Array.isArray(order?.items) && order.items.length
    ? order.items
        .map((item: any) => `${item.title || item.productId || 'Product'} x${Number(item.quantity || 1)}`)
        .join(', ')
    : order?.productId
    ? `${order.productId} x${Number(order.quantity || 1)}`
    : 'Marketplace item';

const toCurrency = (amount: number) => `AED ${Number(amount || 0).toFixed(2)}`;
const toDateTimeLabel = (value?: string) => {
  const parsed = new Date(String(value || ''));
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString('en-AE');
};

const buildOrderFacts = (order: any, sellerName?: string) => [
  { label: 'Order ID', value: order.orderId || order.id || '-' },
  { label: 'Seller', value: sellerName || order.sellerName || 'Marketplace Seller' },
  { label: 'Customer', value: order.customerName || '-' },
  { label: 'Items', value: summarizeOrderItems(order) },
  { label: 'Subtotal', value: toCurrency(order.subtotal || 0) },
  { label: 'Shipping', value: toCurrency(order.shippingCost || 0) },
  { label: 'VAT', value: toCurrency(order.vatAmount || 0) },
  { label: 'Total', value: toCurrency(order.totalAmount || order.subtotal || 0) },
  { label: 'Payment method', value: String(order.paymentMethod || 'cod').toUpperCase() },
  { label: 'Payment status', value: String(order.paymentStatus || 'pending').replace(/_/g, ' ') },
  { label: 'Order date', value: order.createdAt ? toDateTimeLabel(order.createdAt) : toDateTimeLabel(new Date().toISOString()) },
  {
    label: 'Shipping address',
    value:
      typeof order.shippingAddress === 'string'
        ? order.shippingAddress
        : [
            order.shippingAddress?.addressLine,
            order.shippingAddress?.area,
            order.shippingAddress?.emirate,
            order.shippingAddress?.building,
          ]
            .filter(Boolean)
            .join(', ') || '-',
  },
];

const sendAdminAlert = async (subject: string, title: string, intro: string, facts: Array<{ label: string; value: string }> = []) => {
  const recipients = await getAdminAlertRecipients();
  if (!recipients.length) return;
  await sendTransactionalEmail({
    to: recipients,
    subject,
    title,
    intro,
    facts,
    ctaLabel: 'Open Admin Panel',
    ctaUrl: `${APP_URL}/admin`,
    outro: 'This alert was generated automatically by ExShopi marketplace operations.',
  });
};

const sendSellerNotice = async (
  sellerEmail: string,
  subject: string,
  title: string,
  intro: string,
  facts: Array<{ label: string; value: string }> = []
) => {
  await sendTransactionalEmail({
    to: sellerEmail,
    subject,
    title,
    intro,
    facts,
    ctaLabel: 'Open Seller Center',
    ctaUrl: `${APP_URL}/seller`,
    outro: 'You can review the latest action inside your ExShopi Seller Center.',
  });
};

const sendCustomerNotice = async (
  customerEmail: string,
  subject: string,
  title: string,
  intro: string,
  facts: Array<{ label: string; value: string }> = []
) => {
  await sendTransactionalEmail({
    to: customerEmail,
    subject,
    title,
    intro,
    facts,
    ctaLabel: 'Track Order',
    ctaUrl: `${APP_URL}/account?tab=orders`,
    outro: 'Thank you for shopping with ExShopi.',
  });
};

const hasAdminOrderNotificationEvent = (events: Array<{ status?: string }> = []) =>
  events.some((event) => String(event?.status || '').toLowerCase() === 'admin_order_notified');

const notifyAdminsOfNewOrder = async (order: any, seller?: any) => {
  try {
    const trackingEvents = prismaRuntime.enabled
      ? await prismaRuntime.getOrderTracking(order.id)
      : db.getOrderTracking(order.id);

    if (hasAdminOrderNotificationEvent(trackingEvents)) {
      console.info('[orders.notify-admin] Skipping duplicate order email', {
        orderId: order.id,
        orderNumber: order.orderId || order.orderNumber,
      });
      return { ok: true, skipped: true, reason: 'already_sent' };
    }

    const shippingAddress = order.shippingAddress || {};
    const deliveryAddress = [
      shippingAddress.addressLine,
      shippingAddress.building,
      shippingAddress.flat,
      shippingAddress.area,
      shippingAddress.emirate,
    ]
      .filter(Boolean)
      .join(', ');

    const result = await sendNewOrderNotificationToAdmin({
      orderId: String(order.id || ''),
      orderNumber: order.orderId || order.orderNumber || String(order.id || '').slice(-8),
      customerName: order.customerName || 'Customer',
      customerPhone: normalizePhone(order.customerPhone || ''),
      customerEmail: order.customerEmail || '',
      deliveryAddress: deliveryAddress || 'No address provided',
      emirate: shippingAddress.emirate || 'UAE',
      paymentMethod: order.paymentMethod || 'cod',
      paymentStatus: order.paymentStatus || 'pending',
      deliveryType: order.deliveryType || shippingAddress.method || 'Standard Delivery',
      orderStatus: formatOperationalStatusLabel(deriveOperationalStatus(order, trackingEvents)),
      trackingCode: order.trackingCode || '',
      sellerName: seller?.storeName || order.sellerName || 'ExShopi Official',
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            title: item.title || 'Marketplace item',
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            lineTotal: Number(item.subtotal || Number(item.unitPrice || 0) * Number(item.quantity || 1)),
            sku: item.sku || '',
            variant: '',
          }))
        : [],
      subtotal: Number(order.subtotal || 0),
      deliveryFee: Number(order.shippingCost || order.deliveryFee || 0),
      vatAmount: Number(order.vatAmount || 0),
      discountAmount: Number(order.discountAmount || 0),
      totalAmount: Number(order.totalAmount || 0),
      commission: Number(order.commission || 0),
      sellerPayoutAmount: Number(order.sellerAmount || 0),
      orderDate: order.createdAt || new Date().toISOString(),
    });

    console.info('[orders.notify-admin] Order email result', {
      orderId: order.id,
      orderNumber: order.orderId || order.orderNumber,
      recipients: result.recipients,
      ok: result.ok,
      skipped: result.skipped,
      reason: result.reason || '',
    });

    if (result.ok) {
      const note = `Admin order email sent to ${(result.recipients || []).join(', ')}`;
      if (prismaRuntime.enabled) {
        await prismaRuntime.addTrackingEvent(order.id, 'admin_order_notified', new Date().toISOString(), note);
      } else {
        db.addTrackingEvent(order.id, 'admin_order_notified', new Date().toISOString(), note);
      }
    }

    return result;
  } catch (error) {
    console.warn('[orders.notify-admin] Failed to send admin order email:', error);
    return { ok: false, skipped: false, reason: String(error) };
  }
};

const normalizeCategoryPayload = (payload: any) => {
  const slug = slugifyProduct(payload?.slug || payload?.name || 'category');
  return {
    ...payload,
    slug,
    seo: {
      metaTitle: normalizeSeoText(payload?.seo?.metaTitle || ''),
      metaDescription: normalizeSeoText(payload?.seo?.metaDescription || ''),
      keywords: uniqueSeoKeywords(String(payload?.seo?.keywords || '').split(',')).join(', '),
      introText: normalizeSeoText(payload?.seo?.introText || ''),
    },
  };
};

const ensureUniqueProductSlug = async (slugValue: string, currentId?: string) => {
  const products = prismaRuntime.enabled
    ? await prismaRuntime.getAllProductsForAdmin()
    : supabaseRuntime.enabled
    ? await supabaseRuntime.getAllProductsForAdmin()
    : db.getAllProducts();

  return ensureUniqueSlug(slugValue || 'product', {
    currentId,
    exists: async (candidate) =>
      (products || []).some(
        (product: any) =>
          slugifyProduct(product?.slug || product?.title || '') === candidate &&
          String(product?.id || '') !== String(currentId || '')
      ),
  });
};

const buildPersistedProductSeo = async (input: any, currentId?: string) => {
  const requestedSeo = productSeoSchema.parse({
    slug: input?.slug,
    metaTitle: input?.metaTitle,
    metaDescription: input?.metaDescription,
    metaKeywords: input?.metaKeywords,
    canonicalUrl: input?.canonicalUrl,
    ogTitle: input?.ogTitle,
    ogDescription: input?.ogDescription,
    ogImage: input?.ogImage,
  });

  const generated = generateProductSeoPayload({
    title: input?.title,
    slug: requestedSeo.slug || input?.slug || input?.title,
    metaTitle: requestedSeo.metaTitle || input?.specs?.metaTitle,
    metaDescription: requestedSeo.metaDescription || input?.specs?.metaDescription,
    metaKeywords: requestedSeo.metaKeywords || input?.specs?.metaKeywords,
    canonicalUrl: requestedSeo.canonicalUrl || input?.specs?.canonicalUrl,
    ogTitle: requestedSeo.ogTitle || input?.specs?.ogTitle,
    ogDescription: requestedSeo.ogDescription || input?.specs?.ogDescription,
    ogImage: requestedSeo.ogImage || input?.specs?.ogImage || input?.image,
    shortDescription: input?.specs?.shortDescription,
    description: input?.description,
    category: input?.specs?.parentCategoryName || input?.category,
    subcategory: input?.specs?.subcategoryName || input?.subcategory,
    image: input?.image,
  });

  const slug = await ensureUniqueProductSlug(generated.slug || input?.title || 'product', currentId);
  return { ...generated, slug };
};

const getProductSeoMeta = (product: any) => {
  return generateProductSeoPayload({
    title: product?.title,
    slug: product?.slug || product?.specs?.slug,
    metaTitle: product?.metaTitle || product?.specs?.metaTitle,
    metaDescription: product?.metaDescription || product?.specs?.metaDescription,
    metaKeywords: product?.metaKeywords || product?.specs?.metaKeywords,
    canonicalUrl: product?.canonicalUrl || product?.specs?.canonicalUrl,
    ogTitle: product?.ogTitle || product?.specs?.ogTitle,
    ogDescription: product?.ogDescription || product?.specs?.ogDescription,
    ogImage: product?.ogImage || product?.specs?.ogImage || product?.image,
    shortDescription: product?.specs?.shortDescription,
    description: product?.description,
    category: product?.specs?.parentCategoryName || product?.category,
    subcategory: product?.specs?.subcategoryName || product?.subcategory,
    image: product?.image,
  });
};

const getProductCanonicalPath = (product: any) => {
  const canonicalAssignment = resolveCanonicalCategoryAssignment(product);
  const parentSlug = slugifyProduct(
    canonicalAssignment.parentCategorySlug ||
      product?.specs?.parentCategorySlug ||
      product?.specs?.categorySlug ||
      product?.category ||
      'electronics'
  );
  const subcategorySlug = slugifyProduct(
    canonicalAssignment.subcategorySlug ||
      product?.specs?.subcategorySlug ||
      product?.specs?.templateId ||
      product?.subcategory ||
      'products'
  );
  const seo = getProductSeoMeta(product);
  return `/${parentSlug}/${subcategorySlug}/${seo.slug}`;
};

const escapeXml = (value: string) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const BLOG_SITEMAP_SLUGS = ['best-laptops-uae', 'macbook-buying-guide'];
const STATIC_SITEMAP_PATHS = [
  '/',
  '/products',
  '/blog',
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/return-policy',
  '/warranty',
  '/support',
  '/sell-on-exshopi',
  '/promotions',
  '/campaigns/current',
  '/brands/apple',
  '/brands/samsung',
  '/brands/dell',
  '/brands/hp',
  '/brands/lenovo',
  '/brands/acer',
  '/brands/asus',
  '/brands/gaming',
  '/buy-iphone-uae',
  '/cheap-macbook-dubai',
  '/electronics-online-uae',
  '/refurbished-laptops-uae',
  '/saudi-arabia',
  '/ksa',
  '/buy-used-laptops-in-saudi-arabia',
];
const PRIVATE_ROBOTS_PATHS = [
  '/admin',
  '/seller',
  '/dashboard',
  '/checkout',
  '/cart',
  '/account',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];
const PRODUCTS_PER_SITEMAP = 5000;

const getSitemapMeta = (pathname: string) => {
  if (pathname === '/') return { changefreq: 'daily', priority: '1.0' };
  if (pathname.startsWith('/electronics/') || pathname.startsWith('/category/') || pathname === '/products') {
    return { changefreq: 'daily', priority: '0.9' };
  }
  if (pathname.startsWith('/brands/') || pathname.startsWith('/campaigns') || pathname.startsWith('/promotions')) {
    return { changefreq: 'weekly', priority: '0.7' };
  }
  if (pathname.startsWith('/blog')) return { changefreq: 'monthly', priority: '0.6' };
  return { changefreq: 'weekly', priority: '0.7' };
};

const xmlUrlSet = (entries: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .sort((left, right) => left.loc.localeCompare(right.loc))
  .map(
    (entry) =>
      `  <url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
  )
  .join('\n')}
</urlset>`;

const xmlSitemapIndex = (entries: Array<{ loc: string; lastmod: string }>) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <sitemap><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod></sitemap>`)
  .join('\n')}
</sitemapindex>`;

type SitemapUrlEntry = { loc: string; lastmod: string; changefreq: string; priority: string };

const flattenCategoryIds = (categories: Array<any>) => {
  const ids = new Set<string>();
  for (const category of categories || []) {
    if (category?.id) ids.add(String(category.id));
    for (const child of category?.subcategories || []) {
      if (child?.id) ids.add(String(child.id));
    }
  }
  return ids;
};

const resolveEffectiveProductStatus = (product: any) => getProductLifecycleState(product).effectiveStatus;

const buildSoftDeleteProductPayload = (product: any) => {
  const deletedAt = new Date().toISOString();
  const specs = (product?.specs || product?.specsJson || {}) as Record<string, any>;

  return {
    status: 'archived',
    productStatus: 'archived',
    visibilityStatus: 'hidden',
    isDeleted: true,
    deletedAt,
    specs: {
      ...specs,
      __deletion: {
        ...((specs.__deletion as Record<string, any>) || {}),
        isDeleted: true,
        deletedAt,
      },
    },
  } as const;
};

const deriveAdminLifecycle = (payload: any) => {
  const requestedStatus = String(payload?.status || payload?.productStatus || payload?.approvalStatus || 'live');
  const normalizedStatus =
    requestedStatus === 'pending_approval'
      ? 'pending'
      : ['draft', 'pending', 'approved', 'live', 'rejected', 'archived'].includes(requestedStatus)
      ? requestedStatus
      : 'live';

  switch (normalizedStatus) {
    case 'draft':
      return {
        status: 'draft',
        approvalStatus: 'pending',
        productStatus: 'draft',
        visibilityStatus: 'hidden',
      } as const;
    case 'pending':
      return {
        status: 'pending',
        approvalStatus: 'pending',
        productStatus: 'pending_approval',
        visibilityStatus: 'hidden',
      } as const;
    case 'approved':
      return {
        status: 'live',
        approvalStatus: 'approved',
        productStatus: 'live',
        visibilityStatus: 'live',
      } as const;
    case 'rejected':
      return {
        status: 'rejected',
        approvalStatus: 'rejected',
        productStatus: 'rejected',
        visibilityStatus: 'hidden',
      } as const;
    case 'archived':
      return {
        status: 'archived',
        approvalStatus: payload?.approvalStatus === 'approved' ? 'approved' : 'pending',
        productStatus: 'archived',
        visibilityStatus: 'archived',
      } as const;
    case 'live':
    default:
      return {
        status: 'live',
        approvalStatus: 'approved',
        productStatus: 'live',
        visibilityStatus: 'live',
      } as const;
  }
};

const assertAdminProductRequirements = (payload: any, lifecycleStatus: string) => {
  if (lifecycleStatus === 'draft') {
    return;
  }

  if (!String(payload?.categoryId || '').trim()) {
    throw new Error('Category is required.');
  }
  if (!String(payload?.title || '').trim()) {
    throw new Error('Product title is required.');
  }
  if (!String(payload?.description || '').trim()) {
    throw new Error('Product description is required.');
  }
  if (!Number.isFinite(Number(payload?.price)) || Number(payload?.price) < 0) {
    throw new Error('A valid product price is required.');
  }
  const allImages = [payload?.image, ...(Array.isArray(payload?.images) ? payload.images : [])].filter(Boolean);
  if (!allImages.length) {
    throw new Error('At least one product image is required.');
  }
};

const resolveAdminAssignedSeller = async (requestedSellerId?: string) => {
  const desiredSellerId = requestedSellerId || 'exshopi_official';

  if (prismaRuntime.enabled) {
    const direct = await prismaRuntime.getSeller(desiredSellerId);
    if (direct) return direct;

    if (!requestedSellerId || requestedSellerId === 'exshopi_official') {
      const slugMatch = await prismaRuntime.getSellerBySlug('exshopi-official');
      if (slugMatch) return slugMatch;
      const sellers = await prismaRuntime.getAllSellers();
      const official = sellers.find((seller) => seller.isOfficial);
      if (official) return official;
    }
    return null;
  }

  return db.getSeller(desiredSellerId) || db.getSeller('exshopi_official') || db.getAllSellers().find((seller) => seller.isOfficial) || null;
};

const decorateCategory = (category: any) => {
  const interestCount = db
    .getAnalyticsEvents()
    .filter(
      (event) =>
        event.eventType === 'category_interest' &&
        (event.entityId === category.id || event.metadata?.categorySlug === category.slug)
    ).length;

  return {
    ...category,
    active: typeof category.active === 'boolean' ? category.active : ACTIVE_CATEGORY_SLUGS.has(category.slug),
    comingSoonMessage:
      category.comingSoonMessage || "We're preparing amazing products in this category",
    bannerImage: category.bannerImage || '',
    interestCount,
  };
};

// Middleware - Enhanced Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // For inline scripts (Vite injects styles/scripts)
        "'unsafe-eval'", // For dynamic code (Vite/React dev tools)
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://apis.google.com",
        "https://www.gstatic.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http://localhost:*",
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://firebaseremoteconfig.googleapis.com",
        "https://firebaseinstallations.googleapis.com",
        "https://www.googleapis.com",
        "https://accounts.google.com",
        "ws://localhost:*",
        "http://localhost:*",
        "https://*.supabase.co",
        "https://*.firebaseapp.com",
        "https://*.cloudinary.com",
        "https://api.stripe.com",
        "https://resend.com",
      ],
      frameSrc: [
        "'self'",
        "https://www.stripe.com",
        "https://js.stripe.com",
      ],
      mediaSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      // Removed upgradeInsecureRequests for helmet@8 compatibility
    },
    reportOnly: process.env.NODE_ENV !== "production",
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'sameorigin',
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  xssFilter: true,
  noSniff: true,
}));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      const requestPath = String(req.path || '');
      if (req.method !== 'GET') return false;

      return (
        requestPath === '/api/events/stream' ||
        requestPath === '/api/products' ||
        requestPath.startsWith('/api/products/') ||
        requestPath === '/api/categories' ||
        requestPath.startsWith('/api/categories/')
      );
    },
  })
);
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));
void ensureUploadDir().catch((error) => {
  console.error('[boot] upload dir initialization failed', error);
});
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));
// Serve public static assets (images, favicons, site.webmanifest, etc.)
// Must be before any SPA/catch-all handlers so assets are served correctly
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: IS_PRODUCTION ? '30d' : 0,
  index: false,
}));

// Simple SSE hub for broadcasting lightweight marketplace events (product updates/deletes)
const sseClients = new Set<Response>();

function sendSseEvent(eventName: string, data: any) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      (client as any).write(payload);
    } catch (err) {
      try {
        sseClients.delete(client);
      } catch (e) {
        /* ignore */
      }
    }
  }
}

const refreshCookieOptions: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
} = {
  httpOnly: true,
  // Only require secure cookies in production (HTTPS).
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? 'none' : 'lax',
  path: '/',
};

const clearRefreshCookieOptions = {
  ...refreshCookieOptions,
  maxAge: 0,
};

const setRefreshCookies = (res: Response, refreshToken: string) => {
  res.cookie('refresh_token', refreshToken, refreshCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

const clearRefreshCookies = (res: Response) => {
  res.clearCookie('refresh_token', clearRefreshCookieOptions);
  res.clearCookie('refreshToken', clearRefreshCookieOptions);
};

const resolveRefreshToken = (req: Request) => {
  const bodyToken =
    typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';
  return (
    req.cookies?.refresh_token ||
    req.cookies?.refreshToken ||
    bodyToken ||
    ''
  );
};

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/api/events/stream', (req: Request, res: Response) => {
  // Keep a very small, public, unauthenticated stream for UI updates (delete/update events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  try {
    res.flushHeaders?.();
  } catch (e) {
    // ignore if not available
  }
  // initial heartbeat
  (res as any).write(':ok\n\n');
  sseClients.add(res);
  req.on('close', () => {
    try {
      sseClients.delete(res);
    } catch (e) {
      /* ignore */
    }
  });
});

const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const sellerApplicationSchema = z.object({
  businessName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  businessType: z.string().min(2).max(50).default('individual'),
  country: z.string().min(2).max(80).default('UAE'),
  city: z.string().min(2).max(80).default('Dubai'),
  warehouseAddress: z.string().max(240).optional().default(''),
  vatTrn: z.string().max(60).optional().default(''),
  documents: z.array(z.string().min(1)).max(20).default([]),
  logo: z.string().optional().default(''),
  banner: z.string().optional().default(''),
  about: z.string().max(1000).optional().default(''),
  policies: z.record(z.string(), z.string()).optional().default({}),
  bankDetails: z.record(z.string(), z.string()).optional().default({}),
});

const sellerApplicationReviewSchema = z.object({
  notes: z.string().max(1000).optional().default(''),
  reason: z.string().max(1000).optional().default(''),
});

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  image: z.string().optional(),
});

const createOrderSchema = z.object({
  sellerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1).optional(),
  productId: z.string().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  shippingCost: z.coerce.number().nonnegative().optional(),
  shippingAddress: z.object({
    emirate: z.string().min(2),
    area: z.string().min(2),
    building: z.string().min(2),
    flat: z.string().optional().default(''),
    landmark: z.string().optional().default(''),
    addressLine: z.string().min(5),
    method: z.string().optional().default('standard'),
  }),
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  verificationToken: z.string().min(8),
  paymentMethod: z.enum(['cod']).default('cod'),
  deliveryCountry: z.string().min(2).max(10).default('AE'),
  deliveryType: z.string().optional().default('Standard UAE Delivery'),
});

const codOtpSendSchema = z.object({
  phone: z.string().min(7),
  email: z.string().email(),
  country: z.string().optional().default('AE'),
});

const codOtpVerifySchema = z.object({
  sessionId: z.string().min(8),
  code: z.string().min(4).max(8),
});

const blacklistEntrySchema = z.object({
  type: z.enum(['phone', 'email', 'ip']),
  value: z.string().min(2),
  reason: z.string().min(3).max(300),
});

const stripeCheckoutSchema = z.object({
  items: z.array(
    z.object({
      sellerId: z.string().min(1),
      productId: z.string().min(1),
      quantity: z.coerce.number().int().positive().default(1),
      unitPrice: z.coerce.number().nonnegative().optional(),
      variantId: z.string().optional(),
      sku: z.string().optional(),
      image: z.string().optional(),
    })
  ).min(1),
  shippingAddress: z.object({
    emirate: z.string().min(2),
    area: z.string().min(2),
    building: z.string().optional().default(''),
    flat: z.string().optional().default(''),
    addressLine: z.string().min(3),
    method: z.string().optional().default('standard'),
  }),
  deliveryCountry: z.string().min(2).max(10).default('AE'),
});

const productPayloadSchema = z.object({
  categoryId: z.string().min(1),
  slug: z.string().max(140).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogTitle: z.string().max(120).optional(),
  ogDescription: z.string().max(220).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(20000),
  price: z.coerce.number().nonnegative(),
  priceUae: z.coerce.number().nonnegative().optional(),
  priceKsa: z.coerce.number().nonnegative().optional(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  compareAtPriceUae: z.coerce.number().nonnegative().optional(),
  compareAtPriceKsa: z.coerce.number().nonnegative().optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  image: z.string().min(1),
  images: z.array(z.string().min(1)).optional().default([]),
  stock: z.coerce.number().int().nonnegative().default(0),
  sku: z.string().min(2).max(120).optional(),
  specs: z.any().optional(),
  badges: z.array(z.string()).optional().default([]),
  brand: z.string().optional().default(''),
  status: z.enum(['draft', 'pending', 'pending_approval']).optional(),
});

const adminProductLifecycleStatusSchema = z.enum([
  'draft',
  'pending',
  'approved',
  'live',
  'rejected',
  'archived',
]);

const adminProductPayloadSchema = z.object({
  sellerId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  slug: z.string().max(140).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(500).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogTitle: z.string().max(120).optional(),
  ogDescription: z.string().max(220).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(20000).optional().default(''),
  price: z.coerce.number().nonnegative().optional(),
  priceUae: z.coerce.number().nonnegative().optional(),
  priceKsa: z.coerce.number().nonnegative().optional(),
  originalPrice: z.coerce.number().nonnegative().optional(),
  compareAtPriceUae: z.coerce.number().nonnegative().optional(),
  compareAtPriceKsa: z.coerce.number().nonnegative().optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  image: z.string().optional().default(''),
  images: z.array(z.string().min(1)).optional().default([]),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
  rating: z.coerce.number().nonnegative().optional().default(0),
  reviews: z.coerce.number().int().nonnegative().optional().default(0),
  sku: z.string().max(120).optional().default(''),
  specs: z.any().optional().default({}),
  badges: z.array(z.string()).optional().default([]),
  brand: z.string().optional().default(''),
  status: adminProductLifecycleStatusSchema.optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  productStatus: z
    .enum(['draft', 'pending', 'pending_approval', 'approved', 'live', 'rejected', 'archived', 'out_of_stock'])
    .optional(),
  visibilityStatus: z.enum(['hidden', 'live', 'archived']).optional(),
  ownership: z.enum(['seller', 'official']).optional(),
  createdByRole: z.enum(['seller', 'admin']).optional(),
  approvalNotes: z.string().max(2000).optional().default(''),
  rejectionReason: z.string().max(2000).optional().default(''),
  approvalRequestedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  views: z.coerce.number().nonnegative().optional().default(0),
  wishlistCount: z.coerce.number().nonnegative().optional().default(0),
});

const supportTicketSchema = z.object({
  subject: z.string().min(3).max(180),
  description: z.string().min(5).max(5000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  orderId: z.string().optional(),
  productId: z.string().optional(),
  payoutRequestId: z.string().optional(),
  sellerId: z.string().optional(),
  customerId: z.string().optional(),
});

const supportMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  attachmentUrl: z.string().optional(),
});

const adminDashboardQuerySchema = z.object({
  range: z.enum(['today', 'yesterday', '7d', '30d', 'this_month', 'custom']).optional().default('30d'),
  from: z.string().optional(),
  to: z.string().optional(),
});

const uploadPayloadSchema = z.object({
  dataUrl: z.string().min(20),
  folder: z.string().min(1).max(120).default('general'),
  fileName: z.string().max(120).optional(),
});

const parseAdminDateRange = (query: unknown) => {
  const parsed = adminDashboardQuerySchema.parse(query || {});
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (parsed.range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (parsed.range === 'yesterday') {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (parsed.range === '7d') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (parsed.range === 'this_month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (parsed.range === '30d') {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else {
    const customStart = parsed.from ? new Date(parsed.from) : new Date(now);
    const customEnd = parsed.to ? new Date(parsed.to) : new Date(now);
    if (!Number.isNaN(customStart.getTime())) {
      start.setTime(customStart.getTime());
      start.setHours(0, 0, 0, 0);
    }
    if (!Number.isNaN(customEnd.getTime())) {
      end.setTime(customEnd.getTime());
      end.setHours(23, 59, 59, 999);
    }
  }

  return {
    range: parsed.range,
    from: start,
    to: end,
  };
};

const isBetweenDates = (value: unknown, from: Date, to: Date) => {
  if (!value) return false;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return false;
  return date >= from && date <= to;
};

const calculateMarketplaceHealthScore = (input: {
  pendingApprovals: number;
  lowStockProducts: number;
  returnRequestedOrders: number;
  failedPayments: number;
  payoutRiskCount: number;
  flaggedVendors: number;
  totalOrders: number;
  totalProducts: number;
}) => {
  const orderBase = Math.max(input.totalOrders, 1);
  const productBase = Math.max(input.totalProducts, 1);
  let score = 100;
  score -= Math.min(input.pendingApprovals * 1.6, 14);
  score -= Math.min((input.lowStockProducts / productBase) * 40, 12);
  score -= Math.min((input.returnRequestedOrders / orderBase) * 100, 18);
  score -= Math.min(input.failedPayments * 2, 12);
  score -= Math.min(input.payoutRiskCount * 2.5, 16);
  score -= Math.min(input.flaggedVendors * 3, 18);
  return Math.max(38, Math.round(score));
};

const computeProductModerationSignals = (product: any, allProducts: any[]) => {
  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const title = String(product.title || '');
  const description = String(product.description || '');
  const price = Number(product.price || 0);
  const stock = Number(product.stock || 0);
  const duplicateCount = allProducts.filter((entry) => {
    if (entry.id === product.id) return false;
    const sameSku = product.sku && entry.sku && String(entry.sku).trim().toLowerCase() === String(product.sku).trim().toLowerCase();
    const sameTitle = String(entry.title || '').trim().toLowerCase() === title.trim().toLowerCase();
    return sameSku || sameTitle;
  }).length;

  const titleQuality = title.length >= 35 ? 'strong' : title.length >= 20 ? 'medium' : 'weak';
  const descriptionCompleteness = description.length >= 180 ? 'strong' : description.length >= 80 ? 'medium' : 'weak';
  const imageCount = images.length;
  const priceAnomaly =
    price <= 0 || price > 25000 || price < 10 || (product.originalPrice && price > Number(product.originalPrice));

  return {
    imageCount,
    titleQuality,
    descriptionCompleteness,
    priceAnomaly,
    categoryMismatch: !product.categoryId,
    duplicateProductDetection: duplicateCount > 0,
    missingSku: !product.sku,
    invalidStock: stock < 0,
    missingPrice: price <= 0,
    missingImage: imageCount === 0,
    qualityScore: Math.max(
      35,
      100 -
        (imageCount < 5 ? 18 : 0) -
        (titleQuality === 'weak' ? 16 : titleQuality === 'medium' ? 8 : 0) -
        (descriptionCompleteness === 'weak' ? 14 : descriptionCompleteness === 'medium' ? 6 : 0) -
        (priceAnomaly ? 16 : 0) -
        (duplicateCount > 0 ? 12 : 0) -
        (!product.sku ? 8 : 0)
    ),
  };
};

const serializeMarketplaceProduct = (product: any) => {
  const seller = db.getSeller(product.sellerId);
  const isOfficialStore = Boolean(seller?.isOfficial || product.sellerId === 'exshopi_official');
  const sellerName = seller?.storeName || (isOfficialStore ? 'ExShopi Official' : 'Marketplace Seller');
  const sellerStoreSlug = seller?.storeSlug || (isOfficialStore ? 'exshopi-official' : 'marketplace-seller');
  const seo = getProductSeoMeta(product);
  const canonicalAssignment = resolveCanonicalCategoryAssignment(product);
  const mergedSpecs = {
    ...(product.specs || {}),
    parentCategorySlug:
      canonicalAssignment.parentCategorySlug ||
      product.specs?.parentCategorySlug ||
      product.specs?.categorySlug ||
      '',
    categorySlug:
      canonicalAssignment.categorySlug ||
      product.specs?.categorySlug ||
      product.specs?.parentCategorySlug ||
      '',
    subcategorySlug:
      canonicalAssignment.subcategorySlug ||
      product.specs?.subcategorySlug ||
      product.specs?.templateId ||
      '',
    parentCategoryName:
      canonicalAssignment.parentCategoryName ||
      product.specs?.parentCategoryName ||
      '',
    categoryName:
      canonicalAssignment.categoryName ||
      product.specs?.categoryName ||
      '',
    subcategoryName:
      canonicalAssignment.subcategoryName ||
      product.specs?.subcategoryName ||
      product.specs?.templateName ||
      '',
    categoryPath:
      canonicalAssignment.categoryPath ||
      product.specs?.categoryPath ||
      '',
  };

  return {
    ...product,
    specs: mergedSpecs,
    slug: seo.slug,
    isDeleted: isSoftDeletedProduct(product),
    deletedAt: product.deletedAt || product.specs?.__deletion?.deletedAt || '',
    seller,
    sellerName,
    sellerStoreSlug,
    sellerLogo: seller?.logo || '',
    soldByLabel: `Sold by ${sellerName}`,
    isOfficialStore,
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
      (product.status === 'live' || product.status === 'approved' ? 'live' : 'hidden'),
    ownership: product.ownership || (isOfficialStore ? 'official' : 'seller'),
    createdByRole: product.createdByRole || (isOfficialStore ? 'admin' : 'seller'),
    views: Number(product.views || 0),
    wishlistCount: Number(product.wishlistCount || 0),
    brand: product.brand || product.specs?.attributes?.brand || '',
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    metaKeywords: seo.metaKeywords,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
    canonicalPath: getProductCanonicalPath({ ...product, slug: seo.slug, specs: mergedSpecs }),
    specifications:
      product.specifications ||
      mergedSpecs.specifications ||
      mergedSpecs.attributes ||
      {},
  };
};

const serializeMarketplaceOrder = (order: any) => {
  const seller = db.getSeller(order.sellerId);
  const customer = db.getUser(order.customerId);
  const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0] : null;
  const product = db.getProduct(firstItem?.productId || order.productId);
  const trackingEvents = db.getOrderTracking(order.id);
  const operationalStatus = deriveOperationalStatus(order, trackingEvents);
  const shippingAddress = order.shippingAddress || order.address || {};
  const risk = shippingAddress?.risk || {};
  const orderProducts = Array.isArray(order.items) && order.items.length
    ? order.items.map((item: any) => ({
        id: item.productId,
        title: item.title,
        quantity: Number(item.quantity || 1),
        price: Number(item.unitPrice || 0),
        image: item.image || '',
        sku: item.sku || '',
      }))
    : Array.isArray(order.products) && order.products.length
    ? order.products
    : [
        {
          id: firstItem?.productId || product?.id || order.productId || order.id,
          title: firstItem?.title || product?.title || order.productTitle || `Product ${order.productId || ''}`,
          quantity: order.quantity || 1,
          price: firstItem?.unitPrice || product?.price || order.unitPrice || order.subtotal || 0,
        },
      ];

  return {
    ...order,
    seller,
    sellerName: seller?.storeName || 'ExShopi Official',
    sellerStoreSlug: seller?.storeSlug || 'exshopi-official',
    customerName: order.customerName || customer?.name || 'Customer',
    customerEmail: order.customerEmail || customer?.email || '',
    customerPhone: order.customerPhone || customer?.phone || '',
    productTitle: firstItem?.title || product?.title || `Product ${order.productId}`,
    productImage: firstItem?.image || product?.image || '',
    products: orderProducts,
    items: order.items || [],
    paymentMethod: order.paymentMethod || 'cod',
    paymentProvider: order.paymentProvider || order.paymentMethod || 'cod',
    paymentReference: order.paymentReference || '',
    paymentSessionId: order.paymentSessionId || '',
    vatAmount: order.vatAmount || 0,
    totalAmount: order.totalAmount || order.subtotal + order.shippingCost + (order.vatAmount || 0),
    deliveryCountry: order.deliveryCountry || 'AE',
    deliveryEta: order.deliveryEta || '',
    shippingAddress,
    trackingCode: order.trackingCode || `TRK-${String(order.id).slice(-8)}`,
    barcodeReference: order.pickupQrCode || order.trackingCode || `BAR-${String(order.id).slice(-8)}`,
    subtotal: order.subtotal || 0,
    commission: order.commission || 0,
    sellerAmount: order.sellerAmount || Math.max((order.subtotal || 0) - (order.commission || 0), 0),
    refundStatus: order.refundStatus || 'none',
    refundReason: order.refundReason || '',
    refundAmount: order.refundAmount || 0,
    dispatchSlotDate: order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '',
    dispatchNotes: order.dispatchNotes || '',
    courierPartner: order.courierPartner || '',
    dispatchState: deriveDispatchState(operationalStatus),
    status: operationalStatus,
    operationalStatus,
    riskLevel: risk.riskLevel || 'normal',
    riskReasons: Array.isArray(risk.reasons) ? risk.reasons : [],
    orderSource: shippingAddress?.source || 'website',
    paymentCollected: Boolean(order.paidAt || order.paymentStatus === 'paid' || order.paymentStatus === 'completed'),
    trackingEvents,
  };
};

const serializeMarketplaceOrderAsync = async (order: any) => {
  if (!prismaRuntime.enabled) {
    return serializeMarketplaceOrder(order);
  }
  const seller = await prismaRuntime.getSeller(order.sellerId);
  const customer = await prismaRuntime.getUser(order.customerId);
  const trackingEvents = await prismaRuntime.getOrderTracking(order.id);
  const operationalStatus = deriveOperationalStatus(order, trackingEvents);
  const shippingAddress = order.shippingAddress || {};
  const risk = shippingAddress?.risk || {};
  const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0] : null;

  return {
    ...order,
    seller,
    sellerName: seller?.storeName || 'ExShopi Official',
    sellerStoreSlug: seller?.storeSlug || 'exshopi-official',
    customerName: order.customerName || customer?.name || 'Customer',
    customerEmail: order.customerEmail || customer?.email || '',
    customerPhone: order.customerPhone || customer?.phone || '',
    productTitle: firstItem?.title || order.products?.[0]?.title || 'Marketplace item',
    productImage: firstItem?.image || order.products?.[0]?.image || '',
    products: order.products || [],
    items: order.items || [],
    paymentMethod: order.paymentMethod || 'cod',
    paymentProvider: order.paymentProvider || order.paymentMethod || 'cod',
    paymentReference: order.paymentReference || '',
    paymentSessionId: order.paymentSessionId || '',
    vatAmount: order.vatAmount || 0,
    totalAmount: order.totalAmount || order.subtotal + order.shippingCost + (order.vatAmount || 0),
    deliveryCountry: order.deliveryCountry || 'AE',
    deliveryEta: order.deliveryEta || '',
    shippingAddress,
    trackingCode: order.trackingCode || `TRK-${String(order.id).slice(-8)}`,
    barcodeReference: order.pickupQrCode || order.trackingCode || `BAR-${String(order.id).slice(-8)}`,
    subtotal: order.subtotal || 0,
    commission: order.commission || 0,
    sellerAmount: order.sellerAmount || Math.max((order.subtotal || 0) - (order.commission || 0), 0),
    refundStatus: order.refundStatus || 'none',
    refundReason: order.refundReason || '',
    refundAmount: order.refundAmount || 0,
    dispatchSlotDate: order.dispatchSlotDate || '',
    dispatchSlotWindow: order.dispatchSlotWindow || '',
    dispatchNotes: order.dispatchNotes || '',
    courierPartner: order.courierPartner || '',
    dispatchState: deriveDispatchState(operationalStatus),
    status: operationalStatus,
    operationalStatus,
    riskLevel: risk.riskLevel || 'normal',
    riskReasons: Array.isArray(risk.reasons) ? risk.reasons : [],
    orderSource: shippingAddress?.source || 'website',
    paymentCollected: Boolean(order.paidAt || order.paymentStatus === 'paid' || order.paymentStatus === 'completed'),
    trackingEvents,
  };
};

const resolveCanonicalSellerForOrderItems = async (
  requestedSellerId: string,
  normalizedItems: Array<{ productId: string; quantity: number; unitPrice: number; variantId?: string; sku?: string; image?: string }>
) => {
  const requested = String(requestedSellerId || '').trim();
  const productSellerIds = new Set<string>();

  for (const item of normalizedItems) {
    const product = prismaRuntime.enabled ? await prismaRuntime.getProduct(item.productId) : db.getProduct(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const sellerId = String((product as any).sellerId || (product as any).storeId || '').trim();
    if (!sellerId) {
      throw new Error(`Product ${item.productId} is missing a seller/store assignment.`);
    }

    productSellerIds.add(sellerId);
  }

  if (!productSellerIds.size) {
    throw new Error('Could not determine a seller for this order.');
  }

  if (productSellerIds.size > 1) {
    throw new Error('Order items belong to multiple sellers. Please place each seller order separately.');
  }

  const [derivedSellerId] = Array.from(productSellerIds);
  const canonicalSellerId = requested && productSellerIds.has(requested) ? requested : derivedSellerId;
  const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(canonicalSellerId) : db.getSeller(canonicalSellerId);

  if (!seller) {
    throw new Error(`Seller not found for resolved store ${canonicalSellerId}.`);
  }

  return {
    seller,
    sellerId: canonicalSellerId,
    requestedSellerId: requested,
    sellerWasCorrected: Boolean(requested) && requested !== canonicalSellerId,
  };
};

const buildOrderPayloadFromItems = async ({
  customerId,
  sellerId,
  normalizedItems,
  shippingCost,
  shippingAddress,
  customerName,
  customerEmail,
  customerPhone,
  paymentMethod,
  paymentProvider,
  paymentStatus,
  deliveryCountry,
  paymentReference,
  paymentSessionId,
  paidAt,
}: {
  customerId: string;
  sellerId: string;
  normalizedItems: Array<{ productId: string; quantity: number; unitPrice: number; variantId?: string; sku?: string; image?: string }>; 
  shippingCost?: number;
  shippingAddress: any;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: 'cod' | 'card' | 'tabby' | 'tamara' | 'bank_transfer';
  paymentProvider: 'cod' | 'stripe' | 'tabby' | 'tamara' | 'bank_transfer';
  paymentStatus: 'pending' | 'awaiting_payment' | 'cod_pending' | 'completed' | 'paid' | 'failed';
  deliveryCountry: string;
  paymentReference?: string;
  paymentSessionId?: string;
  paidAt?: string;
}) => {
  const resolvedSeller = await resolveCanonicalSellerForOrderItems(sellerId, normalizedItems);
  const seller = resolvedSeller.seller;
  const resolvedSellerId = resolvedSeller.sellerId;
  const customer = prismaRuntime.enabled ? await prismaRuntime.getUser(customerId) : db.getUser(customerId);

  const settings = db.getMarketplaceSettings();
  const matchedCountry = settings.countries.find((country) => country.code === deliveryCountry) || settings.countries[0];
  const normalizedShippingCost = Number(shippingCost) || matchedCountry?.deliveryBaseAed || 10;
  const vatRate = (matchedCountry?.vatPercent || 0) / 100;
  const orderCurrency = deliveryCountry === 'SA' ? 'SAR' : 'AED';

  const items = await Promise.all(
    normalizedItems.map(async (item, index) => {
      const product = prismaRuntime.enabled ? await prismaRuntime.getProduct(item.productId) : db.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const productSellerId = String((product as any).sellerId || (product as any).storeId || '').trim();
      if (productSellerId !== resolvedSellerId) {
        throw new Error(`Product ${item.productId} does not belong to seller ${resolvedSellerId}`);
      }
      const quantity = Number(item.quantity || 1);
      // If a variantId is provided, prefer variant-specific values when available
      let variant: any = null;
      const specs: any = (product as any).specs || (product as any).specsJson || {};
      if (item.variantId && Array.isArray(specs?.variants)) {
        variant = specs.variants.find((v: any) => String(v.id) === String(item.variantId) || String(v.id) === String(item.variantId || '')) || null;
        if (!variant) {
          // try matching by color+storage composite id if variantId provided in that form
          variant = specs.variants.find((v: any) => {
            const composite = `${String(v.color || '').trim().toLowerCase()}::${String(v.storage || '').trim().toLowerCase()}`;
            return composite === String(item.variantId || '').trim().toLowerCase();
          }) || null;
        }
      }

      const effectiveUnitPrice = Number(
        item.unitPrice ??
          variant?.price ??
          (deliveryCountry === 'SA'
            ? ((product as any).priceKsa ?? (product as any).priceUae ?? product.salePrice ?? product.price)
            : ((product as any).priceUae ?? product.salePrice ?? product.price)) ??
          0
      );
      const lineSubtotal = effectiveUnitPrice * quantity;
      const lineCommission = Math.round(lineSubtotal * (settings.sellerCommissionPercent / 100));
      const lineVat = Math.round(lineSubtotal * vatRate);

      const effectiveSku = String(item.sku || variant?.sku || product.sku || '');
      const effectiveImage = String(item.image || variant?.image || product.image || '');
      const effectiveTitle = variant
        ? `${product.title}${[variant.color, variant.storage].filter(Boolean).length ? ' (' + [variant.color, variant.storage].filter(Boolean).join(' / ') + ')' : ''}`
        : product.title;

      return {
        id: `item_${Date.now()}_${index}`,
        productId: product.id,
        variantId: variant?.id || item.variantId || undefined,
        title: effectiveTitle,
        quantity,
        unitPrice: effectiveUnitPrice,
        compareAtPrice: Number(
          deliveryCountry === 'SA'
            ? ((product as any).compareAtPriceKsa ?? (product as any).compareAtPriceUae ?? product.originalPrice ?? 0)
            : ((product as any).compareAtPriceUae ?? product.originalPrice ?? 0)
        ) || undefined,
        priceSnapshotCountry: deliveryCountry,
        priceSnapshotCurrency: orderCurrency,
        subtotal: lineSubtotal,
        vatAmount: lineVat,
        commission: lineCommission,
        sellerAmount: lineSubtotal - lineCommission,
        sku: effectiveSku,
        image: effectiveImage,
      };
    })
  );

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const commission = items.reduce((sum, item) => sum + item.commission, 0);
  const sellerAmount = items.reduce((sum, item) => sum + item.sellerAmount, 0);
  const vatAmount = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalAmount = subtotal + normalizedShippingCost + vatAmount;

  return {
    customerId,
    sellerId: resolvedSellerId,
    productId: items[0].productId,
    items,
    products: items.map((item) => ({
      id: item.productId,
      title: item.title,
      quantity: item.quantity,
      price: item.unitPrice,
      image: item.image,
      sku: item.sku,
    })),
    customerName: customerName || customer?.name || '',
    customerEmail: customerEmail || customer?.email || '',
    customerPhone: customerPhone || customer?.phone || '',
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    unitPrice: items[0].unitPrice,
    subtotal,
    commission,
    sellerAmount,
    vatAmount,
    totalAmount,
    shippingCost: normalizedShippingCost,
    currency: orderCurrency,
    taxRate: vatRate,
    shippingAddress,
    paymentMethod,
    paymentProvider,
    paymentStatus,
    paymentReference: paymentReference || '',
    paymentSessionId: paymentSessionId || '',
    paidAt: paidAt || '',
    deliveryCountry,
    deliveryEta: deliveryCountry === 'AE' ? '1-2 business days' : '4-7 business days',
    refundStatus: 'none' as const,
    refundReason: '',
    refundAmount: 0,
    trackingCode: generateTrackingCode(),
    pickupQrCode: generateQRCode(),
    status: 'placed' as const,
    payoutStatus: 'pending' as const,
    orderId: generateOrderId(),
  };
};

const buildSessionPayload = (userId: string) => {
  const user = db.getUser(userId);
  if (!user) return null;
  const seller = db.getSellerByUserId(userId) || null;
  const sellerApplication = db.getSellerApplicationByUserId(userId) || null;
  const marketplaceSettings = db.getMarketplaceSettings();

  return {
    user: sanitizeUser(user),
    role: user.role,
    accessToken: signAccessToken({ id: user.id, role: user.role as any }),
    seller,
    sellerApplication,
    permissions: {
      canAccessAdmin: isBackofficeRole(user.role),
      canAccessSeller: user.role === 'seller' || !!sellerApplication,
      requiresSellerApproval: !!sellerApplication && sellerApplication.status !== 'approved',
      adminPermissions: ADMIN_PERMISSION_MATRIX[user.role] || [],
    },
    marketplace: {
      sellerCommissionPercent: marketplaceSettings.sellerCommissionPercent,
      monthlySellerFeeAed: marketplaceSettings.monthlySellerFeeAed,
      defaultCountry: marketplaceSettings.defaultCountry,
    },
  };
};

const buildSessionPayloadAsync = async (userId: string) => {
  if (!prismaRuntime.enabled) {
    return buildSessionPayload(userId);
  }

  let user = await prismaRuntime.getUser(userId);
  if (!user) {
    await prismaRuntime.ensureCoreAuthRecords();
    user = await prismaRuntime.getUser(userId);
  }
  if (!user) return null;
  const seller = await prismaRuntime.getSellerByUserId(userId);
  const sellerApplication = await prismaRuntime.getSellerApplicationByUserId(userId);
  const marketplaceSettings = db.getMarketplaceSettings();

  return {
    user: sanitizeUser(user),
    role: user.role,
    accessToken: signAccessToken({ id: user.id, role: user.role as any }),
    seller,
    sellerApplication,
    permissions: {
      canAccessAdmin: isBackofficeRole(user.role),
      canAccessSeller: user.role === 'seller' || !!sellerApplication,
      requiresSellerApproval: !!sellerApplication && sellerApplication.status !== 'approved',
      adminPermissions: ADMIN_PERMISSION_MATRIX[user.role] || [],
    },
    marketplace: {
      sellerCommissionPercent: marketplaceSettings.sellerCommissionPercent,
      monthlySellerFeeAed: marketplaceSettings.monthlySellerFeeAed,
      defaultCountry: marketplaceSettings.defaultCountry,
    },
  };
};

const serializeMarketplaceProductAsync = async (product: any) => {
  if (!prismaRuntime.enabled) {
    return serializeMarketplaceProduct(product);
  }
  const seller = await prismaRuntime.getSeller(product.storeId || product.sellerId);
  const isOfficialStore = Boolean(seller?.isOfficial || seller?.storeSlug === 'exshopi-official');
  const sellerName = seller?.storeName || (isOfficialStore ? 'ExShopi Official' : 'Marketplace Seller');
  const sellerStoreSlug = seller?.storeSlug || (isOfficialStore ? 'exshopi-official' : 'marketplace-seller');
  const effectiveStatus = resolveEffectiveProductStatus(product);
  const seo = getProductSeoMeta(product);

  return {
    ...product,
    slug: seo.slug,
    isDeleted: isSoftDeletedProduct(product),
    deletedAt: product.deletedAt || product.specs?.__deletion?.deletedAt || '',
    seller,
    sellerName,
    sellerStoreSlug,
    sellerLogo: seller?.logo || '',
    soldByLabel: `Sold by ${sellerName}`,
    isOfficialStore,
    status: effectiveStatus,
    approvalStatus:
      product.approvalStatus ||
      (effectiveStatus === 'rejected' ? 'rejected' : effectiveStatus === 'approved' || effectiveStatus === 'live' ? 'approved' : 'pending'),
    productStatus:
      product.productStatus ||
      (effectiveStatus === 'draft'
        ? 'draft'
        : effectiveStatus === 'rejected'
        ? 'rejected'
        : effectiveStatus === 'archived'
        ? 'archived'
        : effectiveStatus === 'approved'
        ? 'approved'
        : effectiveStatus === 'live'
        ? 'live'
        : Number(product?.stock || 0) <= 0
        ? 'out_of_stock'
        : 'pending_approval'),
    visibilityStatus:
      product.visibilityStatus ||
      (effectiveStatus === 'live' ? 'live' : effectiveStatus === 'archived' ? 'archived' : 'hidden'),
    ownership: product.ownership || (isOfficialStore ? 'official' : 'seller'),
    createdByRole: product.createdByRole || (isOfficialStore ? 'admin' : 'seller'),
    views: Number(product.views || 0),
    wishlistCount: Number(product.wishlistCount || 0),
    brand: product.brand || product.specs?.attributes?.brand || '',
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    metaKeywords: seo.metaKeywords,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImage,
    canonicalPath: getProductCanonicalPath({ ...product, slug: seo.slug }),
    specifications:
      product.specifications ||
      product.specs?.specifications ||
      product.specs?.attributes ||
      {},
  };
};

// ==================== USERS API ====================
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email().transform((value) => value.trim().toLowerCase()),
      password: z.string().min(8),
      phone: z.string().optional().default(''),
      role: z.enum(['customer', 'seller']).optional().default('customer'),
      country: z.string().optional().default('AE'),
    });

    const { name, email, password, phone, role, country } = await schema.parseAsync(req.body);

    const existingUser = prismaRuntime.enabled
      ? await prismaRuntime.getUserByEmail(email)
      : db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = prismaRuntime.enabled
      ? await prismaRuntime.createUser({
          name,
          email,
          password: passwordHash,
          phone,
          role,
          status: role === 'seller' ? 'pending' : 'active',
          country,
          emailVerified: true,
          sellerApplicationStatus: role === 'seller' ? 'draft' : null,
        })
      : db.createUser({
          name,
          email,
          password: passwordHash,
          phone,
          role,
          status: role === 'seller' ? 'pending' : 'active',
          country,
          emailVerified: true,
          sellerApplicationStatus: role === 'seller' ? 'draft' : null,
        });
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const refreshToken = signRefreshToken({ id: user.id, role: user.role as any });
    setRefreshCookies(res, refreshToken);

    const session = await buildSessionPayloadAsync(user.id);
    if (role === 'customer') {
      pushNotification({
        audience: 'customer',
        audienceId: user.id,
        title: 'Account created',
        message: 'Your ExShopi customer account is ready.',
        type: 'account_created',
        entityType: 'user',
        entityId: user.id,
      });
      await sendCustomerNotice(
        user.email,
        'Welcome to ExShopi',
        'Your account is ready',
        'Your ExShopi customer account has been created successfully.',
        [
          { label: 'Account name', value: user.name },
          { label: 'Email', value: user.email },
          { label: 'Country', value: user.country || 'AE' },
        ]
      );
    }
    res.json({
      ...session,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((issue) => issue.message).join(', ') });
    }
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email().transform((value) => value.trim().toLowerCase()),
      password: z.string().min(1),
    });
    const { email, password } = await schema.parseAsync(req.body);
    let user = prismaRuntime.enabled
      ? await prismaRuntime.getUserByEmail(email)
      : db.getUserByEmail(email);

    if (!user && prismaRuntime.enabled) {
      await prismaRuntime.ensureCoreAuthRecords();
      user = await prismaRuntime.getUserByEmail(email);
    }

    let passwordMatches = user ? await verifyPassword(password, user.password) : false;

    if (!passwordMatches && prismaRuntime.enabled && isCoreBackofficeCredential(email, password)) {
      await prismaRuntime.ensureCoreAuthRecords();
      user = await prismaRuntime.getUserByEmail(email);
      passwordMatches = Boolean(user);
    }

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!prismaRuntime.enabled) {
      await upgradeLegacyPasswordIfNeeded(user.id, password, user.password);
      db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
      db.createAnalyticsEvent({
        userId: user.id,
        role: user.role,
        eventType: 'login',
        entityType: 'user',
        entityId: user.id,
        metadata: { email: user.email },
      });
    } else {
      await prismaRuntime.updateUser(user.id, { lastLoginAt: new Date().toISOString() } as any);
    }

    const refreshToken = signRefreshToken({ id: user.id, role: user.role as any });
    setRefreshCookies(res, refreshToken);

    const session = await buildSessionPayloadAsync(user.id);
    res.json({
      ...session,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((issue) => issue.message).join(', ') });
    }
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/auth/session', async (req: Request, res: Response) => {
  try {
    const accessUser = tryAuthenticateRequest(req);
    let userId = accessUser?.id || '';
    let userRole = accessUser?.role || null;

    if (!userId) {
      const token = resolveRefreshToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Missing refresh token' });
      }

      const payload = verifyRefreshToken(token);
      userId = String(payload.sub);
      userRole = String(payload.role) as any;

      const nextRefreshToken = signRefreshToken({
        id: userId,
        role: userRole as any,
      });
      setRefreshCookies(res, nextRefreshToken);
    }

    const session = await buildSessionPayloadAsync(userId);
    if (!session) return res.status(404).json({ error: 'Session user not found' });
    res.json(session);
  } catch (error) {
    clearRefreshCookies(res);
    res.status(401).json({ error: 'Invalid or expired session' });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const token = resolveRefreshToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    const payload = verifyRefreshToken(token);
    const nextRefreshToken = signRefreshToken({
      id: String(payload.sub),
      role: String(payload.role) as any,
    });
    setRefreshCookies(res, nextRefreshToken);
    const session = await buildSessionPayloadAsync(String(payload.sub));
    if (!session) {
      clearRefreshCookies(res);
      return res.status(401).json({ error: 'Invalid refresh session' });
    }

    res.json({
      ...session,
      refreshToken: nextRefreshToken,
    });
  } catch (error) {
    clearRefreshCookies(res);
    res.status(401).json({ error: 'Refresh token expired or invalid' });
  }
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  clearRefreshCookies(res);
  res.json({ success: true });
});

app.post('/api/uploads/image', async (req: Request, res: Response) => {
  try {
    const payload = uploadPayloadSchema.parse(req.body);
    const result = await uploadDataUrl({
      dataUrl: payload.dataUrl,
      folder: payload.folder,
      fileName: payload.fileName,
      kind: 'image',
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post('/api/uploads/document', async (req: Request, res: Response) => {
  try {
    const payload = uploadPayloadSchema.parse(req.body);
    const result = await uploadDataUrl({
      dataUrl: payload.dataUrl,
      folder: payload.folder,
      fileName: payload.fileName,
      kind: 'document',
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post('/api/users/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    hashPassword(password).then((passwordHash) => {
      const normalizedRole = role === 'seller' ? 'seller' : 'customer';
      const user = db.createUser({
        name,
        email,
        password: passwordHash,
        phone,
        role: normalizedRole,
        status: normalizedRole === 'seller' ? 'pending' : 'active',
        country: 'AE',
        emailVerified: true,
        sellerApplicationStatus: normalizedRole === 'seller' ? 'draft' : null,
      });
      res.json(sanitizeUser(user));
    }).catch((error) => res.status(500).json({ error: String(error) }));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/users/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);
    
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await upgradeLegacyPasswordIfNeeded(user.id, password, user.password);
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/users/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const respond = (user: any) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(sanitizeUser(user));
    };

    if (prismaRuntime.enabled) {
      prismaRuntime
        .getUser(req.params.id)
        .then(respond)
        .catch((error) => res.status(500).json({ error: String(error) }));
      return;
    }

    respond(db.getUser(req.params.id));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/users/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    // Allow users to update their own profile or admin to update any profile
    if (req.user?.id !== req.params.id && !isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const nextData = {
      ...(req.body as any),
      name: req.body?.name || req.body?.fullName,
    };

    const respond = (updated: any) => {
      if (!updated) return res.status(404).json({ error: 'User not found' });
      res.json(sanitizeUser(updated));
    };

    if (prismaRuntime.enabled) {
      prismaRuntime
        .updateUser(req.params.id, nextData)
        .then(respond)
        .catch((error) => res.status(500).json({ error: String(error) }));
      return;
    }

    respond(db.updateUser(req.params.id, nextData as any));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== SELLERS API ====================
app.post('/api/sellers/create', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create store' });
    }

    const application = db.getSellerApplicationByUserId(req.user.id);
    if (application && application.status !== 'approved') {
      return res.status(403).json({ error: 'Seller application must be approved before store activation' });
    }

    const existingSeller = db.getSellerByUserId(req.user.id);
    if (existingSeller) {
      return res.json(existingSeller);
    }
    
    const {
      storeName,
      description,
      logo,
      banner,
      city,
      country,
      phone,
      email,
      website = '',
      warehouseAddress = '',
      vatTrn = '',
      supportInfo = '',
      policies = {},
      socialLinks = {},
      bankAccount,
      bankName,
      accountHolder,
      iban = '',
    } = req.body;
    const seller = db.createSeller({
      userId: req.user.id,
      storeName,
      storeSlug: storeName,
      description,
      logo,
      banner,
      city,
      country,
      phone,
      email,
      website,
      warehouseAddress,
      vatTrn,
      supportInfo,
      policies,
      socialLinks,
      bankAccount,
      bankName,
      accountHolder,
      iban,
      commissionRate: 6, // Fixed 6% commission
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0,
      status: 'active',
    });
    
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/sellers/:id', async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSeller(req.params.id)
      : db.getSeller(req.params.id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/sellers/store/:storeSlug', async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerBySlug(req.params.storeSlug)
      : db.getSellerBySlug(req.params.storeSlug);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/sellers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const existing = prismaRuntime.enabled
      ? await prismaRuntime.getSeller(req.params.id)
      : db.getSeller(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Seller not found' });

    // Only admin or the seller owner can update seller profile
    if (!isAdminLike(req.user?.role) && existing.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateSeller(req.params.id, req.body as any)
      : db.updateSeller(req.params.id, req.body as any);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/sellers', async (req: Request, res: Response) => {
  try {
    const sellers = prismaRuntime.enabled
      ? await prismaRuntime.getAllSellers()
      : db.getAllSellers();
    const orders = prismaRuntime.enabled ? await prismaRuntime.getAllOrders() : db.getAllOrders();
    const products = prismaRuntime.enabled ? await prismaRuntime.getAllProductsForAdmin() : [
      ...db.getAllProducts(),
      ...db.getProductsByStatus('pending'),
      ...db.getProductsByStatus('approved'),
      ...db.getProductsByStatus('rejected'),
    ];
    const users = prismaRuntime.enabled ? await prismaRuntime.getAllUsers() : db.getAllUsers();
    const supportTickets = prismaRuntime.enabled ? await prismaRuntime.getAllSupportTickets() : db.getSupportTickets();
    const payoutRequests = prismaRuntime.enabled ? await prismaRuntime.getAllPayoutRequests() : db.getAllPayoutRequests();
    const applications = prismaRuntime.enabled ? await prismaRuntime.getSellerApplications() : db.getSellerApplications();

    const enriched = sellers.map((seller) => {
      const sellerOrders = orders.filter((order) => order.sellerId === seller.id);
      const sellerProducts = products.filter((product) => product.sellerId === seller.id || product.storeId === seller.id);
      const liveProductCount = sellerProducts.filter((product) => product.visibilityStatus === 'live' || product.status === 'live' || product.status === 'approved').length;
      const deliveredOrders = sellerOrders.filter((order) => order.status === 'delivered');
      const returnOrders = sellerOrders.filter((order) => ['return_requested', 'returned', 'refunded'].includes(order.status) || order.refundStatus === 'requested' || order.refundStatus === 'refunded');
      const successfulOrders = sellerOrders.filter((order) => ['delivered', 'packed', 'shipped', 'confirmed'].includes(order.status));
      const sellerUser = users.find((user) => user.id === seller.userId);
      const application = applications.find((item) => item.userId === seller.userId);
      const sellerPayoutRequests = payoutRequests.filter((request) => request.sellerId === seller.id && request.status !== 'paid');
      const sellerSupportTickets = supportTickets.filter((ticket) => ticket.sellerId === seller.id || ticket.createdById === seller.userId);
      const lowQualityProducts = sellerProducts.filter((product) => computeProductModerationSignals(product, sellerProducts).qualityScore < 70).length;
      const orderSuccessRate = sellerOrders.length ? Math.round((successfulOrders.length / sellerOrders.length) * 100) : 0;
      const returnRate = sellerOrders.length ? Math.round((returnOrders.length / sellerOrders.length) * 100) : 0;
      const responseSla = sellerSupportTickets.length ? `${Math.min(24, 4 + sellerSupportTickets.length)}h` : '2h';
      const bankStatus = seller.iban && seller.bankName && seller.accountHolder ? 'verified' : 'missing';
      const tradeLicenseStatus = application?.documents?.length ? 'submitted' : application?.status === 'approved' ? 'verified' : 'pending';
      const storeQualityScore = Math.max(35, 100 - lowQualityProducts * 10 - (bankStatus === 'missing' ? 12 : 0) - (returnRate > 20 ? 15 : returnRate > 10 ? 8 : 0));
      const riskScore = Math.min(100, returnRate * 2 + sellerPayoutRequests.length * 10 + (seller.status === 'suspended' ? 20 : 0) + (lowQualityProducts ? 10 : 0));

      return {
        ...seller,
        approvalStatus: application?.status || (seller.status === 'pending' ? 'pending_review' : 'approved'),
        kycStatus: application?.status === 'approved' ? 'verified' : application?.status === 'needs_more_info' ? 'needs_review' : 'pending',
        tradeLicenseStatus,
        payoutBankStatus: bankStatus,
        storeQualityScore,
        orderSuccessRate,
        returnRate,
        responseSla,
        lastLoginAt: sellerUser?.lastLoginAt || null,
        liveProductCount,
        riskScore,
        vendorRiskLevel: riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
        internalNotes: seller.supportInfo || '',
        pendingPayoutValue: sellerPayoutRequests.reduce((sum, request) => sum + Number(request.amount || 0), 0),
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/sellers/user/:userId', async (req: Request, res: Response) => {
  try {
    const requestUser = tryAuthenticateRequest(req);
    if (!requestUser || (requestUser.id !== req.params.userId && !isBackofficeRole(requestUser.role))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.params.userId)
      : db.getSellerByUserId(req.params.userId);
    res.json(seller || null);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/seller/store/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.user!.id)
      : db.getSellerByUserId(req.user!.id);
    res.json(seller || null);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== SELLER APPLICATIONS ====================
app.post('/api/seller-applications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = prismaRuntime.enabled
      ? await prismaRuntime.getUser(req.user!.id)
      : db.getUser(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingApplication = prismaRuntime.enabled
      ? await prismaRuntime.getSellerApplicationByUserId(req.user!.id)
      : db.getSellerApplicationByUserId(req.user!.id);
    if (existingApplication && ['pending_review', 'approved'].includes(existingApplication.status)) {
      return res.status(400).json({ error: 'Seller application already exists' });
    }
    const payload = sellerApplicationSchema.parse(req.body);

    const settings = db.getMarketplaceSettings();
    const application = existingApplication
      ? prismaRuntime.enabled
        ? await prismaRuntime.updateSellerApplication(existingApplication.id, {
            ...existingApplication,
            ...payload,
            monthlyFeeAed: settings.monthlySellerFeeAed,
            commissionRate: settings.sellerCommissionPercent,
            status: 'pending_review',
            rejectionReason: '',
            adminNotes: '',
            reviewedAt: '',
            reviewedBy: '',
          } as any)
        : db.updateSellerApplication(existingApplication.id, {
          ...payload,
          monthlyFeeAed: settings.monthlySellerFeeAed,
          commissionRate: settings.sellerCommissionPercent,
          status: 'pending_review',
          rejectionReason: '',
          adminNotes: '',
          reviewedAt: '',
          reviewedBy: '',
        })
      : prismaRuntime.enabled
        ? await prismaRuntime.createSellerApplication({
            userId: req.user!.id,
            businessName: payload.businessName,
            ownerName: payload.ownerName,
            email: payload.email,
            phone: payload.phone,
            businessType: payload.businessType,
            country: payload.country,
            city: payload.city,
            warehouseAddress: payload.warehouseAddress,
            vatTrn: payload.vatTrn,
            monthlyFeeAed: settings.monthlySellerFeeAed,
            commissionRate: settings.sellerCommissionPercent,
            documents: payload.documents,
            logo: payload.logo,
            banner: payload.banner,
            about: payload.about,
            policies: payload.policies,
            bankDetails: payload.bankDetails,
            status: 'pending_review',
          })
        : db.createSellerApplication({
          userId: req.user!.id,
          businessName: payload.businessName,
          ownerName: payload.ownerName,
          email: payload.email,
          phone: payload.phone,
          businessType: payload.businessType,
          country: payload.country,
          city: payload.city,
          warehouseAddress: payload.warehouseAddress,
          vatTrn: payload.vatTrn,
          monthlyFeeAed: settings.monthlySellerFeeAed,
          commissionRate: settings.sellerCommissionPercent,
          documents: payload.documents,
          logo: payload.logo,
          banner: payload.banner,
          about: payload.about,
          policies: payload.policies,
          bankDetails: payload.bankDetails,
          status: 'pending_review',
        });

    if (!application) {
      return res.status(500).json({ error: 'Failed to create seller application' });
    }

    const isResubmission = Boolean(existingApplication);
    pushNotification({
      audience: 'admin',
      title: isResubmission ? 'Seller application resubmitted' : 'New seller application',
      message: `${application.businessName} is waiting for review.`,
      type: isResubmission ? 'seller_resubmitted' : 'seller_application_submitted',
      entityType: 'seller_application',
      entityId: application.id,
    });

    // Send email notifications
    await Promise.all([
      sendSellerSignupConfirmationEmail({
        businessName: application.businessName,
        ownerName: application.ownerName,
        email: application.email,
        phone: application.phone,
        businessType: application.businessType,
        city: application.city,
        applicationId: application.id,
      }),
      sendSellerApplicationNotificationToAdmin({
        businessName: application.businessName,
        ownerName: application.ownerName,
        email: application.email,
        phone: application.phone,
        businessType: application.businessType,
        city: application.city,
        applicationId: application.id,
        isResubmission,
      }),
    ]).catch((emailErr) => {
      console.error('[EMAIL] Failed to send seller application emails:', emailErr);
    });

    await sendAdminAlert(
      isResubmission ? 'Seller resubmission received' : 'New seller application received',
      isResubmission ? 'Seller resubmission ready for review' : 'New seller application ready for review',
      `${application.businessName} has been submitted to ExShopi and is waiting for admin review.`,
      [
        { label: 'Store / business', value: application.businessName },
        { label: 'Owner', value: application.ownerName },
        { label: 'Email', value: application.email },
        { label: 'Phone', value: application.phone },
        { label: 'Status', value: formatOperationalStatusLabel(application.status) },
      ]
    );

    res.json(application);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/seller-applications/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const application = prismaRuntime.enabled
      ? await prismaRuntime.getSellerApplicationByUserId(req.user!.id)
      : db.getSellerApplicationByUserId(req.user!.id);
    res.json(application || null);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/seller-applications', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isBackofficeRole(req.user?.role)) {
      return res.status(403).json({ error: 'Backoffice only' });
    }
    const rawApplications = prismaRuntime.enabled
      ? await prismaRuntime.getSellerApplications()
      : db.getSellerApplications();
    const applications = await Promise.all(
      rawApplications.map(async (application) => ({
        ...application,
        user: sanitizeUser(
          prismaRuntime.enabled
            ? await prismaRuntime.getUser(application.userId)
            : db.getUser(application.userId)
        ),
        seller: prismaRuntime.enabled
          ? await prismaRuntime.getSellerByUserId(application.userId)
          : db.getSellerByUserId(application.userId) || null,
      }))
    );
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/seller-applications/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const payload = sellerApplicationReviewSchema.parse(req.body || {});

    const application = prismaRuntime.enabled
      ? await prismaRuntime.updateSellerApplication(req.params.id, {
          status: 'approved',
          adminNotes: payload.notes,
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user!.id,
        } as any)
      : db.updateSellerApplication(req.params.id, {
      status: 'approved',
      adminNotes: payload.notes,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user!.id,
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    let seller;
    if (prismaRuntime.enabled) {
      const [createdSeller] = await Promise.all([
        prismaRuntime.ensureSellerFromApplication(application.id),
        prismaRuntime.updateUser(application.userId, {
          role: 'seller',
          status: 'active',
          sellerApplicationStatus: 'approved',
        } as any),
      ]);
      seller = createdSeller;
    } else {
      seller = db.ensureSellerFromApplication(application.id, req.user!.id);
      db.updateUser(application.userId, { role: 'seller', status: 'active', sellerApplicationStatus: 'approved' });
    }
    const sellerUser = prismaRuntime.enabled ? await prismaRuntime.getUser(application.userId) : db.getUser(application.userId);
    pushNotification({
      audience: 'seller',
      audienceId: seller?.userId || application.userId,
      title: 'Seller account approved',
      message: 'Your seller application has been approved and your store is now live for operations.',
      type: 'seller_approved',
      entityType: 'seller_application',
      entityId: application.id,
    });
    if (sellerUser?.email) {
      await sendSellerNotice(
        sellerUser.email,
        'Your ExShopi seller account is approved',
        'Seller approval confirmed',
        'Your ExShopi seller application has been approved. You can now access the seller center and start submitting products.',
        [
          { label: 'Store name', value: seller?.storeName || application.businessName },
          { label: 'Commission rate', value: `${Number(application.commissionRate || 6)}%` },
          { label: 'Monthly fee', value: toCurrency(Number(application.monthlyFeeAed || 0)) },
        ]
      );
    }
    res.json({ application, seller });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/seller-applications/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const payload = sellerApplicationReviewSchema.parse(req.body || {});
    const application = prismaRuntime.enabled
      ? await prismaRuntime.updateSellerApplication(req.params.id, {
          status: 'rejected',
          rejectionReason: payload.reason || 'Application rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user!.id,
        } as any)
      : db.updateSellerApplication(req.params.id, {
      status: 'rejected',
      rejectionReason: payload.reason || 'Application rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user!.id,
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (prismaRuntime.enabled) {
      await prismaRuntime.updateUser(application.userId, { status: 'suspended', sellerApplicationStatus: 'rejected' } as any);
    } else {
      db.updateUser(application.userId, { status: 'suspended', sellerApplicationStatus: 'rejected' });
    }
    const sellerUser = prismaRuntime.enabled ? await prismaRuntime.getUser(application.userId) : db.getUser(application.userId);
    pushNotification({
      audience: 'seller',
      audienceId: application.userId,
      title: 'Seller application rejected',
      message: payload.reason || 'Your seller application was rejected.',
      type: 'seller_rejected',
      entityType: 'seller_application',
      entityId: application.id,
    });
    if (sellerUser?.email) {
      await sendSellerNotice(
        sellerUser.email,
        'ExShopi seller application update',
        'Seller application rejected',
        'Your seller application could not be approved at this time.',
        [
          { label: 'Store / business', value: application.businessName },
          { label: 'Reason', value: payload.reason || 'Application rejected' },
        ]
      );
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/seller-applications/:id/request-info', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const payload = sellerApplicationReviewSchema.parse(req.body || {});
    const application = prismaRuntime.enabled
      ? await prismaRuntime.updateSellerApplication(req.params.id, {
          status: 'needs_more_info',
          adminNotes: payload.notes || 'More information requested',
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user!.id,
        } as any)
      : db.updateSellerApplication(req.params.id, {
      status: 'needs_more_info',
      adminNotes: payload.notes || 'More information requested',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user!.id,
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (prismaRuntime.enabled) {
      await prismaRuntime.updateUser(application.userId, { status: 'pending', sellerApplicationStatus: 'needs_more_info' } as any);
    } else {
      db.updateUser(application.userId, { status: 'pending', sellerApplicationStatus: 'needs_more_info' });
    }
    const sellerUser = prismaRuntime.enabled ? await prismaRuntime.getUser(application.userId) : db.getUser(application.userId);
    pushNotification({
      audience: 'seller',
      audienceId: application.userId,
      title: 'More seller information requested',
      message: payload.notes || 'Please update your seller application with the requested details.',
      type: 'seller_info_requested',
      entityType: 'seller_application',
      entityId: application.id,
    });
    if (sellerUser?.email) {
      await sendSellerNotice(
        sellerUser.email,
        'More information needed for your seller application',
        'Additional seller details requested',
        'ExShopi needs a few more details before approving your seller account.',
        [
          { label: 'Store / business', value: application.businessName },
          { label: 'Requested update', value: payload.notes || 'Please review the application notes in your seller center.' },
        ]
      );
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== PRODUCTS API ====================
app.post('/api/products/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.user!.id)
      : db.getSellerByUserId(req.user!.id);
    if (!seller) {
      return res.status(400).json({ error: 'Seller profile not found' });
    }
    const payload = productPayloadSchema.parse(req.body);
    const isDraft = payload.status === 'draft';
    const seo = await buildPersistedProductSeo(payload);
    const normalizedSpecs = normalizeProductSpecifications(payload.specs || {}, {
      parentCategorySlug: payload.specs?.parentCategorySlug || payload.specs?.categorySlug || '',
      parentCategoryName: payload.specs?.parentCategoryName || payload.specs?.categoryName || '',
      categorySlug: payload.specs?.categorySlug || payload.specs?.parentCategorySlug || '',
      categoryName: payload.specs?.categoryName || payload.specs?.parentCategoryName || '',
      subcategorySlug: payload.specs?.subcategorySlug || payload.specs?.templateId || '',
      subcategoryName: payload.specs?.subcategoryName || payload.specs?.templateName || '',
      title: payload.title,
    });
    const persistedSpecs = mergeProductSeoIntoSpecs(normalizedSpecs.specs || {}, seo);
    if (!isDraft) {
      validateSeoForPublish(seo);
      validateProductSpecificationsForTemplate(persistedSpecs, normalizedSpecs.template, {
        requireHighlights: true,
      });
    }
    
    let product: any = null;
    if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.createProduct({
        sellerId: seller.id,
        storeId: seller.id,
        categoryId: payload.categoryId,
        slug: seo.slug,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        canonicalUrl: seo.canonicalUrl,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImage: seo.ogImage,
        title: payload.title,
        description: payload.description,
        price: Number(payload.price) || 0,
        priceUae: Number(payload.priceUae ?? payload.price) || 0,
        priceKsa: payload.priceKsa != null ? Number(payload.priceKsa) : undefined,
        originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
        compareAtPriceUae: Number(payload.compareAtPriceUae ?? payload.originalPrice ?? payload.price) || Number(payload.price) || 0,
        compareAtPriceKsa: payload.compareAtPriceKsa != null ? Number(payload.compareAtPriceKsa) : undefined,
        salePrice: Number(payload.salePrice) || Number(payload.price) || 0,
        image: payload.image,
        images: payload.images,
        stock: Number(payload.stock) || 0,
        rating: 0,
        reviews: 0,
        sku: payload.sku || '',
        specs: persistedSpecs,
        brand: payload.brand || payload.specs?.attributes?.brand || '',
        status: isDraft ? 'draft' : 'pending',
        approvalStatus: isDraft ? 'pending' : 'pending',
        productStatus: isDraft ? 'draft' : Number(payload.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval',
        visibilityStatus: 'hidden',
        ownership: 'seller',
        createdByRole: 'seller',
        approvalRequestedAt: isDraft ? '' : new Date().toISOString(),
        approvedAt: '',
        rejectedAt: '',
        views: 0,
        wishlistCount: 0,
        rejectionReason: '',
        approvalNotes: '',
        badges: payload.badges,
      } as any);
    } else if (prismaRuntime.enabled) {
      product = await prismaRuntime.createProduct({
        sellerId: seller.id,
        storeId: seller.id,
        categoryId: payload.categoryId,
        slug: seo.slug,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        canonicalUrl: seo.canonicalUrl,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImage: seo.ogImage,
        title: payload.title,
        description: payload.description,
        price: Number(payload.price) || 0,
        priceUae: Number(payload.priceUae ?? payload.price) || 0,
        priceKsa: payload.priceKsa != null ? Number(payload.priceKsa) : undefined,
        originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
        compareAtPriceUae: Number(payload.compareAtPriceUae ?? payload.originalPrice ?? payload.price) || Number(payload.price) || 0,
        compareAtPriceKsa: payload.compareAtPriceKsa != null ? Number(payload.compareAtPriceKsa) : undefined,
        salePrice: Number(payload.salePrice) || Number(payload.price) || 0,
        image: payload.image,
        images: payload.images,
        stock: Number(payload.stock) || 0,
        rating: 0,
        reviews: 0,
        sku: payload.sku || '',
        specs: persistedSpecs,
        brand: payload.brand || payload.specs?.attributes?.brand || '',
        status: isDraft ? 'draft' : 'pending',
        approvalStatus: isDraft ? 'pending' : 'pending',
        productStatus: isDraft ? 'draft' : Number(payload.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval',
        visibilityStatus: 'hidden',
        ownership: 'seller',
        createdByRole: 'seller',
        approvalRequestedAt: isDraft ? '' : new Date().toISOString(),
        approvedAt: '',
        rejectedAt: '',
        views: 0,
        wishlistCount: 0,
        rejectionReason: '',
        approvalNotes: '',
        badges: payload.badges,
        createdAt: '',
        updatedAt: '',
      } as any);
    } else {
      product = db.createProduct({
        sellerId: seller.id,
        storeId: seller.id,
        categoryId: payload.categoryId,
        slug: seo.slug,
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        metaKeywords: seo.metaKeywords,
        canonicalUrl: seo.canonicalUrl,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImage: seo.ogImage,
        title: payload.title,
        description: payload.description,
        price: Number(payload.price) || 0,
        priceUae: Number(payload.priceUae ?? payload.price) || 0,
        priceKsa: payload.priceKsa != null ? Number(payload.priceKsa) : undefined,
        originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
        compareAtPriceUae: Number(payload.compareAtPriceUae ?? payload.originalPrice ?? payload.price) || Number(payload.price) || 0,
        compareAtPriceKsa: payload.compareAtPriceKsa != null ? Number(payload.compareAtPriceKsa) : undefined,
        salePrice: Number(payload.salePrice) || Number(payload.price) || 0,
        image: payload.image,
        images: payload.images,
        stock: Number(payload.stock) || 0,
        rating: 0,
        reviews: 0,
        sku: payload.sku || '',
        specs: persistedSpecs,
        brand: payload.brand || payload.specs?.attributes?.brand || '',
        status: isDraft ? 'draft' : 'pending',
        approvalStatus: isDraft ? 'pending' : 'pending',
        productStatus: isDraft ? 'draft' : Number(payload.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval',
        visibilityStatus: 'hidden',
        ownership: 'seller',
        createdByRole: 'seller',
        approvalRequestedAt: isDraft ? '' : new Date().toISOString(),
        approvedAt: '',
        rejectedAt: '',
        views: 0,
        wishlistCount: 0,
        badges: payload.badges,
      });
    }

    if (!isDraft) {
      pushNotification({
        audience: 'admin',
        title: 'New product submitted',
        message: `${payload.title} was submitted for moderation by ${seller.storeName}.`,
        type: 'product_submitted',
        entityType: 'product',
        entityId: product.id,
      });
      await sendAdminAlert(
        'New product submitted for review',
        'Product review required',
        `${payload.title} is waiting for catalog review in ExShopi.`,
        [
          { label: 'Product', value: payload.title },
          { label: 'Seller', value: seller.storeName },
          { label: 'SKU', value: payload.sku || '-' },
          { label: 'Price', value: toCurrency(Number(payload.price || 0)) },
        ]
      );
    }

    res.json(await serializeMarketplaceProductAsync(product));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/products/check-slug', async (req: Request, res: Response) => {
  try {
    const desiredSlug = normalizeSlugInput(String(req.query.slug || ''));
    const currentId = String(req.query.currentId || '');

    if (!desiredSlug) {
      return res.status(400).json({
        available: false,
        slug: '',
        message: 'Slug must contain letters or numbers.',
      });
    }

    const suggestedSlug = await ensureUniqueProductSlug(desiredSlug, currentId || undefined);
    const available = suggestedSlug === desiredSlug;

    return res.json({
      available,
      slug: desiredSlug,
      suggestedSlug,
      message: available ? 'Slug is available.' : 'Slug is already in use.',
    });
  } catch (error) {
    return res.status(500).json({
      available: false,
      slug: normalizeSlugInput(String(req.query.slug || '')),
      message: String(error instanceof Error ? error.message : error),
    });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const param = req.params.id;
    console.debug('[api] GET /api/products/:id param=', param, 'prismaEnabled=', prismaRuntime.enabled);

    let product: any = null;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.getProduct(param);
      if (!product) {
        console.debug('[api] not found by id, trying getProductBySlug');
        product = await prismaRuntime.getProductBySlug(param);
      }
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.getProduct(param);
      if (!product) {
        product = await supabaseRuntime.getProductBySlug(param);
      }
    } else {
      product = db.getProduct(param);
    }

    // Final fallback: search the full list (covers db fallback and any mismatch)
    if (!product) {
      console.debug('[api] final fallback: scanning all products for id/slug');
      const all = prismaRuntime.enabled
        ? await prismaRuntime.getAllProducts()
        : supabaseRuntime.enabled
        ? await supabaseRuntime.getAllProducts()
        : db.getAllProducts();
      product =
        all.find(
          (p: any) =>
            String(p.id) === param ||
            String(p.slug || p.id) === param ||
            seoSlugify(String(p.slug || p.title || p.id)) === seoSlugify(param)
        ) || null;

      if (!product) {
        const routeMatch = findProductRouteMatch(all, param);
        if (routeMatch?.product) {
          product = routeMatch.product;
          if (!IS_PRODUCTION) {
            console.info('[api] route alias matched live product', {
              requested: param,
              productId: String((product as any)?.id || ''),
              matchedAlias: routeMatch.matchedAlias,
              canonicalPath: routeMatch.canonicalPath,
            });
          }
        }
      }
    }

    if (!product || isSoftDeletedProduct(product)) {
      console.debug('[api] product not found after fallbacks for', param);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.debug('[api] product found, returning', (product as any).id || (product as any).slug);
    const serialized = await serializeMarketplaceProductAsync(product);
    res.json({
      ...serialized,
      canonicalPath: getProductCanonicalPath(serialized),
    });
  } catch (error) {
    console.error('[api] error fetching product:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : '';
    const categorySlug = typeof req.query.categorySlug === 'string' ? req.query.categorySlug : '';
    const subcategorySlug = typeof req.query.subcategorySlug === 'string' ? req.query.subcategorySlug : '';
    const parentSlug = typeof req.query.parentSlug === 'string' ? req.query.parentSlug : '';

    let products: any[] = [];

    // Fast path: explicit backend category id
    if (categoryId) {
      if (prismaRuntime.enabled) {
        products = await prismaRuntime.getAllProducts();
        products = products.filter((product: any) => String(product.categoryId || product.specs?.backendCategoryId || '') === categoryId);
      } else if (supabaseRuntime.enabled) {
        const all = await supabaseRuntime.getAllProducts();
        products = all.filter((product: any) => String(product.categoryId || product.specs?.backendCategoryId || '') === categoryId);
      } else {
        products = db.getAllProducts();
        products = products.filter((product: any) => String(product.categoryId || product.specs?.backendCategoryId || '') === categoryId);
      }
    } else if (categorySlug || subcategorySlug || parentSlug) {
      // Query by canonical slugs using the resolved category assignment so legacy and malformed records still match.
      const allProducts = prismaRuntime.enabled
        ? await prismaRuntime.getAllProducts()
        : supabaseRuntime.enabled
        ? await supabaseRuntime.getAllProducts()
        : db.getAllProducts();

      products = allProducts.filter((product: any) =>
        productMatchesCategoryAssignment(product, categorySlug || null, subcategorySlug || null, parentSlug || null)
      );
    } else {
      // No filters: return global marketplace products
      if (prismaRuntime.enabled) {
        products = await prismaRuntime.getAllProducts();
      } else if (supabaseRuntime.enabled) {
        products = await supabaseRuntime.getAllProducts();
      } else {
        products = db.getAllProducts();
      }
    }

    res.json(await Promise.all(products.map((product) => serializeMarketplaceProductAsync(product))));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/products/seller/:sellerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.user!.id)
      : db.getSellerByUserId(req.user!.id);
    if (
      !(isBackofficeRole(req.user?.role)) &&
      !(req.user?.role === 'seller' && seller?.id === req.params.sellerId)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let products: any[] = [];
    if (prismaRuntime.enabled) {
      products = await prismaRuntime.getSellerProducts(req.params.sellerId);
    } else if (supabaseRuntime.enabled) {
      products = await supabaseRuntime.getSellerProducts(req.params.sellerId);
    } else {
      products = db.getSellerProducts(req.params.sellerId);
    }
    res.json(await Promise.all(products.map((product) => serializeMarketplaceProductAsync(product))));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/products/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    let current: any = null;
    if (prismaRuntime.enabled) {
      current = await prismaRuntime.getProduct(req.params.id);
    } else if (supabaseRuntime.enabled) {
      current = await supabaseRuntime.getProduct(req.params.id);
    } else {
      current = db.getProduct(req.params.id);
    }
    if (!current) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (req.user?.role === 'seller') {
      const seller = prismaRuntime.enabled
        ? await prismaRuntime.getSellerByUserId(req.user.id)
        : db.getSellerByUserId(req.user.id);
      if (!seller || current.sellerId !== seller.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const validated = productPayloadSchema.partial().parse(req.body);
    const payload = { ...(validated as any) };
    if (req.user?.role === 'seller') {
      const isDraft = payload.status === 'draft';
      payload.slug = payload.slug || current.slug || seoSlugify(payload.title || current.title || '');
      payload.status = isDraft ? 'draft' : 'pending';
      payload.approvalStatus = 'pending';
      payload.productStatus = isDraft ? 'draft' : Number(payload.stock ?? current.stock ?? 0) <= 0 ? 'out_of_stock' : 'pending_approval';
      payload.visibilityStatus = 'hidden';
      payload.approvalRequestedAt = isDraft ? '' : new Date().toISOString();
      payload.approvedAt = '';
      payload.rejectedAt = '';
      payload.rejectionReason = '';
      payload.approvalNotes = '';
      payload.createdByRole = 'seller';
      payload.ownership = 'seller';
      payload.storeId = current.storeId || current.sellerId;
      payload.brand = payload.brand || payload.specs?.attributes?.brand || current.brand || '';
    }
    if (payload.specs || payload.title || payload.categoryId) {
      const normalizedSpecs = normalizeProductSpecifications(
        {
          ...(current.specs || {}),
          ...(payload.specs || {}),
        },
        {
          parentCategorySlug:
            payload.specs?.parentCategorySlug || current.specs?.parentCategorySlug || current.specs?.categorySlug || '',
          parentCategoryName:
            payload.specs?.parentCategoryName || current.specs?.parentCategoryName || current.specs?.categoryName || '',
          categorySlug: payload.specs?.categorySlug || current.specs?.categorySlug || current.specs?.parentCategorySlug || '',
          categoryName: payload.specs?.categoryName || current.specs?.categoryName || current.specs?.parentCategoryName || '',
          subcategorySlug: payload.specs?.subcategorySlug || current.specs?.subcategorySlug || current.specs?.templateId || '',
          subcategoryName: payload.specs?.subcategoryName || current.specs?.subcategoryName || current.specs?.templateName || '',
          title: payload.title || current.title,
        }
      );
      payload.specs = normalizedSpecs.specs;
      if ((payload.status || current.status) !== 'draft') {
        validateProductSpecificationsForTemplate(payload.specs, normalizedSpecs.template, {
          requireHighlights: true,
        });
      }
    }
    if (payload.title || payload.slug || payload.metaTitle || payload.metaDescription || payload.metaKeywords) {
      const seo = await buildPersistedProductSeo(
        {
          ...current,
          ...payload,
          specs: {
            ...(current.specs || {}),
            ...(payload.specs || {}),
          },
        },
        req.params.id
      );
      payload.slug = seo.slug;
      payload.metaTitle = seo.metaTitle;
      payload.metaDescription = seo.metaDescription;
      payload.metaKeywords = seo.metaKeywords;
      payload.canonicalUrl = seo.canonicalUrl;
      payload.ogTitle = seo.ogTitle;
      payload.ogDescription = seo.ogDescription;
      payload.ogImage = seo.ogImage;
      payload.specs = mergeProductSeoIntoSpecs(
        {
          ...(current.specs || {}),
          ...(payload.specs || {}),
        },
        seo
      );
      if (payload.status !== 'draft') {
        validateSeoForPublish(seo);
      }
    }

    let product: any = null;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.updateProduct(req.params.id, payload as any);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.updateProduct(req.params.id, payload as any);
    } else {
      product = db.updateProduct(req.params.id, payload as any);
    }
    res.json(await serializeMarketplaceProductAsync(product));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/products/:id/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'seller') {
      return res.status(403).json({ error: 'Seller only' });
    }
    let product: any = null;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.getProduct(req.params.id);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.getProduct(req.params.id);
    } else {
      product = db.getProduct(req.params.id);
    }
    const seller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.user.id)
      : db.getSellerByUserId(req.user.id);
    if (!product || !seller || product.sellerId !== seller.id) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let updated: any = null;
    const updates = {
      status: 'pending',
      approvalStatus: 'pending',
      productStatus: Number(product.stock || 0) <= 0 ? 'out_of_stock' : 'pending_approval',
      visibilityStatus: 'hidden',
      approvalRequestedAt: new Date().toISOString(),
      rejectedAt: '',
      approvedAt: '',
      rejectionReason: '',
      approvalNotes: '',
    } as any;
    if (prismaRuntime.enabled) {
      updated = await prismaRuntime.updateProduct(req.params.id, updates as any);
    } else if (supabaseRuntime.enabled) {
      updated = await supabaseRuntime.updateProduct(req.params.id, updates);
    } else {
      updated = db.updateProduct(req.params.id, updates as any);
    }
    pushNotification({
      audience: 'admin',
      title: 'New product submitted',
      message: `${product.title} was submitted for moderation by ${seller.storeName}.`,
      type: 'product_submitted',
      entityType: 'product',
      entityId: product.id,
    });
    await sendAdminAlert(
      'Product submitted for review',
      'Product moderation queue updated',
      `${product.title} has been resubmitted and is waiting for admin review.`,
      [
        { label: 'Product', value: product.title },
        { label: 'Seller', value: seller.storeName },
        { label: 'SKU', value: product.sku || '-' },
      ]
    );
    res.json(await serializeMarketplaceProductAsync(updated));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Allow sellers to delete their own products or admin to delete any product
app.delete('/api/products/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    let product: any = null;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.getProduct(req.params.id);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.getProduct(req.params.id);
    } else {
      product = db.getProduct(req.params.id);
    }
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Admins can delete any product
    if (isAdminLike(req.user?.role)) {
      const ok = prismaRuntime.enabled
        ? await prismaRuntime.deleteProduct(req.params.id)
        : supabaseRuntime.enabled
        ? await supabaseRuntime.deleteProduct(req.params.id)
        : db.deleteProduct(req.params.id);
      if (ok) {
        try {
          sendSseEvent('product-deleted', { id: req.params.id, ts: new Date().toISOString() });
        } catch (e) {
          /* ignore SSE errors */
        }
      }
      return ok ? res.json({ success: true }) : res.status(500).json({ error: 'Failed to delete' });
    }

    // Sellers can delete their own products
    const ownerSeller = prismaRuntime.enabled
      ? await prismaRuntime.getSellerByUserId(req.user!.id)
      : db.getSellerByUserId(req.user!.id);
    if (req.user?.role === 'seller' && product.sellerId === ownerSeller?.id) {
      const ok = prismaRuntime.enabled
        ? await prismaRuntime.deleteProduct(req.params.id)
        : supabaseRuntime.enabled
        ? await supabaseRuntime.deleteProduct(req.params.id)
        : db.deleteProduct(req.params.id);
      if (ok) {
        try {
          sendSseEvent('product-deleted', { id: req.params.id, ts: new Date().toISOString() });
        } catch (e) {
          /* ignore SSE errors */
        }
      }
      return ok ? res.json({ success: true }) : res.status(500).json({ error: 'Failed to delete' });
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== REVIEWS API ====================
app.post('/api/reviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'customer') return res.status(403).json({ error: 'Only customers can post reviews' });

    const { productId, vendorId, rating, comment } = req.body;
    if (!productId || !vendorId || typeof rating !== 'number') {
      return res.status(400).json({ error: 'productId, vendorId and rating are required' });
    }

    if (prismaRuntime.enabled) {
      const deliveredOrders = await prismaRuntime.getCustomerOrders(req.user.id);
      const eligibleOrder = deliveredOrders.find(
        (order) =>
          order.status === 'delivered' &&
          order.sellerId === vendorId &&
          Array.isArray(order.items) &&
          order.items.some((item) => item.productId === productId)
      );
      if (!eligibleOrder) {
        return res.status(400).json({ error: 'Reviews are only allowed for delivered purchases' });
      }
      const orderItem = eligibleOrder.items?.find((item) => item.productId === productId);
      if (!orderItem) {
        return res.status(400).json({ error: 'Delivered order item not found' });
      }
      const existing = await prismaRuntime.getReviewByOrderItem(orderItem.id, req.user.id);
      if (existing) {
        return res.status(400).json({ error: 'You already reviewed this delivered purchase' });
      }
      const review = await prismaRuntime.createReview({
        productId,
        vendorId,
        orderId: eligibleOrder.id,
        orderItemId: orderItem.id,
        verifiedPurchase: true,
        customerId: req.user.id,
        customerName: '',
        rating,
        comment: comment || '',
      });
      return res.json(review);
    }

    const eligibleOrder = db.getEligibleDeliveredOrderForReview(req.user.id, productId);
    if (!eligibleOrder) {
      return res.status(400).json({ error: 'Reviews are only allowed for delivered purchases' });
    }
    if (eligibleOrder.sellerId !== vendorId) {
      return res.status(400).json({ error: 'Review vendor mismatch' });
    }
    if (db.hasCustomerReviewedOrderItem(req.user.id, eligibleOrder.id, productId)) {
      return res.status(400).json({ error: 'You already reviewed this delivered purchase' });
    }

    const review = db.createReview({
      productId,
      vendorId,
      orderId: eligibleOrder.id,
      orderItemId: eligibleOrder.items?.find((item) => item.productId === productId)?.id,
      verifiedPurchase: true,
      customerId: req.user.id,
      customerName: db.getUser(req.user.id)?.name || '',
      rating,
      comment: comment || '',
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/reviews/vendor/:vendorId', async (req: Request, res: Response) => {
  try {
    const reviews = prismaRuntime.enabled
      ? await prismaRuntime.getVendorReviews(req.params.vendorId)
      : db.getReviewsByVendorId(req.params.vendorId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/reviews/product/:productId', async (req: Request, res: Response) => {
  try {
    const reviews = prismaRuntime.enabled
      ? await prismaRuntime.getProductReviews(req.params.productId)
      : db.getReviewsByProductId(req.params.productId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== PRODUCT APPROVAL API (ADMIN) ====================
app.get('/api/admin/products/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'catalog:review')) {
      return res.status(403).json({ error: 'Catalog access only' });
    }
    let allProducts: any[] = [];
    if (prismaRuntime.enabled) {
      allProducts = await prismaRuntime.getAllProductsForAdmin();
    } else if (supabaseRuntime.enabled) {
      allProducts = await supabaseRuntime.getAllProductsForAdmin();
    } else {
      allProducts = db.getAllProductsForAdmin();
    }
    const pendingProducts = allProducts
      .filter((product, index, array) => array.findIndex((entry) => entry.id === product.id) === index)
      .filter((product) => !isSoftDeletedProduct(product))
      .filter((product) => product.approvalStatus === 'pending' || product.status === 'pending' || product.productStatus === 'pending_approval');
    const serialized = await Promise.all(pendingProducts.map((product) => serializeMarketplaceProductAsync(product)));
    res.json(serialized.map((product) => ({
      ...product,
      moderationSignals: computeProductModerationSignals(product, serialized),
    })));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/products', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'catalog:view')) {
      return res.status(403).json({ error: 'Catalog access only' });
    }

    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const sellerId = typeof req.query.sellerId === 'string' ? req.query.sellerId : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let products: any[] = [];
    if (prismaRuntime.enabled) {
      products = await prismaRuntime.getAllProductsForAdmin();
    } else if (supabaseRuntime.enabled) {
      products = await supabaseRuntime.getAllProductsForAdmin();
    } else {
      products = db.getAllProductsForAdmin();
    }

    products = products.filter((product, index, array) => array.findIndex((entry) => entry.id === product.id) === index);
    products = products.filter((product) => !isSoftDeletedProduct(product));

    if (status && status !== 'all') {
      products = products.filter((product) => resolveEffectiveProductStatus(product) === status);
    }

    if (sellerId && sellerId !== 'all') {
      products = products.filter((product) => product.sellerId === sellerId);
    }

    if (search) {
      products = products.filter((product) => {
        const seller = db.getSeller(product.sellerId);
        return [product.title, product.sku, product.categoryId, seller?.storeName, seller?.storeSlug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
    }

    const serialized = await Promise.all(products.map((product) => serializeMarketplaceProductAsync(product)));
    res.json(serialized.map((product) => ({
      ...product,
      moderationSignals: computeProductModerationSignals(product, serialized),
      auditTrail: [
        product.approvalRequestedAt ? { type: 'submitted', at: product.approvalRequestedAt } : null,
        product.approvedAt ? { type: 'approved', at: product.approvedAt } : null,
        product.rejectedAt ? { type: 'rejected', at: product.rejectedAt, reason: product.rejectionReason || '' } : null,
      ].filter(Boolean),
    })));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/products/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'catalog:review')) {
      return res.status(403).json({ error: 'Catalog access only' });
    }
    
    let product: any = null;
    const approveUpdates = {
      status: 'live',
      approvalStatus: 'approved',
      productStatus: 'live',
      visibilityStatus: 'live',
      approvalNotes: req.body.notes,
      rejectionReason: '',
      approvedAt: new Date().toISOString(),
    } as any;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.updateProduct(req.params.id, approveUpdates as any);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.updateProduct(req.params.id, approveUpdates);
    } else {
      product = db.updateProduct(req.params.id, approveUpdates as any);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(product.sellerId) : db.getSeller(product.sellerId);
    if (seller?.email) {
      pushNotification({
        audience: 'seller',
        audienceId: seller.userId || seller.id,
        title: 'Product approved',
        message: `${product.title} is now live on ExShopi.`,
        type: 'product_approved',
        entityType: 'product',
        entityId: product.id,
      });
      await sendSellerNotice(
        seller.email,
        'Your product is now live on ExShopi',
        'Product approved',
        `${product.title} has been approved and is now visible to customers.`,
        [
          { label: 'Product', value: product.title },
          { label: 'Seller store', value: seller.storeName },
          { label: 'Visibility', value: 'Live' },
        ]
      );
    }
    res.json(await serializeMarketplaceProductAsync(product));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/products/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'catalog:review')) {
      return res.status(403).json({ error: 'Catalog access only' });
    }
    
    let product: any = null;
    const rejectUpdates = {
      status: 'rejected',
      approvalStatus: 'rejected',
      productStatus: 'rejected',
      visibilityStatus: 'hidden',
      rejectionReason: req.body.reason,
      rejectedAt: new Date().toISOString(),
    } as any;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.updateProduct(req.params.id, rejectUpdates as any);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.updateProduct(req.params.id, rejectUpdates);
    } else {
      product = db.updateProduct(req.params.id, rejectUpdates as any);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(product.sellerId) : db.getSeller(product.sellerId);
    if (seller?.email) {
      pushNotification({
        audience: 'seller',
        audienceId: seller.userId || seller.id,
        title: 'Product rejected',
        message: req.body.reason || `${product.title} was rejected by the catalog team.`,
        type: 'product_rejected',
        entityType: 'product',
        entityId: product.id,
      });
      await sendSellerNotice(
        seller.email,
        'Your product needs changes on ExShopi',
        'Product rejected',
        `${product.title} was rejected during moderation.`,
        [
          { label: 'Product', value: product.title },
          { label: 'Reason', value: req.body.reason || 'Rejected by catalog team' },
        ]
      );
    }
    res.json(await serializeMarketplaceProductAsync(product));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/products/bulk-review', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'catalog:review')) {
      return res.status(403).json({ error: 'Catalog access only' });
    }

    const payload = z.object({
      ids: z.array(z.string().min(1)).min(1),
      action: z.enum(['approve', 'reject', 'request_changes']),
      reason: z.string().optional().default(''),
      notes: z.string().optional().default(''),
    }).parse(req.body);

    const results = [];
    for (const id of payload.ids) {
      const updates =
        payload.action === 'approve'
              ? {
              status: 'live',
              approvalStatus: 'approved',
              productStatus: 'live',
              visibilityStatus: 'live',
              approvalNotes: payload.notes,
              rejectionReason: '',
              approvedAt: new Date().toISOString(),
            }
          : {
              status: 'rejected',
              approvalStatus: 'rejected',
              productStatus: 'rejected',
              visibilityStatus: 'hidden',
              rejectionReason: payload.reason || (payload.action === 'request_changes' ? 'Changes requested by catalog team' : 'Rejected by catalog team'),
              approvalNotes: payload.notes,
              rejectedAt: new Date().toISOString(),
            };

      let updated: any = null;
      if (prismaRuntime.enabled) {
        updated = await prismaRuntime.updateProduct(id, updates as any);
      } else if (supabaseRuntime.enabled) {
        updated = await supabaseRuntime.updateProduct(id, updates as any);
      } else {
        updated = db.updateProduct(id, updates as any);
      }
      if (updated) {
        const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(updated.sellerId) : db.getSeller(updated.sellerId);
        if (seller?.email) {
          const actionType =
            payload.action === 'approve'
              ? 'product_approved'
              : payload.action === 'request_changes'
              ? 'product_info_requested'
              : 'product_rejected';
          pushNotification({
            audience: 'seller',
            audienceId: seller.userId || seller.id,
            title:
              payload.action === 'approve'
                ? 'Product approved'
                : payload.action === 'request_changes'
                ? 'More product information requested'
                : 'Product rejected',
            message:
              payload.action === 'approve'
                ? `${updated.title} is now live on ExShopi.`
                : payload.reason || payload.notes || `${updated.title} was reviewed by the catalog team.`,
            type: actionType,
            entityType: 'product',
            entityId: updated.id,
          });
          await sendSellerNotice(
            seller.email,
            payload.action === 'approve'
              ? 'Your product is now live on ExShopi'
              : payload.action === 'request_changes'
              ? 'More information needed for your product'
              : 'Your product was rejected on ExShopi',
            payload.action === 'approve'
              ? 'Product approved'
              : payload.action === 'request_changes'
              ? 'Additional product details requested'
              : 'Product rejected',
            payload.action === 'approve'
              ? `${updated.title} is now live on the marketplace.`
              : `${updated.title} needs catalog follow-up before it can go live.`,
            [
              { label: 'Product', value: updated.title },
              {
                label: payload.action === 'approve' ? 'Status' : 'Review note',
                value: payload.reason || payload.notes || 'Catalog team review completed',
              },
            ]
          );
        }
        results.push(await serializeMarketplaceProductAsync(updated));
      }
    }

    res.json({ success: true, count: results.length, products: results });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Admin create/update/delete products (ExShopi official)
app.post('/api/admin/products', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const payload = await adminProductPayloadSchema.parseAsync(req.body);
    const lifecycle = deriveAdminLifecycle(payload);
    const categoryId = payload.categoryId || payload.category || '';
    assertAdminProductRequirements({ ...payload, categoryId }, lifecycle.status);

    const categoryIds = flattenCategoryIds(prismaRuntime.enabled ? await prismaRuntime.getCategories() : db.getCategories());
    if (categoryId && !categoryIds.has(categoryId)) {
      return res.status(400).json({ error: 'Selected category no longer exists. Please choose a valid category.' });
    }

    const assignedSeller = await resolveAdminAssignedSeller(payload.sellerId);
    if (!assignedSeller) {
      return res.status(400).json({ error: 'ExShopi Official seller profile is missing. Please seed the official store first.' });
    }

    const seo = await buildPersistedProductSeo(payload);
    const normalizedSpecs = normalizeProductSpecifications(payload.specs || {}, {
      parentCategorySlug: payload.specs?.parentCategorySlug || payload.specs?.categorySlug || '',
      parentCategoryName: payload.specs?.parentCategoryName || payload.specs?.categoryName || '',
      categorySlug: payload.specs?.categorySlug || payload.specs?.parentCategorySlug || '',
      categoryName: payload.specs?.categoryName || payload.specs?.parentCategoryName || '',
      subcategorySlug: payload.specs?.subcategorySlug || payload.specs?.templateId || '',
      subcategoryName: payload.specs?.subcategoryName || payload.specs?.templateName || '',
      title: payload.title || 'Untitled',
    });
    if (lifecycle.status !== 'draft') {
      validateSeoForPublish(seo);
      validateProductSpecificationsForTemplate(normalizedSpecs.specs, normalizedSpecs.template, {
        requireHighlights: true,
      });
    }

    const productInput = {
      sellerId: assignedSeller.id,
      storeId: assignedSeller.id,
      categoryId,
      slug: seo.slug,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      canonicalUrl: seo.canonicalUrl,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage,
      title: payload.title || 'Untitled',
      description: payload.description || '',
      price: Number(payload.price || 0),
      priceUae: Number(payload.priceUae ?? payload.price ?? 0),
      priceKsa: payload.priceKsa != null ? Number(payload.priceKsa) : undefined,
      originalPrice:
        payload.originalPrice != null ? Number(payload.originalPrice) : Number(payload.salePrice ?? payload.price ?? 0),
      compareAtPriceUae:
        payload.compareAtPriceUae != null
          ? Number(payload.compareAtPriceUae)
          : Number(payload.originalPrice ?? payload.salePrice ?? payload.price ?? 0),
      compareAtPriceKsa: payload.compareAtPriceKsa != null ? Number(payload.compareAtPriceKsa) : undefined,
      salePrice: payload.salePrice != null ? Number(payload.salePrice) : Number(payload.price || 0),
      image: payload.image || payload.images?.[0] || '',
      images: Array.isArray(payload.images) ? payload.images : [],
      stock: Number(payload.stock || 0),
      rating: Number(payload.rating || 0),
      reviews: Number(payload.reviews || 0),
      sku: payload.sku || '',
      brand: payload.brand || payload.specs?.attributes?.brand || '',
      specs: {
        ...mergeProductSeoIntoSpecs(normalizedSpecs.specs || {}, seo),
        ownership: {
          sellerId: assignedSeller.id,
          sellerName: assignedSeller.storeName,
          isOfficialStore: Boolean(assignedSeller.isOfficial),
        },
      },
      status: lifecycle.status,
      approvalStatus: lifecycle.approvalStatus,
      productStatus: lifecycle.productStatus,
      visibilityStatus: lifecycle.visibilityStatus,
      ownership: assignedSeller.isOfficial ? 'official' : 'seller',
      createdByRole: 'admin',
      approvalRequestedAt: payload.approvalRequestedAt || new Date().toISOString(),
      approvedAt: lifecycle.approvalStatus === 'approved' ? payload.approvedAt || new Date().toISOString() : '',
      rejectedAt: lifecycle.approvalStatus === 'rejected' ? payload.rejectedAt || new Date().toISOString() : '',
      approvalNotes: payload.approvalNotes || '',
      rejectionReason: payload.rejectionReason || '',
      views: Number(payload.views || 0),
      wishlistCount: Number(payload.wishlistCount || 0),
      badges: payload.badges || [],
    };

    let product: any = null;
    if (prismaRuntime.enabled) {
      product = await prismaRuntime.createProduct(productInput as any);
    } else if (supabaseRuntime.enabled) {
      product = await supabaseRuntime.createProduct(productInput as any);
    } else {
      product = db.createProduct(productInput as any);
    }

    res.json(await serializeMarketplaceProductAsync(product));
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.put('/api/admin/products/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const nextPayload = { ...(await adminProductPayloadSchema.partial().parseAsync(req.body)) } as any;
    const currentProduct = prismaRuntime.enabled
      ? await prismaRuntime.getProduct(req.params.id)
      : supabaseRuntime.enabled
      ? await supabaseRuntime.getProduct(req.params.id)
      : db.getProduct(req.params.id);
    if (!currentProduct) return res.status(404).json({ error: 'Product not found' });

    if (nextPayload.specs || nextPayload.title || nextPayload.categoryId) {
      const normalizedSpecs = normalizeProductSpecifications(
        {
          ...((currentProduct as any)?.specs || {}),
          ...(nextPayload.specs || {}),
        },
        {
          parentCategorySlug:
            nextPayload.specs?.parentCategorySlug || (currentProduct as any)?.specs?.parentCategorySlug || (currentProduct as any)?.specs?.categorySlug || '',
          parentCategoryName:
            nextPayload.specs?.parentCategoryName || (currentProduct as any)?.specs?.parentCategoryName || (currentProduct as any)?.specs?.categoryName || '',
          categorySlug:
            nextPayload.specs?.categorySlug || (currentProduct as any)?.specs?.categorySlug || (currentProduct as any)?.specs?.parentCategorySlug || '',
          categoryName:
            nextPayload.specs?.categoryName || (currentProduct as any)?.specs?.categoryName || (currentProduct as any)?.specs?.parentCategoryName || '',
          subcategorySlug:
            nextPayload.specs?.subcategorySlug || (currentProduct as any)?.specs?.subcategorySlug || (currentProduct as any)?.specs?.templateId || '',
          subcategoryName:
            nextPayload.specs?.subcategoryName || (currentProduct as any)?.specs?.subcategoryName || (currentProduct as any)?.specs?.templateName || '',
          title: nextPayload.title || (currentProduct as any)?.title,
        }
      );
      nextPayload.specs = normalizedSpecs.specs;
      if ((nextPayload.status || (currentProduct as any)?.status) !== 'draft') {
        validateProductSpecificationsForTemplate(nextPayload.specs, normalizedSpecs.template, {
          requireHighlights: true,
        });
      }
    }

    if (nextPayload.title || nextPayload.slug || nextPayload.metaTitle || nextPayload.metaDescription || nextPayload.metaKeywords) {
      const seo = await buildPersistedProductSeo(
        {
          ...(currentProduct || {}),
          ...nextPayload,
          specs: {
            ...((currentProduct as any)?.specs || {}),
            ...(nextPayload.specs || {}),
          },
        },
        req.params.id
      );
      nextPayload.slug = seo.slug;
      nextPayload.metaTitle = seo.metaTitle;
      nextPayload.metaDescription = seo.metaDescription;
      nextPayload.metaKeywords = seo.metaKeywords;
      nextPayload.canonicalUrl = seo.canonicalUrl;
      nextPayload.ogTitle = seo.ogTitle;
      nextPayload.ogDescription = seo.ogDescription;
      nextPayload.ogImage = seo.ogImage;
      nextPayload.specs = mergeProductSeoIntoSpecs(
        {
          ...((currentProduct as any)?.specs || {}),
          ...(nextPayload.specs || {}),
        },
        seo
      );
      if ((nextPayload.status || (currentProduct as any)?.status) !== 'draft') {
        validateSeoForPublish(seo);
      }
    }

    if (nextPayload.categoryId) {
      const categoryIds = flattenCategoryIds(prismaRuntime.enabled ? await prismaRuntime.getCategories() : db.getCategories());
      if (!categoryIds.has(nextPayload.categoryId)) {
        return res.status(400).json({ error: 'Selected category no longer exists. Please choose a valid category.' });
      }
    }

    if (nextPayload.sellerId) {
      const assignedSeller = await resolveAdminAssignedSeller(nextPayload.sellerId);
      if (!assignedSeller) {
        return res.status(400).json({ error: 'Assigned seller not found' });
      }
      nextPayload.sellerId = assignedSeller.id;
      nextPayload.storeId = assignedSeller.id;
      nextPayload.specs = {
        ...(nextPayload.specs || {}),
        ownership: {
          sellerId: assignedSeller.id,
          sellerName: assignedSeller.storeName,
          isOfficialStore: Boolean(assignedSeller.isOfficial),
        },
      };
    }

    if (nextPayload.status || nextPayload.productStatus || nextPayload.approvalStatus) {
      const lifecycle = deriveAdminLifecycle(nextPayload);
      nextPayload.status = lifecycle.status;
      nextPayload.approvalStatus = lifecycle.approvalStatus;
      nextPayload.productStatus = lifecycle.productStatus;
      nextPayload.visibilityStatus = lifecycle.visibilityStatus;
      if (lifecycle.approvalStatus === 'approved' && !nextPayload.approvedAt) {
        nextPayload.approvedAt = new Date().toISOString();
      }
      if (lifecycle.approvalStatus === 'rejected' && !nextPayload.rejectedAt) {
        nextPayload.rejectedAt = new Date().toISOString();
      }
    }

    let updated: any = null;
    if (prismaRuntime.enabled) {
      updated = await prismaRuntime.updateProduct(req.params.id, nextPayload as any);
    } else if (supabaseRuntime.enabled) {
      updated = await supabaseRuntime.updateProduct(req.params.id, nextPayload as any);
    } else {
      updated = db.updateProduct(req.params.id, nextPayload as any);
    }
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(await serializeMarketplaceProductAsync(updated));
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    let existing: any = null;
    if (prismaRuntime.enabled) {
      existing = await prismaRuntime.getProduct(req.params.id);
    } else if (supabaseRuntime.enabled) {
      existing = await supabaseRuntime.getProduct(req.params.id);
    } else {
      existing = db.getProduct(req.params.id);
    }
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const updates = buildSoftDeleteProductPayload(existing);
    const deleted = prismaRuntime.enabled
      ? await prismaRuntime.updateProduct(req.params.id, updates as any)
      : supabaseRuntime.enabled
      ? await supabaseRuntime.updateProduct(req.params.id, updates as any)
      : db.updateProduct(req.params.id, updates as any);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    try {
      sendSseEvent('product-deleted', { id: req.params.id, ts: new Date().toISOString() });
    } catch (e) {
      /* ignore SSE errors */
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== ORDERS API ====================
app.post('/api/cod/otp/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Customer only' });
    }

    const payload = codOtpSendSchema.parse(req.body);
    const blacklisted = isBlacklisted({
      phone: payload.phone,
      email: payload.email,
      ip: getClientIp(req),
    });
    if (blacklisted) {
      return res.status(403).json({ error: `COD blocked for this ${blacklisted.type}.` });
    }
    if (!isValidPhoneForCountry(payload.phone, payload.country || 'AE')) {
      return res.status(400).json({ error: 'Please enter a valid phone number for the selected country.' });
    }

    const session = createCodOtpSession({
      customerId: req.user.id,
      phone: payload.phone,
      email: payload.email,
      ip: getClientIp(req),
    });

    res.json({
      sessionId: session.id,
      expiresAt: session.expiresAt,
      resendAvailableAt: session.resendAvailableAt,
      phone: session.phone,
      // Temporary local launch mode: expose OTP in API until real SMS provider is connected.
      otpCode: session.otpCode,
    });
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.post('/api/cod/otp/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Customer only' });
    }
    const payload = codOtpVerifySchema.parse(req.body);
    const session = verifyCodOtpSession(payload.sessionId, payload.code);
    res.json({
      verified: true,
      verificationToken: session.id,
      verifiedAt: session.verifiedAt,
      phone: session.phone,
    });
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.get('/api/admin/blacklist', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    res.json(listBlacklistEntries());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/blacklist', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const payload = blacklistEntrySchema.parse(req.body);
    const entry = addBlacklistEntry({
      ...payload,
      createdBy: req.user!.id,
    });
    recordMarketplaceActivity({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      entityType: 'blacklist',
      entityId: entry.id,
      action: 'blacklist_added',
      summary: `${payload.type} blacklist added for ${payload.value}`,
    });
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.post('/api/orders/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Customer only' });
    }

    const payload = createOrderSchema.parse(req.body);
    const {
      sellerId,
      shippingCost,
      shippingAddress,
      customerName,
      customerEmail,
      customerPhone,
      verificationToken,
      paymentMethod,
      deliveryCountry,
    } = payload;

    const normalizedItems =
      payload.items && payload.items.length
        ? payload.items
        : payload.productId
        ? [{ productId: payload.productId, quantity: payload.quantity || 1, unitPrice: payload.unitPrice || 0 }]
        : [];

    if (!normalizedItems.length) {
      return res.status(400).json({ error: 'At least one order item is required' });
    }

    if (paymentMethod !== 'cod') {
      return res.status(400).json({ error: 'Cash on Delivery is the only payment method available right now.' });
    }

    if (!isValidPhoneForCountry(customerPhone, deliveryCountry || 'AE')) {
      return res.status(400).json({ error: 'Please enter a valid phone number for the selected country.' });
    }

    const clientIp = getClientIp(req);
    const blacklistHit = isBlacklisted({
      phone: customerPhone,
      email: customerEmail,
      ip: clientIp,
    });
    if (blacklistHit) {
      return res.status(403).json({ error: `This customer is blocked from COD ordering (${blacklistHit.type}).` });
    }

    const isFirebaseVerification = verificationToken.startsWith('firebase:');
    let verificationMethod = 'phone_otp';
    if (isFirebaseVerification) {
      const [, verifiedPhone = ''] = verificationToken.split(':');
      if (normalizePhone(verifiedPhone) !== normalizePhone(customerPhone)) {
        return res.status(400).json({ error: 'Verified Firebase phone does not match the checkout phone.' });
      }
      verificationMethod = 'firebase_phone';
    } else {
      consumeCodOtpVerification(verificationToken, req.user.id, customerPhone);
    }

    const allOrders = prismaRuntime.enabled ? await prismaRuntime.getAllOrders() : db.getAllOrders();
    const now = Date.now();
    const priorCustomerOrdersToday = allOrders.filter((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : 0;
      return (
        order.customerId === req.user!.id &&
        now - createdAt < 24 * 60 * 60 * 1000 &&
        now - createdAt > 10 * 60 * 1000
      );
    }).length;
    if (priorCustomerOrdersToday >= COD_MAX_DAILY_ORDERS) {
      return res.status(429).json({ error: 'Daily COD order limit reached for this customer.' });
    }

    const risk = calculateCodRisk({
      phone: customerPhone,
      email: customerEmail,
      ip: clientIp,
      orders: allOrders.map((order) => ({
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerId: order.customerId,
        createdAt: order.createdAt,
        status: order.status,
      })),
      customerId: req.user.id,
    });

    const orderPayload: any = await buildOrderPayloadFromItems({
      customerId: req.user!.id,
      sellerId,
      normalizedItems,
      shippingCost,
      shippingAddress: {
        ...shippingAddress,
        phone: normalizePhone(customerPhone),
        landmark: shippingAddress.landmark || '',
        source: 'website',
        risk,
        verification: {
          verifiedAt: new Date().toISOString(),
          method: verificationMethod,
          sessionId: verificationToken,
        },
      },
      customerName,
      customerEmail,
      customerPhone: normalizePhone(customerPhone),
      paymentMethod,
      paymentProvider: 'cod',
      paymentStatus: 'cod_pending',
      deliveryCountry,
    });

    const order = prismaRuntime.enabled
      ? await prismaRuntime.createOrder(orderPayload)
      : db.createOrder(orderPayload);
    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    const resolvedSellerId = String(orderPayload.sellerId || sellerId || '').trim();
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(resolvedSellerId) : db.getSeller(resolvedSellerId);
    const customer = prismaRuntime.enabled ? await prismaRuntime.getUser(req.user!.id) : db.getUser(req.user!.id);
    const orderSummaryTitle = orderPayload.items?.[0]?.title || 'Marketplace item';
    const timestamp = new Date().toISOString();

    console.info('[orders.create] order created', {
      requestedSellerId: sellerId,
      resolvedSellerId,
      orderId: orderPayload.orderId,
      itemCount: orderPayload.items?.length || 0,
      customerId: req.user!.id,
    });

    pushNotification({
      audience: 'admin',
      title: risk.riskLevel === 'suspicious' ? 'Suspicious COD order placed' : 'New COD order placed',
      message: `${customerName} placed ${orderPayload.orderId} for ${orderSummaryTitle}${risk.riskLevel === 'suspicious' ? ' and it needs review' : ''}.`,
      type: risk.riskLevel === 'suspicious' ? 'cod_order_risk' : 'cod_order_created',
      entityType: 'order',
      entityId: order.id,
    });
    pushNotification({
      audience: 'seller',
      audienceId: seller?.userId || seller?.id,
      title: 'New order received',
      message: `${customerName} placed ${orderPayload.orderId}. Prepare it for confirmation and packing.`,
      type: 'order_created',
      entityType: 'order',
      entityId: order.id,
    });
    pushNotification({
      audience: 'customer',
      audienceId: req.user!.id,
      title: 'Order placed successfully',
      message: `Your COD order ${orderPayload.orderId} is waiting for seller confirmation.`,
      type: 'order_created',
      entityType: 'order',
      entityId: order.id,
    });
    recordMarketplaceActivity({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      entityType: 'order',
      entityId: order.id,
      action: 'cod_order_created',
      summary: `${customerName} placed COD order ${orderPayload.orderId}${risk.riskLevel === 'suspicious' ? ' (flagged)' : ''}`,
    });
    await sendAdminAlert(
      risk.riskLevel === 'suspicious' ? 'Suspicious COD order placed' : 'New COD order placed',
      risk.riskLevel === 'suspicious' ? 'Suspicious COD order requires review' : 'New COD order received',
      `${customerName} placed a COD order on ExShopi.`,
      [
        ...buildOrderFacts(
          {
            ...orderPayload,
            createdAt: orderPayload.createdAt || timestamp,
            customerName,
            paymentMethod,
            paymentStatus: 'cod_pending',
          },
          seller?.storeName
        ),
        { label: 'Phone', value: normalizePhone(customerPhone) },
        { label: 'Risk level', value: risk.riskLevel },
      ]
    );

    await notifyAdminsOfNewOrder(
      {
        ...order,
        ...orderPayload,
        id: order.id,
        createdAt: order.createdAt || orderPayload.createdAt || timestamp,
      },
      seller
    );
    if (seller?.email) {
      await sendSellerNotice(
        seller.email,
        'New order received in ExShopi Seller Center',
        'A new order is ready for confirmation',
        `${customerName} has placed a COD order for your store.`,
        buildOrderFacts(orderPayload, seller.storeName)
      );
    }
    if (customerEmail) {
      await sendCustomerNotice(
        customerEmail,
        'Your ExShopi order has been placed',
        'Order placed successfully',
        `Your Cash on Delivery order ${orderPayload.orderId} has been created and is now waiting for seller confirmation.`,
        buildOrderFacts(orderPayload, seller?.storeName)
      );
    }

    let enrichedOrder: any;
    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(order.id, 'pending_confirmation', timestamp, `Order placed for ${seller?.storeName || 'seller'} by ${customer?.name || customerName || 'customer'}`);
      enrichedOrder = await serializeMarketplaceOrderAsync(order);
    } else {
      db.addTrackingEvent(order.id, 'pending_confirmation', timestamp, `Order placed for ${seller?.storeName || 'seller'} by ${customer?.name || customerName || 'customer'}`);
      enrichedOrder = serializeMarketplaceOrder(order);
    }

    // Notify connected admin UIs in realtime
    try {
      sendSseEvent('order-created', {
        id: enrichedOrder.id,
        orderId: enrichedOrder.orderId,
        status: enrichedOrder.status,
        subtotal: enrichedOrder.subtotal,
        sellerId: enrichedOrder.sellerId,
        createdAt: enrichedOrder.createdAt,
      });
    } catch (e) {
      /* ignore SSE failures */
    }

    res.json(enrichedOrder);
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.post('/api/payments/stripe/checkout-session', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Customer only' });
    }

    const payload = stripeCheckoutSchema.parse(req.body);
    const groupedItems = new Map<string, Array<{ productId: string; quantity: number; unitPrice: number }>>();

    payload.items.forEach((item) => {
      if (!groupedItems.has(item.sellerId)) {
        groupedItems.set(item.sellerId, []);
      }
      groupedItems.get(item.sellerId)!.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
      });
    });

    const createdOrders: any[] = [];
    for (const [sellerId, items] of groupedItems.entries()) {
      const orderPayload = await buildOrderPayloadFromItems({
        customerId: req.user!.id,
        sellerId,
        normalizedItems: items,
        shippingAddress: payload.shippingAddress,
        paymentMethod: 'card',
        paymentProvider: 'stripe',
        paymentStatus: 'awaiting_payment',
        deliveryCountry: payload.deliveryCountry,
      });

      const order = prismaRuntime.enabled
        ? await prismaRuntime.createOrder(orderPayload)
        : db.createOrder(orderPayload);
      if (!order) {
        throw new Error('Failed to create payment-ready order');
      }

      createdOrders.push(order);
      if (prismaRuntime.enabled) {
        await prismaRuntime.addTrackingEvent(order.id, 'placed', new Date().toISOString(), 'Stripe checkout initiated');
        try {
          const enriched = await serializeMarketplaceOrderAsync(order);
          sendSseEvent('order-created', { id: enriched.id, orderId: enriched.orderId, status: enriched.status, subtotal: enriched.subtotal, sellerId: enriched.sellerId, createdAt: enriched.createdAt });
        } catch (e) {
          /* ignore */
        }
      } else {
        db.addTrackingEvent(order.id, 'placed', new Date().toISOString(), 'Stripe checkout initiated');
        try {
          const enriched = serializeMarketplaceOrder(order);
          sendSseEvent('order-created', { id: enriched.id, orderId: enriched.orderId, status: enriched.status, subtotal: enriched.subtotal, sellerId: enriched.sellerId, createdAt: enriched.createdAt });
        } catch (e) {
          /* ignore */
        }
      }
    }

    const lineItems = createdOrders.flatMap((order) =>
      (order.items || []).map((item: any) => ({
        name: item.title,
        amountAed: Number(item.unitPrice || 0) + Math.round((Number(item.vatAmount || 0) / Math.max(Number(item.quantity || 1), 1)) * 100) / 100,
        quantity: Number(item.quantity || 1),
      }))
    );

    const deliveryLineAmount = createdOrders.reduce((sum, order) => sum + Number(order.shippingCost || 0), 0);
    if (deliveryLineAmount > 0) {
      lineItems.push({
        name: 'Delivery & handling',
        amountAed: deliveryLineAmount,
        quantity: 1,
      });
    }

    const session = await createStripeCheckoutSession({
      customerEmail: createdOrders[0]?.customerEmail || '',
      successUrl: `${APP_URL}/order-success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/checkout?payment=cancelled`,
      metadata: {
        customerId: req.user!.id,
        orderIds: createdOrders.map((order) => order.id).join(','),
      },
      lineItems,
    });

    for (const order of createdOrders) {
      const updated = prismaRuntime.enabled
        ? await prismaRuntime.updateOrder(order.id, {
            paymentSessionId: session.id,
            paymentReference: session.payment_intent || session.id,
            paymentStatus: 'awaiting_payment',
          } as any)
        : db.updateOrder(order.id, {
            paymentSessionId: session.id,
            paymentReference: session.payment_intent || session.id,
            paymentStatus: 'awaiting_payment',
          } as any);

      if (prismaRuntime.enabled) {
        await prismaRuntime.addTrackingEvent(order.id, 'placed', new Date().toISOString(), `Stripe session ${session.id} created`);
      } else if (updated) {
        db.addTrackingEvent(order.id, 'placed', new Date().toISOString(), `Stripe session ${session.id} created`);
      }
    }

    res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      orderIds: createdOrders.map((order) => order.id),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/payments/stripe/webhook', async (req: Request, res: Response) => {
  try {
    const event = verifyStripeWebhookSignature(req.body as Buffer, req.headers['stripe-signature']);
    const session = event?.data?.object;
    const orderIds = String(session?.metadata?.orderIds || '')
      .split(',')
      .map((entry: string) => entry.trim())
      .filter(Boolean);

    if (event.type === 'checkout.session.completed' && orderIds.length > 0) {
      for (const orderId of orderIds) {
        const existing = prismaRuntime.enabled ? await prismaRuntime.getOrder(orderId) : db.getOrder(orderId);
        if (!existing) continue;
        if (prismaRuntime.enabled) {
          await prismaRuntime.updateOrder(orderId, {
            paymentStatus: 'completed',
            paymentReference: session.payment_intent || session.id,
            paymentSessionId: session.id,
            paidAt: new Date().toISOString(),
          } as any);
          await prismaRuntime.addTrackingEvent(orderId, 'confirmed', new Date().toISOString(), 'Stripe payment confirmed');
        } else {
          db.updateOrder(orderId, {
            paymentStatus: 'completed',
            paymentReference: session.payment_intent || session.id,
            paymentSessionId: session.id,
            paidAt: new Date().toISOString(),
          } as any);
          db.addTrackingEvent(orderId, 'confirmed', new Date().toISOString(), 'Stripe payment confirmed');
        }

        try {
          const latestForEmail = prismaRuntime.enabled ? await prismaRuntime.getOrder(orderId) : db.getOrder(orderId);
          const seller = latestForEmail?.sellerId
            ? prismaRuntime.enabled
              ? await prismaRuntime.getSeller(latestForEmail.sellerId)
              : db.getSeller(latestForEmail.sellerId)
            : null;
          if (latestForEmail) {
            await notifyAdminsOfNewOrder(latestForEmail, seller);
          }
        } catch (emailError) {
          console.warn('[stripe.webhook] Failed to send admin order email:', emailError);
        }

        // Notify admin UIs about the order update
        try {
          const latest = prismaRuntime.enabled ? await prismaRuntime.getOrder(orderId) : db.getOrder(orderId);
          const enriched = prismaRuntime.enabled ? await serializeMarketplaceOrderAsync(latest) : serializeMarketplaceOrder(latest);
          sendSseEvent('order-updated', {
            id: enriched.id,
            orderId: enriched.orderId,
            status: enriched.status,
            paymentStatus: enriched.paymentStatus,
            updatedAt: enriched.updatedAt || new Date().toISOString(),
          });
        } catch (e) {
          /* ignore SSE failures */
        }
      }
    }

    if ((event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') && orderIds.length > 0) {
      for (const orderId of orderIds) {
        if (prismaRuntime.enabled) {
          await prismaRuntime.updateOrder(orderId, {
            paymentStatus: 'failed',
            paymentReference: session?.payment_intent || session?.id || '',
            paymentSessionId: session?.id || '',
            status: 'failed',
          } as any);
          await prismaRuntime.addTrackingEvent(orderId, 'failed', new Date().toISOString(), 'Stripe payment failed or expired');
        } else {
          db.updateOrder(orderId, {
            paymentStatus: 'failed',
            paymentReference: session?.payment_intent || session?.id || '',
            paymentSessionId: session?.id || '',
            status: 'failed',
          } as any);
          db.addTrackingEvent(orderId, 'failed', new Date().toISOString(), 'Stripe payment failed or expired');
        }

        // Notify admin UIs about the failed payment
        try {
          const latest = prismaRuntime.enabled ? await prismaRuntime.getOrder(orderId) : db.getOrder(orderId);
          const enriched = prismaRuntime.enabled ? await serializeMarketplaceOrderAsync(latest) : serializeMarketplaceOrder(latest);
          sendSseEvent('order-updated', {
            id: enriched.id,
            orderId: enriched.orderId,
            status: enriched.status,
            paymentStatus: enriched.paymentStatus,
            updatedAt: enriched.updatedAt || new Date().toISOString(),
          });
        } catch (e) {
          /* ignore SSE failures */
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get('/api/orders/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.id) : db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const authSeller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user!.id) : db.getSellerByUserId(req.user!.id);
    const isSellerOwner = req.user?.role === 'seller' && authSeller?.id === order.sellerId;
    const isCustomerOwner = req.user?.id === order.customerId;
    if (!isSellerOwner && !isCustomerOwner && !isBackofficeRole(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(prismaRuntime.enabled ? await serializeMarketplaceOrderAsync(order) : serializeMarketplaceOrder(order));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/orders/customer/:customerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.id !== req.params.customerId && !isBackofficeRole(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const orders = prismaRuntime.enabled ? await prismaRuntime.getCustomerOrders(req.params.customerId) : db.getCustomerOrders(req.params.customerId);
    res.json(
      prismaRuntime.enabled
        ? await Promise.all(orders.map((order) => serializeMarketplaceOrderAsync(order)))
        : orders.map((order) => serializeMarketplaceOrder(order))
    );
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/orders/seller/:sellerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user!.id) : db.getSellerByUserId(req.user!.id);
    if (req.user?.role !== 'seller' || !seller || seller.id !== req.params.sellerId) {
      return res.status(403).json({ error: 'Seller ownership required' });
    }
    const orders = prismaRuntime.enabled ? await prismaRuntime.getSellerOrders(req.params.sellerId) : db.getSellerOrders(req.params.sellerId);
    res.json(
      prismaRuntime.enabled
        ? await Promise.all(orders.map((order) => serializeMarketplaceOrderAsync(order)))
        : orders.map((order) => serializeMarketplaceOrder(order))
    );
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== ORDER STATUS UPDATE ====================
app.put('/api/orders/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const requestedStatus = normalizeOperationalStatus(req.body?.status);
    if (!OPERATIONAL_ORDER_STATUSES.has(requestedStatus)) {
      return res.status(400).json({ error: 'Unsupported order status' });
    }
    const currentOrder = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.id) : db.getOrder(req.params.id);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const authSeller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user!.id) : db.getSellerByUserId(req.user!.id);
    const isSellerOwner = req.user?.role === 'seller' && authSeller?.id === currentOrder.sellerId;
    if (!isSellerOwner && !isBackofficeRole(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const nextStoredStatus = mapOperationalStatusToStoredStatus(requestedStatus);
    const order = prismaRuntime.enabled
      ? await prismaRuntime.updateOrder(req.params.id, {
          status: nextStoredStatus as any,
          deliveredAt: requestedStatus === 'delivered' ? new Date().toISOString() : undefined,
          paymentStatus: requestedStatus === 'delivered' ? 'paid' : undefined,
          paidAt: requestedStatus === 'delivered' ? new Date().toISOString() : undefined,
        })
      : db.updateOrder(req.params.id, {
          status: nextStoredStatus as any,
          deliveredAt: requestedStatus === 'delivered' ? new Date().toISOString() : currentOrder.deliveredAt,
          paymentStatus: requestedStatus === 'delivered' ? 'paid' : currentOrder.paymentStatus,
          paidAt: requestedStatus === 'delivered' ? new Date().toISOString() : currentOrder.paidAt,
        });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const timestamp = new Date().toISOString();
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(currentOrder.sellerId) : db.getSeller(currentOrder.sellerId);
    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(order.id, requestedStatus, timestamp, `Order moved to ${requestedStatus.replace(/_/g, ' ')}`);
      pushNotification({
        audience: 'customer',
        audienceId: currentOrder.customerId,
        title: 'Order status updated',
        message: `${currentOrder.orderId || currentOrder.id} is now ${requestedStatus.replace(/_/g, ' ')}.`,
        type: 'order_status_update',
        entityType: 'order',
        entityId: order.id,
      });
      pushNotification({
        audience: 'seller',
        audienceId: authSeller?.userId || currentOrder.sellerId,
        title: 'Order status changed',
        message: `${currentOrder.orderId || currentOrder.id} moved to ${requestedStatus.replace(/_/g, ' ')}.`,
        type: 'order_status_update',
        entityType: 'order',
        entityId: order.id,
      });
      recordMarketplaceActivity({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        entityType: 'order',
        entityId: order.id,
        action: 'order_status_updated',
        summary: `${currentOrder.orderId || currentOrder.id} moved to ${requestedStatus.replace(/_/g, ' ')}`,
      });
      if (currentOrder.customerEmail) {
        await sendCustomerNotice(
          currentOrder.customerEmail,
          `Your ExShopi order is now ${formatOperationalStatusLabel(requestedStatus)}`,
          `Order ${formatOperationalStatusLabel(requestedStatus)}`,
          `${currentOrder.orderId || currentOrder.id} is now ${requestedStatus.replace(/_/g, ' ')}.`,
          buildOrderFacts(currentOrder, seller?.storeName)
        );
      }
      return res.json(await serializeMarketplaceOrderAsync(order));
    }
    db.addTrackingEvent(order.id, requestedStatus, timestamp, `Order moved to ${requestedStatus.replace(/_/g, ' ')}`);
    pushNotification({
      audience: 'customer',
      audienceId: currentOrder.customerId,
      title: 'Order status updated',
      message: `${currentOrder.orderId || currentOrder.id} is now ${requestedStatus.replace(/_/g, ' ')}.`,
      type: 'order_status_update',
      entityType: 'order',
      entityId: order.id,
    });
    recordMarketplaceActivity({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      entityType: 'order',
      entityId: order.id,
      action: 'order_status_updated',
      summary: `${currentOrder.orderId || currentOrder.id} moved to ${requestedStatus.replace(/_/g, ' ')}`,
    });
    if (currentOrder.customerEmail) {
      await sendCustomerNotice(
        currentOrder.customerEmail,
        `Your ExShopi order is now ${formatOperationalStatusLabel(requestedStatus)}`,
        `Order ${formatOperationalStatusLabel(requestedStatus)}`,
        `${currentOrder.orderId || currentOrder.id} is now ${requestedStatus.replace(/_/g, ' ')}.`,
        buildOrderFacts(currentOrder, seller?.storeName)
      );
    }
    res.json(serializeMarketplaceOrder(order));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/orders/:id/request-return', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.id) : db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.user?.role !== 'customer' && !isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const next = prismaRuntime.enabled
      ? await prismaRuntime.updateOrder(req.params.id, {
          status: mapOperationalStatusToStoredStatus('return_requested') as any,
          refundStatus: 'requested',
          refundReason: req.body.reason || 'Customer requested return',
          refundAmount: req.body.refundAmount || order.totalAmount || order.subtotal,
        })
      : db.updateOrderStatus(req.params.id, 'return_requested');
    if (!next) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(next.id, 'return_requested', new Date().toISOString(), next.refundReason || 'Return requested');
      pushNotification({
        audience: 'admin',
        title: 'Return requested',
        message: `${order.orderId || order.id} has a new return request.`,
        type: 'return_requested',
        entityType: 'order',
        entityId: order.id,
      });
      pushNotification({
        audience: 'customer',
        audienceId: order.customerId,
        title: 'Return request submitted',
        message: `Return request submitted for ${order.orderId || order.id}.`,
        type: 'return_requested',
        entityType: 'order',
        entityId: order.id,
      });
      await sendAdminAlert(
        'New return request received',
        'Return request needs review',
        `${order.orderId || order.id} has a new return request from the customer.`,
        buildOrderFacts(order)
      );
      if (order.customerEmail) {
        await sendCustomerNotice(
          order.customerEmail,
          'Your return request has been submitted',
          'Return request submitted',
          `We have received your return request for ${order.orderId || order.id}.`,
          buildOrderFacts(order)
        );
      }
      return res.json(await serializeMarketplaceOrderAsync(next));
    }
    next.refundStatus = 'requested';
    next.refundReason = req.body.reason || 'Customer requested return';
    next.refundAmount = req.body.refundAmount || next.totalAmount || next.subtotal;
    next.updatedAt = new Date().toISOString();
    db.addTrackingEvent(next.id, 'return_requested', new Date().toISOString(), next.refundReason || 'Return requested');
    pushNotification({
      audience: 'admin',
      title: 'Return requested',
      message: `${order.orderId || order.id} has a new return request.`,
      type: 'return_requested',
      entityType: 'order',
      entityId: order.id,
    });
    pushNotification({
      audience: 'customer',
      audienceId: order.customerId,
      title: 'Return request submitted',
      message: `Return request submitted for ${order.orderId || order.id}.`,
      type: 'return_requested',
      entityType: 'order',
      entityId: order.id,
    });
    await sendAdminAlert(
      'New return request received',
      'Return request needs review',
      `${order.orderId || order.id} has a new return request from the customer.`,
      buildOrderFacts(order)
    );
    if (order.customerEmail) {
      await sendCustomerNotice(
        order.customerEmail,
        'Your return request has been submitted',
        'Return request submitted',
        `We have received your return request for ${order.orderId || order.id}.`,
        buildOrderFacts(order)
      );
    }
    res.json(serializeMarketplaceOrder(next));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/orders/:id/dispatch-slot', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.id) : db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const authSeller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user!.id) : db.getSellerByUserId(req.user!.id);
    const isSellerOwner = req.user?.role === 'seller' && authSeller?.id === order.sellerId;
    if (!isAdminLike(req.user?.role) && !isSellerOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateOrder(req.params.id, {
          dispatchSlotDate: req.body.dispatchSlotDate || '',
          dispatchSlotWindow: req.body.dispatchSlotWindow || '',
          dispatchNotes: req.body.dispatchNotes || '',
          courierPartner: req.body.courierPartner || '',
          status: mapOperationalStatusToStoredStatus(req.body.status || 'waiting_for_pickup') as any,
        })
      : db.updateOrderDispatch(req.params.id, {
          dispatchSlotDate: req.body.dispatchSlotDate || '',
          dispatchSlotWindow: req.body.dispatchSlotWindow || '',
          dispatchNotes: req.body.dispatchNotes || '',
          courierPartner: req.body.courierPartner || '',
          status: mapOperationalStatusToStoredStatus(req.body.status || 'waiting_for_pickup') as any,
        });

    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(updated.id, normalizeOperationalStatus(req.body.status || 'waiting_for_pickup'), new Date().toISOString(), updated.dispatchNotes || 'Dispatch slot updated');
      pushNotification({
        audience: 'customer',
        audienceId: order.customerId,
        title: 'Order ready for pickup',
        message: `${order.orderId || order.id} is now waiting for ExShopi pickup.`,
        type: 'order_waiting_pickup',
        entityType: 'order',
        entityId: order.id,
      });
      if (order.customerEmail) {
        await sendCustomerNotice(
          order.customerEmail,
          'Your order is waiting for pickup',
          'Order waiting for pickup',
          `${order.orderId || order.id} is packed and waiting for ExShopi pickup.`,
          buildOrderFacts(order)
        );
      }
      return res.json(await serializeMarketplaceOrderAsync(updated));
    }
    pushNotification({
      audience: 'customer',
      audienceId: order.customerId,
      title: 'Order ready for pickup',
      message: `${order.orderId || order.id} is now waiting for ExShopi pickup.`,
      type: 'order_waiting_pickup',
      entityType: 'order',
      entityId: order.id,
    });
    if (order.customerEmail) {
      await sendCustomerNotice(
        order.customerEmail,
        'Your order is waiting for pickup',
        'Order waiting for pickup',
        `${order.orderId || order.id} is packed and waiting for ExShopi pickup.`,
        buildOrderFacts(order)
      );
    }
    res.json(serializeMarketplaceOrder(updated));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/admin/orders/:id/refund', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const order = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.id) : db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const action = req.body.action || 'approve';
    if (action === 'approve') {
      if (prismaRuntime.enabled) {
        const updated = await prismaRuntime.updateOrder(req.params.id, {
          refundStatus: 'refunded',
          status: 'returned',
          paymentStatus: 'completed',
          payoutStatus: 'pending',
          commission: 0,
          sellerAmount: 0,
          refundAmount: req.body.refundAmount || order.totalAmount || order.subtotal,
        });
        if (!updated) return res.status(404).json({ error: 'Order not found' });
        await prismaRuntime.addTrackingEvent(updated.id, 'returned', new Date().toISOString(), 'Refund approved and order marked returned');
        pushNotification({
          audience: 'customer',
          audienceId: order.customerId,
          title: 'Return approved',
          message: `${order.orderId || order.id} return has been approved.`,
          type: 'return_approved',
          entityType: 'order',
          entityId: order.id,
        });
        if (order.customerEmail) {
          await sendCustomerNotice(
            order.customerEmail,
            'Your ExShopi return was approved',
            'Return approved',
            `Your return for ${order.orderId || order.id} has been approved.`,
            buildOrderFacts(order)
          );
        }
        return res.json(await serializeMarketplaceOrderAsync(updated));
      }
      order.refundStatus = 'refunded';
      order.status = 'returned';
      order.paymentStatus = 'completed';
      order.payoutStatus = 'pending';
      order.commission = 0;
      order.sellerAmount = 0;
      if (Array.isArray(order.items)) {
        order.items = order.items.map((item) => ({
          ...item,
          commission: 0,
          sellerAmount: 0,
        }));
      }
      order.refundAmount = req.body.refundAmount || order.totalAmount || order.subtotal;
      order.updatedAt = new Date().toISOString();
      db.addTrackingEvent(order.id, 'returned', new Date().toISOString(), 'Refund approved and order marked returned');
      pushNotification({
        audience: 'customer',
        audienceId: order.customerId,
        title: 'Return approved',
        message: `${order.orderId || order.id} return has been approved.`,
        type: 'return_approved',
        entityType: 'order',
        entityId: order.id,
      });
      if (order.customerEmail) {
        await sendCustomerNotice(
          order.customerEmail,
          'Your ExShopi return was approved',
          'Return approved',
          `Your return for ${order.orderId || order.id} has been approved.`,
          buildOrderFacts(order)
        );
      }
    } else if (action === 'reject') {
      if (prismaRuntime.enabled) {
        const updated = await prismaRuntime.updateOrder(req.params.id, {
          refundStatus: 'rejected',
          refundReason: req.body.reason || 'Refund rejected',
        });
        if (!updated) return res.status(404).json({ error: 'Order not found' });
        await prismaRuntime.addTrackingEvent(updated.id, 'refund_rejected', new Date().toISOString(), req.body.reason || 'Refund rejected');
        pushNotification({
          audience: 'customer',
          audienceId: order.customerId,
          title: 'Return rejected',
          message: req.body.reason || `${order.orderId || order.id} return request was rejected.`,
          type: 'return_rejected',
          entityType: 'order',
          entityId: order.id,
        });
        if (order.customerEmail) {
          await sendCustomerNotice(
            order.customerEmail,
            'Your ExShopi return was not approved',
            'Return rejected',
            `Your return for ${order.orderId || order.id} could not be approved.`,
            [
              ...buildOrderFacts(order),
              { label: 'Reason', value: req.body.reason || 'Refund rejected' },
            ]
          );
        }
        return res.json(await serializeMarketplaceOrderAsync(updated));
      }
      order.refundStatus = 'rejected';
      order.updatedAt = new Date().toISOString();
      db.addTrackingEvent(order.id, 'refund_rejected', new Date().toISOString(), req.body.reason || 'Refund rejected');
      pushNotification({
        audience: 'customer',
        audienceId: order.customerId,
        title: 'Return rejected',
        message: req.body.reason || `${order.orderId || order.id} return request was rejected.`,
        type: 'return_rejected',
        entityType: 'order',
        entityId: order.id,
      });
      if (order.customerEmail) {
        await sendCustomerNotice(
          order.customerEmail,
          'Your ExShopi return was not approved',
          'Return rejected',
          `Your return for ${order.orderId || order.id} could not be approved.`,
          [
            ...buildOrderFacts(order),
            { label: 'Reason', value: req.body.reason || 'Refund rejected' },
          ]
        );
      }
    }

    res.json(serializeMarketplaceOrder(order));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== TRACKING API ====================
app.get('/api/tracking/:trackingCode', async (req: Request, res: Response) => {
  try {
    const order = prismaRuntime.enabled
      ? await prismaRuntime.getOrderByTrackingCode(req.params.trackingCode)
      : db.getAllOrders().find(o => o.trackingCode === req.params.trackingCode);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const trackingEvents = prismaRuntime.enabled
      ? await prismaRuntime.getOrderTracking(order.id)
      : db.getOrderTracking(order.id);
    res.json({
      order: prismaRuntime.enabled ? await serializeMarketplaceOrderAsync(order) : serializeMarketplaceOrder(order),
      trackingEvents,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/tracking/:orderId/scan-qr', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orderBefore = prismaRuntime.enabled ? await prismaRuntime.getOrder(req.params.orderId) : db.getOrder(req.params.orderId);
    if (!orderBefore) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = prismaRuntime.enabled
      ? await prismaRuntime.updateOrder(req.params.orderId, { status: mapOperationalStatusToStoredStatus('picked_up') as any })
      : db.updateOrder(req.params.orderId, { status: mapOperationalStatusToStoredStatus('picked_up') as any, handedToCourierAt: new Date().toISOString() });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const scanLocation = String(req.body?.location || req.headers['x-scan-location'] || 'Pickup hub');
    const scannedBy = req.user?.id || 'ExShopi staff';
    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(order.id, 'picked_up', new Date().toISOString(), `Barcode scanned by ${scannedBy}`, scanLocation);
      pushNotification({
        audience: 'customer',
        audienceId: orderBefore.customerId,
        title: 'Order picked up',
        message: `${orderBefore.orderId || orderBefore.id} has been collected by ExShopi logistics.`,
        type: 'order_picked_up',
        entityType: 'order',
        entityId: order.id,
      });
      if (orderBefore.customerEmail) {
        await sendCustomerNotice(
          orderBefore.customerEmail,
          'Your ExShopi order was picked up',
          'Order picked up',
          `${orderBefore.orderId || orderBefore.id} has been collected by ExShopi logistics.`,
          buildOrderFacts(orderBefore)
        );
      }
      const seller = await prismaRuntime.getSeller(orderBefore.sellerId);
      if (seller?.email) {
        await sendSellerNotice(
          seller.email,
          'Order picked up by ExShopi logistics',
          'Order picked up',
          `${orderBefore.orderId || orderBefore.id} has been scanned and collected by ExShopi logistics.`,
          buildOrderFacts(orderBefore, seller.storeName)
        );
      }
      return res.json(await serializeMarketplaceOrderAsync(order));
    }
    db.addTrackingEvent(order.id, 'picked_up', new Date().toISOString(), `Barcode scanned by ${scannedBy}`, scanLocation);
    pushNotification({
      audience: 'customer',
      audienceId: orderBefore.customerId,
      title: 'Order picked up',
      message: `${orderBefore.orderId || orderBefore.id} has been collected by ExShopi logistics.`,
      type: 'order_picked_up',
      entityType: 'order',
      entityId: order.id,
    });
    if (orderBefore.customerEmail) {
      await sendCustomerNotice(
        orderBefore.customerEmail,
        'Your ExShopi order was picked up',
        'Order picked up',
        `${orderBefore.orderId || orderBefore.id} has been collected by ExShopi logistics.`,
        buildOrderFacts(orderBefore)
      );
    }
    const seller = db.getSeller(orderBefore.sellerId);
    if (seller?.email) {
      await sendSellerNotice(
        seller.email,
        'Order picked up by ExShopi logistics',
        'Order picked up',
        `${orderBefore.orderId || orderBefore.id} has been scanned and collected by ExShopi logistics.`,
        buildOrderFacts(orderBefore, seller.storeName)
      );
    }
    res.json(serializeMarketplaceOrder(order));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/tracking/:orderId/delivery-done', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = prismaRuntime.enabled
      ? await prismaRuntime.updateOrder(req.params.orderId, {
          status: mapOperationalStatusToStoredStatus('delivered') as any,
          deliveredAt: new Date().toISOString(),
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        })
      : db.updateOrder(req.params.orderId, {
          status: mapOperationalStatusToStoredStatus('delivered') as any,
          deliveredAt: new Date().toISOString(),
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (prismaRuntime.enabled) {
      await prismaRuntime.addTrackingEvent(order.id, 'delivered', new Date().toISOString(), 'Delivery completed and COD collected');
      pushNotification({
        audience: 'customer',
        audienceId: order.customerId,
        title: 'Order delivered',
        message: `${order.orderId || order.id} was delivered and marked COD paid.`,
        type: 'order_delivered',
        entityType: 'order',
        entityId: order.id,
      });
      if (order.customerEmail) {
        await sendCustomerNotice(
          order.customerEmail,
          'Your ExShopi order was delivered',
          'Order delivered',
          `${order.orderId || order.id} has been delivered successfully.`,
          buildOrderFacts(order)
        );
      }
      return res.json(await serializeMarketplaceOrderAsync(order));
    }
    db.addTrackingEvent(order.id, 'delivered', new Date().toISOString(), 'Delivery completed and COD collected');
    pushNotification({
      audience: 'customer',
      audienceId: order.customerId,
      title: 'Order delivered',
      message: `${order.orderId || order.id} was delivered and marked COD paid.`,
      type: 'order_delivered',
      entityType: 'order',
      entityId: order.id,
    });
    if (order.customerEmail) {
      await sendCustomerNotice(
        order.customerEmail,
        'Your ExShopi order was delivered',
        'Order delivered',
        `${order.orderId || order.id} has been delivered successfully.`,
        buildOrderFacts(order)
      );
    }
    res.json(serializeMarketplaceOrder(order));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== PAYOUTS API ====================
app.get('/api/payouts/seller/:sellerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user!.id) : db.getSellerByUserId(req.user!.id);
    if (req.user?.role !== 'seller' || !seller || seller.id !== req.params.sellerId) {
      return res.status(403).json({ error: 'Seller ownership required' });
    }
    const payouts = prismaRuntime.enabled ? await prismaRuntime.getSellerPayouts(req.params.sellerId) : db.getSellerPayouts(req.params.sellerId);
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/payouts', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessFinance(req.user?.role)) {
      return res.status(403).json({ error: 'Finance access only' });
    }
    if (prismaRuntime.enabled) {
      return res.json(await prismaRuntime.getAllPayouts());
    }
    const payouts = db.getAllPayouts();
    const withSeller = payouts.map(p => ({
      ...p,
      seller: db.getSeller(p.sellerId),
      sellerName: db.getSeller(p.sellerId)?.storeName || 'Unknown',
    }));
    res.json(withSeller);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/payouts/:id/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessFinance(req.user?.role)) {
      return res.status(403).json({ error: 'Finance access only' });
    }
    if (prismaRuntime.enabled) {
      const updated = await prismaRuntime.updatePayout(req.params.id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        bankTransactionId: generateTransactionId(),
      });
      if (!updated) return res.status(404).json({ error: 'Payout not found' });
      const seller = await prismaRuntime.getSeller(updated.sellerId);
      pushNotification({
        audience: 'seller',
        audienceId: seller?.userId || seller?.id || updated.sellerId,
        title: 'Payout released',
        message: `Your payout of ${toCurrency(updated.netAmount)} has been released.`,
        type: 'payout_released',
        entityType: 'payout',
        entityId: updated.id,
      });
      if (seller?.email) {
        await sendSellerNotice(
          seller.email,
          'Your ExShopi payout has been released',
          'Payout released',
          'Your latest ExShopi payout has been marked as released by finance.',
          [
            { label: 'Payout ID', value: updated.id },
            { label: 'Net amount', value: toCurrency(updated.netAmount) },
            { label: 'Status', value: 'Paid' },
          ]
        );
      }
      return res.json(updated);
    }
    
    const payout = db.getPayout(req.params.id);
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const updated = db.updatePayout(req.params.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      bankTransactionId: generateTransactionId(),
    });

    const relatedOrders = db.getSellerOrders(payout.sellerId).filter(
      (order) =>
        order.payoutStatus === 'processed' &&
        order.deliveredAt &&
        new Date(order.deliveredAt) >= new Date(payout.weekStart) &&
        new Date(order.deliveredAt) <= new Date(payout.weekEnd)
    );
    relatedOrders.forEach((order) => {
      order.payoutStatus = 'paid';
      order.updatedAt = new Date().toISOString();
    });
    const seller = db.getSeller(payout.sellerId);
    pushNotification({
      audience: 'seller',
      audienceId: seller?.userId || seller?.id || payout.sellerId,
      title: 'Payout released',
      message: `Your payout of ${toCurrency(updated?.netAmount || payout.netAmount)} has been released.`,
      type: 'payout_released',
      entityType: 'payout',
      entityId: payout.id,
    });
    if (seller?.email) {
      await sendSellerNotice(
        seller.email,
        'Your ExShopi payout has been released',
        'Payout released',
        'Your latest ExShopi payout has been marked as released by finance.',
        [
          { label: 'Payout ID', value: payout.id },
          { label: 'Net amount', value: toCurrency(updated?.netAmount || payout.netAmount) },
          { label: 'Status', value: 'Paid' },
        ]
      );
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/admin/payouts/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessFinance(req.user?.role)) {
      return res.status(403).json({ error: 'Finance access only' });
    }
    const payouts = prismaRuntime.enabled ? await prismaRuntime.calculateWeeklyPayouts() : db.calculateWeeklyPayouts();
    res.json({
      success: true,
      count: payouts.length,
      payouts,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== PAYOUT REQUESTS (SELLER) ====================
app.post('/api/payout-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'seller') return res.status(403).json({ error: 'Seller only' });
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user.id) : db.getSellerByUserId(req.user.id);
    if (!seller) return res.status(400).json({ error: 'Seller profile not found' });

    const { amount, notes } = req.body;
    const pr = prismaRuntime.enabled
      ? await prismaRuntime.createPayoutRequest({
          sellerId: seller.id,
          amount: Number(amount) || 0,
          status: 'pending',
          notes: notes || '',
          bankDetails: seller ? { bankName: seller.bankName, accountHolder: seller.accountHolder, accountNumber: seller.bankAccount } : {},
        })
      : db.createPayoutRequest({
      sellerId: seller.id,
      amount: Number(amount) || 0,
      status: 'pending',
      notes: notes || '',
      bankDetails: seller ? { bankName: seller.bankName, accountHolder: seller.accountHolder, accountNumber: seller.bankAccount } : {},
    });

    if (!pr) {
      return res.status(500).json({ error: 'Failed to create payout request' });
    }

    pushNotification({
      audience: 'admin',
      title: 'New payout request submitted',
      message: `${seller.storeName} requested ${toCurrency(Number(amount) || 0)} for payout review.`,
      type: 'payout_request_submitted',
      entityType: 'payout_request',
      entityId: pr.id,
    });
    await sendAdminAlert(
      'New payout request submitted',
      'Payout request waiting for finance review',
      `${seller.storeName} has submitted a payout request in ExShopi.`,
      [
        { label: 'Seller', value: seller.storeName },
        { label: 'Amount', value: toCurrency(Number(amount) || 0) },
        { label: 'Request ID', value: pr.id },
      ]
    );

    res.json(pr);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/payout-requests/seller/:sellerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'seller' && !isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    const requests = prismaRuntime.enabled
      ? await prismaRuntime.getSellerPayoutRequests(req.params.sellerId)
      : db.getSellerPayoutRequests(req.params.sellerId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/payout-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessFinance(req.user?.role)) return res.status(403).json({ error: 'Finance access only' });
    if (prismaRuntime.enabled) {
      return res.json(await prismaRuntime.getAllPayoutRequests());
    }
    const requests = db.getAllPayoutRequests();
    const withSeller = requests.map(r => ({
      ...r,
      seller: db.getSeller(r.sellerId),
      sellerName: db.getSeller(r.sellerId)?.storeName || 'Unknown',
      sellerStoreSlug: db.getSeller(r.sellerId)?.storeSlug || '',
    }));
    res.json(withSeller);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/admin/payout-requests/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessFinance(req.user?.role)) return res.status(403).json({ error: 'Finance access only' });
    if (prismaRuntime.enabled) {
      const updated = await prismaRuntime.updatePayoutRequest(req.params.id, {
        status: req.body.status,
        notes: req.body.notes,
      });
      if (!updated) return res.status(404).json({ error: 'Payout request not found' });
      return res.json(updated);
    }
    const updates = req.body as any;
    const updated = db.updatePayoutRequest(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Payout request not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== ADMIN ORDERS API ====================
app.get('/api/admin/orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isBackofficeRole(req.user?.role)) {
      return res.status(403).json({ error: 'Backoffice only' });
    }
    const orders = prismaRuntime.enabled ? await prismaRuntime.getAllOrders() : db.getAllOrders();
    const enriched = prismaRuntime.enabled
      ? await Promise.all(orders.map((order) => serializeMarketplaceOrderAsync(order)))
      : orders.map((order) => serializeMarketplaceOrder(order));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/analytics/events', (req: Request, res: Response) => {
  try {
    const authUser = tryAuthenticateRequest(req);
    const userId = authUser?.id || req.body.userId || '';
    const userRole = authUser?.role || req.body.role || 'guest';
    const { eventType, entityType, entityId, metadata } = req.body || {};

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const event = db.createAnalyticsEvent({
      userId: userId || undefined,
      role: userRole,
      eventType,
      entityType,
      entityId,
      metadata: metadata || {},
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/customers', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    if (prismaRuntime.enabled) {
      const customers = (await prismaRuntime.getAllUsers()).filter((user) => user.role === 'customer');
      const orders = await prismaRuntime.getAllOrders();
      const data = customers.map((customer) => {
        const customerOrders = orders.filter((order) => order.customerId === customer.id);
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          country: customer.country || 'AE',
          createdAt: customer.createdAt,
          lastLoginAt: customer.lastLoginAt || null,
          ordersCount: customerOrders.length,
          totalSpent: customerOrders.reduce((sum, order) => sum + (order.totalAmount || order.subtotal), 0),
          wishlistAdds: 0,
          productViews: 0,
          searches: 0,
          returnRequests: customerOrders.filter((order) => order.status === 'return_requested').length,
          status: customer.status,
        };
      });
      return res.json(data);
    }

    const customers = db.getAllUsers().filter((user) => user.role === 'customer');
    const orders = db.getAllOrders();
    const analyticsEvents = db.getAnalyticsEvents();

    const data = customers.map((customer) => {
      const customerOrders = orders.filter((order) => order.customerId === customer.id);
      const customerEvents = analyticsEvents.filter((event) => event.userId === customer.id);
      const wishlistAdds = customerEvents.filter((event) => event.eventType === 'wishlist_add').length;
      const productViews = customerEvents.filter((event) => event.eventType === 'product_view').length;
      const searches = customerEvents.filter((event) => event.eventType === 'search').length;
      const lastLogin = customer.lastLoginAt || customerEvents.find((event) => event.eventType === 'login')?.createdAt || null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country || 'AE',
        createdAt: customer.createdAt,
        lastLoginAt: lastLogin,
        ordersCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, order) => sum + (order.totalAmount || order.subtotal), 0),
        wishlistAdds,
        productViews,
        searches,
        returnRequests: customerOrders.filter((order) => order.status === 'return_requested').length,
        status: customer.status,
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const dateRange = parseAdminDateRange(req.query);
    const storeOps = await buildStoreOperationsAnalytics(dateRange);
    const internalSummary: any = storeOps.summary || {};

    return res.json({
      success: true,
      range: dateRange.range,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),

      totalLogins: storeOps.legacyReports.totalLogins,
      totalSearches: storeOps.legacyReports.totalSearches,
      totalProductViews: storeOps.legacyReports.totalProductViews,
      totalWishlistAdds: storeOps.legacyReports.totalWishlistAdds,
      topSearches: storeOps.legacyReports.topSearches,
      mostViewedProducts: storeOps.legacyReports.mostViewedProducts,
      mostWishlistedProducts: storeOps.legacyReports.mostWishlistedProducts,
      sellerPerformance: storeOps.legacyReports.sellerPerformance,
      bannerPerformance: storeOps.legacyReports.bannerPerformance,
      refundRequests: storeOps.legacyReports.refundRequests,
      returnsRequested: storeOps.legacyReports.returnsRequested,

      summaryCards: {
        ordersToday: internalSummary.ordersToday || 0,
        totalOrders: internalSummary.totalOrders || 0,
        revenueToday: internalSummary.revenueToday || 0,
        revenueThisMonth: internalSummary.revenueThisMonth || 0,
        totalRevenue: internalSummary.revenueInRange || 0,
        totalUsers: internalSummary.totalCustomers || 0,
        totalSellers: internalSummary.totalSellers || 0,
        totalProducts: internalSummary.totalProducts || 0,
      },

      ga4: {
        enabled: false,
        message: 'GA4 analytics disabled',
      },
      googleAnalytics: {
        enabled: false,
        connected: false,
        message: 'GA4 analytics disabled',
        configurationIssue: 'GA4 analytics disabled',
      },
      internal: {
        orders: internalSummary.totalOrders || 0,
        revenue: internalSummary.revenueInRange || 0,
        users: internalSummary.totalCustomers || 0,
      },
      storeOperations: storeOps,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/seller/analytics/:sellerId', authMiddleware, (req: Request, res: Response) => {
  try {
    const seller = db.getSeller(req.params.sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const products = db.getSellerProducts(seller.id);
    const orders = db.getSellerOrders(seller.id);
    const analyticsEvents = db.getAnalyticsEvents();
    const sellerProductIds = new Set(products.map((product) => product.id));

    const sellerProductViews = analyticsEvents.filter((event) => event.eventType === 'product_view' && sellerProductIds.has(String(event.entityId || '')));
    const sellerWishlistAdds = analyticsEvents.filter((event) => event.eventType === 'wishlist_add' && sellerProductIds.has(String(event.entityId || '')));

    const topProducts = products
      .map((product) => ({
        productId: product.id,
        title: product.title,
        views: sellerProductViews.filter((event) => event.entityId === product.id).length,
        wishlists: sellerWishlistAdds.filter((event) => event.entityId === product.id).length,
        revenue: orders.filter((order) => order.productId === product.id).reduce((sum, order) => sum + (order.totalAmount || order.subtotal), 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    res.json({
      totalViews: sellerProductViews.length,
      totalWishlistAdds: sellerWishlistAdds.length,
      totalOrders: orders.length,
      deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
      returnRequests: orders.filter((order) => order.status === 'return_requested').length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || order.subtotal), 0),
      payoutDue: orders.filter((order) => order.payoutStatus !== 'paid').reduce((sum, order) => sum + order.sellerAmount, 0),
      topProducts,
      rejectedProducts: products.filter((product) => product.status === 'rejected').map((product) => ({
        id: product.id,
        title: product.title,
        rejectionReason: product.rejectionReason || 'Needs marketplace compliance updates',
      })),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== CATEGORIES API ====================
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = prismaRuntime.enabled
      ? await prismaRuntime.getCategories()
      : db.getCategories();
    res.json(categories.map(decorateCategory));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/categories/:id/interest', async (req: Request, res: Response) => {
  try {
    const categories = prismaRuntime.enabled
      ? await prismaRuntime.getCategories()
      : db.getCategories();
    const category = categories.find((entry: any) => entry.id === req.params.id || entry.slug === req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const payload = z.object({
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional().default(''),
    }).parse(req.body || {});

    db.createAnalyticsEvent({
      eventType: 'category_interest',
      entityType: 'category',
      entityId: category.id,
      role: req.user?.role || 'guest',
      userId: req.user?.id,
      metadata: {
        categorySlug: category.slug,
        categoryName: category.name,
        email: payload.email || '',
        phone: payload.phone || '',
      },
    });

    res.json({
      success: true,
      categoryId: category.id,
      interestCount: db
        .getAnalyticsEvents()
        .filter((event) => event.eventType === 'category_interest' && event.entityId === category.id).length,
    });
  } catch (error) {
    res.status(400).json({ error: String(error instanceof Error ? error.message : error) });
  }
});

app.get('/api/settings/site', async (req: Request, res: Response) => {
  try {
    res.json(prismaRuntime.enabled ? await prismaRuntime.getSiteSettings() : db.getSiteSettings());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/settings/site', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateSiteSettings(req.body || {})
      : db.updateSiteSettings(req.body || {});
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/settings/marketplace', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    res.json(prismaRuntime.enabled ? await prismaRuntime.getMarketplaceSettings() : db.getMarketplaceSettings());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/settings/marketplace', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateMarketplaceSettings(req.body || {})
      : db.updateMarketplaceSettings(req.body || {});
    db.recordActivity({
      actorId: req.user?.id || 'system',
      actorRole: isAdminLike(req.user?.role) ? 'admin' : 'system',
      entityType: 'marketplace_settings',
      entityId: 'global',
      action: 'updated',
      summary: 'Marketplace settings updated',
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/activity-logs', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!canAccessSupport(req.user?.role) && !canAccessFinance(req.user?.role)) {
      return res.status(403).json({ error: 'Backoffice only' });
    }
    res.json(db.getActivityLogs().slice(0, 200));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/notifications', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!canAccessSupport(req.user?.role) && !canAccessFinance(req.user?.role)) {
      return res.status(403).json({ error: 'Backoffice only' });
    }

    const notifications = [
      {
        id: 'pending-products',
        type: 'approvals',
        title: 'Pending product approvals',
        value: db.getProductsByStatus('pending').length,
      },
      {
        id: 'pending-sellers',
        type: 'sellers',
        title: 'Pending seller applications',
        value: db.getSellerApplications().filter((item) => item.status === 'pending_review').length,
      },
      {
        id: 'refund-requests',
        type: 'refunds',
        title: 'Refund requests waiting review',
        value: db.getAllOrders().filter((order) => order.refundStatus === 'requested').length,
      },
      {
        id: 'payout-requests',
        type: 'payouts',
        title: 'Pending payout requests',
        value: db.getAllPayoutRequests().filter((request) => request.status === 'pending').length,
      },
      {
        id: 'cod-suspicious',
        type: 'risk',
        title: 'Suspicious COD orders',
        value: db
          .getAllOrders()
          .filter((order) => String(order.shippingAddress?.risk?.level || '').toLowerCase() === 'suspicious').length,
      },
    ];

    const codNotifications = getNotificationsForAudience('admin').slice(0, 25);
    res.json([
      ...notifications,
      ...codNotifications.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        value: 1,
        message: item.message,
        entityType: item.entityType,
        entityId: item.entityId,
        createdAt: item.createdAt,
      })),
    ]);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/notifications/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role === 'seller') {
      const seller = prismaRuntime.enabled ? await prismaRuntime.getSellerByUserId(req.user.id) : db.getSellerByUserId(req.user.id);
      return res.json(getNotificationsForAudience('seller', seller?.userId || seller?.id || req.user.id));
    }

    if (isBackofficeRole(req.user.role)) {
      return res.json(getNotificationsForAudience('admin'));
    }

    return res.json(getNotificationsForAudience('customer', req.user.id));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/support/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = supportTicketSchema.parse(req.body);
    const seller = req.user?.role === 'seller'
      ? prismaRuntime.enabled
        ? await prismaRuntime.getSellerByUserId(req.user.id)
        : db.getSellerByUserId(req.user.id)
      : undefined;
    const ticket = prismaRuntime.enabled
      ? await prismaRuntime.createSupportTicket({
          createdById: req.user!.id,
          createdByRole: req.user!.role as any,
          sellerId: payload.sellerId || seller?.id,
          customerId: payload.customerId || (req.user?.role === 'customer' ? req.user.id : undefined),
          orderId: payload.orderId,
          productId: payload.productId,
          payoutRequestId: payload.payoutRequestId,
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority,
          status: 'open',
          assignedTo: '',
          messages: [
            {
              id: '',
              senderId: req.user!.id,
              senderRole: req.user!.role as any,
              message: payload.description,
              attachmentUrl: '',
              createdAt: new Date().toISOString(),
            },
          ],
        })
      : db.createSupportTicket({
      createdById: req.user!.id,
      createdByRole: req.user!.role as any,
      sellerId: payload.sellerId || seller?.id,
      customerId: payload.customerId || (req.user?.role === 'customer' ? req.user.id : undefined),
      orderId: payload.orderId,
      productId: payload.productId,
      payoutRequestId: payload.payoutRequestId,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority,
      status: 'open',
      assignedTo: '',
      messages: [
        {
          id: '',
          senderId: req.user!.id,
          senderRole: req.user!.role as any,
          message: payload.description,
          attachmentUrl: '',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/support/tickets/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (prismaRuntime.enabled) {
      return res.json(await prismaRuntime.getSupportTicketsForUser(req.user!.id, req.user!.role as any));
    }
    const seller = req.user?.role === 'seller' ? db.getSellerByUserId(req.user.id) : undefined;
    const tickets = db.getSupportTickets().filter((ticket) => {
      if (req.user?.role === 'seller') return ticket.sellerId === seller?.id || ticket.createdById === req.user.id;
      if (req.user?.role === 'customer') return ticket.customerId === req.user.id || ticket.createdById === req.user.id;
      return false;
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/support/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessSupport(req.user?.role) && !isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Support access only' });
    }
    res.json(prismaRuntime.enabled ? await prismaRuntime.getAllSupportTickets() : db.getSupportTickets());
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/admin/support/tickets/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!canAccessSupport(req.user?.role) && !isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Support access only' });
    }
    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateSupportTicket(req.params.id, {
          status: req.body.status,
          assignedTo: req.body.assignedTo ?? req.user?.id,
        })
      : db.updateSupportTicket(req.params.id, {
      status: req.body.status,
      assignedTo: req.body.assignedTo ?? req.user?.id,
    });
    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/support/tickets/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const ticket = prismaRuntime.enabled ? await prismaRuntime.getSupportTicket(req.params.id) : db.getSupportTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isOwner =
      ticket.createdById === req.user?.id ||
      ticket.customerId === req.user?.id ||
      ticket.sellerId === (prismaRuntime.enabled ? (await prismaRuntime.getSellerByUserId(req.user!.id))?.id : db.getSellerByUserId(req.user!.id)?.id);
    if (!isOwner && !canAccessSupport(req.user?.role) && !isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = supportMessageSchema.parse(req.body);
    const updated = prismaRuntime.enabled
      ? await prismaRuntime.addSupportTicketMessage(req.params.id, {
          senderId: req.user!.id,
          senderRole: req.user!.role as any,
          message: payload.message,
          attachmentUrl: payload.attachmentUrl || '',
        })
      : db.addSupportTicketMessage(req.params.id, {
      senderId: req.user!.id,
      senderRole: req.user!.role as any,
      message: payload.message,
      attachmentUrl: payload.attachmentUrl || '',
    });
    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== BANNERS API ====================
app.get('/api/banners', async (req: Request, res: Response) => {
  try {
    const banners = prismaRuntime.enabled ? await prismaRuntime.getBanners() : db.getBanners();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/banners/:id/click', async (req: Request, res: Response) => {
  try {
    const banner = prismaRuntime.enabled
      ? await prismaRuntime.incrementBannerClicks(req.params.id)
      : db.incrementBannerClicks(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    db.createAnalyticsEvent({
      userId: tryAuthenticateRequest(req)?.id || req.body.userId || undefined,
      role: (tryAuthenticateRequest(req)?.role || req.body.role || 'guest') as any,
      eventType: 'banner_click',
      entityType: 'banner',
      entityId: banner.id,
      metadata: {
        title: banner.title,
        link: banner.link || '/',
      },
    });

    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/admin/banners/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const analyticsEvents = db.getAnalyticsEvents();
    const baseBanners = prismaRuntime.enabled ? await prismaRuntime.getBanners() : db.getBanners();
    const banners = baseBanners.map((banner) => {
      const clickEvents = analyticsEvents.filter((event) => event.eventType === 'banner_click' && event.entityId === banner.id);
      return {
        ...banner,
        clickEvents: clickEvents.length,
        lastClickedAt: clickEvents[0]?.createdAt || null,
      };
    });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/banners', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const payload = req.body;
    const banner = prismaRuntime.enabled
      ? await prismaRuntime.createBanner({
          title: payload.title || '',
          subtitle: payload.subtitle || '',
          image: payload.image || '',
          cta: payload.cta || '',
          link: payload.link || '/',
          color: payload.color || '',
          badge: payload.badge || '',
          order: typeof payload.order === 'number' ? payload.order : 0,
          clicks: 0,
        })
      : db.createBanner({
      title: payload.title || '',
      subtitle: payload.subtitle || '',
      image: payload.image || '',
      cta: payload.cta || '',
      link: payload.link || '/',
      color: payload.color || '',
      badge: payload.badge || '',
      order: typeof payload.order === 'number' ? payload.order : 0,
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/banners/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const updated = prismaRuntime.enabled
      ? await prismaRuntime.updateBanner(req.params.id, req.body as any)
      : db.updateBanner(req.params.id, req.body as any);
    if (!updated) return res.status(404).json({ error: 'Banner not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/api/banners/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const ok = prismaRuntime.enabled
      ? await prismaRuntime.deleteBanner(req.params.id)
      : db.deleteBanner(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Banner not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/api/categories/:id', (req: Request, res: Response) => {
  try {
    const category = db.getCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(decorateCategory(category));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/categories', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const normalized = normalizeCategoryPayload(req.body || {});
    const existing = db.getCategories().find((category) => category.slug === normalized.slug);
    if (existing) {
      return res.status(400).json({ error: 'Category slug must be unique.' });
    }
    const cat = db.createCategory(normalized);
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/categories/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const normalized = normalizeCategoryPayload(req.body || {});
    const duplicate = db
      .getCategories()
      .find((category) => category.slug === normalized.slug && category.id !== req.params.id);
    if (duplicate) {
      return res.status(400).json({ error: 'Category slug must be unique.' });
    }
    const updated = db.updateCategory(req.params.id, normalized as any);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/api/categories/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!isAdminLike(req.user?.role)) return res.status(403).json({ error: 'Admin only' });
    const ok = db.deleteCategory(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
${PRIVATE_ROBOTS_PATHS.map((pathname) => `Disallow: ${pathname}`).join('\n')}
Sitemap: https://exshopi.com/sitemap.xml
`);
});

async function getPublicSitemapData() {
  const siteUrl = 'https://exshopi.com';
  const lastmod = new Date().toISOString().slice(0, 10);
  const products = prismaRuntime.enabled
    ? await prismaRuntime.getAllProducts()
    : supabaseRuntime.enabled
    ? await supabaseRuntime.getAllProducts()
    : db.getAllProducts();

  const staticEntries = Array.from(
    new Map(
      [...STATIC_SITEMAP_PATHS, ...BLOG_SITEMAP_SLUGS.map((slug) => `/blog/${slug}`)].map((pathname) => [
        `${siteUrl}${pathname === '/' ? '/' : pathname}`,
        {
          loc: `${siteUrl}${pathname === '/' ? '/' : pathname}`,
          lastmod,
          ...getSitemapMeta(pathname),
        },
      ])
    ).values()
  ) as SitemapUrlEntry[];

  const categoryEntries = Array.from(
    new Map(
      (MASTER_CATEGORIES || [])
        .flatMap((category) => {
          const rows = [
            {
              loc: `${siteUrl}${getCategoryPath(category.slug)}`,
              lastmod,
              ...getSitemapMeta(getCategoryPath(category.slug)),
            },
          ];
          for (const sub of category.subcategories || []) {
            rows.push({
              loc: `${siteUrl}${getCategoryPath(category.slug, sub.slug)}`,
              lastmod,
              ...getSitemapMeta(getCategoryPath(category.slug, sub.slug)),
            });
          }
          return rows;
        })
        .map((entry) => [entry.loc, entry])
    ).values()
  ) as SitemapUrlEntry[];

  const brandEntries = Array.from(
    new Map(
      STATIC_SITEMAP_PATHS.filter((pathname) => pathname.startsWith('/brands/')).map((pathname) => [
        `${siteUrl}${pathname}`,
        {
          loc: `${siteUrl}${pathname}`,
          lastmod,
          ...getSitemapMeta(pathname),
        },
      ])
    ).values()
  ) as SitemapUrlEntry[];

  const productEntries = Array.from(
    new Map(
      (products || [])
        .filter((product) => isCustomerVisibleProduct(product))
        .map((product) => {
          const pathname = getProductCanonicalPath(product);
          const loc = `${siteUrl}${pathname}`;
          return [
            loc,
            {
              loc,
              lastmod: String(product?.updatedAt || product?.createdAt || lastmod).slice(0, 10) || lastmod,
              ...getSitemapMeta(pathname),
            },
          ] as const;
        })
    ).values()
  ) as SitemapUrlEntry[];

  const productChunks: SitemapUrlEntry[][] = [];
  for (let index = 0; index < productEntries.length; index += PRODUCTS_PER_SITEMAP) {
    productChunks.push(productEntries.slice(index, index + PRODUCTS_PER_SITEMAP));
  }

  return { siteUrl, lastmod, staticEntries, categoryEntries, brandEntries, productChunks };
}

app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const { siteUrl, lastmod, productChunks } = await getPublicSitemapData();
    res.type('application/xml');
    res.send(
      xmlSitemapIndex([
        { loc: `${siteUrl}/sitemaps/static.xml`, lastmod },
        { loc: `${siteUrl}/sitemaps/categories.xml`, lastmod },
        { loc: `${siteUrl}/sitemaps/brands.xml`, lastmod },
        ...productChunks.map((_, index) => ({
          loc: `${siteUrl}/sitemaps/products-${index + 1}.xml`,
          lastmod,
        })),
      ])
    );
  } catch (error) {
    res.status(500).type('application/xml').send(`<!-- sitemap generation failed: ${escapeXml(String(error))} -->`);
  }
});

app.get('/sitemaps/static.xml', async (_req: Request, res: Response) => {
  try {
    const { staticEntries } = await getPublicSitemapData();
    res.type('application/xml').send(xmlUrlSet(staticEntries));
  } catch (error) {
    res.status(500).type('application/xml').send(`<!-- sitemap generation failed: ${escapeXml(String(error))} -->`);
  }
});

app.get('/sitemaps/categories.xml', async (_req: Request, res: Response) => {
  try {
    const { categoryEntries } = await getPublicSitemapData();
    res.type('application/xml').send(xmlUrlSet(categoryEntries));
  } catch (error) {
    res.status(500).type('application/xml').send(`<!-- sitemap generation failed: ${escapeXml(String(error))} -->`);
  }
});

app.get('/sitemaps/brands.xml', async (_req: Request, res: Response) => {
  try {
    const { brandEntries } = await getPublicSitemapData();
    res.type('application/xml').send(xmlUrlSet(brandEntries));
  } catch (error) {
    res.status(500).type('application/xml').send(`<!-- sitemap generation failed: ${escapeXml(String(error))} -->`);
  }
});

app.get('/sitemaps/products-:page.xml', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.params.page || 1));
    const { productChunks } = await getPublicSitemapData();
    res.type('application/xml').send(xmlUrlSet(productChunks[page - 1] || []));
  } catch (error) {
    res.status(500).type('application/xml').send(`<!-- sitemap generation failed: ${escapeXml(String(error))} -->`);
  }
});

// ==================== TRANSLATIONS API ====================
app.get('/api/translations', (req: Request, res: Response) => {
  try {
    const translations = db.getTranslations();
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== ADMIN DASHBOARD API ====================
app.get('/api/admin/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!hasAdminPermission(req.user?.role, 'dashboard:view')) {
      return res.status(403).json({ error: 'Dashboard access denied' });
    }

    const query = adminDashboardQuerySchema.parse(req.query);
    const dateRange = parseAdminDateRange(query);

    const [
      sellers,
      allProducts,
      orders,
      payoutRequests,
      payouts,
      users,
      supportTickets,
      banners,
    ] = prismaRuntime.enabled
      ? await Promise.all([
          prismaRuntime.getAllSellers(),
          prismaRuntime.getAllProductsForAdmin(),
          prismaRuntime.getAllOrders(),
          prismaRuntime.getAllPayoutRequests(),
          prismaRuntime.getAllPayouts(),
          prismaRuntime.getAllUsers(),
          prismaRuntime.getAllSupportTickets(),
          prismaRuntime.getBanners(),
        ])
      : [
          db.getAllSellers(),
          [
            ...db.getAllProducts(),
            ...db.getProductsByStatus('pending'),
            ...db.getProductsByStatus('rejected'),
          ].filter((product, index, array) => array.findIndex((entry) => entry.id === product.id) === index),
          db.getAllOrders(),
          db.getAllPayoutRequests(),
          db.getAllPayouts(),
          db.getAllUsers(),
          db.getSupportTickets(),
          db.getBanners(),
        ];

    const analyticsEvents = db.getAnalyticsEvents();
    const ordersInRange = orders.filter((order) => isBetweenDates(order.createdAt, dateRange.from, dateRange.to));
    const supportInRange = supportTickets.filter((ticket) => isBetweenDates(ticket.createdAt, dateRange.from, dateRange.to));
    const payoutsInRange = payouts.filter((payout) => isBetweenDates(payout.createdAt, dateRange.from, dateRange.to));

    const totalSales = ordersInRange.reduce((sum, order) => sum + Number(order.totalAmount || order.subtotal || 0), 0);
    const totalCommission = ordersInRange.reduce((sum, order) => sum + Number(order.commission || 0), 0);
    const totalVendorPayoutDue = orders
      .filter((order) => order.payoutStatus !== 'paid')
      .reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0);

    const pendingProducts = allProducts.filter((product) => product.approvalStatus === 'pending' || product.status === 'pending');
    const pendingOrders = ordersInRange.filter((order) => ['placed', 'confirmed', 'packed'].includes(order.status));
    const deliveredOrders = ordersInRange.filter((order) => order.status === 'delivered');
    const returnedOrders = ordersInRange.filter((order) => order.status === 'returned');
    const returnRequestedOrders = ordersInRange.filter((order) => order.status === 'return_requested');
    const refundRequested = ordersInRange.filter((order) => order.refundStatus === 'requested');
    const lowStockProducts = allProducts.filter((product) => Number(product.stock || 0) <= 5);
    const missingMediaProducts = allProducts.filter((product) => !product.image && (!Array.isArray(product.images) || product.images.length === 0));
    const failedUploadProducts = allProducts.filter((product) => (product.approvalNotes || '').toLowerCase().includes('upload'));
    const paymentRiskOrders = ordersInRange.filter((order) => ['failed', 'requires_action'].includes(String(order.paymentStatus || '').toLowerCase()));
    const fraudFlagOrders = ordersInRange.filter((order) =>
      String((order as any).notes || '').toLowerCase().includes('fraud') ||
      String((order as any).cancellationReason || '').toLowerCase().includes('fraud'),
    );
    const openSupportCases = supportInRange.filter((ticket) => !['resolved', 'closed'].includes(String(ticket.status)));
    const totalCustomers = users.filter((user) => user.role === 'customer').length;
    const customerOrderCounts = ordersInRange.reduce<Record<string, number>>((acc, order) => {
      if (!order.customerId) return acc;
      acc[order.customerId] = (acc[order.customerId] || 0) + 1;
      return acc;
    }, {});
    const repeatPurchaseRate = ordersInRange.length
      ? Math.round(
          (Object.values(customerOrderCounts).filter((count) => count > 1).length / Math.max(1, Object.keys(customerOrderCounts).length)) *
            100,
        )
      : 0;

    const searchKeywords = analyticsEvents
      .filter((event) => event.eventType === 'search' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to))
      .reduce<Record<string, number>>((acc, event) => {
        const keyword = String(event.metadata?.query || '').trim().toLowerCase();
        if (!keyword) return acc;
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {});

    const marketplaceHealthScore = calculateMarketplaceHealthScore({
      pendingApprovals: pendingProducts.length,
      payoutRiskCount: payoutRequests.filter((request) => request.status === 'pending').length,
      lowStockProducts: lowStockProducts.length,
      returnRequestedOrders: returnRequestedOrders.length + returnedOrders.length,
      failedPayments: paymentRiskOrders.length,
      flaggedVendors: fraudFlagOrders.length,
      totalOrders: ordersInRange.length,
      totalProducts: allProducts.length,
    });

    const topSellerMap = sellers.map((seller) => {
      const sellerOrders = ordersInRange.filter((order) => order.sellerId === seller.id);
      const sales = sellerOrders.reduce((sum, order) => sum + Number(order.totalAmount || order.subtotal || 0), 0);
      const commission = sellerOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0);
      const returns = sellerOrders.filter((order) => ['returned', 'return_requested'].includes(order.status)).length;
      const rating = Math.max(3.8, 5 - returns * 0.08);

      return {
        id: seller.id,
        name: seller.storeName,
        orders: sellerOrders.length,
        sales,
        commission,
        rating: rating.toFixed(1),
      };
    });

    const bucketCount = dateRange.range === 'today' ? 6 : 7;
    const bucketSizeDays =
      dateRange.range === 'today'
        ? 1
        : Math.max(1, Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24 * bucketCount)));
    const salesTrend = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(dateRange.from);
      bucketStart.setDate(bucketStart.getDate() + index * bucketSizeDays);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + bucketSizeDays - 1);
      bucketEnd.setHours(23, 59, 59, 999);
      const bucketOrders = orders.filter((order) => isBetweenDates(order.createdAt, bucketStart, bucketEnd));

      return {
        month: bucketStart.toLocaleDateString('en-AE', {
          month: bucketCount > 6 ? 'short' : undefined,
          day: 'numeric',
        }),
        sales: bucketOrders.reduce((sum, order) => sum + Number(order.totalAmount || order.subtotal || 0), 0),
        commission: bucketOrders.reduce((sum, order) => sum + Number(order.commission || 0), 0),
      };
    });

    const alerts = [
      {
        key: 'pending-approvals',
        label: 'Pending approvals waiting in seller and product moderation queues',
        count: pendingProducts.length,
        severity: pendingProducts.length > 10 ? 'high' : pendingProducts.length > 0 ? 'medium' : 'low',
        to: '/admin/approvals',
      },
      {
        key: 'payout-risk',
        label: 'Payout requests need finance verification',
        count: payoutRequests.filter((request) => request.status === 'pending').length,
        severity: payoutRequests.filter((request) => request.status === 'pending').length > 5 ? 'high' : 'medium',
        to: '/admin/payouts',
      },
      {
        key: 'low-stock',
        label: 'Low stock listings are at risk of cancellation',
        count: lowStockProducts.length,
        severity: lowStockProducts.length > 12 ? 'high' : lowStockProducts.length > 0 ? 'medium' : 'low',
        to: '/admin/inventory',
      },
      {
        key: 'returns',
        label: 'Returns are trending above the target rate',
        count: returnRequestedOrders.length + returnedOrders.length,
        severity:
          ordersInRange.length > 0 && (returnRequestedOrders.length + returnedOrders.length) / ordersInRange.length > 0.08
            ? 'high'
            : 'medium',
        to: '/admin/returns',
      },
      {
        key: 'payments',
        label: 'Payment issues require operations review',
        count: paymentRiskOrders.length,
        severity: paymentRiskOrders.length > 0 ? 'high' : 'low',
        to: '/admin/orders',
      },
      {
        key: 'fraud',
        label: 'Orders have fraud or abuse markers',
        count: fraudFlagOrders.length,
        severity: fraudFlagOrders.length > 0 ? 'high' : 'low',
        to: '/admin/orders',
      },
      {
        key: 'uploads',
        label: 'Upload or media ingestion issues detected',
        count: failedUploadProducts.length,
        severity: failedUploadProducts.length > 0 ? 'medium' : 'low',
        to: '/admin/products',
      },
    ].filter((alert) => alert.count > 0);

    const quickActions = [
      { title: 'Review approvals', count: pendingProducts.length, to: '/admin/approvals' },
      { title: 'Resolve payouts', count: payoutRequests.filter((request) => request.status === 'pending').length, to: '/admin/payouts' },
      { title: 'Check returns', count: returnRequestedOrders.length + returnedOrders.length, to: '/admin/returns' },
      { title: 'Answer support', count: openSupportCases.length, to: '/admin/support' },
    ];

    return res.json({
      range: dateRange.range,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      marketplaceHealthScore,
      alerts,
      quickActions,
      totalSellers: sellers.length,
      totalVendors: sellers.length,
      activeVendors: sellers.filter((seller) => seller.status === 'active').length,
      totalProducts: allProducts.length,
      totalOrders: ordersInRange.length,
      totalSales,
      totalCommission,
      platformCommission: totalCommission,
      vendorPayouts: totalVendorPayoutDue,
      pendingApprovals: pendingProducts.length,
      pendingProducts: pendingProducts.length,
      deliveredOrders: deliveredOrders.length,
      returnedOrders: returnedOrders.length,
      pendingOrders: pendingOrders.length,
      returnRequestedOrders: returnRequestedOrders.length,
      refundRequested: refundRequested.length,
      lowStockProducts: lowStockProducts.length,
      pendingPayoutRequests: payoutRequests.filter((request) => request.status === 'pending').length,
      processedPayouts: payoutsInRange.filter((payout) => payout.status === 'processed').length,
      paidPayouts: payoutsInRange.filter((payout) => payout.status === 'paid').length,
      totalCustomers,
      totalBanners: banners.length,
      openSupportCases: openSupportCases.length,
      payoutLiability: totalVendorPayoutDue,
      repeatPurchaseRate,
      failedUploadProducts: failedUploadProducts.length,
      fraudFlags: fraudFlagOrders.length,
      paymentIssues: paymentRiskOrders.length,
      missingMediaProducts: missingMediaProducts.length,
      searchKeywords: Object.entries(searchKeywords)
        .sort(([, left], [, right]) => right - left)
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count })),
      salesTrend,
      topSellers: topSellerMap
        .sort((left, right) => right.sales - left.sales)
        .slice(0, 5),
      metrics: {
        totalSellers: sellers.length,
        activeSellers: sellers.filter((seller) => seller.status === 'active').length,
        totalProducts: allProducts.length,
        pendingProducts: pendingProducts.length,
        totalOrders: ordersInRange.length,
        totalCustomers,
        totalBanners: banners.length,
        openSupportCases: openSupportCases.length,
        returnRequests: returnRequestedOrders.length,
        pendingPayoutRequests: payoutRequests.filter((request) => request.status === 'pending').length,
        lowStockProducts: lowStockProducts.length,
        marketplaceHealthScore,
      },
      sellers: sellers.map((seller) => ({
        ...seller,
        totalOrders: orders.filter((order) => order.sellerId === seller.id).length,
        totalSales: orders.filter((order) => order.sellerId === seller.id).reduce((sum, order) => sum + Number(order.subtotal || 0), 0),
        totalCommission: orders.filter((order) => order.sellerId === seller.id).reduce((sum, order) => sum + Number(order.commission || 0), 0),
        payoutDue: orders
          .filter((order) => order.sellerId === seller.id && order.payoutStatus !== 'paid')
          .reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== SELLER DASHBOARD API ====================
app.get('/api/seller/dashboard/:sellerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const seller = prismaRuntime.enabled ? await prismaRuntime.getSeller(req.params.sellerId) : db.getSeller(req.params.sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    if (prismaRuntime.enabled) {
      const products = await prismaRuntime.getSellerProducts(seller.id);
      const orders = await prismaRuntime.getSellerOrders(seller.id);
      const payouts = await prismaRuntime.getSellerPayouts(seller.id);
      const payoutRequests = await prismaRuntime.getSellerPayoutRequests(seller.id);

      const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal), 0);
      const totalCommission = orders.reduce((sum, o) => sum + o.commission, 0);
      const netAmount = totalSales - totalCommission;

      const pendingProducts = products.filter((p) => p.status === 'pending');
      const approvedProducts = products.filter((p) => p.status === 'live');
      const rejectedProducts = products.filter((p) => p.status === 'rejected');
      const lowStockProducts = products.filter((product) => product.stock <= 5);
      const deliveredOrders = orders.filter((order) => order.status === 'delivered');
      const returnRequestedOrders = orders.filter((order) => order.status === 'return_requested');
      const payoutDue = orders.filter((order) => order.payoutStatus !== 'paid').reduce((sum, order) => sum + order.sellerAmount, 0);

      return res.json({
        seller,
        totalProducts: products.length,
        pendingProducts: pendingProducts.length,
        approvedProducts: approvedProducts.length,
        rejectedProducts: rejectedProducts.length,
        totalOrders: orders.length,
        totalSales,
        totalCommission,
        netAmount,
        payoutDue,
        lowStockProducts: lowStockProducts.length,
        deliveredOrders: deliveredOrders.length,
        returnRequestedOrders: returnRequestedOrders.length,
        pendingPayoutRequests: payoutRequests.filter((request) => request.status === 'pending').length,
        weeklyPayouts: payouts.slice(-4),
      });
    }
    
    const products = db.getSellerProducts(seller.id);
    const orders = db.getSellerOrders(seller.id);
    const payouts = db.getSellerPayouts(seller.id);
    const payoutRequests = db.getSellerPayoutRequests(seller.id);
    
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal), 0);
    const totalCommission = orders.reduce((sum, o) => sum + o.commission, 0);
    const netAmount = totalSales - totalCommission;
    
    const pendingProducts = products.filter(p => p.status === 'pending');
    const approvedProducts = products.filter(p => p.status === 'live');
    const rejectedProducts = products.filter(p => p.status === 'rejected');
    const lowStockProducts = products.filter((product) => product.stock <= 5);
    const deliveredOrders = orders.filter((order) => order.status === 'delivered');
    const returnRequestedOrders = orders.filter((order) => order.status === 'return_requested');
    const payoutDue = orders.filter((order) => order.payoutStatus !== 'paid').reduce((sum, order) => sum + order.sellerAmount, 0);
    
    res.json({
      seller,
      totalProducts: products.length,
      pendingProducts: pendingProducts.length,
      approvedProducts: approvedProducts.length,
      rejectedProducts: rejectedProducts.length,
      totalOrders: orders.length,
      totalSales,
      totalCommission,
      netAmount,
      payoutDue,
      lowStockProducts: lowStockProducts.length,
      deliveredOrders: deliveredOrders.length,
      returnRequestedOrders: returnRequestedOrders.length,
      pendingPayoutRequests: payoutRequests.filter((request) => request.status === 'pending').length,
      weeklyPayouts: payouts.slice(-4), // Last 4 weeks
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== HELPER FUNCTIONS ====================
function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${timestamp}${random}`;
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateQRCode(): string {
  return `QR_${generateTrackingCode()}`;
}

function generateTransactionId(): string {
  return `TXN_${Date.now()}`;
}

// ==================== ROOT & HEALTH CHECK ====================
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ExShopi Backend API',
    version: '1.0.0',
    entry: SERVER_ENTRY,
    startedAt: STARTED_AT,
    message: 'Backend server is running',
    apiBase: `${req.protocol}://${req.get('host') || 'localhost'}/api`,
    availableEndpoints: {
      auth: '/api/users/login, /api/users/register',
      products: '/api/products, /api/products/:id, /api/products/create',
      sellers: '/api/sellers, /api/sellers/:id',
      orders: '/api/orders, /api/orders/create',
      tracking: '/api/tracking/:trackingCode',
      admin: '/api/admin/dashboard, /api/admin/products/pending',
      categories: '/api/categories',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'ExShopi API',
    version: '1.0.0',
    entry: SERVER_ENTRY,
    startedAt: STARTED_AT,
    endpoints: 30,
    description: 'Premium UAE Marketplace Backend',
    apiBase: `${req.protocol}://${req.get('host') || 'localhost'}/api`,
  });
});

// Dev-only: quick product update endpoint for local testing (no auth)
if (process.env.NODE_ENV !== 'production') {
  app.post('/__dev/admin/update-product', async (req: Request, res: Response) => {
    try {
      const { id, payload } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing product id' });
      const updated = db.updateProduct(id, payload || {});
      if (!updated) return res.status(404).json({ error: 'Product not found' });
      try {
        sendSseEvent('product-updated', { id, ts: new Date().toISOString() });
      } catch (e) {
        // ignore SSE errors in dev
      }
      res.json(await serializeMarketplaceProductAsync(updated));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}

// ==================== GLOBAL ERROR HANDLER ====================
// Logs errors and returns JSON
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('❌ Unhandled error in request:', req.method, req.path, err?.message || err);
  
  if (res.headersSent) return next(err);
  applyCorsHeaders(req, res);
  
  const statusCode = err?.status || err?.statusCode || 500;
  const errorMessage = err?.message || String(err) || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: errorMessage,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  applyCorsHeaders(req, res);
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: `${req.method} ${req.path} not found. Try /api/health for a test endpoint.`,
    timestamp: new Date().toISOString(),
  });
});

// ==================== START SERVER ====================
const startServer = async () => {
  console.log('INIT STARTED', {
    port: PORT,
    connectionMode,
  });

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[BOOT] ExShopi API entry: ${SERVER_ENTRY}`);
      console.log(`[BOOT] Node env: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[BOOT] Port binding: ${PORT}`);
      console.log(`[BOOT] Started at: ${STARTED_AT}`);
      console.log(`[BOOT] USE_PRISMA_RUNTIME: ${prismaEnvDiagnostics.usePrismaRuntime || 'unset'}`);
      console.log(`[BOOT] EXSHOPI_DB_MODE: ${prismaEnvDiagnostics.exshopiDbMode || 'unset'}`);
      console.log(`[BOOT] Connection mode: ${connectionMode}`);
      console.log(`[BOOT] DATABASE_URL host: ${prismaEnvDiagnostics.databaseUrlHost}`);
      console.log(`[BOOT] DIRECT_URL host: ${prismaEnvDiagnostics.directUrlHost}`);
      console.log(
        `[BOOT] DB config summary: mode=${connectionMode} databaseHost=${prismaEnvDiagnostics.databaseUrlHost} directHost=${prismaEnvDiagnostics.directUrlHost}`
      );
      console.log(`[BOOT] Frontend URL: ${APP_URL}`);
      console.log(`[BOOT] CORS origins: ${Array.from(defaultAllowedOrigins).join(', ')}`);
      console.log('SERVER LISTENING', { port: PORT, host: '0.0.0.0' });
      console.log('Server running on port', PORT);
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
      console.log(`👤 Frontend on http://localhost:5173`);

      resolve();
    });

    server.on('error', (error) => {
      console.error('INIT FAILED', error);
      reject(error);
    });
  });

  console.log('INIT POST-LISTEN', {
    enabled: prismaRuntime.enabled,
    connectionMode,
    phase: 'post-listen',
  });

  if (!prismaRuntime.enabled) {
    return;
  }

  void (async () => {
    try {
      await prismaRuntime.ensureCoreAuthRecords();
      console.log('[BOOT] Prisma core auth records verified');

      const bundledImport = await prismaRuntime.ensureBundledDraftProductsImported();
      if (bundledImport.attempted) {
        console.log(
          `[BOOT] Bundled draft import summary: total=${bundledImport.totalRows} imported=${bundledImport.imported} duplicates=${bundledImport.duplicates} failed=${bundledImport.failed}`
        );
      } else {
        console.log('[BOOT] No bundled draft import dataset found or import not required');
      }

      const result = await probePrismaConnection();
      if (result.ok) {
        console.log('[DB] Prisma connection probe succeeded');
        return;
      }

      console.error(
        `[DB] Prisma connection probe failed (${result.name}/${result.code}): ${result.message}`
      );
      if (prismaEnvDiagnostics.databaseUrlIssues.length) {
        console.error(
          `[DB] DATABASE_URL issues: ${prismaEnvDiagnostics.databaseUrlIssues.join(' | ')}`
        );
      }
      if (prismaEnvDiagnostics.directUrlIssues.length) {
        console.error(
          `[DB] DIRECT_URL issues: ${prismaEnvDiagnostics.directUrlIssues.join(' | ')}`
        );
      }
      console.error(
        '[DB] Expected format: DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true and DIRECT_URL=postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres'
      );
    } catch (error) {
      console.error('[BOOT] Background init failed', error);
    }
  })();
};

void startServer().catch((error) => {
  console.error('[BOOT] fatal startup error', error);
  process.exit(1);
});

export { startServer };
export default app;
