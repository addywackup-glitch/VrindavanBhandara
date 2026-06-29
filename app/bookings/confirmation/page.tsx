"use client";

// =============================================================================
// Booking Confirmation Page — pixel-matches design_v1/payment-success.html
// Fetches booking from backend using ref param; shows success card
// =============================================================================

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { clearDraft } from "@/lib/booking-draft";
import { trackBookingEvent } from "@/lib/booking-analytics";

// Confetti colours matching the design system
const CONFETTI_COLORS = [
  "oklch(30% 0.12 148)",
  "oklch(67% 0.155 58)",
  "oklch(50% 0.14 145)",
  "oklch(68% 0.15 68)",
];

function Confetti() {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    for (let i = 0; i < 40; i++) {
      const dot = document.createElement("div");
      const size = Math.random() * 8 + 5;
      Object.assign(dot.style, {
        position: "absolute",
        left: `${Math.random() * 100}%`,
        top: "0",
        width: `${size}px`,
        height: `${size}px`,
        background: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animation: `confettiFall ${Math.random() * 2.5 + 1.5}s linear ${Math.random() * 1.5}s both`,
        opacity: `${Math.random() * 0.6 + 0.4}`,
        pointerEvents: "none",
      } as Partial<CSSStyleDeclaration>);
      wrap.appendChild(dot);
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: -1,
      }}
    />
  );
}

const NEXT_STEPS = [
  {
    num: 1,
    title: "Confirmation on WhatsApp",
    desc: "You'll receive a booking confirmation message on your registered mobile number within the next few minutes.",
  },
  {
    num: 2,
    title: "Day before reminder",
    desc: "Our team will send you a reminder the evening before your Seva with the confirmed venue address and timing.",
  },
  {
    num: 3,
    title: "Seva performed with devotion",
    desc: "On your selected date, our Brahmin pandits will perform the Seva in your name with full Vedic traditions.",
  },
  {
    num: 4,
    title: "Photos & video within 24 hours",
    desc: "You'll receive 30+ photos and a full video on WhatsApp and in your dashboard after the Seva.",
  },
];

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref")?.trim() ?? "";
  const hasValidRef = ref.length > 0 && ref !== "—";

  // Clear any lingering draft and track completion on mount
  useEffect(() => {
    clearDraft();
    if (hasValidRef) {
      trackBookingEvent("booking_completed", {
        bookingId: "",
        bookingNumber: ref,
        totalAmount: 0,
        serviceType: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasValidRef) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "0.75rem" }}>Booking reference missing</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
            We could not find a valid booking reference. Check your dashboard for the latest status.
          </p>
          <Link href="/dashboard/bookings" className="btn-brand">View My Bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        background: "var(--bg)",
      }}
    >
      <Confetti />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "clamp(2rem, 5vw, 3.5rem)",
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          boxShadow: "var(--sh-md)",
        }}
        role="main"
        aria-labelledby="confirmation-title"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          style={{
            width: 80,
            height: 80,
            background: "var(--color-success-bg, oklch(95.5% 0.045 145))",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 1.5rem",
          }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="var(--success)"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.div>

        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--success)",
            fontFamily: "var(--font-mono)",
            background: "var(--color-success-bg, oklch(95.5% 0.045 145))",
            padding: "0.3125rem 0.875rem",
            borderRadius: "var(--r-full)",
            border: "1px solid oklch(50% 0.14 145 / 0.2)",
            marginBottom: "1.25rem",
          }}
          role="status"
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--success)",
              borderRadius: "50%",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          Seva Confirmed
        </div>

        {/* Title */}
        <h1
          id="confirmation-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "var(--fg)",
            marginBottom: "1rem",
          }}
        >
          Your <em style={{ fontStyle: "italic", color: "var(--brand)" }}>Seva</em> is booked
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "var(--muted)",
            lineHeight: 1.65,
            marginBottom: "2rem",
            maxWidth: "40ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Your Seva has been confirmed. We will send you photo and video proof via WhatsApp
          within 24 hours of completion.
        </p>

        {/* Booking details */}
        <div
          style={{
            background: "var(--surface-brand)",
            borderRadius: "var(--r-lg)",
            padding: "1.25rem",
            marginBottom: "1.75rem",
            textAlign: "left",
          }}
          aria-label="Booking details"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              padding: "0.625rem 0",
              borderBottom: "1px solid oklch(30% 0.12 148 / 0.1)",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Booking Reference</span>
            <span
              style={{
                fontWeight: 500,
                color: "var(--brand)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                letterSpacing: "0.04em",
              }}
            >
              #{ref}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              padding: "0.625rem 0",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Status</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                color: "var(--success)",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--success)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
                aria-hidden="true"
              />
              Confirmed
            </span>
          </div>
        </div>

        {/* Next steps */}
        <div
          style={{
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            marginBottom: "1.75rem",
            textAlign: "left",
          }}
          aria-label="What happens next"
        >
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              padding: "0.75rem 1.125rem",
              background: "var(--n-100)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            What happens next
          </div>
          {NEXT_STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.875rem",
                padding: "1rem 1.125rem",
                borderBottom: step.num < NEXT_STEPS.length ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--surface-brand)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--brand)",
                  flexShrink: 0,
                  marginTop: 1,
                }}
                aria-hidden="true"
              >
                {step.num}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--fg)", lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>{step.title}</strong> — {step.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.875rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/dashboard/bookings" className="btn-brand">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            View Dashboard
          </Link>
          <Link href="/book" className="btn-ghost">
            Book Another Seva
          </Link>
          <Link href="/" className="btn-ghost">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTopColor: "var(--brand)",
              animation: "spin 0.7s linear infinite",
            }}
            aria-label="Loading confirmation"
            role="status"
          />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
