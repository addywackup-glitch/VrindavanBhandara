"use client";

// =============================================================================
// Step 6 — Review your booking
// Bordered table-style review with all booking details + coupon + protection notice
// =============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BookingFormData } from "@/types";

type Props = {
  form: BookingFormData;
  onChange: (patch: Partial<BookingFormData>) => void;
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

export function ReviewStep({ form, onChange, onProceed, onBack, isLoading }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponInput, setCouponInput] = useState(form.couponCode ?? "");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  const sevaDate = form.sevaDate ? formatDate(form.sevaDate) : "—";
  const fullName = [form.userFirstName, form.userLastName].filter(Boolean).join(" ") || "—";
  const contactLine = [form.userPhone, form.userEmail].filter(Boolean).join(" · ") || "—";
  const locationLine = form.sevaLocation || "Vrindavan";
  const sankalpNames =
    form.sankalpNames.filter(Boolean).join(", ") || form.dedicatedTo || "—";
  const tax = 0;
  const discount = form.discountAmount ?? 0;
  const total = Math.max(0, form.packagePrice - discount + tax);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      onChange({ couponCode: "", discountAmount: 0 });
      setCouponError("");
      return;
    }
    if (!form.packageId) {
      setCouponError("Select a package first.");
      return;
    }
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, packageId: form.packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCouponError(data.error ?? "Invalid coupon");
        onChange({ couponCode: "", discountAmount: 0 });
        return;
      }
      onChange({
        couponCode: data.data.code,
        discountAmount: data.data.discountAmount,
      });
      setCouponInput(data.data.code);
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponBusy(false);
    }
  }

  function clearCoupon() {
    setCouponInput("");
    setCouponError("");
    onChange({ couponCode: "", discountAmount: 0 });
  }

  return (
    <div>
      <div className="step-heading">Review your booking</div>
      <div className="step-sub">Please confirm all details before proceeding to payment.</div>

      <div className="review-section" role="table" aria-label="Booking summary">
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Service</span>
          <span className="review-row-value" role="cell">{form.serviceName || "—"}</span>
        </div>
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Package</span>
          <span className="review-row-value" role="cell">{form.packageName || "—"}</span>
        </div>
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Date</span>
          <span className="review-row-value" role="cell">{sevaDate}</span>
        </div>
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Location</span>
          <span className="review-row-value" role="cell">{locationLine}</span>
        </div>
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
        {form.gotra && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Gotra</span>
            <span className="review-row-value" role="cell">{form.gotra}</span>
          </div>
        )}
        {form.occasion && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Occasion</span>
            <span className="review-row-value" role="cell">{form.occasion}</span>
          </div>
        )}
        {form.specialInstructions && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell">Special Instructions</span>
            <span className="review-row-value" role="cell" style={{ maxWidth: "60%" }}>
              {form.specialInstructions}
            </span>
          </div>
        )}
        <div className="review-row" role="row">
          <span className="review-row-label" role="cell">Package amount</span>
          <span className="review-row-value" role="cell">{formatINR(form.packagePrice)}</span>
        </div>
        {discount > 0 && (
          <div className="review-row" role="row">
            <span className="review-row-label" role="cell" style={{ color: "var(--success)" }}>
              Discount{form.couponCode ? ` (${form.couponCode})` : ""}
            </span>
            <span className="review-row-value" role="cell" style={{ color: "var(--success)" }}>
              −{formatINR(discount)}
            </span>
          </div>
        )}
        <div className="review-row review-total" role="row">
          <span className="review-row-label" role="cell" style={{ fontWeight: 600, color: "var(--fg)" }}>
            Total Amount
          </span>
          <span className="review-row-value" role="cell">{formatINR(total)}</span>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label className="step-label" htmlFor="coupon-code" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
          Coupon code
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            id="coupon-code"
            className="form-input"
            style={{ flex: "1 1 160px" }}
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="e.g. DIWALI10"
            disabled={couponBusy || isLoading}
            autoComplete="off"
          />
          <button type="button" className="btn-next" style={{ width: "auto", padding: "0.625rem 1rem" }} onClick={applyCoupon} disabled={couponBusy || isLoading}>
            {couponBusy ? "Checking…" : "Apply"}
          </button>
          {(form.couponCode || couponInput) && (
            <button type="button" className="btn-back" style={{ width: "auto" }} onClick={clearCoupon} disabled={couponBusy || isLoading}>
              Clear
            </button>
          )}
        </div>
        {couponError && (
          <p role="alert" style={{ color: "var(--danger, #b91c1c)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
            {couponError}
          </p>
        )}
        {form.couponCode && discount > 0 && !couponError && (
          <p role="status" style={{ color: "var(--success)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
            Coupon applied — you save {formatINR(discount)}.
          </p>
        )}
      </div>

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
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "underline" }}>
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
            Creating your booking…
          </motion.div>
        )}
      </AnimatePresence>

      <div className="step-nav">
        <button className="btn-back" onClick={onBack} disabled={isLoading} type="button">
          Back
        </button>
        <button
          className="btn-next"
          onClick={onProceed}
          disabled={!termsAccepted || isLoading}
          aria-disabled={!termsAccepted || isLoading}
          type="button"
        >
          {isLoading ? "Creating booking…" : "Proceed to Payment"}
        </button>
      </div>
    </div>
  );
}
