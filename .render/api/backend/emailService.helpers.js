import { sendTransactionalEmail } from './emailService';
const DEFAULT_ADMIN_ORDER_EMAIL = 'ahsansajid295@gmail.com';
function toCurrency(value) {
    return `AED ${Number(value || 0).toFixed(2)}`;
}
function normalizeEmailList(value) {
    return value
        .split(',')
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter(Boolean);
}
function getAdminOrderRecipients() {
    const recipients = new Set([DEFAULT_ADMIN_ORDER_EMAIL]);
    normalizeEmailList(process.env.ADMIN_ORDER_EMAILS || '').forEach((email) => recipients.add(email));
    normalizeEmailList(process.env.ADMIN_EMAIL || '').forEach((email) => recipients.add(email));
    normalizeEmailList(process.env.ADMIN_ALERT_EMAIL || '').forEach((email) => recipients.add(email));
    return Array.from(recipients);
}
function resolveAdminOrderUrl(orderNumber) {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'https://exshopi.com';
    return `${appUrl.replace(/\/$/, '')}/admin/orders?search=${encodeURIComponent(orderNumber)}`;
}
export async function sendNewOrderNotificationToAdmin(orderData) {
    const recipients = getAdminOrderRecipients();
    const orderUrl = resolveAdminOrderUrl(orderData.orderNumber);
    const itemsList = orderData.items
        .map((item) => {
        const itemBits = [
            `${item.quantity}x ${item.title}`,
            item.variant ? `Variant: ${item.variant}` : '',
            item.sku ? `SKU: ${item.sku}` : '',
            `Unit: ${toCurrency(item.unitPrice)}`,
            `Line: ${toCurrency(item.lineTotal)}`,
        ].filter(Boolean);
        return itemBits.join(' • ');
    })
        .join('\n');
    const text = [
        `New Order Received – ExShopi – Order #${orderData.orderNumber}`,
        ``,
        `Order ID: ${orderData.orderNumber}`,
        `Placed: ${new Date(orderData.orderDate).toLocaleString('en-AE')}`,
        `Status: ${orderData.orderStatus}`,
        `Payment: ${String(orderData.paymentMethod || '').toUpperCase()} (${orderData.paymentStatus})`,
        `Delivery Type: ${orderData.deliveryType}`,
        `Tracking: ${orderData.trackingCode || 'Pending'}`,
        `Seller / Store: ${orderData.sellerName}`,
        ``,
        `Customer: ${orderData.customerName}`,
        `Email: ${orderData.customerEmail}`,
        `Phone: ${orderData.customerPhone}`,
        `Delivery Address: ${orderData.deliveryAddress}`,
        `Emirate: ${orderData.emirate}`,
        ``,
        `Items`,
        itemsList,
        ``,
        `Subtotal: ${toCurrency(orderData.subtotal)}`,
        `VAT: ${toCurrency(orderData.vatAmount)}`,
        `Shipping: ${toCurrency(orderData.deliveryFee)}`,
        `Discount: ${toCurrency(orderData.discountAmount || 0)}`,
        `Grand Total: ${toCurrency(orderData.totalAmount)}`,
        `Commission: ${toCurrency(orderData.commission || 0)}`,
        `Seller Payout: ${toCurrency(orderData.sellerPayoutAmount || 0)}`,
        ``,
        `Open in Admin: ${orderUrl}`,
    ].join('\n');
    return {
        recipients,
        ...(await sendTransactionalEmail({
            to: recipients,
            subject: `New Order Received – ExShopi – Order #${orderData.orderNumber}`,
            title: 'New Order Received',
            intro: 'A real customer order has been placed successfully on ExShopi and is ready for operations review, fulfillment, and dispatch handling.',
            facts: [
                { label: 'Order ID', value: orderData.orderNumber },
                { label: 'Placed At', value: new Date(orderData.orderDate).toLocaleString('en-AE') },
                { label: 'Customer', value: orderData.customerName },
                { label: 'Customer Email', value: orderData.customerEmail },
                { label: 'Customer Phone', value: orderData.customerPhone },
                { label: 'Seller / Store', value: orderData.sellerName },
                { label: 'Delivery Address', value: orderData.deliveryAddress },
                { label: 'Emirate', value: orderData.emirate },
                { label: 'Payment Method', value: String(orderData.paymentMethod || '').toUpperCase() },
                { label: 'Payment Status', value: orderData.paymentStatus },
                { label: 'Delivery Type', value: orderData.deliveryType },
                { label: 'Order Status', value: orderData.orderStatus },
                { label: 'Tracking Code', value: orderData.trackingCode || 'Pending' },
                { label: 'Subtotal', value: toCurrency(orderData.subtotal) },
                { label: 'VAT', value: toCurrency(orderData.vatAmount) },
                { label: 'Shipping Fee', value: toCurrency(orderData.deliveryFee) },
                { label: 'Discount', value: toCurrency(orderData.discountAmount || 0) },
                { label: 'Grand Total', value: toCurrency(orderData.totalAmount) },
                { label: 'Commission', value: toCurrency(orderData.commission || 0) },
                { label: 'Seller Payout', value: toCurrency(orderData.sellerPayoutAmount || 0) },
            ],
            bullets: [
                `${orderData.items.length} line items in this order`,
                ...orderData.items.map((item) => [
                    `${item.quantity}x ${item.title}`,
                    item.variant ? `Variant: ${item.variant}` : '',
                    item.sku ? `SKU: ${item.sku}` : '',
                    `Line total: ${toCurrency(item.lineTotal)}`,
                ]
                    .filter(Boolean)
                    .join(' • ')),
            ],
            ctaLabel: 'Open Order in Admin',
            ctaUrl: orderUrl,
            outro: 'This notification was generated from the successful order creation flow. If dispatch or payment review is needed, open the order workspace from the admin panel.',
            text,
        })),
    };
}
export async function sendSellerSignupConfirmationEmail(sellerData) {
    return sendTransactionalEmail({
        to: sellerData.email,
        subject: `Welcome to ExShopi Seller Program – Application Received`,
        title: 'Welcome to ExShopi',
        intro: `Thank you for joining ExShopi Marketplace! We've received your seller application and our team is reviewing it.`,
        facts: [
            { label: 'Business Name', value: sellerData.businessName },
            { label: 'Owner Name', value: sellerData.ownerName },
            { label: 'Business Type', value: sellerData.businessType },
            { label: 'City', value: sellerData.city },
            { label: 'Application ID', value: sellerData.applicationId },
            { label: 'Status', value: 'Under Review' },
        ],
        bullets: [
            `Your application has been successfully submitted to ExShopi.`,
            `Our admin team will review your business information within 1-2 business days.`,
            `You'll receive an email notification as soon as a decision is made.`,
            `In the meantime, you can log in to your seller account and explore the dashboard.`,
            `If you have any questions, our support team is here to help.`,
        ],
        ctaLabel: 'View Application Status',
        ctaUrl: `https://exshopi.com/seller/applications`,
        outro: `We look forward to partnering with ${sellerData.businessName} on ExShopi!`,
    });
}
export async function sendSellerApplicationNotificationToAdmin(sellerData) {
    const recipients = getAdminOrderRecipients();
    return sendTransactionalEmail({
        to: recipients,
        subject: `${sellerData.isResubmission ? 'Seller Resubmission' : 'New Seller Application'} – ${sellerData.businessName}`,
        title: sellerData.isResubmission ? 'Seller Resubmission Received' : 'New Seller Application Received',
        intro: `A ${sellerData.isResubmission ? 'resubmitted' : 'new'} seller application requires your review and approval.`,
        facts: [
            { label: 'Business Name', value: sellerData.businessName },
            { label: 'Owner Name', value: sellerData.ownerName },
            { label: 'Email', value: sellerData.email },
            { label: 'Phone', value: sellerData.phone },
            { label: 'Business Type', value: sellerData.businessType },
            { label: 'City', value: sellerData.city },
            { label: 'Application ID', value: sellerData.applicationId },
            { label: 'Type', value: sellerData.isResubmission ? 'Resubmission' : 'New Application' },
        ],
        bullets: [
            `Please review the business documents and information provided.`,
            `Verify the seller's legitimacy and compliance with ExShopi policies.`,
            `Check for any red flags or incomplete information.`,
            `Either approve, reject, or request additional information.`,
        ],
        ctaLabel: 'Review in Admin Panel',
        ctaUrl: `https://exshopi.com/admin/seller-applications`,
        outro: `Process seller applications promptly to maintain marketplace growth and seller satisfaction.`,
    });
}
