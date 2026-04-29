import jsPDF from 'jspdf';
import { formatCurrencyForCountry } from './currency';
import { isSupportedCountryCode } from './countryConfig';

export type OrderLabelTemplate = 'a4' | 'compact' | 'packing-slip';

export type AdminOrderLike = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  sellerName?: string;
  sellerStoreSlug?: string;
  subtotal?: number;
  vatAmount?: number;
  deliveryFee?: number;
  totalAmount?: number;
  commissionAmount?: number;
  commission?: number;
  sellerAmount?: number;
  currency?: string;
  taxRate?: number;
  status?: string;
  operationalStatus?: string;
  refundStatus?: string;
  refundReason?: string;
  refundAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryType?: string;
  trackingCode?: string;
  barcodeReference?: string;
  dispatchSlotDate?: string;
  dispatchSlotWindow?: string;
  dispatchNotes?: string;
  courierPartner?: string;
  createdAt?: string;
  deliveredAt?: string;
  riskLevel?: string;
  riskReasons?: string[];
  items?: Array<{
    id?: string;
    title?: string;
    quantity?: number;
    unitPrice?: number;
    salePrice?: number;
    sku?: string;
    image?: string;
  }>;
  shippingAddress?: any;
  shippingAddressJson?: any;
};

function emitPrintErrorToast() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('exshopi:toast', {
      detail: {
        type: 'error',
        message: 'Unable to open print label. Please allow popups or try again.',
      },
    })
  );
}

function getOrderCountryCode(order: AdminOrderLike) {
  const shippingAddress = order.shippingAddressJson
    ? typeof order.shippingAddressJson === 'string'
      ? JSON.parse(order.shippingAddressJson)
      : order.shippingAddressJson
    : order.shippingAddress || {};
  const rawCountry = shippingAddress.country;
  if (isSupportedCountryCode(rawCountry)) return rawCountry;
  return order.currency === 'SAR' ? 'SA' : 'AE';
}

function formatOrderMoney(order: AdminOrderLike, amount: number) {
  return formatCurrencyForCountry(amount, getOrderCountryCode(order));
}

export function buildOrderAddress(order: Pick<AdminOrderLike, 'shippingAddress' | 'shippingAddressJson'>) {
  const shippingAddress = order.shippingAddressJson
    ? typeof order.shippingAddressJson === 'string'
      ? JSON.parse(order.shippingAddressJson)
      : order.shippingAddressJson
    : order.shippingAddress || {};

  return {
    raw: shippingAddress,
    full: [
      shippingAddress.addressLine || '',
      shippingAddress.building || '',
      shippingAddress.flat || '',
      shippingAddress.area || '',
      shippingAddress.emirate || '',
    ]
      .filter(Boolean)
      .join(', '),
  };
}

export function formatOrderDateTime(value?: string, fallback = 'Not available') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function copyToClipboard(value: string, successMessage = 'Copied to clipboard') {
  if (typeof window === 'undefined' || !value) return false;

  const commit = () => {
    window.dispatchEvent(
      new CustomEvent('exshopi:toast', {
        detail: {
          type: 'success',
          message: successMessage,
        },
      })
    );
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(commit).catch(() => undefined);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    commit();
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildLabelStyles(template: OrderLabelTemplate) {
  const pageSize =
    template === 'compact'
      ? '@page { size: 4in 6in; margin: 8mm; }'
      : '@page { size: A4; margin: 12mm; }';

  return `
    ${pageSize}
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2ff; font-family: Inter, Arial, sans-serif; color: #0f172a; }
    .sheet { width: 100%; max-width: ${template === 'compact' ? '380px' : '840px'}; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: ${template === 'compact' ? '18px' : '28px'}; overflow: hidden; }
    .header { padding: ${template === 'compact' ? '18px' : '26px'}; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: white; }
    .eyebrow { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; opacity: .75; font-weight: 800; }
    .title { margin: 10px 0 0; font-size: ${template === 'compact' ? '24px' : '34px'}; font-weight: 900; }
    .subtitle { margin: 8px 0 0; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.82); }
    .section { padding: ${template === 'compact' ? '14px' : '20px 24px'}; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .panel { border: 1px solid #dbe4ff; border-radius: 18px; background: #f8fafc; padding: 14px; }
    .label { margin: 0 0 8px; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; font-weight: 800; color: #64748b; }
    .value { margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; }
    .muted { color: #475569; font-size: 12px; line-height: 1.5; }
    .tracking { border: 2px solid #0f172a; border-radius: 24px; padding: ${template === 'compact' ? '12px' : '18px'}; background: #f8fafc; }
    .barcode { margin-top: 14px; border: 1px dashed #334155; border-radius: 18px; background: white; padding: 14px; text-align: center; }
    .barcode-code { font: 900 ${template === 'compact' ? '22px' : '32px'}/1 "Courier New", monospace; letter-spacing: .22em; }
    .qr { display: inline-flex; align-items: center; justify-content: center; width: ${template === 'compact' ? '92px' : '120px'}; height: ${template === 'compact' ? '92px' : '120px'}; border: 2px solid #0f172a; border-radius: 18px; font: 700 10px/1.4 "Courier New", monospace; text-align: center; padding: 8px; background: #fff; }
    .items { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .items th, .items td { border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 12px; text-align: left; }
    .items th { color: #64748b; text-transform: uppercase; letter-spacing: .16em; font-size: 10px; }
    .totals { display: grid; gap: 8px; margin-top: 8px; }
    .total-row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .total-row strong { font-size: 15px; }
    .footer { padding: ${template === 'compact' ? '14px' : '18px 24px 24px'}; border-top: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; line-height: 1.6; }
    .print-actions { padding: 14px 0 0; text-align: center; }
    @media print {
      body { background: #fff; }
      .sheet { max-width: 100%; border-radius: 0; border: 0; box-shadow: none; }
      .print-actions { display: none !important; }
    }
  `;
}

function buildItemsTable(order: AdminOrderLike) {
  const items = order.items || [];

  return items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.salePrice || 0);
      return `
        <tr>
          <td>
            <div style="font-weight:700;color:#0f172a;">${escapeHtml(item.title || 'Order item')}</div>
            <div style="color:#64748b;font-size:11px;">${escapeHtml(item.sku || 'No SKU')}</div>
          </td>
          <td>${quantity}</td>
          <td>${formatOrderMoney(order, unitPrice)}</td>
          <td>${formatOrderMoney(order, quantity * unitPrice)}</td>
        </tr>
      `;
    })
    .join('');
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOrderLabelSheetHtml(order: AdminOrderLike, template: OrderLabelTemplate = 'a4') {
  const address = buildOrderAddress(order);
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const trackingCode = order.trackingCode || `TRK-${String(order.id || '').slice(-8)}`;
  const totalCommission = Number(order.commissionAmount ?? order.commission ?? 0);
  const sellerAmount = Number(order.sellerAmount || 0);
  const title =
    template === 'packing-slip'
      ? 'Packing Slip'
      : template === 'compact'
      ? 'Courier Label'
      : 'Dispatch Label';

  return `
        <div class="sheet">
          <div class="header">
            <div class="eyebrow">ExShopi Marketplace</div>
            <div class="title">${escapeHtml(title)}</div>
            <p class="subtitle">Order ${escapeHtml(order.orderNumber || order.id || '')} • ${escapeHtml(
              String(order.deliveryType || 'Standard delivery')
            )} • ${escapeHtml(String(order.paymentMethod || 'cod').toUpperCase())}</p>
          </div>
          <div class="section">
            <div class="grid">
              <div class="panel">
                <p class="label">Order</p>
                <p class="value">${escapeHtml(order.orderNumber || order.id || '')}</p>
                <p class="muted">${escapeHtml(formatOrderDateTime(order.createdAt))}</p>
              </div>
              <div class="panel">
                <p class="label">Courier & Tracking</p>
                <p class="value">${escapeHtml(order.courierPartner || 'ExShopi Logistics')}</p>
                <p class="muted">${escapeHtml(trackingCode)}</p>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="tracking">
              <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;">
                <div style="flex:1;">
                  <p class="label">Tracking Barcode</p>
                  <div class="barcode">
                    <div class="barcode-code">${escapeHtml(trackingCode)}</div>
                    <div class="muted" style="margin-top:10px;">Route ref: ${escapeHtml(
                      order.barcodeReference || trackingCode
                    )}</div>
                  </div>
                </div>
                <div>
                  <p class="label">QR / Scan Ref</p>
                  <div class="qr">${escapeHtml(
                    `${order.orderNumber || order.id}\n${trackingCode}\n${order.customerPhone || ''}`
                  )}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="grid">
              <div class="panel">
                <p class="label">Sender</p>
                <p class="value">${escapeHtml(order.sellerName || 'ExShopi Fulfillment')}</p>
                <p class="muted">ExShopi UAE Operations<br />support@exshopi.com<br />+971 52 260 8063</p>
              </div>
              <div class="panel">
                <p class="label">Recipient</p>
                <p class="value">${escapeHtml(order.customerName || 'Customer')}</p>
                <p class="muted">${escapeHtml(address.full || 'Address unavailable')}<br />${escapeHtml(
                  order.customerPhone || 'No phone'
                )}</p>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="grid">
              <div class="panel">
                <p class="label">Order Summary</p>
                <div class="totals">
                  <div class="total-row"><span>Items</span><span>${itemCount}</span></div>
                  <div class="total-row"><span>Subtotal</span><span>${formatOrderMoney(order, Number(order.subtotal || 0))}</span></div>
                  <div class="total-row"><span>Shipping</span><span>${formatOrderMoney(order, Number(order.deliveryFee || 0))}</span></div>
                  <div class="total-row"><span>VAT</span><span>${formatOrderMoney(order, Number(order.vatAmount || 0))}</span></div>
                  <div class="total-row"><strong>Total</strong><strong>${formatOrderMoney(order, Number(order.totalAmount || 0))}</strong></div>
                </div>
              </div>
              <div class="panel">
                <p class="label">Dispatch Snapshot</p>
                <div class="totals">
                  <div class="total-row"><span>Payment</span><span>${escapeHtml(
                    String(order.paymentMethod || 'COD').toUpperCase()
                  )}</span></div>
                  <div class="total-row"><span>Status</span><span>${escapeHtml(
                    String(order.status || order.operationalStatus || 'pending').replace(/_/g, ' ')
                  )}</span></div>
                  <div class="total-row"><span>Courier</span><span>${escapeHtml(order.courierPartner || 'Pending')}</span></div>
                  <div class="total-row"><span>Dispatch</span><span>${escapeHtml(
                    [
                      order.dispatchSlotDate ? formatOrderDateTime(order.dispatchSlotDate) : '',
                      order.dispatchSlotWindow || '',
                    ]
                      .filter(Boolean)
                      .join(' • ') || 'Not assigned'
                  )}</span></div>
                  <div class="total-row"><span>Commission</span><span>${formatOrderMoney(order, totalCommission)}</span></div>
                  <div class="total-row"><span>Seller payout</span><span>${formatOrderMoney(order, sellerAmount)}</span></div>
                </div>
              </div>
            </div>
          </div>
          <div class="section">
            <p class="label">Item Summary</p>
            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>${buildItemsTable(order)}</tbody>
            </table>
          </div>
          ${
            order.dispatchNotes
              ? `<div class="section"><div class="panel"><p class="label">Handling Notes</p><p class="muted">${escapeHtml(
                  order.dispatchNotes
                )}</p></div></div>`
              : ''
          }
          <div class="footer">
            ExShopi trusted marketplace dispatch label. Keep this shipment dry, scan at each handoff, and contact support@exshopi.com for operations issues.
          </div>
        </div>
  `;
}

export function buildOrderLabelHtml(order: AdminOrderLike, template: OrderLabelTemplate = 'a4') {
  const title =
    template === 'packing-slip'
      ? 'Packing Slip'
      : template === 'compact'
      ? 'Courier Label'
      : 'Dispatch Label';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ExShopi ${title} ${escapeHtml(order.orderNumber || order.id)}</title>
        <style>${buildLabelStyles(template)}</style>
      </head>
      <body>
        ${buildOrderLabelSheetHtml(order, template)}
      </body>
    </html>
  `;
}

export function printOrderDocuments(orders: AdminOrderLike[], template: OrderLabelTemplate = 'a4') {
  if (typeof window === 'undefined' || !orders.length) return;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ExShopi Order Labels</title>
        <style>
          ${buildLabelStyles(template)}
          body { margin: 0; background: #eef2ff; font-family: Inter, Arial, sans-serif; color: #0f172a; }
          .print-stack { display: grid; gap: 18px; padding: 18px; }
          .print-page-break { page-break-after: always; break-after: page; }
          .print-page-break:last-child { page-break-after: auto; break-after: auto; }
          @media print {
            .print-stack { padding: 0; gap: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-stack">
          ${orders
            .map(
              (order, index) =>
                `<section class="print-page-break" data-order-index="${index}">${buildOrderLabelSheetHtml(order, template)}</section>`
            )
            .join('')}
        </div>
        <script>
          window.addEventListener('load', function () {
            setTimeout(function () {
              try {
                window.focus();
                window.print();
              } catch (error) {
                console.error('Print failed', error);
              }
            }, 180);
          });
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank', 'width=1100,height=900');
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    emitPrintErrorToast();
    return;
  }

  try {
    const cleanup = () => {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    };
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    printWindow.addEventListener(
      'load',
      () => {
        window.setTimeout(() => {
          try {
            printWindow.focus();
          } catch {
            //
          }
        }, 80);
      },
      { once: true }
    );
  } catch {
    try {
      printWindow.close();
    } catch {
      //
    }
    URL.revokeObjectURL(blobUrl);
    emitPrintErrorToast();
  }
}

function addKeyValueRow(doc: jsPDF, label: string, value: string, x: number, y: number, width = 80) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const split = doc.splitTextToSize(value || '-', width);
  doc.text(split, x, y + 6);
  return y + 6 + split.length * 5;
}

export function downloadOrderLabelPdf(order: AdminOrderLike, template: OrderLabelTemplate = 'a4') {
  const orientation = template === 'compact' ? 'portrait' : 'portrait';
  const format = template === 'compact' ? [152.4, 101.6] : 'a4';
  const doc = new jsPDF({ orientation, unit: 'mm', format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const address = buildOrderAddress(order);
  const trackingCode = order.trackingCode || `TRK-${String(order.id || '').slice(-8)}`;
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(8, 8, pageWidth - 16, 28, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(template === 'compact' ? 16 : 24);
  doc.text('ExShopi Dispatch Label', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(219, 234, 254);
  doc.text(`Order ${order.orderNumber || order.id} • ${String(order.paymentMethod || 'COD').toUpperCase()}`, 14, 28);

  doc.setDrawColor(15, 23, 42);
  doc.roundedRect(8, 42, pageWidth - 16, 30, 4, 4);
  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(template === 'compact' ? 16 : 24);
  doc.text(trackingCode, pageWidth / 2, 57, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Barcode / scan reference • ${order.barcodeReference || trackingCode}`, pageWidth / 2, 66, { align: 'center' });

  let y = 80;
  y = addKeyValueRow(doc, 'Recipient', order.customerName || 'Customer', 10, y, 86);
  y = addKeyValueRow(doc, 'Address', address.full || 'Address unavailable', 10, y + 4, 86);
  y = addKeyValueRow(doc, 'Phone', order.customerPhone || 'No phone', 10, y + 4, 86);

  let rightY = 80;
  rightY = addKeyValueRow(doc, 'Seller', order.sellerName || 'ExShopi Fulfillment', pageWidth / 2 + 4, rightY, 76);
  rightY = addKeyValueRow(doc, 'Courier', order.courierPartner || 'ExShopi Logistics', pageWidth / 2 + 4, rightY + 4, 76);
  rightY = addKeyValueRow(
    doc,
    'Dispatch Slot',
    [
      order.dispatchSlotDate ? formatOrderDateTime(order.dispatchSlotDate) : '',
      order.dispatchSlotWindow || '',
    ]
      .filter(Boolean)
      .join(' • ') || 'Not assigned',
    pageWidth / 2 + 4,
    rightY + 4,
    76
  );

  const startY = Math.max(y, rightY) + 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(8, startY, pageWidth - 16, 40, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('ORDER SNAPSHOT', 12, startY + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Items: ${itemCount}`, 12, startY + 18);
  doc.text(`Subtotal: ${formatOrderMoney(order, Number(order.subtotal || 0))}`, 12, startY + 25);
  doc.text(`VAT: ${formatOrderMoney(order, Number(order.vatAmount || 0))}`, 12, startY + 32);
  doc.text(`Shipping: ${formatOrderMoney(order, Number(order.deliveryFee || 0))}`, pageWidth / 2, startY + 18);
  doc.text(`Commission: ${formatOrderMoney(order, Number(order.commissionAmount ?? order.commission ?? 0))}`, pageWidth / 2, startY + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatOrderMoney(order, Number(order.totalAmount || 0))}`, pageWidth / 2, startY + 32);

  let itemsY = startY + 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('ITEMS', 12, itemsY);
  itemsY += 8;

  (order.items || []).slice(0, 8).forEach((item) => {
    const qty = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || item.salePrice || 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const title = doc.splitTextToSize(item.title || 'Order item', pageWidth - 48);
    doc.text(title, 12, itemsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${qty} x ${formatOrderMoney(order, unitPrice)}`, pageWidth - 46, itemsY, { align: 'left' });
    itemsY += title.length * 4 + 3;
    if (item.sku) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`SKU: ${item.sku}`, 12, itemsY);
      itemsY += 5;
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(12, itemsY, pageWidth - 12, itemsY);
    itemsY += 5;
  });

  if (order.dispatchNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('HANDLING NOTES', 12, itemsY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(order.dispatchNotes, pageWidth - 24), 12, itemsY + 10);
  }

  doc.save(`exshopi-label-${order.orderNumber || order.id}.pdf`);
}

export function downloadOrderInvoicePdf(order: AdminOrderLike) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const address = buildOrderAddress(order);
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('ExShopi Invoice', 14, 20);
  doc.setFontSize(10);
  doc.text(`Order ${order.orderNumber || order.id}`, 14, 28);

  doc.setTextColor(15, 23, 42);
  let y = 46;
  y = addKeyValueRow(doc, 'Customer', order.customerName || 'Customer', 14, y, 82);
  y = addKeyValueRow(doc, 'Email', order.customerEmail || '-', 14, y + 4, 82);
  y = addKeyValueRow(doc, 'Phone', order.customerPhone || '-', 14, y + 4, 82);

  let rightY = 46;
  rightY = addKeyValueRow(doc, 'Seller', order.sellerName || 'ExShopi', 110, rightY, 78);
  rightY = addKeyValueRow(doc, 'Status', String(order.status || order.operationalStatus || 'pending').replace(/_/g, ' '), 110, rightY + 4, 78);
  rightY = addKeyValueRow(doc, 'Address', address.full || '-', 110, rightY + 4, 78);

  let tableY = Math.max(y, rightY) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Item', 14, tableY);
  doc.text('Qty', 118, tableY);
  doc.text('Unit', 138, tableY);
  doc.text('Total', 170, tableY);
  tableY += 5;
  doc.line(14, tableY, 196, tableY);
  tableY += 6;

  (order.items || []).forEach((item) => {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.unitPrice || item.salePrice || 0);
    const title = doc.splitTextToSize(item.title || 'Order item', 96);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, tableY);
    doc.text(String(qty), 118, tableY);
    doc.text(formatOrderMoney(order, unit), 138, tableY);
    doc.text(formatOrderMoney(order, qty * unit), 170, tableY);
    tableY += Math.max(title.length * 5, 8);
  });

  tableY += 8;
  doc.line(120, tableY, 196, tableY);
  tableY += 8;
  doc.text(`Subtotal: ${formatOrderMoney(order, Number(order.subtotal || 0))}`, 128, tableY);
  tableY += 7;
  doc.text(`VAT: ${formatOrderMoney(order, Number(order.vatAmount || 0))}`, 128, tableY);
  tableY += 7;
  doc.text(`Shipping: ${formatOrderMoney(order, Number(order.deliveryFee || 0))}`, 128, tableY);
  tableY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ${formatOrderMoney(order, Number(order.totalAmount || 0))}`, 128, tableY);
  doc.save(`exshopi-invoice-${order.orderNumber || order.id}.pdf`);
}

export function exportOrdersCsv(orders: AdminOrderLike[]) {
  const rows = [
    [
      'Order ID',
      'Created At',
      'Customer',
      'Email',
      'Phone',
      'Seller',
      'Items',
      'Subtotal',
      'VAT',
      'Shipping',
      'Total',
      'Commission',
      'Seller Payout',
      'Payment Method',
      'Delivery Type',
      'Status',
      'Tracking Code',
      'Risk Level',
    ],
    ...orders.map((order) => [
      order.orderNumber || order.id,
      formatOrderDateTime(order.createdAt),
      order.customerName || '',
      order.customerEmail || '',
      order.customerPhone || '',
      order.sellerName || '',
      String((order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
      String(Number(order.subtotal || 0)),
      String(Number(order.vatAmount || 0)),
      String(Number(order.deliveryFee || 0)),
      String(Number(order.totalAmount || 0)),
      String(Number(order.commissionAmount ?? order.commission ?? 0)),
      String(Number(order.sellerAmount || 0)),
      String(order.paymentMethod || ''),
      String(order.deliveryType || ''),
      String(order.status || order.operationalStatus || ''),
      String(order.trackingCode || ''),
      String(order.riskLevel || ''),
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  downloadBlob(`exshopi-orders-${new Date().toISOString().slice(0, 10)}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
}
