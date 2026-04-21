import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { codAPI, orderAPI, productAPI, userAPI } from "../services/api";
import { formatCurrencyForCountry } from "../lib/currency";
import { useAuthStore } from "../store/auth";
import AuthService from "../lib/authService";
import {
  canAttemptFirebasePhoneVerification,
  describeFirebasePhoneVerificationError,
  getFirebasePhoneVerificationRuntimeInfo,
  getReadableFirebasePhoneVerificationError,
  isFirebasePhoneVerificationSupportedOnCurrentOrigin,
  resetFirebasePhoneVerification,
  sendFirebasePhoneCode,
  verifyFirebasePhoneCode,
} from "../lib/firebasePhoneVerification";
import {
  calculateVat,
  getCountryConfig,
  getProductCountryPrice,
  getShippingOption,
  isValidPhoneForCountry,
  normalizePhoneForCountry,
} from "../lib/countryConfig";
import { useCountryStore } from "../store/country";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getCartTotal, clearCart } = useCartStore();
  const removeCartItem = useCartStore((state) => state.removeItem);
  const { createOrder } = useOrderStore();
  const authUser = useAuthStore((state) => state.user);
  const authRole = useAuthStore((state) => state.role);
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const phoneVerificationSupported = isFirebasePhoneVerificationSupportedOnCurrentOrigin();
  const useFirebaseOtp = canAttemptFirebasePhoneVerification();
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
  const [otpProvider, setOtpProvider] = useState<"firebase" | "backend">("firebase");
  const [pageError, setPageError] = useState("");
  const sendOtpLockRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const selectedCity = useCountryStore((state) => state.selectedCity);
  const selectedShippingOption = useCountryStore((state) => state.selectedShippingOption);
  const setCitySelection = useCountryStore((state) => state.setCity);
  const setShippingSelection = useCountryStore((state) => state.setShippingOption);
  const country = getCountryConfig(selectedCountry);
  const activeShipping = getShippingOption(selectedCountry, selectedShippingOption);
  const shippingOptions = country.shippingOptions.map((option) => getShippingOption(selectedCountry, option.id));

  const [form, setForm] = useState({
    // Step 1: Customer Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Step 2: Shipping
    address: "",
    city: selectedCity,
    area: "",
    building: "",
    landmark: "",
    postalCode: "",
    // Step 3: Delivery Method
    deliveryType: activeShipping.id,
    // Step 4: Payment
    paymentMethod: "cod",
  });

  const total = useMemo(
    () => items.reduce((sum, item) => sum + getProductCountryPrice(item, selectedCountry) * item.quantity, 0),
    [items, selectedCountry]
  );
  const shippingFee = activeShipping.fee;
  const vatAmount = Math.round(calculateVat(total, selectedCountry));
  const totalPayable = total + shippingFee + vatAmount;

  useEffect(() => {
    console.info("[checkout] mounted", {
      itemCount: items.length,
      phoneVerificationSupported,
      useFirebaseOtp,
      ...getFirebasePhoneVerificationRuntimeInfo(),
    });
  }, [items.length, phoneVerificationSupported, useFirebaseOtp]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      city: selectedCity,
      deliveryType: activeShipping.id,
    }));
  }, [activeShipping.id, selectedCity]);

  useEffect(() => {
    let active = true;

    const syncUnavailableCheckoutItems = async () => {
      if (!items.length) return;

      try {
        const liveProducts = await productAPI.getAll();
        if (!active) return;

        const liveIds = new Set(
          (liveProducts || []).flatMap((product: any) => [String(product.id || ''), String(product.slug || '')]).filter(Boolean)
        );

        const unavailableItems = items.filter(
          (item) => !liveIds.has(String(item.id)) && !liveIds.has(String(item.slug || ''))
        );

        if (!unavailableItems.length) return;

        unavailableItems.forEach((item) => removeCartItem(item.id));
        setPageError("Some unavailable products were removed from your cart before checkout.");
      } catch (error) {
        console.warn("[checkout] unavailable item sync failed", error);
      }
    };

    syncUnavailableCheckoutItems();

    return () => {
      active = false;
    };
  }, [items, removeCartItem]);

  useEffect(() => {
    return () => {
      resetFirebasePhoneVerification();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const ensureCustomerSession = async () => {
      try {
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
      } catch (sessionError) {
        console.error("[checkout] session restore failed", sessionError);
        if (!mounted) return;
        setPageError("We couldn't restore your checkout session. Please refresh and sign in again.");
      }
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
    if (normalized.includes("missing env vars:")) {
      return raw;
    }
    if (normalized.includes("customer only") || normalized.includes("unauthorized") || normalized.includes("forbidden")) {
      return "Please sign in to your customer account to continue COD verification.";
    }
    if (normalized.includes("valid uae phone")) {
      return `Enter a valid ${country.shortName} phone number before requesting OTP.`;
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
      return `Enter a valid ${country.shortName} phone number.`;
    }
    if (normalized.includes("auth/too-many-requests")) {
      return "Too many attempts. Please wait.";
    }
    if (normalized.includes("auth/billing-not-enabled")) {
      return "Firebase billing issue. Contact support.";
    }
    if (normalized.includes("auth/operation-not-allowed")) {
      return "Firebase phone sign-in is not enabled for this project yet.";
    }
    if (normalized.includes("auth/unauthorized-domain")) {
      return "This domain is not authorized in Firebase yet. Add exshopi-frontend.onrender.com, exshopi.onrender.com, exshopi.com, www.exshopi.com, and localhost in Firebase Authentication settings.";
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
      return "Refresh the page and try again.";
    }
    if (normalized.includes("auth/internal-error")) {
      return "Firebase phone verification failed internally. Refresh the page and try again.";
    }
    if (
      normalized.includes("recaptchaparams") ||
      normalized.includes("app verification")
    ) {
      return "Phone verification could not start securely. Refresh the page and try again.";
    }
    if (normalized.includes("auth/invalid-app-credential")) {
      return "Phone verification could not start. Please refresh the page and try again.";
    }
    if (normalized.includes("auth/network-request-failed")) {
      return "Check your internet connection.";
    }
    if (
      normalized.includes("requires localhost or https") ||
      normalized.includes("operation-not-supported-in-this-environment")
    ) {
      return "Phone verification works only on localhost or an HTTPS domain. Your current LAN HTTP URL is not supported by Firebase phone auth.";
    }

    const readable = getReadableFirebasePhoneVerificationError(raw);
    if (readable && readable !== raw) {
      return readable;
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
      setOtpProvider("firebase");
      resetFirebasePhoneVerification();
    }
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(form.firstName && form.lastName && form.email && isValidPhoneForCountry(form.phone, selectedCountry));
    }
    if (step === 2) {
      return !!(form.address && form.city && form.area && form.building);
    }
    if (step === 3) {
      return !!form.deliveryType;
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
    if (sendOtpLockRef.current) {
      console.info("[checkout] send-code skipped because a request is already in flight");
      return;
    }

    try {
      if (!authChecked || !authUser?.id || authRole !== "customer") {
        setOtpError("Please sign in to your customer account before phone verification.");
        return;
      }
      if (!form.email || !isValidPhoneForCountry(form.phone, selectedCountry)) {
        setOtpError(`Enter a valid ${country.shortName} phone number and email before requesting verification.`);
        return;
      }

      sendOtpLockRef.current = true;
      setSendingOtp(true);
      setOtpError("");
      setOtpMessage("");
      const normalizedPhone = normalizePhoneForCountry(form.phone, selectedCountry);
      console.info("[checkout] send-code requested", {
        ...getFirebasePhoneVerificationRuntimeInfo(),
        phone: normalizedPhone,
      });
      if (selectedCountry === "AE") {
        const response = await sendFirebasePhoneCode(normalizedPhone, "checkout-firebase-recaptcha");
        setOtpProvider("firebase");
        setOtpSessionId(`firebase:${response.phone}`);
        setOtpResendAvailableAt(new Date(Date.now() + 60 * 1000).toISOString());
        setOtpMessage(`Verification code sent to ${response.phone}. Enter the 6-digit code to continue your COD order.`);
      } else {
        const response = await codAPI.sendOtp({
          phone: normalizedPhone,
          email: form.email,
          country: selectedCountry,
        } as any);
        setOtpProvider("backend");
        setOtpSessionId(response.sessionId);
        setOtpResendAvailableAt(response.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
        setOtpMessage(`Verification code sent to ${response.phone}. Enter the 6-digit code to continue your COD order.`);
      }
    } catch (error: any) {
      console.error("[checkout] send-code failed", {
        ...getFirebasePhoneVerificationRuntimeInfo(),
        error: describeFirebasePhoneVerificationError(error),
      });
      setOtpError(mapOtpError(error, "send"));
    } finally {
      sendOtpLockRef.current = false;
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
        const verifiedPhone = normalizePhoneForCountry(response.phone, selectedCountry);
        if (verifiedPhone !== normalizePhoneForCountry(form.phone, selectedCountry)) {
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
        const verifiedPhone = normalizePhoneForCountry(response.phone, selectedCountry);
        if (verifiedPhone !== normalizePhoneForCountry(form.phone, selectedCountry)) {
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

  const resolveCanonicalSellerGroups = async () => {
    const grouped = new Map<string, any[]>();
    const productCache = new Map<string, any>();

    for (const item of items) {
      const [baseProductId] = String(item.id || '').split('::');
      const currentSellerId = String(item.sellerId || '').trim();
      let canonicalSellerId = currentSellerId;

      if (!canonicalSellerId && baseProductId) {
        let product = productCache.get(baseProductId);
        if (!product) {
          product = await productAPI.get(baseProductId);
          productCache.set(baseProductId, product);
        }

        canonicalSellerId = String(product?.sellerId || product?.storeId || '').trim();
      }

      if (!canonicalSellerId) {
        throw new Error(`We could not determine the seller for "${item.title}". Please refresh the cart and try again.`);
      }

      if (!grouped.has(canonicalSellerId)) {
        grouped.set(canonicalSellerId, []);
      }

      grouped.get(canonicalSellerId)!.push({
        ...item,
        sellerId: canonicalSellerId,
      });
    }

    return grouped;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      alert("Please complete the COD verification step.");
      return;
    }

    try {
      setIsProcessing(true);
      setPageError("");
      const ordersBySellerMap = await resolveCanonicalSellerGroups();

      const createdOrders: any[] = [];

      // Create an order for each seller
      for (const [sellerId, sellerItems] of ordersBySellerMap) {
        const sellerShippingCost = activeShipping.fee;
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
              unitPrice: getProductCountryPrice(item, selectedCountry),
              sku: item.sku || variant?.sku,
              image: item.image || variant?.image,
            };
          }),
          customerName: `${form.firstName} ${form.lastName}`.trim(),
          customerEmail: form.email,
          customerPhone: normalizePhoneForCountry(form.phone, selectedCountry),
          verificationToken: otpSessionId,
          shippingCost: sellerShippingCost,
          deliveryType: activeShipping.label,
          shippingAddress: {
            emirate: selectedCountry === 'AE' ? form.city : '',
            area: form.area,
            building: form.building,
            flat: '',
            landmark: form.landmark,
            addressLine: form.address,
            method: form.deliveryType,
            city: form.city,
            district: form.area,
            street: form.address,
            buildingNumber: form.building,
            postalCode: form.postalCode,
            country: selectedCountry,
          },
          paymentMethod: "cod",
          deliveryCountry: selectedCountry,
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
          country: country.name,
        },
        {
          method: "cod",
          status: "pending",
        },
        {
          subtotal: total,
          shipping: shippingFee,
          vat: vatAmount,
          currency: country.currency,
          taxRate: country.vatRate,
          discount: 0,
          total: totalPayable,
        }
      );

      // Clear cart and redirect to success
      clearCart();
      navigate(primaryOrder?.trackingCode ? `/order-success?tracking=${primaryOrder.trackingCode}` : "/order-success");
    } catch (error: any) {
      console.error("Order creation failed:", error);
      const message = "We could not place your order right now. Please try again.";
      setPageError(message);
      alert(message);
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
        {pageError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {pageError}
          </div>
        ) : null}

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
                          placeholder={selectedCountry === 'AE' ? '+971 50 123 4567' : '+966 5X XXX XXXX'}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="mt-2 text-xs font-semibold text-slate-500">{country.shortName} mobile verification is required before COD order confirmation.</p>
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
                        {country.addressLabels.address} *
                      </label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder={selectedCountry === 'AE' ? 'Street address, building, etc.' : 'Street name'}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.city} *
                        </label>
                        <select
                          name="city"
                          value={form.city}
                          onChange={(event) => {
                            handleChange(event);
                            setCitySelection(event.target.value);
                          }}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          {country.cities.map((city) => (
                            <option key={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.area} *
                        </label>
                        <input
                          name="area"
                          value={form.area}
                          onChange={handleChange}
                          placeholder={selectedCountry === 'AE' ? 'Al Barsha, Deira, Khalidiya...' : 'Al Olaya, Al Rawdah, Al Malqa...'}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.building} *
                        </label>
                        <input
                          name="building"
                          value={form.building}
                          onChange={handleChange}
                          placeholder={selectedCountry === 'AE' ? 'Building 9, Villa 14, Tower B' : 'Building 24'}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.landmark}
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

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-900">
                        {country.addressLabels.postalCode}
                      </label>
                      <input
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                        placeholder={selectedCountry === 'AE' ? 'Optional postal code' : '12345'}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Delivery Method */}
              {currentStep === 3 && (
                <div>
                  <h2 className="mb-8 text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Truck className="h-8 w-8 text-blue-600" />
                    Delivery Method
                  </h2>

                  {form.city && (
                    <p className="mb-6 text-sm text-slate-600">
                      <span className="font-semibold">Delivery to:</span> {form.city}
                    </p>
                  )}

                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className="relative flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all hover:border-blue-400"
                        style={{
                          borderColor:
                            form.deliveryType === option.id
                              ? "rgb(37, 99, 235)"
                              : "rgb(226, 232, 240)",
                        }}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value={option.id}
                          checked={form.deliveryType === option.id}
                          onChange={(event) => {
                            handleChange(event);
                            setShippingSelection(option.id);
                          }}
                          className="h-4 w-4"
                        />
                        <div className="ml-4 flex-1">
                          <p className="font-bold text-slate-900">{option.label}</p>
                          <p className="text-sm text-slate-600">{option.eta}</p>
                        </div>
                        <span className="font-bold text-blue-600">{formatCurrencyForCountry(option.fee, selectedCountry)}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    <p><span className="font-semibold">Note:</span> {activeShipping.description}</p>
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
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-lg font-black text-slate-900">Cash on Delivery</p>
                        <p className="mt-1 text-sm font-medium text-slate-600">Pay on delivery in {country.currency}. ExShopi requires {country.shortName} phone verification before the order is sent to sellers.</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Total Payable</p>
                        <p className="mt-1 text-2xl font-black text-emerald-900">{formatCurrencyForCountry(totalPayable, selectedCountry)}</p>
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
                        <p className="mt-2 text-xl font-black text-slate-900">{formatCurrencyForCountry(shippingFee, selectedCountry)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">VAT</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{formatCurrencyForCountry(vatAmount, selectedCountry)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Verification</p>
                        <p className={`mt-2 text-xl font-black ${otpVerified ? "text-emerald-600" : "text-slate-900"}`}>
                          {otpVerified ? "Verified" : "Required"}
                        </p>
                        {!otpVerified && otpSessionId && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Code sent to {normalizePhoneForCountry(form.phone, selectedCountry)}
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
                          {form.building}, {form.area}, {form.city}, {selectedCountry}
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
                              {formatCurrencyForCountry(getProductCountryPrice(item, selectedCountry) * item.quantity, selectedCountry)}
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
                          <span className="font-bold text-slate-900">{formatCurrencyForCountry(shippingFee, selectedCountry)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT</span>
                          <span className="font-bold text-slate-900">{formatCurrencyForCountry(vatAmount, selectedCountry)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-3">
                          <span className="font-bold text-slate-900">Total Payable on Delivery</span>
                          <span className="font-black text-slate-900">{formatCurrencyForCountry(totalPayable, selectedCountry)}</span>
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
                      {formatCurrencyForCountry(getProductCountryPrice(item, selectedCountry) * item.quantity, selectedCountry)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold uppercase tracking-[0.12em] text-white/70">Subtotal</span>
                  <span className="font-semibold">{formatCurrencyForCountry(total, selectedCountry)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold uppercase tracking-[0.12em] text-white/70">Shipping</span>
                  <span className="font-bold">{formatCurrencyForCountry(shippingFee, selectedCountry)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold uppercase tracking-[0.12em] text-white/70">VAT ({Math.round(country.vatRate * 100)}%)</span>
                  <span className="font-semibold">{formatCurrencyForCountry(vatAmount, selectedCountry)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-end">
                  <span className="text-base font-black uppercase tracking-[0.18em]">Total</span>
                  <span className="text-3xl font-black">{formatCurrencyForCountry(totalPayable, selectedCountry)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-emerald-200">
                You will pay cash when your order is delivered
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  COD protected by {country.shortName} phone OTP
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Truck className="h-4 w-4" />
                  {activeShipping.eta}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
