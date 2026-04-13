# ⚡ Admin Order Actions - Quick Reference Card

## 30-Second Summary
Admin clicks button → API Call → DB Update → Toast Shows → UI Updates ✅

---

## Developer Checklist (5 Minutes)

- [ ] `order.id` exists (real, not fake)
- [ ] Click button → spinner appears
- [ ] Network tab shows `PUT /api/orders/{id}/status`
- [ ] Toast appears: "Order successfully moved to..."
- [ ] Next button becomes enabled

---

## Code Quick Lookup

| What | Where | Line |
|------|-------|------|
| Status validation | `OrderDetailsModal.tsx` | 80-110 |
| Button rendering | `OrderDetailsModal.tsx` | 410-430 |
| Handler function | `AdminOrderMonitoring.tsx` | 473-495 |
| Modal integration | `AdminOrderMonitoring.tsx` | 847-849 |
| Backend endpoint | `backend/server.ts` | 4409 |

---

## Status Map (Frontend → Backend)

```
"confirmed" → "confirmed"
"packed" → "packed"
"shipped" → "in_transit"     ← Maps to different backend value!
"delivered" → "delivered"
```

---

## Valid Transitions

```
pending_confirmation
    ↓
[Confirmed] → confirmed
    ↓
[Packed] → packed
    ↓
[Shipped] → in_transit
    ↓
[Delivered] → delivered
    ↓
(No more transitions)
```

---

## API Call Format

```http
PUT /api/orders/ord_123/status
Authorization: Bearer token
Content-Type: application/json

{ "status": "confirmed" }

← Returns: { id, status, operationalStatus, trackingEvents, ... }
```

---

## What Backend Does

1. ✅ Validates status
2. ✅ Checks permission
3. ✅ Updates DB
4. ✅ Creates TrackingEvent
5. ✅ Sends email
6. ✅ Returns order

---

## Testing Command

```bash
bash verify-admin-actions.sh
```

Should show all ✅ checks passing.

---

## Real Order Test

```
1. Place order through checkout
2. Admin → Orders → Details
3. Click "Confirmed"
4. See: Toast + button update + timeline change
5. Click "Packed"
6. Repeat until "Delivered"
```

---

## Debug Console

```javascript
// Check order has ID
console.log(order.id)

// Check handler is wired
console.log(!!onStatusChange)

// Check button state
console.log(isStatusDisabled('confirmed'))

// Manual API test
fetch('/api/orders/ord_123/status', {
  method: 'PUT',
  body: JSON.stringify({ status: 'confirmed' }),
  headers: { 'Content-Type': 'application/json' }
})
```

---

## Success Signs

- ✅ Spinner shows 1-2 seconds
- ✅ Green toast appears
- ✅ Buttons updatestate
- ✅ Timeline adds event
- ✅ Customer gets email

---

## Error Signs

- ❌ No spinner
- ❌ No API request in Network tab
- ❌ Red error toast
- ❌ Console shows error
- ❌ Button doesn't change state

---

## Critical Files (Read These)

1. **Setup Guide**: `ADMIN_ORDER_ACTIONS_SETUP.md`
2. **Implementation**: `ADMIN_ACTIONS_IMPLEMENTATION_COMPLETE.md`
3. **Frontend**: `src/components/OrderDetails/OrderDetailsModal.tsx`
4. **Admin Page**: `src/pages/admin/AdminOrderMonitoring.tsx`

---

## One-Command Test

```bash
npm run dev && echo "✓ Server running - go to Admin → Orders → test buttons"
```

---

## Status Code: READY ✅
- Build: ✓ Passing
- Tests: ✓ Passing
- Verified: ✓ All checks pass
- Docs: ✓ Complete
- Production: ✓ Ready
