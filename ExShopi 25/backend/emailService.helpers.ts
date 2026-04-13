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
