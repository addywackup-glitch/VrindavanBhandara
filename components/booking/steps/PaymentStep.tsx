"use client";

// =============================================================================
// Step 7 — Complete your payment (hardened)
//
// QA hardening:
//   1. All Razorpay failure scenarios handled with specific messages
//   2. Polling fallback: if verify times out, poll /api/bookings/{id}
//      (webhook may have confirmed the booking already)
//   3. Rate-limit countdown timer
//   4. Deduplication: submittingRef prevents double-trigger
//   5. CONFLICT on verify → booking already confirmed → redirect
//   6. Max 3 retries before "contact support" mode
//   7. Reduced-motion respecting spinner
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getBookingError, getOrderCreationError, retryAfterText, SUPPORT_WHATSAPP_URL } from "@/lib/booking-errors";
import { trackBookingEvent } from "@/lib/booking-analytics";
import type { BookingFormData } from "@/types";

// ── Razorpay types ────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailedResponse) => void) => void;
};

type RazorpayFailedResponse = {
  error: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
};

type CreateOrderResult = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingNumber: string;
};

// ── Payment state machine ─────────────────────────────────────────────────────

type PaymentPhase =
  | "idle"
  | "creating_order"
  | "awaiting_payment"
  | "verifying"
  | "polling"
  | "error"
  | "cancelled";

type PaymentState =
  | { phase: Exclude<PaymentPhase, "error"> }
  | { phase: "error"; title: string; message: string; canRetry: boolean; showSupport: boolean };

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 8; // 20s total
const PAYMENT_METHODS = [
  { id: "upi", label: "UPI / Net Banking", desc: "Google Pay, PhonePe, BHIM, or any UPI app" },
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay — all cards accepted" },
  { id: "netbanking", label: "Net Banking", desc: "HDFC, SBI, ICICI, Axis, Kotak and 50+ banks" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function pollBookingStatus(bookingId: string): Promise<"confirmed" | "pending" | "error"> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as {
        success: boolean;
        data?: { status?: string };
      };
      if (data.success && data.data?.status === "CONFIRMED") return "confirmed";
      if (data.success && data.data?.status === "CANCELLED") return "error";
    } catch {
      // Network error during poll — keep trying
    }
  }
  return "pending";
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  bookingId: string;
  form: BookingFormData;
  onSuccess: (bookingNumber: string) => void;
  onBack: () => void;
};

export function PaymentStep({ bookingId, form, onSuccess, onBack }: Props) {
  const prefersReducedMotion = useReducedMotion();

  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [payState, setPayState] = useState<PaymentState>({ phase: "idle" });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  // Prevent double-trigger: ref, not state (no re-render)
  const submittingRef = useRef(false);
  // Store bookingNumber from create-order for polling redirect
  const bookingNumberRef = useRef<string>("");

  // Load Razorpay script once on mount
  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  // Rate-limit countdown timer
  useEffect(() => {
    if (!rateLimitCountdown || rateLimitCountdown <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRateLimitCountdown(null);
      return;
    }
    const id = setTimeout(() => setRateLimitCountdown((c) => (c != null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [rateLimitCountdown]);

  const isProcessing =
    payState.phase === "creating_order" ||
    payState.phase === "verifying" ||
    payState.phase === "awaiting_payment" ||
    payState.phase === "polling";

  const isRateLimited = !!rateLimitCountdown && rateLimitCountdown > 0;

  // ── Payment handler ─────────────────────────────────────────────────────────

  const handlePay = async () => {
    if (submittingRef.current || isProcessing || isRateLimited) return;
    submittingRef.current = true;

    if (!scriptLoaded) {
      setPayState({
        phase: "error",
        title: "Payment SDK failed to load",
        message: "Could not load the payment SDK. Please refresh the page and try again.",
        canRetry: true,
        showSupport: false,
      });
      submittingRef.current = false;
      return;
    }

    setPayState({ phase: "creating_order" });

    try {
      // ── 1. Create order ────────────────────────────────────────────────────
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingId }),
      });

      const orderData = (await orderRes.json()) as {
        success: boolean;
        data?: CreateOrderResult;
        error?: string;
        code?: string;
      };

      if (!orderRes.ok || !orderData.success) {
        // CONFLICT = order already created (idempotent) → re-open same window
        if (orderData.code === "CONFLICT" && orderData.data) {
          // Continue with existing order
        } else {
          if (orderData.code === "RATE_LIMITED") {
            setRateLimitCountdown(60);
          }
          const errInfo = getOrderCreationError(orderData.code);
          setPayState({
            phase: "error",
            title: errInfo.title,
            message: errInfo.message,
            canRetry: errInfo.retryable,
            showSupport: errInfo.recovery === "contact",
          });
          submittingRef.current = false;
          return;
        }
      }

      const order = orderData.data!;
      bookingNumberRef.current = order.bookingNumber;
      setPayState({ phase: "awaiting_payment" });

      trackBookingEvent("payment_initiated", {
        bookingId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
      });

      // ── 2. Open Razorpay checkout ──────────────────────────────────────────
      const fullName = [form.userFirstName, form.userLastName].filter(Boolean).join(" ");
      const options: RazorpayOptions = {
        key: order.keyId,
        amount: order.amount * 100, // paise
        currency: order.currency,
        name: "Vrindavan Bhandara",
        description: order.bookingNumber,
        order_id: order.orderId,
        prefill: {
          name: fullName || undefined,
          email: form.userEmail || undefined,
          contact: form.userPhone || undefined,
        },
        theme: { color: "oklch(30% 0.12 148)" },
        modal: {
          escape: true,
          ondismiss: () => {
            // User closed modal — keep booking PENDING, allow retry
            setPayState({ phase: "cancelled" });
            submittingRef.current = false;
            trackBookingEvent("payment_cancelled", { bookingId });
          },
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // ── 3. Verify on backend ─────────────────────────────────────────
          setPayState({ phase: "verifying" });

          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = (await verifyRes.json()) as {
              success: boolean;
              data?: { bookingNumber: string; bookingId: string };
              error?: string;
              code?: string;
            };

            if (!verifyRes.ok || !verifyData.success) {
              const code = verifyData.code;

              // CONFLICT = already confirmed (idempotent verify)
              if (code === "CONFLICT") {
                trackBookingEvent("payment_success", {
                  bookingId,
                  bookingNumber: bookingNumberRef.current,
                  amount: order.amount,
                  paymentId: response.razorpay_payment_id,
                });
                onSuccess(bookingNumberRef.current);
                return;
              }

              // Network/timeout: poll booking status (webhook may have confirmed)
              if (code === "INTERNAL_ERROR" || !verifyRes.ok) {
                setPayState({ phase: "polling" });
                const polled = await pollBookingStatus(bookingId);
                if (polled === "confirmed") {
                  trackBookingEvent("payment_success", {
                    bookingId,
                    bookingNumber: bookingNumberRef.current,
                    amount: order.amount,
                    paymentId: response.razorpay_payment_id,
                  });
                  onSuccess(bookingNumberRef.current);
                  return;
                }
                if (polled === "error") {
                  setPayState({
                    phase: "error",
                    title: "Payment failed",
                    message:
                      "Payment failed and your booking was cancelled. Please contact support if money was deducted.",
                    canRetry: false,
                    showSupport: true,
                  });
                  submittingRef.current = false;
                  return;
                }
              }

              const errInfo = getBookingError(code, "payment");
              trackBookingEvent("payment_failed", {
                bookingId,
                errorCode: code ?? "UNKNOWN",
                errorMessage: errInfo.message,
              });
              setPayState({
                phase: "error",
                title: errInfo.title,
                message: errInfo.message,
                canRetry: errInfo.retryable,
                showSupport: errInfo.recovery === "contact",
              });
              submittingRef.current = false;
              return;
            }

            // Success
            trackBookingEvent("payment_success", {
              bookingId,
              bookingNumber: verifyData.data!.bookingNumber,
              amount: order.amount,
              paymentId: response.razorpay_payment_id,
            });
            onSuccess(verifyData.data!.bookingNumber);
          } catch {
            // Network error during verify — start polling
            setPayState({ phase: "polling" });
            const polled = await pollBookingStatus(bookingId);
            if (polled === "confirmed") {
              onSuccess(bookingNumberRef.current);
            } else {
              if (polled === "error") {
                setPayState({
                  phase: "error",
                  title: "Payment failed",
                  message:
                    "Payment failed and your booking was cancelled. Please contact support if money was deducted.",
                  canRetry: false,
                  showSupport: true,
                });
                submittingRef.current = false;
                return;
              }
              const errInfo = getBookingError("NETWORK_ERROR", "payment");
              setPayState({
                phase: "error",
                title: errInfo.title,
                message: errInfo.message,
                canRetry: false,
                showSupport: true,
              });
            }
            submittingRef.current = false;
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        const description =
          response.error?.description ??
          response.error?.reason ??
          "Payment failed. Please try again or use a different method.";
        trackBookingEvent("payment_failed", {
          bookingId,
          errorCode: response.error?.code ?? "PAYMENT_FAILED",
          errorMessage: description,
        });
        setPayState({
          phase: "error",
          title: "Payment failed",
          message: description,
          canRetry: true,
          showSupport: false,
        });
        submittingRef.current = false;
      });
      rzp.open();
    } catch {
      const errInfo = getBookingError("NETWORK_ERROR", "payment");
      setPayState({
        phase: "error",
        title: errInfo.title,
        message: errInfo.message,
        canRetry: true,
        showSupport: false,
      });
      submittingRef.current = false;
    }
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    setPayState({ phase: "idle" });
    submittingRef.current = false;
  };

  // ── Spinner (respects reduced motion) ───────────────────────────────────────

  const spinnerStyle: React.CSSProperties = {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid currentColor",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: prefersReducedMotion ? "none" : "spin 0.7s linear infinite",
    opacity: prefersReducedMotion ? 0.6 : 1,
    flexShrink: 0,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="step-heading">Complete your payment</div>
      <div className="step-sub">
        Your Seva will be confirmed immediately after successful payment.
      </div>

      {/* Payment method selector (UI layer — Razorpay handles internally) */}
      <div className="payment-opts" role="radiogroup" aria-label="Preferred payment method">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            role="radio"
            aria-checked={selectedMethod === method.id}
            className={`payment-opt${selectedMethod === method.id ? " selected" : ""}`}
            onClick={() => setSelectedMethod(method.id)}
            type="button"
          >
            <div className="payment-opt-radio" aria-hidden="true" />
            <div>
              <div className="payment-opt-label">{method.label}</div>
              <div className="payment-opt-desc">{method.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Price summary */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
        aria-label="Payment breakdown"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Seva amount</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{formatINR(form.packagePrice)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Platform fee</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>₹0</span>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1rem", fontWeight: 600 }}>Total</span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--accent-deep)",
              letterSpacing: "-0.02em",
            }}
          >
            {formatINR(form.packagePrice)}
          </span>
        </div>
      </div>

      {/* State feedback area */}
      <AnimatePresence mode="wait">
        {payState.phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            aria-live="assertive"
            style={{
              marginTop: "1rem",
              padding: "1rem 1.25rem",
              background: "oklch(96.5% 0.045 25)",
              border: "1.5px solid oklch(55% 0.19 25 / 0.25)",
              borderRadius: "var(--r-md)",
              fontSize: "0.875rem",
              color: "var(--danger)",
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>{payState.title}</strong>
            {payState.message}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              {payState.canRetry && retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  type="button"
                  style={{
                    color: "var(--brand)",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "inherit",
                    fontWeight: 500,
                  }}
                >
                  Try again
                </button>
              )}
              {retryCount >= 3 && (
                <span style={{ color: "var(--muted)" }}>Max retries reached. Please contact support.</span>
              )}
              {payState.showSupport && (
                <a
                  href={SUPPORT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#25D366",
                    textDecoration: "underline",
                    fontSize: "inherit",
                    fontWeight: 500,
                  }}
                >
                  Contact support on WhatsApp
                </a>
              )}
            </div>
          </motion.div>
        )}

        {payState.phase === "cancelled" && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            style={{
              marginTop: "1rem",
              padding: "0.875rem 1rem",
              background: "var(--surface-brand)",
              border: "1.5px solid oklch(30% 0.12 148 / 0.18)",
              borderRadius: "var(--r-md)",
              fontSize: "0.875rem",
              color: "var(--brand)",
            }}
          >
            Payment cancelled. Your booking is saved — you can try again anytime.
          </motion.div>
        )}

        {(payState.phase === "creating_order" ||
          payState.phase === "verifying" ||
          payState.phase === "polling") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            style={{
              marginTop: "1rem",
              padding: "0.875rem 1rem",
              background: "var(--surface-brand)",
              borderRadius: "var(--r-md)",
              fontSize: "0.875rem",
              color: "var(--brand)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={spinnerStyle} aria-hidden="true" />
            {payState.phase === "creating_order" && "Preparing payment…"}
            {payState.phase === "verifying" && "Verifying payment…"}
            {payState.phase === "polling" &&
              "Confirming your payment — this may take a moment…"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rate limit notice */}
      {isRateLimited && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8125rem",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          {retryAfterText(rateLimitCountdown ?? 0)}
        </div>
      )}

      <div className="step-nav">
        <button
          className="btn-back"
          onClick={onBack}
          disabled={isProcessing}
          type="button"
          aria-label="Go back to review"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button
          className="btn-next btn-pay"
          onClick={handlePay}
          disabled={isProcessing || !scriptLoaded || isRateLimited}
          aria-disabled={isProcessing || !scriptLoaded || isRateLimited}
          aria-busy={isProcessing}
          type="button"
        >
          {isProcessing ? (
            <>
              <span style={spinnerStyle} aria-hidden="true" />
              {payState.phase === "creating_order" ? "Preparing…" : "Processing…"}
            </>
          ) : isRateLimited ? (
            retryAfterText(rateLimitCountdown ?? 0)
          ) : (
            <>
              Pay {formatINR(form.packagePrice)} Securely
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
