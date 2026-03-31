import crypto from 'crypto';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured');
  }
  return key;
}

function formEncode(input: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params;
}

export async function createStripeCheckoutSession(input: {
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems: Array<{
    name: string;
    amountAed: number;
    quantity: number;
  }>;
}) {
  const secretKey = getStripeSecretKey();
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', input.successUrl);
  params.append('cancel_url', input.cancelUrl);
  params.append('customer_email', input.customerEmail);
  params.append('currency', 'aed');
  params.append('billing_address_collection', 'required');
  params.append('submit_type', 'pay');
  params.append('payment_method_types[0]', 'card');

  input.lineItems.forEach((item, index) => {
    params.append(`line_items[${index}][price_data][currency]`, 'aed');
    params.append(`line_items[${index}][price_data][product_data][name]`, item.name);
    params.append(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.amountAed * 100)));
    params.append(`line_items[${index}][quantity]`, String(item.quantity));
  });

  Object.entries(input.metadata || {}).forEach(([key, value]) => {
    params.append(`metadata[${key}]`, value);
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to create Stripe checkout session');
  }

  return data;
}

export function verifyStripeWebhookSignature(payload: Buffer, signatureHeader?: string | string[] | undefined) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  const pairs = signature.split(',').map((entry) => entry.trim());
  const timestamp = pairs.find((entry) => entry.startsWith('t='))?.slice(2);
  const candidates = pairs.filter((entry) => entry.startsWith('v1=')).map((entry) => entry.slice(3));
  if (!timestamp || candidates.length === 0) {
    throw new Error('Invalid Stripe signature header');
  }

  const signedPayload = `${timestamp}.${payload.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
  const matched = candidates.some((candidate) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
    } catch {
      return false;
    }
  });

  if (!matched) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(payload.toString('utf8'));
}
