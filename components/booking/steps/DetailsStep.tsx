"use client";

// =============================================================================
// Step 4 — Your details
// React Hook Form + Zod validation; pre-fills from NextAuth session
// =============================================================================

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import type { BookingFormData } from "@/types";

const DetailsSchema = z.object({
  userFirstName: z.string().min(1, "First name is required").max(60),
  userLastName: z.string().min(1, "Last name is required").max(60),
  userPhone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  userEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  userCity: z.string().max(100).optional(),
  occasion: z.string().max(100).optional(),
  specialInstructions: z.string().max(1000).optional(),
});

type DetailsFields = z.infer<typeof DetailsSchema>;

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function DetailsStep({ form, updateForm, onNext, onBack }: Props) {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DetailsFields>({
    resolver: zodResolver(DetailsSchema),
    defaultValues: {
      userFirstName: form.userFirstName,
      userLastName: form.userLastName,
      userPhone: form.userPhone,
      userEmail: form.userEmail,
      userCity: form.userCity,
      occasion: form.occasion,
      specialInstructions: form.specialInstructions,
    },
    mode: "onBlur",
  });

  // Pre-fill from session when available
  useEffect(() => {
    if (session?.user) {
      if (!form.userFirstName && session.user.name) {
        const parts = session.user.name.split(" ");
        setValue("userFirstName", parts[0] ?? "");
        setValue("userLastName", parts.slice(1).join(" ") ?? "");
      }
      if (!form.userEmail && session.user.email) {
        setValue("userEmail", session.user.email);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const onSubmit = (data: DetailsFields) => {
    updateForm({
      userFirstName: data.userFirstName,
      userLastName: data.userLastName,
      userPhone: data.userPhone,
      userEmail: data.userEmail ?? "",
      userCity: data.userCity ?? "",
      occasion: data.occasion ?? "",
      specialInstructions: data.specialInstructions ?? "",
    });
    onNext();
  };

  return (
    <div>
      <div className="step-heading">Your details</div>
      <div className="step-sub">
        These details will appear on your booking confirmation and invoice.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="userFirstName" className="form-label">
              First Name <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="userFirstName"
              type="text"
              autoComplete="given-name"
              placeholder="Ramesh"
              className={`input${errors.userFirstName ? " error" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.userFirstName}
              aria-describedby={errors.userFirstName ? "err-firstName" : undefined}
              {...register("userFirstName")}
            />
            {errors.userFirstName && (
              <span id="err-firstName" className="form-error" role="alert">
                {errors.userFirstName.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userLastName" className="form-label">
              Last Name <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="userLastName"
              type="text"
              autoComplete="family-name"
              placeholder="Sharma"
              className={`input${errors.userLastName ? " error" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.userLastName}
              aria-describedby={errors.userLastName ? "err-lastName" : undefined}
              {...register("userLastName")}
            />
            {errors.userLastName && (
              <span id="err-lastName" className="form-error" role="alert">
                {errors.userLastName.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userPhone" className="form-label">
              Mobile Number <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="userPhone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className={`input${errors.userPhone ? " error" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.userPhone}
              aria-describedby={errors.userPhone ? "err-phone" : undefined}
              {...register("userPhone")}
            />
            {errors.userPhone && (
              <span id="err-phone" className="form-error" role="alert">
                {errors.userPhone.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userEmail" className="form-label">
              Email Address
            </label>
            <input
              id="userEmail"
              type="email"
              autoComplete="email"
              placeholder="ramesh@example.com"
              className={`input${errors.userEmail ? " error" : ""}`}
              aria-invalid={!!errors.userEmail}
              aria-describedby={errors.userEmail ? "err-email" : undefined}
              {...register("userEmail")}
            />
            {errors.userEmail && (
              <span id="err-email" className="form-error" role="alert">
                {errors.userEmail.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userCity" className="form-label">City / State</label>
            <input
              id="userCity"
              type="text"
              autoComplete="address-level2"
              placeholder="Mumbai, Maharashtra"
              className="input"
              {...register("userCity")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="occasion" className="form-label">Occasion</label>
            <select id="occasion" className="input" {...register("occasion")}>
              <option value="">Select occasion (optional)</option>
              <option value="Shraddha / Pitru Paksha">Shraddha / Pitru Paksha</option>
              <option value="Birthday / Anniversary">Birthday / Anniversary</option>
              <option value="Festival Celebration">Festival Celebration</option>
              <option value="Gratitude / Fulfilment of vow">Gratitude / Fulfilment of vow</option>
              <option value="Regular devotional offering">Regular devotional offering</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group full">
            <label htmlFor="specialInstructions" className="form-label">
              Special Instructions
            </label>
            <textarea
              id="specialInstructions"
              placeholder="Any specific requests — preferred temple location, timing, dietary restrictions, etc."
              className="input"
              {...register("specialInstructions")}
            />
            <span className="form-hint">
              Optional. Our team will do their best to accommodate your preferences.
            </span>
          </div>
        </div>

        <div className="step-nav">
          <button className="btn-back" onClick={onBack} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button className="btn-next" type="submit">
            Continue
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
