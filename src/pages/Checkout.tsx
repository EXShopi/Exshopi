import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Check,
  Home,
} from "lucide-react";
import { useCartStore } from "../store/cart";
import { useOrderStore } from "../store/orders";
import { codAPI, orderAPI, userAPI } from "../services/api";
import { formatAED } from "../lib/currency";
import { useAuthStore } from "../store/auth";
import AuthService from "../lib/authService";
import {
  describeFirebasePhoneVerificationError,
  isFirebasePhoneVerificationEnabled,
  isFirebasePhoneVerificationSupportedOnCurrentOrigin,
  isValidUaePhone,
  normalizeUaePhone,
  resetFirebasePhoneVerification,
  sendFirebasePhoneCode,
  shouldFallbackToBackendOtp,
  verifyFirebasePhoneCode,
} from "../lib/firebasePhoneVerification";

const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const authUser = useAuthStore((state) => state.user);
  const authRole = useAuthStore((state) => state.role);
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const phoneVerificationSupported = isFirebasePhoneVerificationSupportedOnCurrentOrigin();
  const useFirebaseOtp = phoneVerificationSupported && isFirebasePhoneVerificationEnabled();
  const allowDevOtpFallback = import.meta.env.DEV;
  const [authChecked, setAuthChecked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState("");
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [otpProvider, setOtpProvider] = useState<"firebase" | "backend">(
    useFirebaseOtp ? "firebase" : "backend"
  );

  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    // Step 1: Customer Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Step 2: Shipping
    address: "",
    city: "Dubai",
    area: "",
    building: "",
    landmark: "",
    postalCode: "",
    // Step 3: Shipping Method
    shippingMethod: "standard",
    // Step 4: Payment
    paymentMethod: "cod",
  });

  const total = useMemo(() => getCartTotal(), [getCartTotal, items]);
  const shippingFee = form.shippingMethod === "express" ? 25 : 12;
  const vatAmount = Math.round(total * 0.05);
  const totalPayable = total + shippingFee + vatAmount;
  const useBackendOtp = otpProvider === "backend" && allowDevOtpFallback;

  useEffect(() => {
    return () => {
      resetFirebasePhoneVerification();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const ensureCustomerSession = async () => {
      const currentUserId = authUser?.id || authUser?.uid || "";
      const currentRole = authRole || null;

      if (currentUserId && currentRole === "customer") {
        if (mounted) setAuthChecked(true);
        return;
      }

      const restored = await AuthService.restoreSession().catch(() => null);
      if (!mounted) return;

      if (restored?.user?.id) {
        setUser({
          id: restored.user.id,
          uid: restored.user.id,
          email: restored.user.email || "",
          name: restored.user.name || restored.user.fullName || restored.user.displayName || "",
          fullName: restored.user.fullName || restored.user.name || restored.user.displayName || "",
          displayName: restored.user.displayName || restored.user.name || restored.user.fullName || "",
          phone: restored.user.phone || "",
          status: restored.user.status || "active",
          country: restored.user.country || "AE",
          sellerApplicationStatus: restored.user.sellerApplicationStatus || null,
        });
        setRole((restored.role as any) || "customer");
        setAccessToken(restored.accessToken || null);

        if (restored.role === "customer") {
          setAuthChecked(true);
          return;
        }
      }

      navigate("/login", {
        replace: true,
        state: {
          from: location,
          reason: "checkout_requires_customer_login",
        },
      });
    };

    ensureCustomerSession();

    return () => {
      mounted = false;
    };
  }, [authRole, authUser?.id, authUser?.uid, location, navigate, setAccessToken, setRole, setUser]);

  useEffect(() => {
    if (!authChecked || !authUser?.id) return;

    let mounted = true;
    userAPI
      .get(authUser.id)
      .then((user) => {
        if (!mounted || !user) return;
        const parts = String(user.name || user.fullName || authUser.displayName || '').trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ');

        setForm((current) => ({
          ...current,
          firstName: current.firstName || firstName,
          lastName: current.lastName || lastName,
          email: current.email || user.email || authUser.email || '',
          phone: current.phone || user.phone || authUser.phone || '',
        }));
      })
      .catch(() => {
        if (!mounted) return;
        const parts = String(authUser.name || authUser.fullName || authUser.displayName || '').trim().split(/\s+/);
        setForm((current) => ({
          ...current,
          firstName: current.firstName || parts[0] || '',
          lastName: current.lastName || parts.slice(1).join(' '),
          email: current.email || authUser.email || '',
          phone: current.phone || authUser.phone || '',
        }));
      });

    return () => {
      mounted = false;
    };
  }, [authChecked, authUser]);

  useEffect(() => {
    if (!otpResendAvailableAt) {
      setOtpCooldownSeconds(0);
      return;
    }

    const syncCooldown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(otpResendAvailableAt).getTime() - Date.now()) / 1000)
      );
      setOtpCooldownSeconds(remaining);
    };

    syncCooldown();
    const timer = window.setInterval(syncCooldown, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendAvailableAt]);

  const mapOtpError = (error: unknown, phase: "send" | "verify") => {
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code.trim()
        : "";
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "";
    const raw = [code, message].filter(Boolean).join(" ").trim();
    const normalized = raw.toLowerCase();

    if (!raw || normalized === "not found" || normalized.includes("/api/cod/otp")) {
      return "Phone verification is temporarily unavailable. Refresh the page and try again.";
    }
    if (normalized.includes("customer only") || normalized.includes("unauthorized") || normalized.includes("forbidden")) {
      return "Please sign in to your customer account to continue COD verification.";
    }
    if (normalized.includes("valid uae phone")) {
      return "Enter a valid UAE phone number before requesting OTP.";
    }
    if (normalized.includes("wait before requesting another otp")) {
      return "Please wait a moment before requesting another OTP.";
    }
    if (normalized.includes("otp session not found")) {
      return "This OTP session expired or could not be found. Request a new OTP and try again.";
    }
    if (normalized.includes("invalid otp")) {
      return "The OTP code is incorrect. Please check the code and try again.";
    }
    if (normalized.includes("otp expired")) {
      return "Your OTP has expired. Request a new code to continue.";
    }
    if (normalized.includes("too many otp attempts")) {
      return "Too many OTP attempts. Please request a new code.";
    }
    if (normalized.includes("cod blocked for this")) {
      return raw;
    }
    if (normalized.includes("request and enter the verification code first")) {
      return "Request the verification code first, then enter it here.";
    }
    if (normalized.includes("firebase phone verification is not configured")) {
      return "Firebase phone verification is not configured yet for this environment.";
    }
    if (normalized.includes("auth/invalid-phone-number")) {
      return "Enter a valid UAE mobile number before requesting verification.";
    }
    if (normalized.includes("auth/too-many-requests")) {
      return "Too many verification attempts. Please wait and try again.";
    }
    if (normalized.includes("auth/unauthorized-domain")) {
      return "This domain is not authorized in Firebase yet. Add localhost, exshopi.com, and www.exshopi.com in Firebase Authentication settings.";
    }
    if (normalized.includes("auth/invalid-app-credential") || normalized.includes("auth/app-not-authorized")) {
      return "Firebase phone verification is blocked for this app right now. Restart the frontend and check your Firebase app config and authorized domains.";
    }
    if (normalized.includes("auth/quota-exceeded")) {
      return "Firebase SMS quota has been reached for this project. Wait or upgrade the Firebase plan.";
    }
    if (normalized.includes("auth/invalid-verification-code")) {
      return "The verification code is incorrect. Please try again.";
    }
    if (normalized.includes("auth/code-expired")) {
      return "The verification code expired. Request a new code and try again.";
    }
    if (normalized.includes("auth/captcha-check-failed")) {
      return "Phone verification could not start. Refresh the page and try again.";
    }
    if (
      normalized.includes("auth/internal-error") ||
      normalized.includes("recaptchaparams") ||
      normalized.includes("app verification")
    ) {
      return "Phone verification could not start securely. Refresh the page and try again.";
    }
    if (normalized.includes("auth/invalid-app-credential")) {
      return "Phone verification could not start. Please refresh the page and try again.";
    }
    if (normalized.includes("auth/network-request-failed")) {
      return "Network error while contacting phone verification. Check your connection and try again.";
    }
    if (
      normalized.includes("requires localhost or https") ||
      normalized.includes("operation-not-supported-in-this-environment")
    ) {
      return "Phone verification works only on localhost or an HTTPS domain. Your current LAN HTTP URL is not supported by Firebase phone auth.";
    }

    return phase === "send"
      ? "We couldn't send the verification code right now. Please try again."
      : "We couldn't verify the code. Please try again.";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "phone") {
      setOtpVerified(false);
      setOtpSessionId("");
      setOtpCode("");
      setOtpMessage("");
      setOtpError("");
      setOtpResendAvailableAt("");
      setOtpCooldownSeconds(0);
      setOtpProvider(useFirebaseOtp ? "firebase" : allowDevOtpFallback ? "backend" : "firebase");
      resetFirebasePhoneVerification();
    }
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(form.firstName && form.lastName && form.email && isValidUaePhone(form.phone));
    }
    if (step === 2) {
      return !!(form.address && form.city && form.area && form.building);
    }
    if (step === 3) {
      return !!form.shippingMethod;
    }
    if (step === 4) {
      return form.paymentMethod === "cod" && otpVerified;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      alert("Please fill all required fields");
    }
  };

  const handleSendOtp = async () => {
    try {
      if (!authChecked || !authUser?.id || authRole !== "customer") {
        setOtpError("Please sign in to your customer account before phone verification.");
        return;
      }
      if (!form.email || !isValidUaePhone(form.phone)) {
        setOtpError("Enter a valid UAE phone number and email before requesting verification.");
        return;
      }
      setSendingOtp(true);
      setOtpError("");
      const normalizedPhone = normalizeUaePhone(form.phone);

      if (useFirebaseOtp) {
        try {
          const response = await sendFirebasePhoneCode(normalizedPhone, "checkout-firebase-recaptcha");
          setOtpProvider("firebase");
          setOtpSessionId(`firebase:${response.phone}`);
          setOtpResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
          setOtpMessage(`Verification code sent to ${response.phone}. Enter the 6-digit code to continue your COD order.`);
          return;
        } catch (firebaseError) {
          const firebaseDetails = describeFirebasePhoneVerificationError(firebaseError);
          if (import.meta.env.DEV) {
            console.error("[Checkout OTP] Firebase send failed:", firebaseDetails, firebaseError);
          }

          if (!shouldFallbackToBackendOtp(firebaseError)) {
            throw firebaseError;
          }

          setOtpMessage("Switching to development OTP verification for this local checkout session.");
        }
      }

      if (!allowDevOtpFallback) {
        throw new Error("Phone verification is unavailable right now. Please try again later.");
      }

      const response = await codAPI.sendOtp({
        phone: normalizedPhone,
        email: form.email,
      });
      setOtpProvider("backend");
      setOtpSessionId(response.sessionId);
      setOtpResendAvailableAt(response.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
      const fallbackOtpHint = import.meta.env.DEV && response.otpCode ? ` Verification code: ${response.otpCode}.` : "";
      setOtpMessage(`Verification code sent to ${response.phone}. Enter the 6-digit code to continue your COD order.${fallbackOtpHint}`);
    } catch (error: any) {
      setOtpError(mapOtpError(error, "send"));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!otpSessionId || !otpCode) {
        setOtpError("Request and enter the verification code first.");
        return;
      }
      setVerifyingOtp(true);
      setOtpError("");
      if (otpProvider === "firebase") {
        const response = await verifyFirebasePhoneCode(otpCode);
        const verifiedPhone = normalizeUaePhone(response.phone);
        if (verifiedPhone !== normalizeUaePhone(form.phone)) {
          throw new Error("Verified phone does not match the checkout number.");
        }
        setOtpSessionId(`firebase:${verifiedPhone}`);
        setOtpVerified(true);
        setOtpError("");
        setOtpMessage("Phone verification complete. Your COD order is ready.");
      } else {
        const response = await codAPI.verifyOtp({
          sessionId: otpSessionId,
          code: otpCode,
        });
        const verifiedPhone = normalizeUaePhone(response.phone);
        if (verifiedPhone !== normalizeUaePhone(form.phone)) {
          throw new Error("Verified phone does not match the checkout number.");
        }
        setOtpSessionId(response.verificationToken);
        setOtpVerified(true);
        setOtpError("");
        setOtpMessage("Phone verification complete. Your COD order is ready.");
      }
    } catch (error: any) {
      setOtpVerified(false);
      setOtpError(mapOtpError(error, "verify"));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      alert("Please complete the COD verification step.");
      return;
    }

    try {
      setIsProcessing(true);

      // Create orders for each unique seller in cart (robustly handle sellerId or seller name)
      const ordersBySellerMap = new Map<string, any[]>();
      items.forEach((item: any) => {
        const sellerKey =
          item.sellerId || item.seller || item.vendor || item.storeId || "exshopi_official";
        if (!ordersBySellerMap.has(sellerKey)) {
          ordersBySellerMap.set(sellerKey, []);
        }
        ordersBySellerMap.get(sellerKey)!.push(item);
      });

      const createdOrders: any[] = [];

      // Create an order for each seller
      for (const [sellerId, sellerItems] of ordersBySellerMap) {
        const sellerShippingCost = form.shippingMethod === "express" ? 25 : 12;
        const created = await orderAPI.create({
          sellerId,
          items: sellerItems.map((item: any) => {
            const parts = String(item.id).split('::');
            const productId = parts[0];
            const variantId = parts[1] || undefined;
            const variant = item.variants && item.variants.length ? item.variants[0] : undefined;
            return {
              productId,
              variantId,
              quantity: item.quantity,
              unitPrice: item.salePrice || variant?.price || item.price,
              sku: item.sku || variant?.sku,
              image: item.image || variant?.image,
            };
          }),
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email,
          customerPhone: normalizeUaePhone(form.phone),
          verificationToken: otpSessionId,
          shippingCost: sellerShippingCost,
          shippingAddress: {
            emirate: form.city,
            area: form.area,
            building: form.building,
            flat: '',
            landmark: form.landmark,
            addressLine: form.address,
            method: form.shippingMethod,
          },
          paymentMethod: "cod",
        });
        createdOrders.push(created);
      }

      const primaryOrder = createdOrders[0];
      createOrder(
        items,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        {
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: "UAE",
        },
        {
          method: "cod",
          status: "pending",
        },
        {
          subtotal: total,
          shipping: shippingFee,
          vat: vatAmount,
          discount: 0,
          total: totalPayable,
        }
      );

      // Clear cart and redirect to success
      clearCart();
      navigate(primaryOrder?.trackingCode ? `/order-success?tracking=${primaryOrder.trackingCode}` : "/order-success");
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-black text-slate-900">No items to checkout</h1>
          <p className="mt-4 text-slate-500 font-semibold">
            Your cart is empty. Add products before continuing to checkout.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="mx-auto max-w-[1200px]">
        {/* Back Button */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        {/* Step Indicators */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <button
                  onClick={() => currentStep >= step && setCurrentStep(step)}
                  disabled={currentStep < step}
                  className={`flex items-center justify-center h-12 w-12 rounded-full font-bold transition-all ${
                    step < currentStep
                      ? "bg-emerald-500 text-white"
                      : step === currentStep
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    step
                  )}
                </button>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      step < currentStep ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-600 px-2">
            <span>Customer Info</span>
            <span>Shipping</span>
            <span>Method</span>
            <span>Payment</span>
            <span>Review</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              {/* Step 1: Customer Info */}
              {currentStep === 1 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <User className="h-8 w-8 text-blue-600" />
                    Your Information
                  </h2>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          First Name *
                        </label>
                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          placeholder="John"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          Last Name *
                        </label>
                        <input
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          placeholder="Doe"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-900">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-900">
                        Phone Number *
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+971 50 123 4567"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="mt-2 text-xs font-semibold text-slate-500">UAE mobile verification is required before COD order confirmation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-blue-600" />
                    Shipping Address
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-900">
                        Full Address *
                      </label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Street address, building, etc."
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          Emirate *
                        </label>
                        <select
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          <option>Dubai</option>
                          <option>Abu Dhabi</option>
                          <option>Sharjah</option>
                          <option>Ajman</option>
                          <option>Ras Al Khaimah</option>
                          <option>Fujairah</option>
                          <option>Umm Al Quwain</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          Area *
                        </label>
                        <input
                          name="area"
                          value={form.area}
                          onChange={handleChange}
                          placeholder="Al Barsha, Deira, Khalidiya..."
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          Building / Villa *
                        </label>
                        <input
                          name="building"
                          value={form.building}
                          onChange={handleChange}
                          placeholder="Building 9, Villa 14, Tower B"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          Landmark
                        </label>
                        <input
                          name="landmark"
                          value={form.landmark}
                          onChange={handleChange}
                          placeholder="Near Metro, Opposite Mall..."
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Shipping Method */}
              {currentStep === 3 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    Shipping Method
                  </h2>

                  <div className="space-y-3">
                    {[
                      {
                        id: "standard",
                        name: "Standard UAE Delivery",
                        desc: "ExShopi COD route • 2-4 business days",
                        price: "AED 12",
                      },
                      {
                        id: "express",
                        name: "Priority UAE Delivery",
                        desc: "Faster COD route • 1-2 business days",
                        price: "AED 25",
                      },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className="relative flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all hover:border-blue-400"
                        style={{
                          borderColor:
                            form.shippingMethod === method.id
                              ? "rgb(37, 99, 235)"
                              : "rgb(226, 232, 240)",
                        }}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={form.shippingMethod === method.id}
                          onChange={handleChange}
                          className="h-4 w-4"
                        />
                        <div className="ml-4 flex-1">
                          <p className="font-bold text-slate-900">{method.name}</p>
                          <p className="text-sm text-slate-600">{method.desc}</p>
                        </div>
                        <span className="font-bold text-slate-900">{method.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Payment Method */}
              {currentStep === 4 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Smartphone className="h-8 w-8 text-blue-600" />
                    COD Verification
                  </h2>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    {!authChecked && (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                        Restoring your checkout session...
                      </div>
                    )}
                    {authChecked && (!authUser?.id || authRole !== "customer") && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                        Sign in first. COD verification and order placement require a customer account.
                      </div>
                    )}
                    {authChecked && authUser?.id && authRole === "customer" && useBackendOtp && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                        Using development OTP verification for this local checkout session.
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-lg font-black text-slate-900">Cash on Delivery</p>
                        <p className="mt-1 text-sm font-medium text-slate-600">Pay on Delivery in AED. ExShopi requires UAE phone verification before the order is sent to sellers.</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Total Payable</p>
                        <p className="mt-1 text-2xl font-black text-emerald-900">{formatAED(totalPayable)}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">Phone Verification</label>
                        <div className="flex gap-3">
                          <input
                            value={otpCode}
                            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || !otpSessionId || otpCode.trim().length < 6}
                            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {verifyingOtp ? "Verifying..." : "Verify Code"}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || otpCooldownSeconds > 0 || !authChecked || !authUser?.id || authRole !== "customer"}
                        className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {sendingOtp ? "Sending..." : otpCooldownSeconds > 0 ? `Resend in ${otpCooldownSeconds}s` : "Send Code"}
                      </button>
                    </div>

                    {otpMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {otpMessage}
                      </div>
                    )}

                    {otpError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                        {otpError}
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Delivery Charges</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{formatAED(shippingFee)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">VAT</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{formatAED(vatAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Verification</p>
                        <p className={`mt-2 text-xl font-black ${otpVerified ? "text-emerald-600" : "text-slate-900"}`}>
                          {otpVerified ? "Verified" : "Required"}
                        </p>
                        {!otpVerified && otpSessionId && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Code sent to {normalizeUaePhone(form.phone)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div id="checkout-firebase-recaptcha" />
                  </div>
                </div>
              )}

              {/* Step 5: Review Order */}
              {currentStep === 5 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Check className="h-8 w-8 text-blue-600" />
                    Review Your Order
                  </h2>

                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="mb-4 font-bold text-slate-900">
                        Customer Information
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>
                          <span className="font-semibold text-slate-900">
                            {form.firstName} {form.lastName}
                          </span>
                        </p>
                        <p>{form.email}</p>
                        <p>{form.phone}</p>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="mb-4 font-bold text-slate-900">
                        Shipping Address
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>{form.address}</p>
                        <p>
                          {form.building}, {form.area}, {form.city}, AE
                        </p>
                        {form.landmark && <p>Landmark: {form.landmark}</p>}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="mb-4 font-bold text-slate-900">
                        Order Items
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-slate-600">
                              {item.title} x {item.quantity}
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatAED(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="mb-4 font-bold text-slate-900">COD Summary</h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Payment Method</span>
                          <span className="font-bold text-slate-900">Cash on Delivery</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Charges</span>
                          <span className="font-bold text-slate-900">{formatAED(shippingFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT</span>
                          <span className="font-bold text-slate-900">{formatAED(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-3">
                          <span className="font-bold text-slate-900">Total Payable on Delivery</span>
                          <span className="font-black text-slate-900">{formatAED(totalPayable)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                {currentStep < 5 && (
                  <button
                    onClick={handleNextStep}
                    className="ml-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {currentStep === 5 && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="ml-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Place Order
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl">
              <h3 className="mb-8 text-xl font-black">Order Summary</h3>

              <div className="mb-6 space-y-4 max-h-64 overflow-y-auto pb-6 border-b border-white/10">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-semibold line-clamp-1">{item.title}</p>
                      <p className="text-white/60 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold ml-2 whitespace-nowrap">
                      {formatAED(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Subtotal</span>
                  <span>{formatAED(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Shipping</span>
                  <span className="font-bold">{formatAED(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">VAT (5%)</span>
                  <span>{formatAED(vatAmount)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold">Total</span>
                  <span className="text-3xl font-black">{formatAED(totalPayable)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  COD protected by UAE phone OTP
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Truck className="h-4 w-4" />
                  Pay on delivery across UAE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
