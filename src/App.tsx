import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteProgressBar } from "./components/ui/RouteProgressBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { SellerLayout } from "./layouts/SellerLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import GoogleServices from "./components/seo/GoogleServices";
import { useAuthBootstrap } from "./hooks";
import SEOHead from "./components/seo/SEOHead";
import { lazyWithRetry } from "./utils/lazyWithRetry";
import ProductDetail from "./pages/ProductDetail";
import Home from "./pages/Home";

const ProductListing = lazyWithRetry(() => import("./pages/ProductListing"), "route-product-listing");
const Cart = lazyWithRetry(() => import("./pages/Cart"), "route-cart");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "route-checkout");
const OrderSuccess = lazyWithRetry(() => import("./pages/OrderSuccess"), "route-order-success");
const Invoice = lazyWithRetry(() => import("./pages/Invoice"), "route-invoice");
const OrderTracking = lazyWithRetry(() => import("./pages/OrderTracking"), "route-order-tracking");
const VendorStorefront = lazyWithRetry(() => import("./pages/VendorStorefront"), "route-vendor-storefront");
const Support = lazyWithRetry(() => import("./pages/Support"), "route-support");
const Wishlist = lazyWithRetry(() => import("./pages/Wishlist"), "route-wishlist");
const Account = lazyWithRetry(() => import("./pages/Account"), "route-account");
const CategoryPage = lazyWithRetry(() => import("./pages/CategoryPage"), "route-category-page");
const About = lazyWithRetry(() => import("./pages/About").then((m) => ({ default: m.About })), "route-about");
const Contact = lazyWithRetry(() => import("./pages/Contact").then((m) => ({ default: m.Contact })), "route-contact");
const FAQ = lazyWithRetry(() => import("./pages/FAQ").then((m) => ({ default: m.FAQ })), "route-faq");
const SellOnExShopi = lazyWithRetry(() => import("./pages/SellOnExShopi"), "route-sell");
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"), "route-privacy");
const TermsConditions = lazyWithRetry(() => import("./pages/TermsConditions"), "route-terms");
const ReturnPolicy = lazyWithRetry(() => import("./pages/ReturnPolicy"), "route-return-policy");
const Warranty = lazyWithRetry(() => import("./pages/Warranty"), "route-warranty");
const BrandPage = lazyWithRetry(() => import("./pages/BrandPage"), "route-brand");
const PopularCollectionPage = lazyWithRetry(() => import("./pages/PopularCollectionPage"), "route-popular-collection");
const CampaignCollectionPage = lazyWithRetry(() => import("./pages/CampaignCollectionPage"), "route-campaign-collection");
const PromotionsPage = lazyWithRetry(() => import("./pages/PromotionsPage"), "route-promotions");
const TrackOrder = lazyWithRetry(() => import("./pages/TrackOrder"), "route-track-order");
const BlogIndex = lazyWithRetry(() => import("./pages/BlogIndex"), "route-blog-index");
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"), "route-blog-post");
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"), "route-landing");
const CustomerLogin = lazyWithRetry(() => import("./pages/auth/Login"), "route-customer-login");
const CustomerRegister = lazyWithRetry(() => import("./pages/auth/Register"), "route-customer-register");

const SellerDashboard = lazyWithRetry(() => import("./pages/seller/SellerDashboard"), "route-seller-dashboard");
const SellerProducts = lazyWithRetry(() => import("./pages/seller/SellerProducts"), "route-seller-products");
const SellerOrders = lazyWithRetry(() => import("./pages/seller/SellerOrders"), "route-seller-orders");
const SellerPayouts = lazyWithRetry(() => import("./pages/seller/SellerPayouts"), "route-seller-payouts");
const AddProduct = lazyWithRetry(() => import("./pages/seller/AddProduct"), "route-seller-add-product");
const SellerEarnings = lazyWithRetry(() => import("./pages/seller/Earnings"), "route-seller-earnings");
const SellerSettings = lazyWithRetry(() => import("./pages/seller/Settings"), "route-seller-settings");
const SellerSupport = lazyWithRetry(() => import("./pages/seller/Support"), "route-seller-support");
const SellerReviews = lazyWithRetry(() => import("./pages/seller/Reviews").then((m) => ({ default: m.SellerReviews })), "route-seller-reviews");
const SellerCommissions = lazyWithRetry(() => import("./pages/seller/Commissions"), "route-seller-commissions");
const SellerOffers = lazyWithRetry(() => import("./pages/seller/Offers"), "route-seller-offers");
const SellerLogin = lazyWithRetry(() => import("./pages/seller/Login").then((m) => ({ default: m.SellerLogin })), "route-seller-login");
const SellerRegister = lazyWithRetry(() => import("./pages/seller/Register").then((m) => ({ default: m.SellerRegister })), "route-seller-register");
const SellerForgotPassword = lazyWithRetry(() => import("./pages/seller/ForgotPassword").then((m) => ({ default: m.SellerForgotPassword })), "route-seller-forgot-password");
const SellerResetPassword = lazyWithRetry(() => import("./pages/seller/ResetPassword").then((m) => ({ default: m.SellerResetPassword })), "route-seller-reset-password");

const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"), "route-admin-dashboard");
const AdminApprovals = lazyWithRetry(() => import("./pages/admin/AdminApprovals"), "route-admin-approvals");
const AdminSellerManagement = lazyWithRetry(() => import("./pages/admin/AdminSellerManagement"), "route-admin-seller-management");
const AdminVendors = lazyWithRetry(() => import("./pages/admin/Vendors").then((m) => ({ default: m.AdminVendors })), "route-admin-vendors");
const AdminProducts = lazyWithRetry(() => import("./pages/admin/Products").then((m) => ({ default: m.AdminProducts })), "route-admin-products");
const AdminAddProduct = lazyWithRetry(() => import("./pages/admin/AddProduct"), "route-admin-add-product");
const AdminInventory = lazyWithRetry(() => import("./pages/admin/Inventory").then((m) => ({ default: m.AdminInventory })), "route-admin-inventory");
const AdminCommissions = lazyWithRetry(() => import("./pages/admin/Commissions").then((m) => ({ default: m.AdminCommissions })), "route-admin-commissions");
const AdminCategories = lazyWithRetry(() => import("./pages/admin/Categories").then((m) => ({ default: m.AdminCategories })), "route-admin-categories");
const AdminBanners = lazyWithRetry(() => import("./pages/admin/Banners").then((m) => ({ default: m.AdminBanners })), "route-admin-banners");
const AdminOffers = lazyWithRetry(() => import("./pages/admin/Offers").then((m) => ({ default: m.AdminOffers })), "route-admin-offers");
const AdminPayoutProcessing = lazyWithRetry(() => import("./pages/admin/AdminPayoutProcessing"), "route-admin-payouts");
const AdminOrderMonitoring = lazyWithRetry(() => import("./pages/admin/AdminOrderMonitoring"), "route-admin-orders");
const AdminCustomers = lazyWithRetry(() => import("./pages/admin/Customers").then((m) => ({ default: m.AdminCustomers })), "route-admin-customers");
const AdminReports = lazyWithRetry(() => import("./pages/admin/Reports").then((m) => ({ default: m.AdminReports })), "route-admin-reports");
const AdminReturns = lazyWithRetry(() => import("./pages/admin/Returns").then((m) => ({ default: m.AdminReturns })), "route-admin-returns");
const AdminSettings = lazyWithRetry(() => import("./pages/admin/Settings").then((m) => ({ default: m.AdminSettings })), "route-admin-settings");
const AdminSupport = lazyWithRetry(() => import("./pages/admin/Support").then((m) => ({ default: m.AdminSupport })), "route-admin-support");
const AdminLogin = lazyWithRetry(() => import("./pages/admin/Login").then((m) => ({ default: m.AdminLogin })), "route-admin-login");
const AdminForgotPassword = lazyWithRetry(() => import("./pages/admin/ForgotPassword").then((m) => ({ default: m.AdminForgotPassword })), "route-admin-forgot-password");
const AdminResetPassword = lazyWithRetry(() => import("./pages/admin/ResetPassword").then((m) => ({ default: m.AdminResetPassword })), "route-admin-reset-password");

function PageLoader() {
  const [showShell, setShowShell] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowShell(true), 2800);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="flex min-h-[30vh] items-start justify-center px-4 py-5 sm:py-8">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white">
            <img src="/logo.png" alt="ExShopi" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <p className="text-sm font-black leading-tight text-slate-900">Loading ExShopi...</p>
            <p className="text-xs font-semibold text-slate-500">Preparing your marketplace</p>
          </div>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="exshopi-loader-bar-fill h-full w-1/2 rounded-full bg-slate-900" />
        </div>
        <div className="space-y-3 bg-slate-50 p-4">
          {showShell ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {["Mobiles", "Laptops", "Cameras", "Fashion"].map((label) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center text-[10px] font-black text-slate-600">
                    {label}
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="h-4 w-24 rounded-full bg-slate-100" />
                <div className="mt-3 h-7 w-3/4 rounded-2xl bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100" />
              </div>
            </>
          ) : (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 overflow-hidden rounded-2xl bg-white">
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-slate-100 via-white to-slate-100" />
              </div>
            ))
          )}
          </div>
        </div>
      </div>
  );
}

function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash || "";

    if (!hash.includes("access_token") || !hash.includes("type=recovery")) return;
    if (location.pathname === "/admin/reset-password") return;
    if (location.pathname === "/seller/reset-password") return;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const next =
      hashParams.get("next") ||
      new URLSearchParams(window.location.search).get("next") ||
      "";

    if (next === "admin") {
      navigate(`/admin/reset-password${window.location.hash}`, { replace: true });
      return;
    }

    if (next === "seller") {
      navigate(`/seller/reset-password${window.location.hash}`, { replace: true });
      return;
    }

    if (location.pathname.startsWith("/seller")) {
      navigate(`/seller/reset-password${window.location.hash}`, { replace: true });
      return;
    }

    navigate(`/admin/reset-password${window.location.hash}`, { replace: true });
  }, [navigate, location.pathname]);

  return null;
}

function RouteDebugLogger() {
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info('[route] navigate', location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location.hash, location.pathname, location.search]);

  return null;
}

function NotFound() {
  return (
    <>
      <SEOHead
        title="Page Not Found | ExShopi"
        description="This page is not available on ExShopi."
        pathname={typeof window !== "undefined" ? window.location.pathname : "/404"}
        noindex={true}
        canonicalUrl={typeof window !== "undefined" ? `${window.location.origin}/404` : "https://exshopi.com/404"}
      />
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-black text-slate-900">Page not found</h1>
          <p className="mt-4 text-slate-500 font-semibold">
            The page you requested is unavailable or may have moved.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  // App-level auth bootstrap: restore session before route guards evaluate
  useAuthBootstrap();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;

      if (e.key === "exshopi:product-deleted") {
        try {
          console.debug("[sync] product-deleted storage event", e.newValue);
        } catch {
          //
        }
        window.location.reload();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      <GoogleServices />
      <PasswordRecoveryRedirect />
      <RouteDebugLogger />
      <RouteProgressBar />
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:identifier" element={<ProductDetail />} />
            <Route path="/:category/:subcategory/:identifier" element={<ProductDetail />} />
            <Route path="/electronics" element={<CategoryPage />} />
            <Route path="/electronics/:subcategory" element={<CategoryPage />} />
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
            <Route path="/sell-on-exshopi" element={<SellOnExShopi />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/brands/:brand" element={<BrandPage />} />
            <Route path="/popular/:slug" element={<PopularCollectionPage />} />
            <Route path="/campaigns/current" element={<CampaignCollectionPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/buy-iphone-uae" element={<LandingPage />} />
            <Route path="/refurbished-laptops-uae" element={<LandingPage />} />
            <Route path="/cheap-macbook-dubai" element={<LandingPage />} />
            <Route path="/electronics-online-uae" element={<LandingPage />} />
            <Route path="/saudi-arabia" element={<LandingPage />} />
            <Route path="/ksa" element={<LandingPage />} />
            <Route path="/buy-used-laptops-in-saudi-arabia" element={<LandingPage />} />
            <Route path="/category/laptops" element={<Navigate to="/category/electronics/laptops" replace />} />
            <Route path="/category/computers" element={<Navigate to="/category/electronics/computers" replace />} />
            <Route path="/category/pc" element={<Navigate to="/category/electronics/pc" replace />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
            <Route path="/vendors" element={<VendorStorefront />} />
            <Route path="/deals" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            
            {/* SEO Redirects: Old category paths to new canonical paths */}
            <Route path="/mobiles" element={<Navigate to="/category/mobiles" replace />} />
            <Route path="/laptops" element={<Navigate to="/category/electronics/laptops" replace />} />
            <Route path="/computers" element={<Navigate to="/category/electronics/computers" replace />} />
            <Route path="/pc" element={<Navigate to="/category/electronics/pc" replace />} />
            <Route path="/tablets" element={<Navigate to="/category/tablets" replace />} />
            <Route path="/accessories" element={<Navigate to="/category/accessories" replace />} />
            <Route path="/gaming" element={<Navigate to="/category/gaming" replace />} />
            <Route path="/games" element={<Navigate to="/category/gaming" replace />} />
          </Route>

          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
          <Route path="/seller/reset-password" element={<SellerResetPassword />} />

          <Route element={<SellerLayout />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/products/add" element={<AddProduct />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/payouts" element={<SellerPayouts />} />
            <Route path="/seller/earnings" element={<SellerEarnings />} />
            <Route path="/seller/settings" element={<SellerSettings />} />
            <Route path="/seller/support" element={<SellerSupport />} />
            <Route path="/seller/reviews" element={<SellerReviews />} />
            <Route path="/seller/commissions" element={<SellerCommissions />} />
            <Route path="/seller/offers" element={<SellerOffers />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            <Route path="/admin/sellers" element={<AdminSellerManagement />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/add" element={<AdminAddProduct />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/orders" element={<AdminOrderMonitoring />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/payouts" element={<AdminPayoutProcessing />} />
            <Route path="/admin/order-monitoring" element={<Navigate to="/admin/orders" replace />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/support" element={<AdminSupport />} />
          </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
