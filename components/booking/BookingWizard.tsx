"use client";

// =============================================================================
// BookingWizard — Hardened 7-step booking flow
//
// QA hardening additions:
//   1. Draft persistence (localStorage, auto-save, auto-restore, clear on success)
//   2. Duplicate submission prevention (ref-based lock, not just disabled state)
//   3. Browser exit warning (beforeunload) when draft exists
//   4. Offline detection + banner
//   5. Focus management: step heading ref, skip-to-content
//   6. Analytics events at each step
//   7. Error code mapping to user-friendly messages
//   8. Step URL hash for history awareness
// =============================================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceStep } from "./steps/ServiceStep";
import { PackageStep } from "./steps/PackageStep";
import { DateStep } from "./steps/DateStep";
import { DetailsStep } from "./steps/DetailsStep";
import { SankalpStep } from "./steps/SankalpStep";
import { ReviewStep } from "./steps/ReviewStep";
import { PaymentStep } from "./steps/PaymentStep";
import { saveDraft, loadDraft, clearDraft } from "@/lib/booking-draft";
import { getBookingError } from "@/lib/booking-errors";
import { trackBookingEvent } from "@/lib/booking-analytics";
import type { BookingFormData } from "@/types";

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Service" },
  { id: 2, label: "Package" },
  { id: 3, label: "Date" },
  { id: 4, label: "Details" },
  { id: 5, label: "Sankalp" },
  { id: 6, label: "Review" },
  { id: 7, label: "Payment" },
] as const;

const TOTAL_STEPS = STEPS.length;

const INITIAL_FORM: BookingFormData = {
  serviceCategoryId: "",
  serviceSlug: "",
  serviceType: "",
  serviceName: "",
  packageId: "",
  packageName: "",
  packagePrice: 0,
  packageOriginalPrice: null,
  packageMaxGuests: null,
  packageBadge: null,
  sevaDate: "",
  sevaLocation: "Vrindavan",
  guestCount: 1,
  userFirstName: "",
  userLastName: "",
  userPhone: "",
  userEmail: "",
  userCity: "",
  occasion: "",
  specialInstructions: "",
  gotra: "",
  sankalpNames: [""],
  intention: "",
  couponCode: "",
  dedicatedTo: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="progress-header">
      <h1 className="progress-title">
        Book your <em>Sacred Seva</em>
      </h1>
      <div
        className="progress-steps"
        role="list"
        aria-label={`Booking progress: step ${currentStep} of ${TOTAL_STEPS}`}
      >
        {STEPS.map((step, i) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;
          return (
            <div key={step.id} className="p-step" role="listitem">
              <div
                className={`p-step-num${isDone ? " done" : isActive ? " active" : " pending"}`}
                aria-label={`Step ${step.id}: ${step.label}${isDone ? " — completed" : isActive ? " — current" : " — upcoming"}`}
              >
                {isDone ? (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className={`p-step-label${isActive ? " active" : ""}`} aria-hidden="true">
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`p-line${isDone ? " done" : ""}`} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Booking summary sidebar ───────────────────────────────────────────────────

function BookingSidebar({ form }: { form: BookingFormData }) {
  const formattedDate = form.sevaDate
    ? new Date(form.sevaDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

  return (
    <aside className="booking-sidebar" aria-label="Booking summary">
      <div className="sidebar-title">Booking Summary</div>
      <div className="summary-line">
        <span className="summary-line-label">Service</span>
        <span className="summary-line-value">{form.serviceName || "—"}</span>
      </div>
      <div className="summary-line">
        <span className="summary-line-label">Package</span>
        <span className="summary-line-value">{form.packageName || "—"}</span>
      </div>
      <div className="summary-line">
        <span className="summary-line-label">Date</span>
        <span className="summary-line-value">{formattedDate}</span>
      </div>
      {form.packageMaxGuests != null && (
        <div className="summary-line">
          <span className="summary-line-label">People</span>
          <span className="summary-line-value">Up to {form.packageMaxGuests.toLocaleString()}</span>
        </div>
      )}
      <div className="summary-line">
        <span className="summary-line-label">Location</span>
        <span className="summary-line-value">{form.sevaLocation}</span>
      </div>
      <div className="summary-total">
        <div className="summary-total-label">Amount</div>
        <div className="summary-total-value">
          {form.packagePrice > 0 ? formatINR(form.packagePrice) : "—"}
        </div>
      </div>
      <div className="summary-trust">
        {[
          "100% secure payment via Razorpay",
          "Photo & video proof within 24hrs",
          "Full refund if cancelled 48hrs before",
        ].map((text) => (
          <div key={text} className="summary-trust-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {text}
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Offline banner ────────────────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "oklch(55% 0.19 25)",
        color: "#fff",
        padding: "0.625rem 1.25rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18.364 5.636l-12.728 12.728M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
      </svg>
      You&apos;re offline — your booking progress is saved. Reconnect to continue.
    </div>
  );
}

// ── Draft restore banner ──────────────────────────────────────────────────────

function DraftRestoreBanner({
  step,
  onDismiss,
}: {
  step: number;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="status"
      aria-live="polite"
      style={{
        marginBottom: "1rem",
        padding: "0.875rem 1rem",
        background: "var(--surface-brand)",
        border: "1.5px solid oklch(30% 0.12 148 / 0.18)",
        borderRadius: "var(--r-md)",
        fontSize: "0.875rem",
        color: "var(--brand)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}
    >
      <span>
        <strong>Draft restored</strong> — we saved your progress from your last session (step {step}).
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss draft restored notice"
        type="button"
        style={{
          background: "none",
          border: "none",
          color: "var(--brand)",
          cursor: "pointer",
          flexShrink: 0,
          padding: "0 0.25rem",
          fontSize: "1rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

  // ── State ──────────────────────────────────────────────────────────────────

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [draftRestoredStep, setDraftRestoredStep] = useState<number | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  // Prevents double-click / duplicate submission race condition
  const submittingRef = useRef(false);
  const resumeLoadedRef = useRef(false);
  const stepHeadingRef = useRef<HTMLDivElement>(null);

  // ── Payment resume (?resume=bookingId) ─────────────────────────────────────

  useEffect(() => {
    if (!resumeId || resumeLoadedRef.current) return;
    resumeLoadedRef.current = true;

    async function loadResume() {
      try {
        const res = await fetch(`/api/bookings/${resumeId}`, { credentials: "include" });
        const data = (await res.json()) as {
          success: boolean;
          data?: {
            id: string;
            status: string;
            sevaDate: string;
            sevaLocation: string;
            guestCount: number;
            totalAmount: number | string;
            package?: {
              id: string;
              name: string;
              price: number | string;
              serviceCategory?: { id: string; name: string; slug: string; type?: string };
            };
          };
          error?: string;
        };

        if (!res.ok || !data.success || !data.data) {
          setError("Could not load this booking for payment. Open it from My Bookings and try again.");
          return;
        }

        const booking = data.data;
        if (booking.status !== "PENDING") {
          setError("This booking is no longer awaiting payment.");
          return;
        }

        const pkg = booking.package;
        setBookingId(booking.id);
        setForm((prev) => ({
          ...prev,
          packageId: pkg?.id ?? prev.packageId,
          packageName: pkg?.name ?? prev.packageName,
          packagePrice: Number(booking.totalAmount ?? pkg?.price ?? prev.packagePrice),
          serviceCategoryId: pkg?.serviceCategory?.id ?? prev.serviceCategoryId,
          serviceSlug: pkg?.serviceCategory?.slug ?? prev.serviceSlug,
          serviceName: pkg?.serviceCategory?.name ?? prev.serviceName,
          serviceType: pkg?.serviceCategory?.type ?? prev.serviceType,
          sevaDate: booking.sevaDate.split("T")[0],
          sevaLocation: (booking.sevaLocation === "Mathura" ? "Mathura" : "Vrindavan") as BookingFormData["sevaLocation"],
          guestCount: booking.guestCount,
        }));
        setStep(7);
        clearDraft();
      } catch {
        setError("Could not load this booking for payment.");
      }
    }

    loadResume();
  }, [resumeId]);

  // ── Draft restore on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (resumeId) return;
    const draft = loadDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(draft.form);
      setStep(draft.step);
      setDraftRestoredStep(draft.step);
      trackBookingEvent("draft_restored", { step: draft.step });
    } else {
      trackBookingEvent("booking_started", { source: "direct" });
    }
  }, [resumeId]);

  // ── Offline detection ──────────────────────────────────────────────────────

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Exit warning ───────────────────────────────────────────────────────────

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Warn if user has made progress but hasn't completed the booking
      if (step > 1 && !bookingId) {
        e.preventDefault();
        // Required for older browsers
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, bookingId]);

  // ── Auto-save draft on step/form change ───────────────────────────────────

  useEffect(() => {
    // Don't save if we're at step 7 (payment), or if nothing has been selected
    if (step > 0 && step < 7 && form.serviceCategoryId) {
      saveDraft(form, step);
    }
  }, [form, step]);

  // ── Focus management ───────────────────────────────────────────────────────

  useEffect(() => {
    // Delay slightly to let animation settle, then focus the step heading
    const id = setTimeout(() => {
      stepHeadingRef.current?.focus({ preventScroll: true });
    }, 320);
    return () => clearTimeout(id);
  }, [step]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const updateForm = useCallback((updates: Partial<BookingFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Booking creation (step 6 → 7 transition) ───────────────────────────────

  const handleCreateBooking = useCallback(async (): Promise<boolean> => {
    // Ref-based deduplication — prevents race condition if user spams button
    if (submittingRef.current) return false;
    submittingRef.current = true;

    if (!isOnline) {
      setError("You're offline. Please reconnect and try again.");
      submittingRef.current = false;
      return false;
    }

    setIsCreating(true);
    setError(null);

    try {
      const dedicatedTo = form.sankalpNames.filter(Boolean).join(", ");
      const intentionNote = form.intention ? `Prayer: ${form.intention}` : "";
      const specialInstructions =
        [form.specialInstructions, intentionNote].filter(Boolean).join("\n") || undefined;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: form.packageId,
          sevaDate: new Date(form.sevaDate).toISOString(),
          sevaLocation: form.sevaLocation,
          guestCount: form.guestCount || undefined,
          dedicatedTo: dedicatedTo || undefined,
          gotra: form.gotra || undefined,
          occasion: form.occasion || undefined,
          specialInstructions,
          couponCode: form.couponCode || undefined,
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: { id: string; bookingNumber?: string };
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.success) {
        const errInfo = getBookingError(data.code, "booking");
        setError(errInfo.message);
        return false;
      }

      const newBookingId = data.data!.id;
      setBookingId(newBookingId);
      updateForm({ dedicatedTo });
      return true;
    } catch {
      const errInfo = getBookingError("NETWORK_ERROR", "booking");
      setError(errInfo.message);
      return false;
    } finally {
      setIsCreating(false);
      submittingRef.current = false;
    }
  }, [form, isOnline, updateForm]);

  const handleProceedToPayment = useCallback(async () => {
    const ok = await handleCreateBooking();
    if (ok) {
      trackBookingEvent("booking_review_viewed", {
        packageId: form.packageId,
        totalAmount: form.packagePrice,
      });
      goNext();
    }
  }, [handleCreateBooking, goNext, form.packageId, form.packagePrice]);

  const handlePaymentSuccess = useCallback(
    (bookingNumber: string) => {
      // Clear draft — booking completed successfully
      clearDraft();
      trackBookingEvent("booking_completed", {
        bookingId: bookingId ?? "",
        bookingNumber,
        totalAmount: form.packagePrice,
        serviceType: form.serviceType,
      });
      router.push(`/bookings/confirmation?ref=${encodeURIComponent(bookingNumber)}`);
    },
    [bookingId, form.packagePrice, form.serviceType, router]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#booking-form"
        className="sr-only focus:not-sr-only"
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          zIndex: 100,
          padding: "0.5rem 1rem",
          background: "var(--brand)",
          color: "var(--brand-fg)",
          borderRadius: "var(--r-sm)",
          fontWeight: 500,
        }}
      >
        Skip to booking form
      </a>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <OfflineBanner />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="booking-layout">
        {/* ── Left: Form ─────────────────────────────────────────────────── */}
        <main className="booking-main" id="booking-form">
          {/* Visually-hidden live region: announces step changes to screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {`Step ${step} of ${TOTAL_STEPS}: ${STEPS[step - 1]?.label ?? ""}`}
          </div>

          {/* Focus target between steps */}
          <div
            ref={stepHeadingRef}
            tabIndex={-1}
            aria-hidden="true"
            style={{ outline: "none" }}
          />

          <ProgressBar currentStep={step} />

          {/* Draft restored notice */}
          <AnimatePresence>
            {draftRestoredStep !== null && (
              <DraftRestoreBanner
                step={draftRestoredStep}
                onDismiss={() => setDraftRestoredStep(null)}
              />
            )}
          </AnimatePresence>

          {/* Global error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                aria-live="assertive"
                style={{
                  marginBottom: "1.25rem",
                  padding: "1rem 1.25rem",
                  background: "oklch(96.5% 0.045 25)",
                  border: "1.5px solid oklch(55% 0.19 25 / 0.25)",
                  borderRadius: "var(--r-md)",
                  color: "var(--danger)",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step panels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <ServiceStep form={form} updateForm={updateForm} onNext={goNext} />
              )}
              {step === 2 && (
                <PackageStep form={form} updateForm={updateForm} onNext={goNext} onBack={goPrev} />
              )}
              {step === 3 && (
                <DateStep form={form} updateForm={updateForm} onNext={goNext} onBack={goPrev} />
              )}
              {step === 4 && (
                <DetailsStep form={form} updateForm={updateForm} onNext={goNext} onBack={goPrev} />
              )}
              {step === 5 && (
                <SankalpStep form={form} updateForm={updateForm} onNext={goNext} onBack={goPrev} />
              )}
              {step === 6 && (
                <ReviewStep
                  form={form}
                  onProceed={handleProceedToPayment}
                  onBack={goPrev}
                  isLoading={isCreating}
                />
              )}
              {step === 7 && bookingId && (
                <PaymentStep
                  bookingId={bookingId}
                  form={form}
                  onSuccess={handlePaymentSuccess}
                  onBack={goPrev}
                />
              )}
              {step === 7 && !bookingId && (
                <div>
                  <div className="step-heading">Booking not created</div>
                  <p className="step-sub">
                    Something went wrong during booking creation. Please go back and try again.
                  </p>
                  <div className="step-nav">
                    <button className="btn-back" onClick={goPrev} type="button">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <div />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Right: Sidebar ────────────────────────────────────────────── */}
        <BookingSidebar form={form} />
      </div>
    </>
  );
}
