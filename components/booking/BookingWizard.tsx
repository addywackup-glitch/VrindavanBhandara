"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { ServiceStep } from "./steps/ServiceStep";
import { PackageStep } from "./steps/PackageStep";
import { DateStep } from "./steps/DateStep";
import { DetailsStep } from "./steps/DetailsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { PaymentStep } from "./steps/PaymentStep";
import type { BookingFormData } from "@/types";

const STEPS = [
  { id: 1, label: "Service", icon: "🙏" },
  { id: 2, label: "Package", icon: "📦" },
  { id: 3, label: "Date", icon: "📅" },
  { id: 4, label: "Details", icon: "📝" },
  { id: 5, label: "Review", icon: "✅" },
  { id: 6, label: "Payment", icon: "💳" },
];

const INITIAL_FORM: BookingFormData = {
  serviceCategoryId: "",
  serviceType: "",
  serviceName: "",
  packageId: "",
  packageName: "",
  packagePrice: 0,
  sevaDate: "",
  sevaLocation: "VRINDAVAN",
  guestCount: 0,
  dedicatedTo: "",
  gotra: "",
  occasion: "",
  specialInstructions: "",
  couponCode: "",
  userName: "",
  userEmail: "",
  userPhone: "",
};

export function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = useCallback((updates: Partial<BookingFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => {
    setStep((s) => Math.min(s + 1, STEPS.length));
    setError(null);
  };

  const goPrev = () => {
    setStep((s) => Math.max(s - 1, 1));
    setError(null);
  };

  const handleCreateBooking = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: form.packageId,
          sevaDate: new Date(form.sevaDate).toISOString(),
          sevaLocation: form.sevaLocation,
          guestCount: form.guestCount || undefined,
          dedicatedTo: form.dedicatedTo || undefined,
          gotra: form.gotra || undefined,
          occasion: form.occasion || undefined,
          specialInstructions: form.specialInstructions || undefined,
          couponCode: form.couponCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to create booking. Please try again.");
        return false;
      }
      setBookingId(data.data.id);
      return true;
    } catch {
      setError("Network error. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextFromReview = async () => {
    const ok = await handleCreateBooking();
    if (ok) goNext();
  };

  const handlePaymentSuccess = (bookingNumber: string) => {
    router.push(`/bookings/confirmation?ref=${bookingNumber}`);
  };

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return !!form.serviceCategoryId;
      case 2: return !!form.packageId;
      case 3: return !!form.sevaDate;
      case 4: return true; // Zod validated inside DetailsStep
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="section-label">Book Your Seva</span>
          <h1 className="font-heading text-3xl md:text-4xl text-charcoal mt-2">
            Complete Your Sacred Seva Booking
          </h1>
          <div className="divider-gold mx-auto mt-3" />
        </div>

        {/* Step Indicator */}
        <div className="relative mb-10">
          <div className="flex items-center justify-between relative z-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    s.id < step
                      ? "bg-gradient-gold text-white shadow-glow-gold"
                      : s.id === step
                      ? "bg-gradient-gold text-white shadow-luxury ring-4 ring-gold-200"
                      : "bg-white text-gray-300 border-2 border-gray-200"
                  }`}
                >
                  {s.id < step ? <Check className="w-4 h-4" /> : <span>{s.icon}</span>}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide hidden sm:block ${
                    s.id <= step ? "text-gold-600" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 h-0.5 transition-all duration-500 ${
                      s.id < step ? "bg-gradient-gold" : "bg-gray-200"
                    }`}
                    style={{
                      left: `${(i / (STEPS.length - 1)) * 100 + 100 / STEPS.length / 2}%`,
                      width: `${100 / (STEPS.length - 1) - 100 / STEPS.length}%`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Step Content */}
        <div className="card-luxury p-6 md:p-10 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <ServiceStep form={form} updateForm={updateForm} onNext={goNext} />
              )}
              {step === 2 && (
                <PackageStep form={form} updateForm={updateForm} onNext={goNext} />
              )}
              {step === 3 && (
                <DateStep form={form} updateForm={updateForm} />
              )}
              {step === 4 && (
                <DetailsStep form={form} updateForm={updateForm} onNext={goNext} />
              )}
              {step === 5 && (
                <ReviewStep form={form} />
              )}
              {step === 6 && bookingId && (
                <PaymentStep
                  bookingId={bookingId}
                  form={form}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < 5 ? (
              <button
                onClick={goNext}
                disabled={!canGoNext() || isLoading}
                className="btn-gold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleNextFromReview}
                disabled={isLoading}
                className="btn-gold px-8 py-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
