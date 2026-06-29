// =============================================================================
// Booking Error Mapping
//
// Maps backend error codes (docs/error-codes.md) to user-friendly messages
// with recovery paths for every booking flow scenario.
//
// Never display raw error strings or stack traces to the user.
// =============================================================================

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_ERROR"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "OFFLINE";

export type RecoveryAction =
  | "retry"          // user can click retry
  | "go_back"        // go to previous step
  | "login"          // redirect to login
  | "contact"        // show contact/support link
  | "refresh"        // suggest page refresh
  | "none";          // no recovery action

export type BookingErrorInfo = {
  title: string;
  message: string;
  recovery: RecoveryAction;
  retryable: boolean;
};

// ── Generic booking creation errors ──────────────────────────────────────────
const BOOKING_ERRORS: Record<string, BookingErrorInfo> = {
  VALIDATION_ERROR: {
    title: "Invalid booking details",
    message: "Some of the details you entered are not valid. Please review and correct them.",
    recovery: "go_back",
    retryable: false,
  },
  UNAUTHORIZED: {
    title: "Sign in required",
    message: "You need to be signed in to complete this booking. Your progress has been saved.",
    recovery: "login",
    retryable: false,
  },
  FORBIDDEN: {
    title: "Access denied",
    message: "You don't have permission to perform this action.",
    recovery: "contact",
    retryable: false,
  },
  NOT_FOUND: {
    title: "Package not available",
    message: "The selected package is no longer available. Please choose a different package.",
    recovery: "go_back",
    retryable: false,
  },
  CONFLICT: {
    title: "Booking conflict",
    message: "This date or package is no longer available. Please select a different option.",
    recovery: "go_back",
    retryable: false,
  },
  RATE_LIMITED: {
    title: "Too many attempts",
    message: "You've made too many requests. Please wait a moment before trying again.",
    recovery: "retry",
    retryable: true,
  },
  INTERNAL_ERROR: {
    title: "Something went wrong",
    message: "An unexpected error occurred on our server. Please try again in a moment.",
    recovery: "retry",
    retryable: true,
  },
  NETWORK_ERROR: {
    title: "Connection error",
    message: "Could not reach our server. Please check your internet connection and try again.",
    recovery: "retry",
    retryable: true,
  },
  OFFLINE: {
    title: "You're offline",
    message: "You appear to be offline. Please reconnect to continue your booking.",
    recovery: "retry",
    retryable: true,
  },
};

// ── Payment-specific errors ───────────────────────────────────────────────────
const PAYMENT_ERRORS: Record<string, BookingErrorInfo> = {
  VALIDATION_ERROR: {
    title: "Payment details invalid",
    message: "The payment information could not be verified. Please try again.",
    recovery: "retry",
    retryable: true,
  },
  UNAUTHORIZED: {
    title: "Session expired",
    message: "Your session has expired. Please sign in again to complete payment.",
    recovery: "login",
    retryable: false,
  },
  CONFLICT: {
    title: "Already paid",
    message: "This booking has already been confirmed. Redirecting you to the confirmation page.",
    recovery: "none",
    retryable: false,
  },
  RATE_LIMITED: {
    title: "Too many payment attempts",
    message: "You've reached the payment attempt limit. Please wait before trying again.",
    recovery: "retry",
    retryable: true,
  },
  PAYMENT_ERROR: {
    title: "Payment could not be verified",
    message:
      "Your payment could not be verified by our server. If money was deducted, please contact support — it will be refunded within 3-5 business days.",
    recovery: "contact",
    retryable: false,
  },
  INTERNAL_ERROR: {
    title: "Payment server error",
    message:
      "Our payment server encountered an error. If money was deducted, it will be refunded automatically. You can try again or contact support.",
    recovery: "retry",
    retryable: true,
  },
  NETWORK_ERROR: {
    title: "Verification failed — network error",
    message:
      "Your payment may have been captured but we couldn't verify it due to a network issue. We'll check automatically — please wait.",
    recovery: "retry",
    retryable: false,
  },
  OFFLINE: {
    title: "You're offline",
    message:
      "Lost internet connection during payment. If money was deducted, we'll detect it automatically when you reconnect.",
    recovery: "retry",
    retryable: false,
  },
};

export function getBookingError(
  code: string | undefined,
  context: "booking" | "payment" = "booking"
): BookingErrorInfo {
  const map = context === "payment" ? PAYMENT_ERRORS : BOOKING_ERRORS;
  return map[code ?? "INTERNAL_ERROR"] ?? map["INTERNAL_ERROR"]!;
}

export function getOrderCreationError(code: string | undefined): BookingErrorInfo {
  const base = PAYMENT_ERRORS[code ?? "INTERNAL_ERROR"] ?? PAYMENT_ERRORS["INTERNAL_ERROR"]!;
  if (code === "CONFLICT") {
    return {
      ...base,
      title: "Order already created",
      message:
        "A payment order already exists for this booking. Reopening the payment window.",
      recovery: "retry",
      retryable: true,
    };
  }
  return base;
}

// Human-readable retry countdown string
export function retryAfterText(seconds: number): string {
  if (seconds <= 0) return "Try again";
  return `Try again in ${seconds}s`;
}

// WhatsApp support deep link
export const SUPPORT_WHATSAPP_URL =
  `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") ?? "919999999999"}` +
  `?text=${encodeURIComponent("Hello, I need help with my booking.")}`;
