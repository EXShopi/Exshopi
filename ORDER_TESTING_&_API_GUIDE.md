# ExShopi Order Management - API Integration & Testing Guide

## 🔄 Complete Order Flow (End-to-End)

```
CUSTOMER JOURNEY:
1. Browse products → 2. Add to cart → 3. Checkout
   ↓
4. Enter delivery address, select delivery type (Same Day OR Standard UAE)
   ↓
5. Enter phone number
   ↓
6. Receive OTP, verify phone
   ↓
7. Select payment (COD only)
   ↓
8. Click "Place Order"
   ↓
   POST /api/orders/create
   ├─ Save to Prisma DB
   ├─ Create OrderItems
   ├─ Generate tracking code
   ├─ Create TrackingEvent (initial)
   └─ Send admin email
   ↓
9. Show OrderSuccess page with tracking code
   ↓
10. Customer goes to "Track Order" page
    ├─ Enter Order ID / Tracking Code / Phone / Email
    ├─ Search finds order
    └─ Redirect to order tracking details
    ↓

ADMIN JOURNEY:
1. Go to admin panel "Orders" section
   ↓
2. See list of real orders (real-time SSE updates)
   ↓
3. Click Details button on order
   ↓
   Show OrderDetailsModal with:
   ├─ Overview tab (customer, items, pricing)
   ├─ Timeline tab (order progression)
   └─ Label tab (printable shipping label)
   ↓
4. Print shipping label or manage order status
   ↓
5. Click action buttons (Confirm, Pack, Ship, Deliver)
   ↓
   [Future: Wire to status update endpoints]
   ├─ Update order status
   ├─ Create TrackingEvent
   └─ Optionally send notification
```

---

## 🛠️ Testing Scenarios

### Scenario 1: Same Day Delivery (Dubai)
**Precondition**: Customer in Dubai

**Steps**:
1. Go to Checkout
2. Enter delivery address → Select Dubai emirate
3. Should see "Same Day Delivery" option (AED 25) ✅
4. Should see "Standard UAE Delivery" option (AED 15) ✅
5. Select Same Day
6. Select payment method (COD)
7. Enter phone number
8. Verify OTP
9. Click "Place Order"

**Expected Results**:
- Order created with `deliveryType: "Same Day Delivery"` ✅
- Order appears in admin panel within 1-2 seconds ✅
- Admin receives email with subject: "🛒 New Order Received – ExShopi (Order #XXXX)" ✅
- Email includes: "Delivery Type: Same Day Delivery" ✅
- Customer sees OrderSuccess page with tracking code ✅
- Customer can search order on TrackOrder page ✅

---

### Scenario 2: Standard Delivery (Ras Al Khaimah)
**Precondition**: Customer in RAK

**Steps**:
1. Go to Checkout
2. Enter delivery address → Select Ras Al Khaimah emirate
3. Should NOT see "Same Day Delivery" option ❌
4. Should only see "Standard UAE Delivery" option (AED 15) ✅
5. Select Standard
6. Select payment method (COD)
7. Enter phone number
8. Verify OTP
9. Click "Place Order"

**Expected Results**:
- Only Standard option visible (Same Day grayed out/hidden) ✅
- Order created with `deliveryType: "Standard UAE Delivery"` ✅
- Shipping cost 15 AED (not 25) ✅
- Email shows: "Delivery Type: Standard UAE Delivery" ✅

---

### Scenario 3: Admin Order Details
**Precondition**: At least one real order in system

**Steps**:
1. Go to Admin → Orders
2. See list of orders
3. Click "Details" on any order

**Expected Results**:
- OrderDetailsModal opens ✅
- Shows Overview tab with:
  - Customer name, email, phone ✅
  - Seller name ✅
  - Order ID, Tracking Code ✅
  - Items with quantity × price ✅
  - Subtotal, VAT, Delivery Fee, Total ✅
  - Commission breakdown ✅
  - Payment Status, Delivery Type ✅
- No raw objects rendered ✅
- Timeline tab shows status progression ✅
- Label tab shows printable label ✅

---

### Scenario 4: Customer Tracking Search
**Precondition**: Order placed with real data

**Test Case 1: Search by Order ID**
```
Input: "ORD883862NJOF"
Expected: Order found → Redirect to tracking details ✅
```

**Test Case 2: Search by Tracking Code**
```
Input: "46QOKP3H09MB"
Expected: Order found → Redirect to tracking details ✅
```

**Test Case 3: Search by Phone**
```
Input: "+971501234567"
Expected: Order found → Redirect to tracking details ✅
Behavior: If multiple orders → Show first match
```

**Test Case 4: Search by Email**
```
Input: "customer@example.com"
Expected: Order found → Redirect to tracking details ✅
```

**Test Case 5: Invalid Search**
```
Input: "INVALID12345"
Expected: Error message displayed ✅
Text: "Order not found. Please double-check your Order ID..."
```

---

### Scenario 5: Email Notification Verification
**Precondition**: ADMIN_EMAIL env var set, order placed

**Steps**:
1. Complete order on checkout
2. Wait 2-3 seconds
3. Check admin email inbox

**Expected Email Content**:
```
From: orders@exshopi.com (Resend)
To: ahsansajid295@gmail.com
Subject: 🛒 New Order Received – ExShopi (Order #XXXX)

Body should contain:
- Order ID: ORD883862NJOF ✅
- Customer Name: [Full name] ✅
- Phone: +971501234567 ✅
- Email: customer@example.com ✅
- Delivery Address: [Full formatted address] ✅
- Emirate: Dubai ✅
- Items: "2 × Product Title - 999.00 AED" ✅
- Subtotal: 1,998.00 AED ✅
- Delivery Fee: 15.00 AED or 25.00 AED ✅
- VAT: Calculated amount ✅
- Total: Grand total ✅
- Payment Method: COD (Cash on Delivery) ✅
- Delivery Type: Same Day Delivery OR Standard UAE Delivery ✅
- Order Date: ISO timestamp ✅
- CTA Link: https://exshopi.com/admin/orders?search=ORD883862NJOF ✅
```

---

### Scenario 6: Shipping Label Printing
**Precondition**: Order open in admin details modal

**Steps**:
1. Click on "Label" tab in OrderDetailsModal
2. Click "Print Label" button
3. Browser print dialog opens
4. Set paper size to A4
5. Disable margins
6. Print

**Expected Output**:
```
A4 Page containing:
- ExShopi Logo/Branding ✅
- "DISPATCH LABEL" header ✅
- Order ID: ORD883862NJOF ✅
- Tracking Code: 46QOKP3H09MB ✅
- [Barcode area placeholder] ✅
- From: ExShopi (seller address) ✅
- To: [Customer name, address] ✅
- Items: [List with quantities] ✅
- Total: [Grand total] ✅
- Delivery Type: [Same Day/Standard] ✅
- Payment Status: Pending (COD) ✅
- Dispatch Date: [Today] ✅
- Notes: [Any special handling] ✅
- Cleanly formatted, professional appearance ✅
- No raw JSON ✅
```

---

## 📊 API Calls Reference

### Order Creation
```typescript
// Called from: src/pages/Checkout.tsx
// Method: POST
// URL: /api/orders/create

Request Body:
{
  customerId: "customer_123",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "+971501234567",
  
  sellerId: "seller_123",
  
  items: [
    {
      productId: "prod_123",
      title: "Product Name",
      quantity: 2,
      unitPrice: 999,
      subtotal: 1998,
      vatAmount: 150
    }
  ],
  
  subtotal: 1998,
  vatAmount: 150,
  totalAmount: 2163,
  deliveryFee: 15,
  paymentMethod: "COD",
  
  shippingAddress: {
    addressLine: "123 Main St",
    building: "Unit 10",
    area: "Downtown Dubai",
    emirate: "Dubai",
    city: "Dubai",
    zipCode: "12345",
    country: "UAE"
  },
  
  deliveryType: "Standard UAE Delivery" or "Same Day Delivery",
  shippingCost: 15 or 25
}

Response:
{
  success: true,
  orderId: "ord_1774699883862",
  orderNumber: "ORD883862NJOF",
  trackingCode: "46QOKP3H09MB",
  message: "Order created successfully"
}
```

### Get All Orders
```typescript
// Called from: src/pages/admin/AdminOrderMonitoring.tsx
// Method: GET
// URL: /api/orders

Response: Array<Order>
[
  {
    id: "ord_1774699883862",
    orderNumber: "ORD883862NJOF",
    customerId: "customer1",
    customerName: "John Doe",
    customerPhone: "+971501234567",
    customerEmail: "john@example.com",
    
    sellerId: "seller_123",
    sellerName: "My Store",
    
    items: [...],
    subtotal: 1998,
    vatAmount: 150,
    deliveryFee: 15,
    totalAmount: 2163,
    commission: 0,
    
    paymentMethod: "COD",
    paymentStatus: "pending",
    
    deliveryType: "Standard UAE Delivery",
    operationalStatus: "pending",
    
    trackingCode: "46QOKP3H09MB",
    shippingAddress: {...},
    
    trackingEvents: [
      {
        id: "evt_1",
        status: "placed",
        timestamp: "2026-03-28T12:11:23.862Z",
        location: "Dubai",
        notes: "Order placed"
      }
    ],
    
    createdAt: "2026-03-28T12:11:23.862Z",
    updatedAt: "2026-03-28T12:11:23.862Z"
  }
]
```

### Real-Time Order Updates (SSE)
```typescript
// Called from: src/pages/admin/AdminOrderMonitoring.tsx
// Connection: EventSource to /api/orders/updates

Received Events:
{
  type: "ORDER_CREATED",
  data: {...order}
}

{
  type: "ORDER_UPDATED",
  data: {...updatedOrder}
}

{
  type: "TRACKING_EVENT_ADDED",
  data: {...trackingEvent}
}
```

---

## ✅ Validation Checklist

### Before Go-Live
- [ ] Test order creation with both delivery types
- [ ] Verify Same Day only shows for Dubai/Sharjah/Ajman
- [ ] Test admin receives 3+ sample order emails
- [ ] Confirm email includes all fields
- [ ] Test customer search finds orders
- [ ] Test with invalid order search
- [ ] Print test shipping labels (5+ samples)
- [ ] Verify no raw objects in any UI
- [ ] Check all timestamps are correct
- [ ] Verify tracking code is unique per order
- [ ] Test OTP flow still works
- [ ] Confirm db.json has no fake demo data
- [ ] Test on mobile (checkout + tracking)
- [ ] Test on desktop browsers (Chrome, Firefox, Safari)
- [ ] Verify status timeline shows correct progression
- [ ] Check financial breakdowns are accurate

### Ongoing Monitoring
- [ ] Email delivery rate (target: 100%)
- [ ] Email delivery latency (target: <5 seconds)
- [ ] Search success rate (target: 100% for valid data)
- [ ] Page load performance (admin modal, tracking)
- [ ] Print label rendering on different devices
- [ ] Order creation success rate (target: 100%)

---

## 🔐 Security Considerations

### Data Privacy
- ✅ Phone numbers shown only in admin & order details
- ✅ Email addresses shown only where needed
- ✅ Passwords never logged or transmitted
- ✅ Order tracking available to customer only with exact ID/code/phone/email

### API Security
- ✅ All POST /api/orders/create requires auth (already implemented)
- ✅ GET /api/orders requires admin role
- ✅ Tracking operations only show relevant data to requester

### Email Security
- ✅ Admin email should use strong password
- ✅ RESEND_API_KEY should be in .env (not committed)
- ✅ Email IP allowlisting recommended

---

## 🚀 Performance Optimization

### Current Implementation
- Real-time SSE for admin updates (no polling)
- Indexed searches for orders (ID, tracking code)
- Batch email sending (not per-item)
- Lazy loading of order details

### Recommended Future Improvements
- Cache order list with Redis (15-second TTL)
- Index customer phone/email for faster search
- Batch print labels (generate PDF for 10+ orders)
- Archive old orders (>1 year) to separate table

---

## 📋 Deployment Checklist

```bash
# 1. Environment Variables
echo "ADMIN_EMAIL=ahsansajid295@gmail.com" >> .env
echo "RESEND_API_KEY=re_xxxxxxxxxxxx" >> .env

# 2. Database Migrations (if needed)
npx prisma migrate deploy

# 3. Build Frontend
npm run build

# 4. Start Server
npm start

# 5. Test Sample Order
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{...order_payload...}'

# 6. Verify Email Received
# Check admin inbox for test order email

# 7. Go Live!
# All systems operational ✅
```

---

## 📞 Troubleshooting Guide

| Issue | Symptom | Solution |
|-------|---------|----------|
| Email not sent | No email in inbox | Check ADMIN_EMAIL, RESEND_API_KEY, see server logs |
| Delivery type wrong | Wrong AED amount in order | Verify `deliveryType` value matches backend mapping |
| Search doesn't find order | "Order not found" error | Confirm order in DB, check phone format |
| Label print fails | Prints incorrectly | Set margin to 0, paper to A4, use Chrome |
| Admin modal crashes | White screen error | Check order data in browser DevTools, missing fields |
| Same Day appears in non-Dubai | Should be hidden | Verify emirate value matches exactly: 'Dubai' |

---

**Last Updated**: April 13, 2026  
**Status**: Ready for Testing & Deployment ✅
