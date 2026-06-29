"use client";

// =============================================================================
// Step 6 — Review your booking
// Bordered table-style review with all booking details + protection notice
// =============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BookingFormData } from "@/types";

type Props = {
  form: BookingFormData;
  onProceed: () => void;
  onBack: () => void;
  isLoading: boolean;
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ReviewStep({ form, onProceed, onBack, isLoading }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const sevaDate = form.sevaDate ? formatDate(form.sevaDate) : "—";
  const fullName = [form.userFirstName, form.userLastName].filter(Boolean).join(" ") || "—";
  const contactLine = [form.userPhone, form.userEmail].filter(Boolean).join(" · ") || "—";
  const locationLine = form.sevaLocation || "Vrindavan";
  const sankalpNames =
    form.sankalpNames.filter(Boolean).join(", ") || form.dedicatedTo || "—";
  const tax = Math.round(form.packagePrice * 0);  // platform fee = 0
  const total = form.packagePrice + tax;

  return (
    <div>
      <div className="step-heading">Review your booking</div>
      <div className="step-sub">Please confirm all details before proceeding to payment.</div>

      <div className="review-section" role="table" aria-label="Booking summary">
        {/* Service */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Service</span>
          <span className="review-row-value" role="cell">{form.serviceName || "—"}</span>
        </div>
        {/* Package */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Package</span>
          <span className="review-row-value" role="cell">{form.packageName || "—"}</span>
        </div>
        {/* Date */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Date</span>
          <span className="review-row-value" role="cell">{sevaDate}</span>
        </div>
        {/* Location */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Location</span>
          <span className="review-row-value" role="cell">{locationLine}</span>
        </div>
        {/* Booking for */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Booking for</span>
          <span className="review-row-value" role="cell">
            {fullName}
            {contactLine !== "—" && (
              <>
                <br />
                <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: "0.8125rem" }}>
                  {contactLine}
                </span>
              </>
            )}
          </span>
        </div>
        {/* Sankalp names */}
        {sankalpNames !== "—" && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Sankalp names</span>
            <span className="review-row-value" role="cell" style={{ maxWidth: "60%" }}>
              {form.sankalpNames.filter(Boolean).map((n, i) => (
                <span key={i} style={{ display: "block" }}>{n}</span>
              ))}
              {form.sankalpNames.filter(Boolean).length === 0 && form.dedicatedTo}
            </span>
          </div>
        )}
        {/* Gotra */}
        {form.gotra && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Gotra</span>
            <span className="review-row-value" role="cell">{form.gotra}</span>
          </div>
        )}
        {/* Occasion */}
        {form.occasion && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Occasion</span>
            <span className="review-row-value" role="cell">{form.occasion}</span>
          </div>
        )}
        {/* Special instructions */}
        {form.specialInstructions && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Special Instructions</span>
            <span className="review-row-value" role="cell" style={{ maxWidth: "60%" }}>
              {form.specialInstructions}
            </span>
          </div>
        )}
        {/* Pricing */}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Package amount</span>
          <span className="review-row-value" role="cell">{formatINR(form.packagePrice)}</span>
        </div>
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Platform fee</span>
          <span className="review-row-value" role="cell">{formatINR(tax)}</span>
        </div>
        {/* Coupon */}
        {form.couponCode && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell" style={{ color: "var(--success)" }}>
              Coupon: {form.couponCode}
            </span>
            <span className="review-row-value" role="cell" style={{ color: "var(--success)" }}>
              Applied ✓
            </span>
          </div>
        )}
        {/* Total */}
        <div className="review-row review-total" role="row">
          <span className="review-row-label" role="cell" style={{ fontWeight: 600, color: "var(--fg)" }}>
            Total Amount
          </span>
          <span className="review-row-value" role="cell">{formatINR(total)}</span>
        </div>
      </div>

      {/* Protection notice */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--color-success-bg, oklch(95.5% 0.045 145))",
          borderRadius: "var(--r-md)",
          fontSize: "0.875rem",
          color: "var(--success)",
          lineHeight: 1.6,
          marginBottom: "1.5rem",
        }}
        role="note"
      >
        <strong>Your booking is protected.</strong> Full refund if cancelled 48+ hours before
        the Seva date.
      </div>

      {/* Terms checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--fg)",
          lineHeight: 1.5,
          marginBottom: "1.5rem",
        }}
      >
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--brand)", flexShrink: 0 }}
          aria-label="I confirm all details and agree to the terms"
        />
        <span>
          I confirm that all the above details are correct and agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--brand)", textDecoration: "underline" }}
          >
            booking terms
          </a>
          .
        </span>
      </label>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "0.875rem 1rem",
              background: "var(--surface-brand)",
              borderRadius: "var(--r-md)",
              fontSize: "0.875rem",
              color: "var(--brand)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            role="status"
            aria-live="polite"
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: "2px solid var(--brand)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
              aria-hidden="true"
            />
            Creating your booking…
          </motion.div>
        )}
      </AnimatePresence>

      <div className="step-nav">
        <button className="btn-back" onClick={onBack} disabled={isLoading} type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          className="btn-next"
          onClick={onProceed}
          disabled={!termsAccepted || isLoading}
          aria-disabled={!termsAccepted || isLoading}
          type="button"
        >
          {isLoading ? (
            "Creating booking…"
          ) : (
            <>
              Proceed to Payment
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
