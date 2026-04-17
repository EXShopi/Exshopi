type EmailFact = {
  label: string;
  value: string;
};

type TransactionalEmailInput = {
  to: string | string[];
  subject: string;
  title: string;
  intro: string;
  facts?: EmailFact[];
  bullets?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  outro?: string;
  text?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@exshopi.com';

const escapeHtml = (value: string) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeRecipients = (to: string | string[]) =>
  (Array.isArray(to) ? to : [to])
    .map((entry) => String(entry || '').trim().toLowerCase())
    .filter(Boolean);

function renderEmailHtml(input: TransactionalEmailInput) {
  const facts = (input.facts || [])
    .filter((fact) => fact.label && fact.value)
    .map(
      (fact) =>
        `<tr><td style="padding:8px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;">${escapeHtml(
          fact.label
        )}</td><td style="padding:8px 12px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${escapeHtml(
          fact.value
        )}</td></tr>`
    )
    .join('');

  const bullets = (input.bullets || [])
    .filter(Boolean)
    .map(
      (bullet) =>
        `<li style="margin:0 0 8px 0;color:#334155;font-size:14px;line-height:1.6;">${escapeHtml(bullet)}</li>`
    )
    .join('');

  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<div style="margin:24px 0 0;"><a href="${escapeHtml(
          input.ctaUrl
        )}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(
          input.ctaLabel
        )}</a></div>`
      : '';

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%);border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:700;">ExShopi Marketplace</div>
          <h1 style="margin:12px 0 0;color:#0f172a;font-size:28px;line-height:1.2;">${escapeHtml(input.title)}</h1>
          <p style="margin:14px 0 0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(input.intro)}</p>
        </div>
        <div style="padding:28px;">
          ${
            facts
              ? `<table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff;">${facts}</table>`
              : ''
          }
          ${bullets ? `<ul style="margin:24px 0 0;padding-left:20px;">${bullets}</ul>` : ''}
          ${cta}
          ${
            input.outro
              ? `<p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.7;">${escapeHtml(input.outro)}</p>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function renderEmailText(input: TransactionalEmailInput) {
  const factLines = (input.facts || [])
    .filter((fact) => fact.label && fact.value)
    .map((fact) => `${fact.label}: ${fact.value}`);

  const bulletLines = (input.bullets || []).filter(Boolean).map((bullet) => `- ${bullet}`);

  return [
    `ExShopi Marketplace`,
    ``,
    input.title,
    ``,
    input.intro,
    ``,
    ...factLines,
    factLines.length ? `` : '',
    ...bulletLines,
    input.ctaLabel && input.ctaUrl ? `` : '',
    input.ctaLabel && input.ctaUrl ? `${input.ctaLabel}: ${input.ctaUrl}` : '',
    input.outro ? `` : '',
    input.outro || '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function isEmailEnabled() {
  return Boolean(RESEND_API_KEY && MAIL_FROM);
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const recipients = normalizeRecipients(input.to);
  if (!recipients.length) {
    return { ok: false, skipped: true, reason: 'missing_recipient' };
  }

  if (!isEmailEnabled()) {
    console.warn('[email] Skipping send because RESEND_API_KEY or MAIL_FROM is missing.');
    return { ok: false, skipped: true, reason: 'email_disabled' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: recipients,
        subject: input.subject,
        html: renderEmailHtml(input),
        text: input.text || renderEmailText(input),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error(`[email] Resend send failed (${response.status}): ${message}`);
      return { ok: false, skipped: false, reason: message };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    console.error('[email] Resend send failed:', error);
    return { ok: false, skipped: false, reason: String(error) };
  }
}
