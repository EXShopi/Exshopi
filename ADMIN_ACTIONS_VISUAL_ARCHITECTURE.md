# Admin Order Actions - Visual Architecture

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN USER INTERFACE                          │
│                                                                   │
│  Admin Orders → Select Order → Click Details                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ORDER DETAILS MODAL - Order #ord_123                    │   │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  Status: pending_confirmation                            │   │
│  │                                                           │   │
│  │  Timeline:                                                │   │
│  │  ├─ ✓ Order Placed (April 13, 12:00)                   │   │
│  │  └─ ○ Confirmed (waiting for action)                   │   │
│  │                                                           │   │
│  │  [✓ Confirmed] [✗ Packed] [✗ Shipped] [✗ Delivered]    │   │
│  │   Click!                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                       │
│                    [Show Spinner]                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND - OrderDetailsModal.tsx                    │
│                                                                   │
│  1. handleActionClick('confirmed')                              │
│  2. Validate: isStatusDisabled('confirmed') → false             │
│  3. Set: loadingStatus = 'confirmed'                            │
│  4. Map: confirmed → confirmed (or shipped → in_transit)       │
│  5. Call: onStatusChange(orderId: ord_123,                      │
│                          newStatus: 'confirmed')               │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            ADMIN COMPONENT - AdminOrderMonitoring.tsx            │
│                                                                   │
│  handleStatusChange(orderId, newStatus) {                       │
│    ↓                                                              │
│    await orderAPI.updateStatus(orderId, newStatus)              │
│  }                                                                │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  HTTP REQUEST   │
                    ├─────────────────┤
                    │ PUT /api/        │
                    │ orders/ord_123/  │
                    │ status           │
                    │                  │
                    │ { status:        │
                    │   "confirmed" }  │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND - server.ts:4409                            │
│                                                                   │
│  PUT /api/orders/:id/status                                     │
│  ├─ 1. Authenticate user                                       │
│  ├─ 2. Load order from database {id: ord_123}                 │
│  ├─ 3. Validate status ∈ OPERATIONAL_ORDER_STATUSES           │
│  ├─ 4. Check permission (admin OR order seller)               │
│  ├─ 5. Update order {status: 'confirmed'}                     │
│  ├─ 6. Save to Prisma/PostgreSQL                              │
│  ├─ 7. Create TrackingEvent:                                  │
│  │     {status: 'confirmed',                                  │
│  │      timestamp: 2026-04-13T12:05:00Z}                      │
│  ├─ 8. Send customer email:                                   │
│  │     "Your order is now confirmed!"                         │
│  ├─ 9. Record marketplace activity                            │
│  └─ 10. Return updated order JSON                             │
│                           ↓                                       │
│         { id: ord_123,                                          │
│           status: 'confirmed',                                  │
│           operationalStatus: 'confirmed',                       │
│           trackingEvents: [...],                               │
│           updatedAt: 2026-04-13T12:05:00Z }                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ HTTP RESPONSE   │
                    │ 200 OK          │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            FRONTEND - AdminOrderMonitoring.tsx                   │
│                                                                   │
│  In handleStatusChange:                                         │
│  ├─ Receive updated order object                              │
│  ├─ Call: syncUpdatedOrder(updated)                           │
│  │   → Updates React state with new order data                │
│  │   → Modal automatically re-renders                         │
│  └─ Log: ✓ Order updated to: confirmed                        │
│                           ↓                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND - OrderDetailsModal.tsx                    │
│                                                                   │
│  Then in catch block:                                            │
│  ├─ Clear: loadingStatus = null (hide spinner)                 │
│  ├─ Show toast:                                                │
│  │  { text: "Order successfully moved to confirmed! 🎉"       │
│  │    type: 'success' }                                        │
│  └─ Update button states:                                      │
│     (isStatusDisabled recalculates for new status)             │
│                           ↓                                       │
│  UI State Update:                                               │
│  ├─ [✗ Confirmed] → grayed/disabled                           │
│  ├─ [✓ Packed] → blue/enabled                                │
│  ├─ [✗ Shipped] → grayed/disabled                            │
│  └─ [✗ Delivered] → grayed/disabled                          │
│                                                                   │
│  Timeline Updates:                                              │
│  ├─ ✓ Order Placed (April 13, 12:00)                         │
│  └─ ✓ Confirmed (April 13, 12:05) ← NEW EVENT               │
│                           ↓                                       │
│  Toast appears:                                                 │
│  ┌─────────────────────────────────────────┐                  │
│  │ 🎉 Order successfully moved to          │                  │
│  │    confirmed!                           │                  │
│  │                                          │                  │
│  │  [Auto-dismiss after 3-4 seconds]       │                  │
│  └─────────────────────────────────────────┘                  │
│                                                                   │
│  Result:                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ORDER DETAILS MODAL - Order #ord_123                   │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │  Status: confirmed                                       │  │
│  │                                                          │  │
│  │  Timeline:                                               │  │
│  │  ├─ ✓ Order Placed (April 13, 12:00)                  │  │
│  │  └─ ✓ Confirmed (April 13, 12:05)                     │  │
│  │                                                          │  │
│  │  [✗ Confirmed] [✓ Packed] [✗ Shipped] [✗ Delivered]   │  │
│  │                 ↑ Now clickable!                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER SYSTEMS                                    │
│                                                                   │
│  1. Email Notification:                                         │
│     "Your order #ord_123 is now confirmed!"                    │
│     (From: backend/emailService.ts)                            │
│                           ↓                                       │
│  2. Customer Tracking Page (TrackOrder.tsx):                   │
│     Auto-updates to show new status                            │
│     (From: SSE or next page load)                              │
│                           ↓                                       │
│  3. Order Timeline:                                             │
│     ├─ ✓ Order Placed                                          │
│     └─ ✓ Confirmed (just now)                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Transition Diagram

```
                    ADMIN WORKFLOW
                    
                         ↓
              User lands on Admin → Orders
                         ↓
              Clicks "Details" on existing order
                         ↓
        ┌──────────────────────────────────────┐
        │   Order Loaded from Database          │
        │   status: pending_confirmation       │
        │   or: confirmed, packed, etc.         │
        └──────────────────────────────────────┘
                         ↓
        ╔══════════════════════════════════════╗
        ║        STATUS TRANSITION             ║
        ╚══════════════════════════════════════╝
                         ↓
         Decision: What status is order in?
                /        |        |        \
               /         |        |         \
        pending_    confirmed  packed    in_transit
        confirmation    |        |          |
           |            |        |          |
           ↓            ↓        ↓          ↓
        [✓ Conf]    [✗ Conf] [✗ Conf] [✗ Conf]
        [✗ Pack]    [✓ Pack] [✗ Pack] [✗ Pack]
        [✗ Ship]    [✗ Ship] [✓ Ship] [✗ Ship]
        [✗ Del]     [✗ Del]  [✗ Del]  [✓ Del]
           |            |        |          |
        Click!       Click!   Click!    Click!
        Conf          Pack     Ship       Del
           |____________|________|__________|
                         ↓
                    API Request
                         ↓
         Backend validates & updates DB
                         ↓
              ─────────────────────────
             / Success      or      Error \
            /                             \
           ↓                              ↓
        Show Green Toast            Show Red Toast
        Update Button States        Keep buttons same
        Refresh UI                  Log error
           ↓                              ↓
        Ready for next status        Ready to retry
        (e.g., Pack → Ship)          (e.g., try again)
```

---

## Component Hierarchy

```
AdminOrderMonitoring.tsx (Main Admin Page)
│
├─ State:
│  ├─ orders: Order[]
│  ├─ selectedOrder: Order (updated via syncUpdatedOrder)
│  └─ handlers: handleStatusChange()
│
└─ Renders OrderDetailsModal
   │
   └─ OrderDetailsModal.tsx
      │
      ├─ Props:
      │  ├─ order: Order
      │  ├─ onStatusChange: (id, status) → void
      │  └─ onClose: () => void
      │
      ├─ State:
      │  ├─ loadingStatus: string | null (shows spinner)
      │  ├─ toastMessage: { text, type } (shows notification)
      │  └─ activeTab: 'details' | 'shipping' | 'timeline'
      │
      ├─ Functions:
      │  ├─ getValidNextStatuses(currentStatus)
      │  ├─ isStatusDisabled(buttonStatus)
      │  └─ handleActionClick(action)
      │       └─ Calls: onStatusChange(order.id, backendStatus)
      │            └─ (wired from AdminOrderMonitoring)
      │
      ├─ Tabs:
      │  ├─ Details Tab
      │  ├─ Shipping Label Tab
      │  └─ Timeline Tab (shows tracking events)
      │
      ├─ Action Buttons:
      │  ├─ [Confirmed Button]
      │  │  ├─ Disabled? ← isStatusDisabled('confirmed')
      │  │  ├─ Loading? ← loadingStatus === 'confirmed'
      │  │  └─ onClick → handleActionClick('confirmed')
      │  │
      │  ├─ [Packed Button]
      │  ├─ [Shipped Button]
      │  └─ [Delivered Button]
      │
      └─ Toast Container (fixed position)
         └─ Renders if toastMessage exists
```

---

## File Access Map

```
User opens Admin → Orders interface
                    ↓
AdminOrderMonitoring.tsx loads
                    ↓
    Fetches orders from backend
                    ↓
  User clicks "Details" on order
                    ↓
OrderDetailsModal.tsx opens
                    ↓
   Displays action buttons
   (all initially disabled except first valid one)
                    ↓
 User clicks status button
                    ↓
handleActionClick fires
                    ↓
onStatusChange prop called
                    ↓
handleStatusChange in AdminOrderMonitoring
                    ↓
orderAPI.updateStatus() called
                    ↓
PUT /api/orders/:id/status sent to backend
                    ↓
backend/server.ts processes request
                    ↓
Prisma updates database
                    ↓
Response returns to frontend
                    ↓
syncUpdatedOrder() called
                    ↓
Modal re-renders with new status
                    ↓
Toast shows success/error
```

---

## Data Flow Round Trip

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React State)                                      │
│                                                             │
│ AdminOrderMonitoring.tsx:                                  │
│ ├─ orders: [                                               │
│ │   {                                                      │
│ │     id: 'ord_123',                                       │
│ │     status: 'pending_confirmation',                      │
│ │     ...other fields...                                   │
│ │   }                                                      │
│ │ ]                                                        │
│ │                                                          │
│ └─ selectedOrder: (same order from array)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    User clicks button
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ API REQUEST                                                 │
│                                                             │
│ PUT /api/orders/ord_123/status                             │
│ {                                                          │
│   status: 'confirmed'                                      │
│ }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (PostgreSQL via Prisma)                            │
│                                                             │
│ UPDATE orders SET                                          │
│   status = 'confirmed',                                    │
│   operationalStatus = 'confirmed',                         │
│   updatedAt = NOW()                                        │
│ WHERE id = 'ord_123'                                       │
│                                                             │
│ INSERT INTO trackingEvents                                 │
│   (orderId, status, timestamp)                             │
│ VALUES ('ord_123', 'confirmed', NOW())                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                │
│                                                             │
│ {                                                          │
│   id: 'ord_123',                                           │
│   status: 'confirmed',                  ← UPDATED          │
│   operationalStatus: 'confirmed',       ← UPDATED          │
│   deliveryTime: null,                                      │
│   timelineEvents: [                                        │
│     { status: 'pending_confirmation', ts: '...' },        │
│     { status: 'confirmed', ts: '2026-04-13T12:05:00Z' }   │
│   ]                                                        │
│ }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React State Updated)                             │
│                                                             │
│ syncUpdatedOrder(responseOrder) called                     │
│                                                             │
│ orders[0] = responseOrder  ← Database truth               │
│                                                             │
│ Modal auto re-renders with:                               │
│ ├─ New status displayed                                   │
│ ├─ New buttons enabled/disabled                           │
│ ├─ New timeline events shown                              │
│ └─ Green success toast displayed                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Flow Complete
            Ready for next status update
```

---

## Error Handling Flow

```
User clicks button
       ↓
Try to make API call
       ↓
    ┌─ API Call Success ────→ Show toast: ✅
    │                          Update UI
    │                          Continue
    │
    └─ API Call Fails:
         ├─ Network Error → Show toast: "Network error"
         ├─ 401 Unauthorized → Show toast: "Unauthorized"
         ├─ 400 Bad Request → Show toast: "Invalid status"
         ├─ 403 Forbidden → Show toast: "No permission"
         ├─ 404 Not Found → Show toast: "Order not found"
         ├─ 500 Server Error → Show toast: "Server error"
         └─ Other → Show toast: "Failed to update"
                     UI stays same
                     User can retry
```

---

## Deploy Verification Steps

```
✅ Production Ready Checklist
│
├─ Code Changes
│  ├─ OrderDetailsModal.tsx modified ✓
│  ├─ AdminOrderMonitoring.tsx modified ✓
│  └─ No other files changed ✓
│
├─ Build Status
│  ├─ npm run build passes ✓
│  ├─ No TypeScript errors ✓
│  ├─ No runtime warnings ✓
│  └─ Build time < 10s ✓
│
├─ Functionality
│  ├─ API calls made correctly ✓
│  ├─ Database updates saved ✓
│  ├─ Status transitions valid ✓
│  ├─ Toast notifications show ✓
│  └─ Loading states appear ✓
│
├─ UI/UX
│  ├─ Buttons disabled correctly ✓
│  ├─ Spinner shows during request ✓
│  ├─ Toast shows on complete ✓
│  ├─ Timeline updates ✓
│  └─ No console errors ✓
│
└─ Ready to deploy ✅

```

---

## Summary

**Component Chain**: Admin UI → Modal → Handler → API → Backend → DB → Response → State Update → Toast

**Data Journey**: Button Click → Validation → API Request → DB Updated → Response → UI Refresh → Notification

**Timeline**: Click → 0ms (validate) → 100ms (API sent) → 500ms-1s (backend processes) → 1-2s (UI updates) → 3-4s (toast dismisses)

All fully implemented, tested, and production-ready. ✅
