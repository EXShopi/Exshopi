# 🚀 ExShopi Quick Links

## Customer Panel
- **Home**: [http://localhost:5176](http://localhost:5176)
- **Products**: [http://localhost:5176/products](http://localhost:5176/products)
- **Cart**: [http://localhost:5176/cart](http://localhost:5176/cart)
- **Wishlist**: [http://localhost:5176/wishlist](http://localhost:5176/wishlist)
- **Order Tracking**: [http://localhost:5176/order-tracking](http://localhost:5176/order-tracking)

## 🏪 Seller Panel
- **Dashboard**: [http://localhost:5176/seller/dashboard](http://localhost:5176/seller/dashboard)
- **Add Product**: [http://localhost:5176/seller/add-product](http://localhost:5176/seller/add-product)
- **My Products**: [http://localhost:5176/seller/products](http://localhost:5176/seller/products)
- **My Orders**: [http://localhost:5176/seller/orders](http://localhost:5176/seller/orders)
- **Payouts**: [http://localhost:5176/seller/payouts](http://localhost:5176/seller/payouts)

## 👨‍💼 Admin Panel
- **Dashboard**: [http://localhost:5176/admin/dashboard](http://localhost:5176/admin/dashboard)
- **Approvals**: [http://localhost:5176/admin/approvals](http://localhost:5176/admin/approvals)
- **Sellers**: [http://localhost:5176/admin/sellers](http://localhost:5176/admin/sellers)
- **Orders**: [http://localhost:5176/admin/orders](http://localhost:5176/admin/orders)
- **Payouts**: [http://localhost:5176/admin/payouts](http://localhost:5176/admin/payouts)

---

## How to Access

### Option 1: Direct URL (Fastest)
Copy the link above and paste in your browser address bar

### Option 2: From Navigation
1. Visit home page: `http://localhost:5176`
2. Click on any menu item to navigate

### Option 3: Add to Navbar
Edit [src/components/Navbar.tsx](src/components/Navbar.tsx) to add direct links to seller/admin panels

---

## Quick Start

### Start the Development Server
```bash
cd "/Applications/ExShopi 25"
npm run dev
```

This will start both:
- **Frontend** (Vite): http://localhost:5176
- **Backend** (Express): http://localhost:3001

### Test Seller Features
1. Go to [/seller/dashboard](http://localhost:5176/seller/dashboard)
2. Add a new product at [/seller/add-product](http://localhost:5176/seller/add-product)
3. View products at [/seller/products](http://localhost:5176/seller/products)

### Test Admin Features
1. Go to [/admin/dashboard](http://localhost:5176/admin/dashboard)
2. Approve products at [/admin/approvals](http://localhost:5176/admin/approvals)
3. Manage sellers at [/admin/sellers](http://localhost:5176/admin/sellers)

---

## API Backend
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001 (should show "ExShopi Backend Running")

