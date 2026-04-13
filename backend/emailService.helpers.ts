import { sendTransactionalEmail } from './emailService';

// New order notification for admin when customer places an order
export async function sendNewOrderNotificationToAdmin(orderData: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  emirate: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  deliveryType: string;
  orderDate: string;
}) {
  const itemsList = orderData.items
    .map((item) => `${item.quantity}x ${item.title} - AED ${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'ahsansajid295@gmail.com';

  return sendTransactionalEmail({
    to: adminEmail,
    subject: `🛒 New Order Received – ExShopi (Order #${orderData.orderNumber})`,
    title: 'New Order Received',
    intro: `A new order has been placed on ExShopi. Please review and process it as soon as possible.`,
    facts: [
      { label: 'Order ID', value: orderData.orderNumber },
      { label: 'Customer Name', value: orderData.customerName },
      { label: 'Customer Phone', value: orderData.customerPhone },
      { label: 'Customer Email', value: orderData.customerEmail },
      { label: 'Delivery Address', value: orderData.deliveryAddress },
      { label: 'Emirate', value: orderData.emirate },
      { label: 'Delivery Type', value: orderData.deliveryType },
      { label: 'Items', value: orderData.items.length.toString() },
      { label: 'Subtotal', value: `AED ${orderData.subtotal.toFixed(2)}` },
      { label: 'Delivery Fee', value: `AED ${orderData.deliveryFee.toFixed(2)}` },
      { label: 'VAT (5%)', value: `AED ${orderData.vatAmount.toFixed(2)}` },
      { label: 'Total Amount', value: `AED ${orderData.totalAmount.toFixed(2)}` },
      { label: 'Payment Method', value: orderData.paymentMethod.toUpperCase() },
      { label: 'Order Date', value: new Date(orderData.orderDate).toLocaleString('en-AE') },
    ],
    bullets: [
      `Items ordered (${orderData.items.length} items): ${itemsList}`,
      `Payment Status: Pending - ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Payment Method'}`,
      `Next Step: Review order details and confirm acceptance in admin panel`,
    ],
    ctaLabel: 'View Order in Admin Panel',
    ctaUrl: `https://exshopi.com/admin/orders?search=${orderData.orderNumber}`,
    outro: 'Please ensure to process this order promptly to maintain customer satisfaction and marketplace reputation.',
  });
}

// Seller signup confirmation email sent to seller after successful registration
export async function sendSellerSignupConfirmationEmail(sellerData: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  applicationId: string;
}) {
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

// Admin notification when new seller applies
export async function sendSellerApplicationNotificationToAdmin(sellerData: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  applicationId: string;
  isResubmission: boolean;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'ahsansajid295@gmail.com';

  return sendTransactionalEmail({
    to: adminEmail,
    subject: `${sellerData.isResubmission ? '📝 Seller Resubmission' : '🔔 New Seller Application'} – ${sellerData.businessName}`,
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
