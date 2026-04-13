# ExShopi Order Management - Quick Reference Guide

## 🎯 Key Components Overview

### 1. **OrderDetailsModal** (Main Admin View)
**Location**: `src/components/OrderDetails/OrderDetailsModal.tsx`

**Purpose**: Professional order details display with three tabs
- **Overview Tab**: Customer info, items, pricing, payment status
- **Timeline Tab**: Order progression with visual timeline
- **Label Tab**: Printable shipping label

**How to Use**:
```tsx
import { OrderDetailsModal } from "../components/OrderDetails";

<OrderDetailsModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
  order={orderData} 
/>
```

**Required Props**:
- `isOpen` (boolean) - Modal visibility
- `onClose` (function) - Close handler
- `order` (OrderDetailsData) - Order object with all fields

### 2. **OrderStatusTimeline** (Visual Progress)
**Location**: `src/components/OrderDetails/OrderStatusTimeline.tsx`

**Purpose**: Shows 6-stage order progression visually

**Status Stages**:
1. Pending (ℹ️ Blue) - Order received, awaiting confirmation
2. Confirmed (✓ Green) - Admin accepted order
3. Packed (📦 Amber) - Items packaged
4. Shipped (🚚 Purple) - Handed to courier
5. In Transit (🌍 Cyan) - On the way
6. Delivered (✨ Green) - Completed

**How to Use**:
```tsx
<OrderStatusTimeline 
  events={order.trackingEvents} 
  currentStatus={order.operationalStatus}
/>
```

### 3. **OrderDetailsShippingLabel** (Printable Label)
**Location**: `src/components/OrderDetails/OrderDetailsShippingLabel.tsx`

**Purpose**: A4-sized printable shipping label with all dispatch info

**Includes**:
- Order ID & tracking code
- Customer address & details
- Item list
- Delivery type & payment method
- Dispatchable as PDF or printed directly

**CSS**: Print-optimized with `@media print` styles

---

## 🛒 Checkout Flow (Delivery Options)

**File**: `src/pages/Checkout.tsx`

### Delivery Options
```
Same Day Delivery (⚡ 25 AED)
├─ Available: Dubai, Sharjah, Ajman ONLY
├─ Form value: "same_day_delivery"
└─ API: "Same Day Delivery"

Standard UAE Delivery (📦 15 AED)
├─ Available: All emirates
├─ Form value: "standard_uae"
└─ API: "Standard UAE Delivery"
```

### Emirate Validation Logic
```tsx
const sameDayEmirateers = ['Dubai', 'Sharjah', 'Ajman'];
const canUseSameDay = sameDayEmirateers.includes(selectedEmirateState);

// If user selects Same Day but emirate doesn't support:
// → Auto-switch to Standard UAE
```

### Order Payload Format
```json
{
  "deliveryType": "Same Day Delivery" or "Standard UAE Delivery",
  "shippingCost": 25 or 15,
  "shippingAddress": {...}
}
```

---

## 📧 Email Notification System

**File**: `backend/emailService.helpers.ts`

### Trigger Point
- Fires when: Customer completes OTP verification in checkout
- Called from: `backend/server.ts` POST `/api/orders/create`

### Email Configuration
```typescript
Admin Email: process.env.ADMIN_EMAIL || 'ahsansajid295@gmail.com'
Subject: "🛒 New Order Received – ExShopi (Order #XXXX)"
Service: Resend API (existing)
```

### Email Contents
- Order ID and tracking code
- Customer details (name, phone, email)
- Delivery address and emirate
- Item list with pricing
- Subtotal, delivery fee, VAT, total
- Payment method
- Delivery type
- Order timestamp
- Admin panel link (CTA)

### Error Handling
- Email failures DO NOT block order creation
- Warnings logged to console
- Process continues normally

---

## 👥 Admin Order Monitoring

**File**: `src/pages/admin/AdminOrderMonitoring.tsx`

### Features
- Real-time order list with SSE updates
- Click "Details" to open professional modal
- View timeline of order events
- Print shipping labels
- Manage order status (buttons available)
- Refund management interface

### Order Data Structure (After Enhancement)
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  
  items: OrderItem[];  // New: array of items
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  totalAmount: number;
  commission: number;
  
  deliveryType: "Same Day Delivery" | "Standard UAE Delivery";  // New
  paymentMethod: "COD";
  paymentStatus: "pending" | "completed" | "failed";
  
  shippingAddress: {
    addressLine: string;
    building?: string;
    area?: string;
    emirate: string;
  };
  trackingCode: string;  // e.g., "46QOKP3H09MB"
  operationalStatus: string;
  
  trackingEvents: TrackingEvent[];  // New: array of status changes
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}
```

---

## 🔍 Customer Track Order Page

**File**: `src/pages/TrackOrder.tsx`

### How It Works
1. **User Input**: Enter any of:
   - Order ID (e.g., "ORD883862NJOF")
   - Tracking Code (e.g., "46QOKP3H09MB")
   - Phone Number (e.g., "+971501234567")
   - Email address (e.g., "customer@example.com")

2. **Search Logic**:
   - Calls `orderAPI.getAllOrders()`
   - Searches for match in order ID, tracking code, phone, email
   - If found: Navigates to `/order-tracking?code=[trackingCode]`
   - If not found: Shows helpful error message

3. **Error Messages**:
   - "Please enter either an Order ID or Phone/Email"
   - "Order not found. Please check..."
   - Real-time validation feedback

---

## 🔧 Backend Integration Points

### API Endpoints Used
```
POST /api/orders/create
  ├─ Receives: Complete order payload with deliveryType
  ├─ Creates: Order record in database
  ├─ Calls: sendNewOrderNotificationToAdmin()
  └─ Returns: { orderId, trackingCode, ... }

GET /api/orders (or similar)
  ├─ Used by: AdminOrderMonitoring (SSE for real-time)
  └─ Returns: Array of all orders

GET /api/tracking/:trackingCode
  └─ Used by: TrackOrder page search
```

### Order Creation Flow
```
1. Customer submits Checkout form
2. OTP verification succeeds
3. POST /api/orders/create called
   ├─ Save order to DB
   ├─ Create OrderItem records
   ├─ Create TrackingEvent (initial status)
   ├─ Call sendNewOrderNotificationToAdmin()
   └─ Return success + tracking code
4. Client redirects to OrderSuccess page
5. Admin receives email notification
```

---

## 🎨 UI/UX Patterns

### Status Badge Colors
- 🔵 **Blue** (Pending) - Initial state
- 🟢 **Green** (Confirmed/Delivered) - Positive states
- 🟠 **Amber** (Packed/Processing) - In progress
- 🟣 **Purple** (Shipped) - In transit
- 🔴 **Red** (Cancelled/Failed) - Negative states

### Professional Card Design
- Rounded: 24px (`rounded-[24px]`)
- Shadow: `shadow-sm` for depth
- Padding: 24px (`p-6`) standard spacing
- Border: 1px slate-200

### Icons Used (Lucide React)
- `PackageCheck` - Order complete
- `Truck` - Shipping/delivery
- `MapPin` - Location
- `Clock3` - Timeline/timing
- `Search` - Search action
- `AlertCircle` - Errors
- `Loader` - Loading state

---

## 📱 Responsive Design

All components are mobile-first:
- **Mobile** (default): Single column, full-width inputs
- **Tablet** (md:): Two-column layouts
- **Desktop**: Three-column layouts with fuller information

---

## 🚨 Common Issues & Solutions

### Issue: Admin doesn't receive email
**Check**:
1. `ADMIN_EMAIL` env var is set
2. `RESEND_API_KEY` is valid
3. Check `backend/server.ts` console logs for email errors
4. Order status is "placed" and payment verified
5. Email service endpoint is accessible

### Issue: Customer sees wrong delivery options
**Check**:
1. Emirate name matches list: ['Dubai', 'Sharjah', 'Ajman']
2. useEffect dependency includes emirate state
3. Form validation is not cached from previous entries

### Issue: Tracking page shows "Order not found"
**Check**:
1. Order was successfully created (check admin panel)
2. Tracking code is correct (case-sensitive)
3. Customer phone/email matches exactly what's in order
4. Database query returns all orders (no filters)

### Issue: Shipping label doesn't print properly
**Check**:
1. Browser print settings: disable margins
2. Paper size: A4 (210mm × 297mm)
3. Browser: Use Chrome/Firefox for best print quality
4. Check CSS media queries for print styles

---

## 💾 Data Persistence

### Database (Prisma)
- ✅ Real data source
- ✅ All order operations read/write here
- ✅ Supports full relational queries

### File System (db.json)
- ⚠️ Fallback only (for development)
- ✅ Demo data cleared (empty orders array)
- ⚠️ NOT used for production orders
- ⚠️ Do not commit real data here

---

## 📞 Maintenance Tasks

### Regular Tasks
- [ ] Check email delivery in notification logs
- [ ] Verify admin receives alerts consistently
- [ ] Monitor tracking code generation (uniqueness)
- [ ] Clear old tracking events periodically

### Before Deployment
- [ ] Set ADMIN_EMAIL env var
- [ ] Set RESEND_API_KEY env var
- [ ] Run order creation test
- [ ] Verify admin receives test email
- [ ] Test customer tracking search
- [ ] Test delivery option selection by emirate
- [ ] Print test shipping label

---

## 📚 Related Files Reference

```
Frontend
├── src/pages/Checkout.tsx (Delivery selection)
├── src/pages/TrackOrder.tsx (Customer search)
├── src/pages/admin/AdminOrderMonitoring.tsx (Admin view)
├── src/components/OrderDetails/ (All modal components)
├── src/services/api.ts (orderAPI calls)
└── src/store/orderStore.ts (Order state management)

Backend
├── backend/server.ts (Order endpoints)
├── backend/emailService.helpers.ts (Email functions)
├── backend/emailService.ts (Email service integration)
├── prisma/schema.prisma (Database schema)
└── backend/db.json (Development data - empty orders)

Configuration
├── .env (ADMIN_EMAIL, RESEND_API_KEY)
├── tsconfig.json
├── package.json
└── vite.config.ts
```

---

**Last Updated**: April 13, 2026  
**Version**: 1.0.0 - Production Ready
