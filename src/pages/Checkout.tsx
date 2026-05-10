import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
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
import { codAPI, orderAPI, paypalAPI, paymentAPI, productAPI, userAPI } from "../services/api";
import { formatCurrencyForCountry } from "../lib/currency";
import { useAuthStore } from "../store/auth";
import AuthService from "../lib/authService";
import {
  canAttemptFirebasePhoneVerification,
  describeFirebasePhoneVerificationError,
  getActiveFirebasePhoneOtpSession,
  getFirebasePhoneSendCooldownRemainingMs,
  getFirebasePhoneVerificationRuntimeInfo,
  getReadableFirebasePhoneVerificationError,
  isFirebasePhoneVerificationSupportedOnCurrentOrigin,
  resetFirebasePhoneVerification,
  sendFirebasePhoneCode,
  verifyFirebasePhoneCode,
} from "../lib/firebasePhoneVerification";
import {
  COUNTRY_CONFIG,
  SUPPORTED_COUNTRY_CODES,
  calculateVat,
  getCheckoutPaymentOptions,
  getCountryConfig,
  getDefaultPaymentMethod,
  getPaypalCurrencyForCountry,
  getPaypalCurrencyNotice,
  getProductCountryPrice,
  getShippingOption,
  isCodEnabledCountry,
  isPaymentMethodAllowed,
  isSupportedCountryCode,
  type PaymentMethodCode,
} from "../lib/countryConfig";
import { useCountryStore } from "../store/country";
import { getInvalidPhoneMessage, getPhonePlaceholder, isValidPhoneForCountry, normalizePhoneByCountry } from "../utils/phone";

function getItemBasePriceAed(item: any) {
  const amount = Number(item?.basePriceAED ?? item?.priceUae ?? item?.price ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getGuestCheckoutSessionId() {
  if (typeof window === "undefined") return `guest_${Date.now()}`;
  const key = "exshopi_guest_checkout_session";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, created);
  return created;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart } = useCartStore();
  const removeCartItem = useCartStore((state) => state.removeItem);
  const hydrateOrderFromApi = useOrderStore((state) => state.hydrateOrderFromApi);
  const authUser = useAuthStore((state) => state.user);
  const authRole = useAuthStore((state) => state.role);
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const phoneVerificationSupported = isFirebasePhoneVerificationSupportedOnCurrentOrigin();
  const useFirebaseOtp = canAttemptFirebasePhoneVerification();
  const [authChecked, setAuthChecked] = useState(false);
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "account">(
    queryParams.get("mode") === "account" ? "account" : "guest"
  );
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
  const setCountrySelection = useCountryStore((state) => state.setCountry);
  const setCitySelection = useCountryStore((state) => state.setCity);
  const setShippingSelection = useCountryStore((state) => state.setShippingOption);
  const country = getCountryConfig(selectedCountry);
  const activeShipping = getShippingOption(selectedCountry, selectedShippingOption);
  const shippingOptions = country.shippingOptions.map((option) => getShippingOption(selectedCountry, option.id));
  const canUseCod = isCodEnabledCountry(selectedCountry);
  const paymentOptions = useMemo(() => getCheckoutPaymentOptions(selectedCountry), [selectedCountry]);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
  const paypalCurrency = getPaypalCurrencyForCountry(selectedCountry);
  const paypalCurrencyNotice = getPaypalCurrencyNotice(selectedCountry);
  const [paypalError, setPaypalError] = useState("");
  const [paypalStatus, setPaypalStatus] = useState("");

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
    flat: "",
    landmark: "",
    postalCode: "",
    // Step 3: Delivery Method
    deliveryType: activeShipping.id,
    // Step 4: Payment
    paymentMethod: getDefaultPaymentMethod(selectedCountry),
  });

  const total = useMemo(
    () => items.reduce((sum, item) => sum + getProductCountryPrice(item, selectedCountry) * item.quantity, 0),
    [items, selectedCountry]
  );
  const shippingFee = activeShipping.fee;
  const vatAmount = Math.round(calculateVat(total, selectedCountry));
  const totalPayable = total + shippingFee + vatAmount;
  const normalizedPhone = normalizePhoneByCountry(form.phone, selectedCountry);
  const hasCustomerSession = authChecked && Boolean(authUser?.id) && authRole === "customer";
  const isGuestCheckout = checkoutMode === "guest" || !hasCustomerSession;
  const guestSessionId = useMemo(() => getGuestCheckoutSessionId(), []);
  const guestOtpRequired = isGuestCheckout && form.paymentMethod === "cod" && totalPayable >= 2000;
  const codVerificationRequired = form.paymentMethod === "cod" && (!isGuestCheckout || guestOtpRequired);

  useEffect(() => {
    if (!authChecked || queryParams.get("mode")) return;
    if (hasCustomerSession) {
      setCheckoutMode("account");
    }
  }, [authChecked, hasCustomerSession, queryParams]);

  const resetOtpState = () => {
    setOtpVerified(false);
    setOtpSessionId("");
    setOtpCode("");
    setOtpMessage("");
    setOtpError("");
    setOtpResendAvailableAt("");
    setOtpCooldownSeconds(0);
    setOtpProvider("firebase");
    resetFirebasePhoneVerification();
  };

  const buildCheckoutShippingAddress = () => ({
    emirate: form.city,
    region: form.city,
    area: form.area,
    building: form.building,
    flat: form.flat,
    landmark: form.landmark,
    addressLine: form.address,
    method: form.deliveryType,
    city: form.city,
    district: form.area,
    street: form.address,
    buildingNumber: form.building,
    postalCode: form.postalCode,
    country: selectedCountry,
    countryCode: selectedCountry,
    countryName: country.name,
    phone: normalizedPhone,
  });

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
      paymentMethod: isPaymentMethodAllowed(selectedCountry, prev.paymentMethod)
        ? (prev.paymentMethod as PaymentMethodCode)
        : getDefaultPaymentMethod(selectedCountry),
    }));
  }, [activeShipping.id, selectedCity, selectedCountry]);

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
    if (!codVerificationRequired) return;
    const persistedSession = getActiveFirebasePhoneOtpSession();
    if (!persistedSession?.phone || !normalizedPhone) return;
    if (persistedSession.phone !== normalizedPhone || otpVerified) return;

    const cooldownMs = getFirebasePhoneSendCooldownRemainingMs();
    setOtpProvider("firebase");
    setOtpSessionId(`firebase:${persistedSession.phone}`);
    if (cooldownMs > 0) {
      setOtpResendAvailableAt(new Date(Date.now() + cooldownMs).toISOString());
    }
    setOtpMessage((current) =>
      current ||
      `Verification code already sent to ${persistedSession.phone}. Enter the 6-digit code to continue your COD order.`
    );
  }, [codVerificationRequired, normalizedPhone, otpVerified]);

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

        setAuthChecked(true);
      } catch (sessionError) {
        console.error("[checkout] session restore failed", sessionError);
        if (!mounted) return;
        setAuthChecked(true);
      }
    };

    ensureCustomerSession();

    return () => {
      mounted = false;
    };
  }, [authRole, authUser?.id, authUser?.uid, setAccessToken, setRole, setUser]);

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
      return getInvalidPhoneMessage(selectedCountry);
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
      return getInvalidPhoneMessage(selectedCountry);
    }
    if (normalized.includes("auth/too-many-requests")) {
      const remaining = Math.max(
        otpCooldownSeconds,
        Math.ceil(getFirebasePhoneSendCooldownRemainingMs() / 1000)
      );
      return remaining > 0
        ? `Please wait ${remaining}s before requesting another code.`
        : "Too many attempts. Please wait before requesting another code.";
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

    const readable = getReadableFirebasePhoneVerificationError(raw, selectedCountry);
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
      resetOtpState();
    }
    setPageError("");
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCountryChange = (nextCountry: string) => {
    if (!isSupportedCountryCode(nextCountry) || nextCountry === selectedCountry) return;
    setCountrySelection(nextCountry);
    setForm((prev) => ({
      ...prev,
      city: COUNTRY_CONFIG[nextCountry].defaultCity,
      deliveryType: COUNTRY_CONFIG[nextCountry].shippingOptions[0].id,
      paymentMethod: isPaymentMethodAllowed(nextCountry, prev.paymentMethod)
        ? (prev.paymentMethod as PaymentMethodCode)
        : getDefaultPaymentMethod(nextCountry),
      postalCode: nextCountry === "AE" ? "" : prev.postalCode,
    }));
    resetOtpState();
    setPaypalError("");
    setPaypalStatus("");
    setPageError("");
  };

  const getStepValidationMessage = (step: number) => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        return "Please enter your full name.";
      }
      if (!isGuestCheckout && !form.email.trim()) {
        return "Please enter your email address.";
      }
      if (!isValidPhoneForCountry(form.phone, selectedCountry)) {
        return getInvalidPhoneMessage(selectedCountry);
      }
      return "";
    }

    if (step === 2) {
      if (!form.address.trim()) {
        return `Please enter your ${country.addressLabels.address.toLowerCase()}.`;
      }
      if (!form.city.trim() || !country.cities.includes(form.city)) {
        return `Please select your ${country.addressLabels.city}.`;
      }
      if (!form.area.trim()) {
        return `Please enter your ${country.addressLabels.area.toLowerCase()}.`;
      }
      if (!form.building.trim()) {
        return `Please enter your ${country.addressLabels.building.toLowerCase()}.`;
      }
      return "";
    }

    if (step === 3 && !form.deliveryType) {
      return "Please select your delivery method.";
    }

    if (step === 4 && !form.paymentMethod) {
      return "Please select a secure payment method.";
    }

    if (step === 4 && !isPaymentMethodAllowed(selectedCountry, form.paymentMethod)) {
      return "This payment method is not available for the selected country yet.";
    }

    if (step === 4 && form.paymentMethod === "cod" && !canUseCod) {
      return "Cash on Delivery is available only in the UAE. Please select a prepaid method for international delivery.";
    }

    if (step === 4 && form.paymentMethod !== "cod" && !form.email.trim()) {
      return "Please enter your email address for secure prepaid payment receipts.";
    }

    if (step === 4 && guestOtpRequired) {
      return "High-value guest COD needs phone verification. Please sign in for OTP verification or choose a prepaid method.";
    }

    if (step === 4 && codVerificationRequired && !otpVerified) {
      return "Please complete the COD verification step.";
    }

    return "";
  };

  const validateStep = (step: number): boolean => {
    return !getStepValidationMessage(step);
  };

  const handleNextStep = () => {
    const validationMessage = getStepValidationMessage(currentStep);
    if (validationMessage) {
      setPageError(validationMessage);
      return;
    }
    setPageError("");
    setCurrentStep(currentStep + 1);
  };

  const handleSendOtp = async () => {
    if (sendOtpLockRef.current) {
      console.info("[checkout] send-code skipped because a request is already in flight");
      return;
    }

    try {
      if (isGuestCheckout) {
        setOtpError("This guest COD order needs extra verification. Please sign in for OTP verification or choose a prepaid method.");
        return;
      }
      if (!authChecked || !authUser?.id || authRole !== "customer") {
        setOtpError("Please sign in to your customer account before phone verification.");
        return;
      }
      if (!form.email || !isValidPhoneForCountry(form.phone, selectedCountry)) {
        setOtpError(`${getInvalidPhoneMessage(selectedCountry)} Enter your email before requesting verification.`);
        return;
      }

      sendOtpLockRef.current = true;
      setSendingOtp(true);
      setPageError("");
      setOtpError("");
      setOtpMessage("");
      const persistedSession = getActiveFirebasePhoneOtpSession();
      const cooldownRemainingMs = getFirebasePhoneSendCooldownRemainingMs();

      if (
        persistedSession?.phone === normalizedPhone &&
        cooldownRemainingMs > 0
      ) {
        setOtpProvider("firebase");
        setOtpSessionId(`firebase:${persistedSession.phone}`);
        setOtpResendAvailableAt(new Date(Date.now() + cooldownRemainingMs).toISOString());
        setOtpMessage(
          `Verification code already sent to ${persistedSession.phone}. Enter the 6-digit code to continue your COD order.`
        );
        return;
      }

      console.info("[checkout] send-code requested", {
        ...getFirebasePhoneVerificationRuntimeInfo(),
        phone: normalizedPhone,
      });
      const response = await sendFirebasePhoneCode(normalizedPhone, "checkout-firebase-recaptcha", selectedCountry);
      setOtpProvider("firebase");
      setOtpSessionId(`firebase:${response.phone}`);
      setOtpResendAvailableAt(response.resendAvailableAt || new Date(Date.now() + 60 * 1000).toISOString());
      setOtpMessage(`Verification code sent to ${response.phone}. Enter the 6-digit code to continue your COD order.`);
    } catch (error: any) {
      console.error("[checkout] send-code failed", {
        ...getFirebasePhoneVerificationRuntimeInfo(),
        error: describeFirebasePhoneVerificationError(error),
      });
      const remaining = Math.ceil(getFirebasePhoneSendCooldownRemainingMs() / 1000);
      if (remaining > 0) {
        setOtpResendAvailableAt(new Date(Date.now() + remaining * 1000).toISOString());
      }
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
        const verifiedPhone = normalizePhoneByCountry(response.phone, selectedCountry);
        if (verifiedPhone !== normalizePhoneByCountry(form.phone, selectedCountry)) {
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
        const verifiedPhone = normalizePhoneByCountry(response.phone, selectedCountry);
        if (verifiedPhone !== normalizePhoneByCountry(form.phone, selectedCountry)) {
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
      let product = productCache.get(baseProductId);
      if (!product && baseProductId) {
        product = await productAPI.get(baseProductId);
        productCache.set(baseProductId, product);
      }
      const currentSellerId = String(item.sellerId || '').trim();
      const canonicalSellerId = String(product?.storeId || product?.sellerId || currentSellerId || '').trim();

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

  const buildPrepaidPaymentItems = (ordersBySellerMap: Map<string, any[]>) =>
    Array.from(ordersBySellerMap.entries()).flatMap(([sellerId, sellerItems]) =>
      sellerItems.map((item: any) => {
        const parts = String(item.id).split("::");
        const variant = item.variants && item.variants.length ? item.variants[0] : undefined;
        return {
          sellerId,
          productId: parts[0],
          variantId: parts[1] || undefined,
          sku: item.sku || variant?.sku,
          image: item.image || variant?.image,
          title: item.title,
          quantity: item.quantity,
          unitPrice: getProductCountryPrice(item, selectedCountry),
          basePriceAed: getItemBasePriceAed(item),
        };
      })
    );

  const handlePaypalCreateOrder = async () => {
    const validationMessage =
      getStepValidationMessage(1) ||
      getStepValidationMessage(2) ||
      getStepValidationMessage(3) ||
      getStepValidationMessage(4);
    if (validationMessage) {
      setPageError(validationMessage);
      throw new Error(validationMessage);
    }
    if (!paypalClientId) {
      const message = "PayPal checkout is not configured for this storefront.";
      setPaypalError(message);
      throw new Error(message);
    }

    setPaypalError("");
    setPaypalStatus("Starting protected PayPal checkout...");
    const ordersBySellerMap = await resolveCanonicalSellerGroups();
    const response = await paypalAPI.createOrder({
      items: buildPrepaidPaymentItems(ordersBySellerMap),
      shippingAddress: buildCheckoutShippingAddress(),
      deliveryCountry: selectedCountry,
      currency: country.currency,
      shippingFee,
      vatAmount,
      expectedTotal: totalPayable,
      customerName: `${form.firstName} ${form.lastName}`.trim(),
      customerEmail: form.email,
      customerPhone: normalizedPhone,
      checkoutMode: isGuestCheckout ? "guest" : "account",
      guestSessionId: isGuestCheckout ? guestSessionId : undefined,
    });

    if (!response?.paypalOrderId) {
      throw new Error("PayPal checkout could not be started.");
    }

    setPaypalStatus("PayPal window is ready. Complete payment to place your order.");
    return response.paypalOrderId;
  };

  const handlePaypalApprove = async (paypalOrderId?: string) => {
    if (!paypalOrderId) {
      throw new Error("PayPal did not return an order id.");
    }

    setIsProcessing(true);
    setPaypalError("");
    setPaypalStatus("Verifying PayPal payment securely...");
    const response = await paypalAPI.captureOrder({
      paypalOrderId,
      guestSessionId: isGuestCheckout ? guestSessionId : undefined,
    });
    const primaryOrder = response?.order || response?.orders?.[0];
    if (!response?.success || !primaryOrder) {
      throw new Error(response?.error || "PayPal payment was not verified.");
    }

    hydrateOrderFromApi(primaryOrder);
    if (isGuestCheckout && typeof window !== "undefined") {
      window.localStorage.setItem(
        "exshopi_guest_checkout_profile",
        JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: normalizedPhone,
          summary: { subtotal: total, shipping: shippingFee, total: totalPayable },
          items: items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            price: getProductCountryPrice(item, selectedCountry),
            image: item.image,
          })),
          country: selectedCountry,
          savedAt: new Date().toISOString(),
        })
      );
    }
    clearCart();
    setPaypalStatus("Payment verified. Opening your order confirmation...");
    navigate(
      primaryOrder?.trackingCode
        ? `/order-success?tracking=${encodeURIComponent(primaryOrder.trackingCode)}`
        : primaryOrder?.orderId || primaryOrder?.orderNumber || primaryOrder?.id
        ? `/order-success?order=${encodeURIComponent(String(primaryOrder.orderId || primaryOrder.orderNumber || primaryOrder.id))}`
        : isGuestCheckout
        ? "/order-success?guest=1"
        : "/order-success"
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalValidationMessage = getStepValidationMessage(4);
    if (finalValidationMessage) {
      setPageError(finalValidationMessage);
      return;
    }

    try {
      setIsProcessing(true);
      setPageError("");
      if (!isGuestCheckout && (!authChecked || !authUser?.id || authRole !== "customer")) {
        setPageError("Please sign in or choose Continue as Guest before placing this order.");
        setIsProcessing(false);
        return;
      }
      const ordersBySellerMap = await resolveCanonicalSellerGroups();

      if (form.paymentMethod === "paypal") {
        setPageError("Complete the PayPal buttons in the payment step to place this order securely.");
        setCurrentStep(4);
        return;
      }

      if (form.paymentMethod !== "cod") {
        const paymentItems = buildPrepaidPaymentItems(ordersBySellerMap).map((item) => ({
          sellerId: item.sellerId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.basePriceAed,
        }));

        const session = isGuestCheckout
          ? await paymentAPI.createGuestStripeCheckoutSession({
              items: paymentItems,
              shippingAddress: buildCheckoutShippingAddress(),
              deliveryCountry: selectedCountry,
              customerName: `${form.firstName} ${form.lastName}`.trim(),
              customerEmail: form.email,
              customerPhone: normalizedPhone,
              checkoutMode: "guest",
              guestSessionId,
            })
          : await paymentAPI.createStripeCheckoutSession({
              items: paymentItems,
              shippingAddress: buildCheckoutShippingAddress(),
              deliveryCountry: selectedCountry,
            });

        if (!session?.checkoutUrl) {
          throw new Error("Secure prepaid checkout could not be started.");
        }

        if (isGuestCheckout && typeof window !== "undefined") {
          window.localStorage.setItem(
            "exshopi_guest_checkout_profile",
            JSON.stringify({
              name: `${form.firstName} ${form.lastName}`.trim(),
              email: form.email,
              phone: normalizedPhone,
              summary: { subtotal: total, shipping: shippingFee, total: totalPayable },
              items: items.map((item) => ({
                title: item.title,
                quantity: item.quantity,
                price: getProductCountryPrice(item, selectedCountry),
                image: item.image,
              })),
              country: selectedCountry,
              savedAt: new Date().toISOString(),
            })
          );
        }

        window.location.href = session.checkoutUrl;
        return;
      }

      const createdOrders: any[] = [];

      // Create an order for each seller
      for (const [sellerId, sellerItems] of ordersBySellerMap) {
        const sellerShippingCost = activeShipping.fee;
        const orderPayload = {
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
          customerPhone: normalizedPhone,
          verificationToken: form.paymentMethod === "cod" ? otpSessionId : undefined,
          shippingCost: sellerShippingCost,
          deliveryType: activeShipping.label,
          shippingAddress: buildCheckoutShippingAddress(),
          paymentMethod: form.paymentMethod,
          deliveryCountry: selectedCountry,
          countryCode: selectedCountry,
          countryName: country.name,
        };
        const created = isGuestCheckout
          ? await orderAPI.createGuest({
              ...orderPayload,
              checkoutMode: "guest",
              guestSessionId,
            })
          : await orderAPI.create(orderPayload);
        const createdOrder = created?.order ?? created;
        if (!createdOrder?.id && !createdOrder?.orderId && !createdOrder?.trackingCode) {
          throw new Error("Order was not created successfully.");
        }
        createdOrders.push(createdOrder);
      }

      const primaryOrder = createdOrders[0];
      if (primaryOrder) {
        hydrateOrderFromApi(primaryOrder);
      }
      if (isGuestCheckout && typeof window !== "undefined") {
        window.localStorage.setItem(
          "exshopi_guest_checkout_profile",
          JSON.stringify({
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: normalizedPhone,
            summary: { subtotal: total, shipping: shippingFee, total: totalPayable },
            items: items.map((item) => ({
              title: item.title,
              quantity: item.quantity,
              price: getProductCountryPrice(item, selectedCountry),
              image: item.image,
            })),
            country: selectedCountry,
            savedAt: new Date().toISOString(),
          })
        );
      }

      // Clear cart and redirect to success
      clearCart();
      navigate(
        primaryOrder?.trackingCode
          ? `/order-success?tracking=${encodeURIComponent(primaryOrder.trackingCode)}`
          : primaryOrder?.orderId || primaryOrder?.orderNumber || primaryOrder?.id
          ? `/order-success?order=${encodeURIComponent(String(primaryOrder.orderId || primaryOrder.orderNumber || primaryOrder.id))}`
          : isGuestCheckout
          ? "/order-success?guest=1"
          : "/order-success"
      );
    } catch (error: any) {
      console.error("Order creation failed:", error);
      const message = "We could not place your order right now. Please try again.";
      setPageError(message);
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
              <div className="mb-8 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutMode("guest");
                    setPageError("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isGuestCheckout
                      ? "border-blue-500 bg-blue-50 shadow-[0_14px_34px_rgba(37,99,235,0.14)]"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">Fastest</p>
                  <p className="mt-1 text-lg font-black text-slate-900">Continue as Guest</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">No account or password required. Track with your order number.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasCustomerSession) {
                      navigate("/login", { state: { from: location, reason: "checkout_account_selected" } });
                      return;
                    }
                    setCheckoutMode("account");
                    setPageError("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    !isGuestCheckout
                      ? "border-slate-900 bg-slate-900 text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <p className={`text-sm font-black uppercase tracking-[0.16em] ${!isGuestCheckout ? "text-blue-200" : "text-slate-500"}`}>Account</p>
                  <p className={`mt-1 text-lg font-black ${!isGuestCheckout ? "text-white" : "text-slate-900"}`}>Login / Create Account</p>
                  <p className={`mt-1 text-sm font-semibold ${!isGuestCheckout ? "text-white/70" : "text-slate-600"}`}>Save addresses, wishlist, invoices, and faster future checkout.</p>
                </button>
              </div>

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
                        Email Address {isGuestCheckout && form.paymentMethod === "cod" ? "(optional for COD)" : "*"}
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
                        {country.addressLabels.country} *
                      </label>
                      <select
                        name="country"
                        value={selectedCountry}
                        onChange={(event) => handleCountryChange(event.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        {SUPPORTED_COUNTRY_CODES.map((countryCode) => (
                          <option key={countryCode} value={countryCode}>
                            {COUNTRY_CONFIG[countryCode].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-900">
                        Phone Number *
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={getPhonePlaceholder(selectedCountry)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {canUseCod
                          ? isGuestCheckout
                            ? "Guest COD stays fast. OTP is requested only for high-value or suspicious orders."
                            : "UAE mobile verification is required before COD order confirmation."
                          : `${country.shortName} phone number is used for courier delivery updates.`}
                      </p>
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
                        placeholder={country.addressPlaceholders.address}
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
                          placeholder={country.addressPlaceholders.area}
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
                          placeholder={country.addressPlaceholders.building}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.flat}
                        </label>
                        <input
                          name="flat"
                          value={form.flat}
                          onChange={handleChange}
                          placeholder={country.addressPlaceholders.flat}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.landmark}
                        </label>
                        <input
                          name="landmark"
                          value={form.landmark}
                          onChange={handleChange}
                          placeholder={country.addressPlaceholders.landmark}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-900">
                          {country.addressLabels.postalCode}
                        </label>
                        <input
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleChange}
                          placeholder={country.addressPlaceholders.postalCode}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
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
                    Secure Payment
                  </h2>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      {paymentOptions.map((option) => {
                        const active = form.paymentMethod === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!option.enabled}
                            onClick={() => {
                              if (!option.enabled) return;
                              setForm((prev) => ({ ...prev, paymentMethod: option.id }));
                              if (option.id !== "cod") resetOtpState();
                              setPaypalError("");
                              setPaypalStatus("");
                              setPageError("");
                            }}
                            className={`rounded-2xl border p-4 text-left transition ${
                              active
                                ? "border-blue-500 bg-white shadow-[0_14px_34px_rgba(37,99,235,0.14)]"
                                : option.enabled
                                  ? "border-slate-200 bg-white hover:border-blue-300"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-900">{option.label}</p>
                                <p className="mt-1 text-sm font-medium text-slate-600">{option.description}</p>
                              </div>
                              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                                {option.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!authChecked && (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                        Restoring your checkout session...
                      </div>
                    )}
                    {authChecked && isGuestCheckout && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                        Guest checkout is active. Your order will still appear in admin and seller dashboards with invoice, tracking, and support access.
                      </div>
                    )}
                    {authChecked && !isGuestCheckout && (!authUser?.id || authRole !== "customer") && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                        Sign in first, or choose Continue as Guest above to place this order without an account.
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {form.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid International Order"}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {form.paymentMethod === "cod"
                            ? isGuestCheckout
                              ? `Pay on delivery in ${country.currency}. OTP is only requested for high-value or suspicious guest COD orders.`
                              : `Pay on delivery in ${country.currency}. ExShopi requires UAE phone verification before the order is sent to sellers.`
                            : `International orders to ${country.name} are prepaid only. ExShopi prepares the order with customs-ready invoice, courier tracking, and secure payment confirmation.`}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                          {form.paymentMethod === "cod" ? "Total Payable" : "Total Due"}
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-900">{formatCurrencyForCountry(totalPayable, selectedCountry)}</p>
                      </div>
                    </div>

                    {codVerificationRequired && (
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
                        disabled={sendingOtp || otpCooldownSeconds > 0 || !authChecked || (!isGuestCheckout && (!authUser?.id || authRole !== "customer"))}
                        className="h-12 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {sendingOtp ? "Sending..." : otpCooldownSeconds > 0 ? `Resend in ${otpCooldownSeconds}s` : "Send Code"}
                      </button>
                    </div>
                    )}

                    {codVerificationRequired && otpMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {otpMessage}
                      </div>
                    )}

                    {codVerificationRequired && otpError && (
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
                        <p className={`mt-2 text-xl font-black ${otpVerified || form.paymentMethod !== "cod" || !codVerificationRequired ? "text-emerald-600" : "text-slate-900"}`}>
                          {form.paymentMethod !== "cod" ? "Prepaid" : codVerificationRequired ? (otpVerified ? "Verified" : "Required") : "Guest Fast"}
                        </p>
                        {!otpVerified && otpSessionId && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Code sent to {normalizePhoneByCountry(form.phone, selectedCountry)}
                          </p>
                        )}
                      </div>
                    </div>
                    {form.paymentMethod !== "cod" && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                        Secure prepaid payment is required for worldwide shipping. Customs or import duties may apply depending on the destination country and are normally collected by the courier or local customs authority. {form.paymentMethod === "paypal" ? paypalCurrencyNotice : "Card checkout is currently settled in AED while local prices remain visible on ExShopi."}
                      </div>
                    )}

                    {form.paymentMethod === "paypal" && (
                      <div className="rounded-2xl border border-[#0070ba]/20 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-[#003087] px-3 py-1 text-sm font-black tracking-tight text-white">
                                PayPal
                              </span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                Buyer Protection
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-slate-600">
                              Secure worldwide payments protected by PayPal. Your ExShopi order is created only after backend payment verification succeeds.
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Protected Total</p>
                            <p className="text-lg font-black text-slate-900">{formatCurrencyForCountry(totalPayable, selectedCountry)}</p>
                          </div>
                        </div>

                        {!paypalClientId ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                            PayPal checkout needs VITE_PAYPAL_CLIENT_ID before customers can pay with PayPal.
                          </div>
                        ) : (
                          <PayPalScriptProvider
                            options={{
                              clientId: paypalClientId,
                              currency: paypalCurrency,
                              intent: "capture",
                              components: "buttons",
                            }}
                          >
                            <PayPalButtons
                              style={{
                                layout: "vertical",
                                color: "gold",
                                shape: "rect",
                                label: "paypal",
                                height: 45,
                              }}
                              disabled={isProcessing || (!isGuestCheckout && (!authChecked || !authUser?.id || authRole !== "customer"))}
                              createOrder={async () => handlePaypalCreateOrder()}
                              onApprove={async (data: any) => {
                                try {
                                  await handlePaypalApprove(data?.orderID);
                                } catch (error: any) {
                                  setPaypalError(error?.message || "PayPal payment could not be verified.");
                                  setPaypalStatus("");
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              onCancel={() => {
                                setPaypalStatus("");
                                setPaypalError("PayPal payment was cancelled. Your order was not created.");
                              }}
                              onError={(error: any) => {
                                console.error("PayPal checkout failed:", error);
                                setPaypalStatus("");
                                setPaypalError("PayPal checkout failed. Please try again or choose another prepaid method.");
                              }}
                            />
                          </PayPalScriptProvider>
                        )}

                        {paypalStatus && (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            {paypalStatus}
                          </div>
                        )}
                        {paypalError && (
                          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                            {paypalError}
                          </div>
                        )}
                      </div>
                    )}
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
                        <p>{normalizedPhone || form.phone}</p>
                        <p>{country.name}</p>
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
                          {form.building}{form.flat ? `, ${form.flat}` : ""}, {form.area}, {form.city}, {country.name}
                        </p>
                        {form.landmark && <p>Landmark: {form.landmark}</p>}
                        {form.postalCode && <p>{country.addressLabels.postalCode}: {form.postalCode}</p>}
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
                      <h3 className="mb-4 font-bold text-slate-900">Payment Summary</h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Payment Method</span>
                          <span className="font-bold text-slate-900">
                            {paymentOptions.find((option) => option.id === form.paymentMethod)?.label || "Secure Payment"}
                          </span>
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
                          <span className="font-bold text-slate-900">
                            {form.paymentMethod === "cod" ? "Total Payable on Delivery" : "Total Prepaid Amount"}
                          </span>
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
                {currentStep < 5 && !(currentStep === 4 && form.paymentMethod === "paypal") && (
                  <button
                    onClick={handleNextStep}
                    className="ml-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {currentStep === 4 && form.paymentMethod === "paypal" && (
                  <div className="ml-auto max-w-sm rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900">
                    Complete PayPal above to verify payment and create your order.
                  </div>
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
                {currentStep < 4
                  ? `${country.name} delivery: ${activeShipping.eta}`
                  : form.paymentMethod === "cod"
                  ? "You will pay cash when your order is delivered"
                  : "International delivery requires prepaid confirmation before dispatch"}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  {form.paymentMethod === "cod" ? "COD protected by UAE phone OTP" : "Secure prepaid checkout and buyer protection"}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Truck className="h-4 w-4" />
                  {activeShipping.eta}
                </div>
                {selectedCountry !== "AE" && (
                  <div className="text-xs leading-5 text-white/60">
                    Customs or import duties may apply in {country.name}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
