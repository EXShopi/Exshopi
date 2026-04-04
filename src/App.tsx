import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteProgressBar } from "./components/ui/RouteProgressBar";
import { OrbitLoader } from "./components/ui/OrbitLoader";
import Layout from "./components/Layout";
import { SellerLayout } from "./layouts/SellerLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import ProductDetail from "./pages/ProductDetail";

const Home = lazy(() => import("./pages/Home"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Invoice = lazy(() => import("./pages/Invoice"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const VendorStorefront = lazy(() => import("./pages/VendorStorefront"));
const Support = lazy(() => import("./pages/Support"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const Contact = lazy(() => import("./pages/Contact").then((m) => ({ default: m.Contact })));
const FAQ = lazy(() => import("./pages/FAQ").then((m) => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const Warranty = lazy(() => import("./pages/Warranty"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const PopularCollectionPage = lazy(() => import("./pages/PopularCollectionPage"));
const CampaignCollectionPage = lazy(() => import("./pages/CampaignCollectionPage"));
const PromotionsPage = lazy(() => import("./pages/PromotionsPage"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));

const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerPayouts = lazy(() => import("./pages/seller/SellerPayouts"));
const AddProduct = lazy(() => import("./pages/seller/AddProduct"));
const SellerEarnings = lazy(() => import("./pages/seller/Earnings"));
const SellerSettings = lazy(() => import("./pages/seller/Settings"));
const SellerSupport = lazy(() => import("./pages/seller/Support"));
const SellerReviews = lazy(() => import("./pages/seller/Reviews").then((m) => ({ default: m.SellerReviews })));
const SellerCommissions = lazy(() => import("./pages/seller/Commissions"));
const SellerOffers = lazy(() => import("./pages/seller/Offers"));
const SellerLogin = lazy(() => import("./pages/seller/Login").then((m) => ({ default: m.SellerLogin })));
const SellerRegister = lazy(() => import("./pages/seller/Register").then((m) => ({ default: m.SellerRegister })));
const SellerForgotPassword = lazy(() => import("./pages/seller/ForgotPassword").then((m) => ({ default: m.SellerForgotPassword })));
const SellerResetPassword = lazy(() => import("./pages/seller/ResetPassword").then((m) => ({ default: m.SellerResetPassword })));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminApprovals = lazy(() => import("./pages/admin/AdminApprovals"));
const AdminSellerManagement = lazy(() => import("./pages/admin/AdminSellerManagement"));
const AdminVendors = lazy(() => import("./pages/admin/Vendors").then((m) => ({ default: m.AdminVendors })));
const AdminProducts = lazy(() => import("./pages/admin/Products").then((m) => ({ default: m.AdminProducts })));
const AdminAddProduct = lazy(() => import("./pages/admin/AddProduct"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory").then((m) => ({ default: m.AdminInventory })));
const AdminCommissions = lazy(() => import("./pages/admin/Commissions").then((m) => ({ default: m.AdminCommissions })));
const AdminCategories = lazy(() => import("./pages/admin/Categories").then((m) => ({ default: m.AdminCategories })));
const AdminBanners = lazy(() => import("./pages/admin/Banners").then((m) => ({ default: m.AdminBanners })));
const AdminOffers = lazy(() => import("./pages/admin/Offers").then((m) => ({ default: m.AdminOffers })));
const AdminPayoutProcessing = lazy(() => import("./pages/admin/AdminPayoutProcessing"));
const AdminOrderMonitoring = lazy(() => import("./pages/admin/AdminOrderMonitoring"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers").then((m) => ({ default: m.AdminCustomers })));
const AdminReports = lazy(() => import("./pages/admin/Reports").then((m) => ({ default: m.AdminReports })));
const AdminReturns = lazy(() => import("./pages/admin/Returns").then((m) => ({ default: m.AdminReturns })));
const AdminSettings = lazy(() => import("./pages/admin/Settings").then((m) => ({ default: m.AdminSettings })));
const AdminSupport = lazy(() => import("./pages/admin/Support").then((m) => ({ default: m.AdminSupport })));
const AdminLogin = lazy(() => import("./pages/admin/Login").then((m) => ({ default: m.AdminLogin })));
const AdminForgotPassword = lazy(() => import("./pages/admin/ForgotPassword").then((m) => ({ default: m.AdminForgotPassword })));
const AdminResetPassword = lazy(() => import("./pages/admin/ResetPassword").then((m) => ({ default: m.AdminResetPassword })));

function PageLoader() {
  return (
    <div className="flex min-h-[46vh] items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <OrbitLoader label="Loading page..." size={24} />
            <div className="h-10 w-4/5 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-5 w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="h-5 w-3/4 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 w-44 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'exshopi:product-deleted') {
        try {
          // other tabs: reload to reflect deletions
          console.debug('[sync] product-deleted storage event', e.newValue);
        } catch (err) {
          /* ignore */
        }
        // full reload ensures product lists refresh across tabs
        window.location.reload();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <BrowserRouter>
      <RouteProgressBar />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:identifier" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/invoice/:orderId" element={<Invoice />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/order-tracking/:trackingCode" element={<OrderTracking />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/vendor" element={<VendorStorefront />} />
            <Route path="/vendor/:storeSlug" element={<VendorStorefront />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/brands/:brand" element={<BrandPage />} />
            <Route path="/popular/:slug" element={<PopularCollectionPage />} />
            <Route path="/campaigns/current" element={<CampaignCollectionPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
            <Route path="/vendors" element={<VendorStorefront />} />
            <Route path="/deals" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
          </Route>

          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
          <Route path="/seller/reset-password" element={<SellerResetPassword />} />
          <Route element={<SellerLayout />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/products/add" element={<AddProduct />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/earnings" element={<SellerEarnings />} />
            <Route path="/seller/payouts" element={<SellerPayouts />} />
            <Route path="/seller/settings" element={<SellerSettings />} />
            <Route path="/seller/store-settings" element={<SellerSettings />} />
            <Route path="/seller/support" element={<SellerSupport />} />
            <Route path="/seller/reviews" element={<SellerReviews />} />
            <Route path="/seller/commissions" element={<SellerCommissions />} />
            <Route path="/seller/offers" element={<SellerOffers />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
            <Route path="/admin/sellers" element={<AdminSellerManagement />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/add" element={<AdminAddProduct />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/payouts" element={<AdminPayoutProcessing />} />
            <Route path="/admin/orders" element={<AdminOrderMonitoring />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/support" element={<AdminSupport />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
