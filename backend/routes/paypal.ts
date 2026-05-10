import express, { RequestHandler } from 'express';
import { z } from 'zod';
import paypalSdk from '@paypal/checkout-server-sdk';

type PayPalSdk = any;

const paypal = paypalSdk as PayPalSdk;

const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  'AUD',
  'CAD',
  'CNY',
  'EUR',
  'GBP',
  'HKD',
  'JPY',
  'NZD',
  'SGD',
  'USD',
]);

const COUNTRY_CURRENCY_RATES_FROM_AED: Record<string, { currency: string; rate: number }> = {
  AE: { currency: 'AED', rate: 1 },
  SA: { currency: 'SAR', rate: 1.02 },
  QA: { currency: 'QAR', rate: 0.99 },
  KW: { currency: 'KWD', rate: 0.083 },
  BH: { currency: 'BHD', rate: 0.102 },
  OM: { currency: 'OMR', rate: 0.105 },
  US: { currency: 'USD', rate: 0.272 },
  GB: { currency: 'GBP', rate: 0.214 },
  EU: { currency: 'EUR', rate: 0.251 },
  CA: { currency: 'CAD', rate: 0.372 },
  AU: { currency: 'AUD', rate: 0.421 },
  NZ: { currency: 'NZD', rate: 0.457 },
  JP: { currency: 'JPY', rate: 41.9 },
  CN: { currency: 'CNY', rate: 1.97 },
  HK: { currency: 'HKD', rate: 2.12 },
  IN: { currency: 'INR', rate: 22.7 },
  SG: { currency: 'SGD', rate: 0.354 },
  ZA: { currency: 'ZAR', rate: 4.95 },
  NG: { currency: 'NGN', rate: 398 },
  KE: { currency: 'KES', rate: 35.2 },
  WORLD: { currency: 'USD', rate: 0.272 },
};

const zeroDecimalCurrencies = new Set(['JPY']);

const itemSchema = z.object({
  sellerId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  image: z.string().optional(),
  title: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  unitPrice: z.coerce.number().min(0),
});

const shippingAddressSchema = z.object({
  emirate: z.string().optional().default(''),
  region: z.string().optional().default(''),
  area: z.string().optional().default(''),
  building: z.string().optional().default(''),
  flat: z.string().optional().default(''),
  landmark: z.string().optional().default(''),
  addressLine: z.string().min(2),
  method: z.string().optional().default(''),
  city: z.string().optional().default(''),
  district: z.string().optional().default(''),
  street: z.string().optional().default(''),
  buildingNumber: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default(''),
  countryCode: z.string().optional().default(''),
  countryName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  deliveryCountry: z.string().min(2).max(10),
  currency: z.string().min(3).max(3),
  shippingFee: z.coerce.number().min(0),
  vatAmount: z.coerce.number().min(0).default(0),
  expectedTotal: z.coerce.number().min(0),
  customerName: z.string().optional().default(''),
  customerEmail: z.string().email().optional().or(z.literal('')).default(''),
  customerPhone: z.string().optional().default(''),
  checkoutMode: z.enum(['guest', 'account']).optional().default('account'),
  guestSessionId: z.string().min(8).max(120).optional().default(''),
});

const captureOrderSchema = z.object({
  paypalOrderId: z.string().min(6),
  guestSessionId: z.string().min(8).max(120).optional().default(''),
});

type PaypalCheckoutItem = z.infer<typeof itemSchema>;
type PaypalShippingAddress = z.infer<typeof shippingAddressSchema>;

type StoredQuote = {
  paypalOrderId: string;
  customerId: string;
  customerRole: 'customer' | 'guest';
  guestSessionId: string;
  items: PaypalCheckoutItem[];
  shippingAddress: PaypalShippingAddress;
  deliveryCountry: string;
  displayCurrency: string;
  paypalCurrency: string;
  displayTotal: number;
  paypalTotal: string;
  shippingFee: number;
  vatAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: number;
};

export type CreatePaypalPaidOrdersInput = {
  customerId: string;
  isGuestOrder?: boolean;
  guestSessionId?: string;
  items: PaypalCheckoutItem[];
  shippingAddress: PaypalShippingAddress;
  deliveryCountry: string;
  shippingFee: number;
  payment: {
    paypalOrderId: string;
    captureId: string;
    payerEmail: string;
    currency: string;
    capturedAmount: string;
    capturedAt: string;
    status: string;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

type CreatePaypalRouterOptions = {
  authMiddleware?: RequestHandler;
  authenticateRequest?: (req: any) => { id: string; role: string } | null;
  createPaidOrders: (input: CreatePaypalPaidOrdersInput) => Promise<any[]>;
};

const quoteStore = new Map<string, StoredQuote>();
const capturedStore = new Map<string, any>();
const QUOTE_TTL_MS = 30 * 60 * 1000;

function getPaypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  const environment = String(process.env.PAYPAL_ENV || 'sandbox').toLowerCase();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured.');
  }

  const paypalEnvironment =
    environment === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);

  return new paypal.core.PayPalHttpClient(paypalEnvironment);
}

function cleanupExpiredQuotes() {
  const now = Date.now();
  for (const [orderId, quote] of quoteStore.entries()) {
    if (now - quote.createdAt > QUOTE_TTL_MS) {
      quoteStore.delete(orderId);
    }
  }
}

function roundMoney(amount: number, currency: string) {
  const decimals = zeroDecimalCurrencies.has(currency.toUpperCase()) ? 0 : 2;
  return Number(amount.toFixed(decimals));
}

function formatMoney(amount: number, currency: string) {
  const decimals = zeroDecimalCurrencies.has(currency.toUpperCase()) ? 0 : 2;
  return roundMoney(amount, currency).toFixed(decimals);
}

function getConfiguredCurrencyRate(currency: string, fallbackCountry?: string) {
  const normalized = currency.toUpperCase();
  const direct = Object.values(COUNTRY_CURRENCY_RATES_FROM_AED).find((entry) => entry.currency === normalized);
  if (direct) return direct.rate;
  const country = COUNTRY_CURRENCY_RATES_FROM_AED[String(fallbackCountry || '').toUpperCase()];
  return country?.rate || COUNTRY_CURRENCY_RATES_FROM_AED.US.rate;
}

function getPaypalCurrency(deliveryCountry: string, displayCurrency: string) {
  const country = COUNTRY_CURRENCY_RATES_FROM_AED[String(deliveryCountry || '').toUpperCase()];
  const currency = String(displayCurrency || country?.currency || 'USD').toUpperCase();
  return PAYPAL_SUPPORTED_CURRENCIES.has(currency) ? currency : 'USD';
}

function convertDisplayAmount(amount: number, displayCurrency: string, paypalCurrency: string, deliveryCountry: string) {
  const displayRate = getConfiguredCurrencyRate(displayCurrency, deliveryCountry);
  const paypalRate = getConfiguredCurrencyRate(paypalCurrency, 'US');
  const amountAed = amount / Math.max(displayRate, 0.000001);
  return amountAed * paypalRate;
}

function safeEqualsMoney(left: string | number, right: string | number, currency: string) {
  const decimals = zeroDecimalCurrencies.has(currency.toUpperCase()) ? 0 : 2;
  const tolerance = decimals === 0 ? 1 : 0.02;
  return Math.abs(Number(left) - Number(right)) <= tolerance;
}

function maskPayPalId(value: string) {
  if (!value) return '';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function extractCapture(result: any) {
  const purchaseUnit = result?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  return {
    id: String(capture?.id || ''),
    status: String(capture?.status || result?.status || ''),
    amount: String(capture?.amount?.value || ''),
    currency: String(capture?.amount?.currency_code || ''),
    capturedAt: String(capture?.create_time || new Date().toISOString()),
    payerEmail: String(result?.payer?.email_address || ''),
  };
}

function createGuestCustomerId(guestSessionId: string, phone?: string, email?: string) {
  const seed = `${guestSessionId}:${phone || ''}:${email || ''}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `guest_${hash.toString(36)}_${String(guestSessionId || '').slice(-8)}`;
}

export function createPaypalRouter({ authenticateRequest, createPaidOrders }: CreatePaypalRouterOptions) {
  const router = express.Router();

  router.post('/create-order', async (req, res) => {
    try {
      cleanupExpiredQuotes();
      const payload = createOrderSchema.parse(req.body);
      const authUser = authenticateRequest?.(req) || null;
      const isCustomer = authUser?.role === 'customer';
      const isGuestOrder = payload.checkoutMode === 'guest' || !isCustomer;
      if (!isCustomer && !isGuestOrder) {
        return res.status(403).json({ error: 'Customer only' });
      }
      if (isGuestOrder && (!payload.customerName.trim() || !payload.customerPhone.trim())) {
        return res.status(400).json({ error: 'Guest PayPal checkout needs a name and phone number.' });
      }

      const displayCurrency = payload.currency.toUpperCase();
      const paypalCurrency = getPaypalCurrency(payload.deliveryCountry, displayCurrency);
      const itemTotal = payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const displayTotal = roundMoney(itemTotal + payload.shippingFee + payload.vatAmount, displayCurrency);

      if (!safeEqualsMoney(displayTotal, payload.expectedTotal, displayCurrency)) {
        return res.status(400).json({ error: 'Order total changed. Please refresh checkout and try again.' });
      }

      const paypalTotal = formatMoney(
        paypalCurrency === displayCurrency
          ? displayTotal
          : convertDisplayAmount(displayTotal, displayCurrency, paypalCurrency, payload.deliveryCountry),
        paypalCurrency
      );

      const client = getPaypalClient();
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `exshopi-${Date.now()}`,
            description: 'ExShopi worldwide marketplace order',
            amount: {
              currency_code: paypalCurrency,
              value: paypalTotal,
              breakdown: {
                item_total: {
                  currency_code: paypalCurrency,
                  value: paypalTotal,
                },
              },
            },
          },
        ],
        application_context: {
          brand_name: 'ExShopi',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      });

      const response = await client.execute(request);
      const paypalOrderId = String(response?.result?.id || '');
      if (!paypalOrderId) {
        throw new Error('PayPal did not return an order id.');
      }

      quoteStore.set(paypalOrderId, {
        paypalOrderId,
        customerId: isGuestOrder
          ? createGuestCustomerId(payload.guestSessionId || paypalOrderId, payload.customerPhone, payload.customerEmail)
          : authUser!.id,
        customerRole: isGuestOrder ? 'guest' : 'customer',
        guestSessionId: isGuestOrder ? payload.guestSessionId || paypalOrderId : '',
        items: payload.items,
        shippingAddress: payload.shippingAddress,
        deliveryCountry: payload.deliveryCountry.toUpperCase(),
        displayCurrency,
        paypalCurrency,
        displayTotal,
        paypalTotal,
        shippingFee: payload.shippingFee,
        vatAmount: payload.vatAmount,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        createdAt: Date.now(),
      });

      console.info('[paypal] order created', {
        paypalOrderId: maskPayPalId(paypalOrderId),
        customerId: isGuestOrder ? 'guest' : authUser!.id,
        paypalCurrency,
        paypalTotal,
        deliveryCountry: payload.deliveryCountry,
      });

      res.json({
        paypalOrderId,
        currency: paypalCurrency,
        amount: paypalTotal,
      });
    } catch (error) {
      console.error('[paypal] create-order failed', error instanceof Error ? error.message : error);
      res.status(400).json({ error: 'PayPal checkout could not be started. Please try again.' });
    }
  });

  router.post('/capture-order', async (req, res) => {
    try {
      cleanupExpiredQuotes();
      const payload = captureOrderSchema.parse(req.body);
      const authUser = authenticateRequest?.(req) || null;
      const existingCapture = capturedStore.get(payload.paypalOrderId);
      if (existingCapture) {
        return res.json(existingCapture);
      }

      const quote = quoteStore.get(payload.paypalOrderId);
      const quoteBelongsToCustomer = quote?.customerRole === 'customer' && authUser?.role === 'customer' && quote.customerId === authUser.id;
      const quoteBelongsToGuest = quote?.customerRole === 'guest' && payload.guestSessionId && payload.guestSessionId === quote.guestSessionId;
      if (!quote || (!quoteBelongsToCustomer && !quoteBelongsToGuest)) {
        return res.status(400).json({ error: 'PayPal order expired or does not belong to this checkout.' });
      }

      const client = getPaypalClient();
      const getRequest = new paypal.orders.OrdersGetRequest(payload.paypalOrderId);
      const getResponse = await client.execute(getRequest);
      const paypalAmount = getResponse?.result?.purchase_units?.[0]?.amount;

      if (
        String(paypalAmount?.currency_code || '').toUpperCase() !== quote.paypalCurrency ||
        !safeEqualsMoney(paypalAmount?.value || 0, quote.paypalTotal, quote.paypalCurrency)
      ) {
        return res.status(400).json({ error: 'PayPal amount verification failed.' });
      }

      const captureRequest = new paypal.orders.OrdersCaptureRequest(payload.paypalOrderId);
      captureRequest.requestBody({});
      const captureResponse = await client.execute(captureRequest);
      const capture = extractCapture(captureResponse?.result);

      if (
        !capture.id ||
        capture.status.toUpperCase() !== 'COMPLETED' ||
        capture.currency.toUpperCase() !== quote.paypalCurrency ||
        !safeEqualsMoney(capture.amount, quote.paypalTotal, quote.paypalCurrency)
      ) {
        return res.status(400).json({ error: 'PayPal capture was not completed or did not match this order.' });
      }

      const orders = await createPaidOrders({
        customerId: quote.customerId,
        isGuestOrder: quote.customerRole === 'guest',
        guestSessionId: quote.guestSessionId,
        items: quote.items,
        shippingAddress: quote.shippingAddress,
        deliveryCountry: quote.deliveryCountry,
        shippingFee: quote.shippingFee,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        payment: {
          paypalOrderId: quote.paypalOrderId,
          captureId: capture.id,
          payerEmail: capture.payerEmail,
          currency: capture.currency.toUpperCase(),
          capturedAmount: capture.amount,
          capturedAt: capture.capturedAt,
          status: capture.status.toUpperCase(),
        },
      });

      const result = {
        success: true,
        message: 'PayPal payment verified and order created.',
        paypal: {
          orderId: quote.paypalOrderId,
          captureId: capture.id,
          status: capture.status.toUpperCase(),
          payerEmail: capture.payerEmail,
          currency: capture.currency.toUpperCase(),
          capturedAmount: capture.amount,
          capturedAt: capture.capturedAt,
        },
        orders,
        order: orders[0] || null,
      };

      capturedStore.set(payload.paypalOrderId, result);
      quoteStore.delete(payload.paypalOrderId);

      console.info('[paypal] order captured', {
        paypalOrderId: maskPayPalId(quote.paypalOrderId),
        captureId: maskPayPalId(capture.id),
        customerId: quote.customerRole === 'guest' ? 'guest' : quote.customerId,
        orderCount: orders.length,
      });

      res.json(result);
    } catch (error) {
      console.error('[paypal] capture-order failed', error instanceof Error ? error.message : error);
      res.status(400).json({ error: 'PayPal payment could not be verified. Your order was not created.' });
    }
  });

  return router;
}
