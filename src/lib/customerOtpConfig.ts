export function isCustomerOtpEnabled() {
  return String(import.meta.env.VITE_ENABLE_CUSTOMER_OTP || '').trim().toLowerCase() === 'true';
}

export const CUSTOMER_OTP_DISABLED_VERIFICATION_TOKEN = 'otp-disabled-customer-flow';
