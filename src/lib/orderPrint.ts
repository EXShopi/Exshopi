import { formatAED } from './currency';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function printOrderSlip(order: any, mode: 'pickup' | 'invoice' = 'pickup') {
  const popup = window.open('', '_blank', 'width=860,height=960');
  if (!popup) return;

  const address = [
    order?.shippingAddress?.addressLine1,
    order?.shippingAddress?.address,
    order?.shippingAddress?.building,
    order?.shippingAddress?.flat,
    order?.shippingAddress?.area,
    order?.shippingAddress?.city,
    order?.shippingAddress?.emirate,
  ]
    .filter(Boolean)
    .join(', ');

  const html = `
    <html>
      <head>
        <title>${mode === 'pickup' ? 'Pickup Slip' : 'Invoice'} - ${escapeHtml(order.orderId || order.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px; }
          .brand { font-size: 28px; font-weight: 800; }
          .muted { color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
          .card { border:1px solid #cbd5e1; border-radius:18px; padding:18px; margin-bottom:18px; }
          .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
          .label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.12em; }
          .value { font-size:15px; font-weight:700; margin-top:6px; word-break:break-word; }
          .code { border:2px dashed #0f172a; border-radius:16px; padding:18px; text-align:center; font-family: monospace; font-size:20px; font-weight:800; letter-spacing:.2em; }
          .totals { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ExShopi</div>
            <div class="muted">${mode === 'pickup' ? 'Seller Pickup Slip' : 'Marketplace Invoice'}</div>
          </div>
          <div class="muted">Printed ${escapeHtml(new Date().toLocaleString('en-AE'))}</div>
        </div>
        <div class="card grid">
          <div><div class="label">Order Number</div><div class="value">${escapeHtml(order.orderId || order.id)}</div></div>
          <div><div class="label">Tracking Code</div><div class="value">${escapeHtml(order.trackingCode || 'Pending')}</div></div>
          <div><div class="label">Customer</div><div class="value">${escapeHtml(order.customerName || 'Customer')}</div></div>
          <div><div class="label">Phone</div><div class="value">${escapeHtml(order.customerPhone || order.shippingAddress?.phone || 'Not available')}</div></div>
          <div><div class="label">Seller</div><div class="value">${escapeHtml(order.sellerName || 'ExShopi Official')}</div></div>
          <div><div class="label">Payment</div><div class="value">${escapeHtml(order.paymentMethod || 'COD')} / ${escapeHtml(order.paymentStatus || 'pending')}</div></div>
          <div><div class="label">Status</div><div class="value">${escapeHtml(order.status || 'pending_confirmation')}</div></div>
        </div>
        <div class="card">
          <div class="label">Delivery Address</div>
          <div class="value">${escapeHtml(address || 'Address unavailable')}</div>
        </div>
        <div class="card">
          <div class="label">${mode === 'pickup' ? 'Pickup Barcode / Scan Code' : 'Receipt Code'}</div>
          <div class="code">${escapeHtml(order.pickupQrCode || order.trackingCode || order.orderId || order.id)}</div>
        </div>
        <div class="card totals">
          <div><div class="label">Total</div><div class="value">${escapeHtml(formatAED(Number(order.totalAmount || order.subtotal || 0)))}</div></div>
          <div><div class="label">Commission</div><div class="value">${escapeHtml(formatAED(Number(order.commission || 0)))}</div></div>
          <div><div class="label">Seller Payable</div><div class="value">${escapeHtml(formatAED(Number(order.sellerAmount || 0)))}</div></div>
        </div>
        <script>
          window.onload = () => { window.print(); setTimeout(() => window.close(), 200); };
        </script>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
