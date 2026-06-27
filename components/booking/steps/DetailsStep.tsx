"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type { BookingFormData } from "@/types";

const DetailsSchema = z.object({
  dedicatedTo: z.string().max(200).optional(),
  gotra: z.string().max(100).optional(),
  occasion: z.string().max(200).optional(),
  specialInstructions: z.string().max(1000).optional(),
  couponCode: z.string().max(30).optional(),
});

type DetailsForm = z.infer<typeof DetailsSchema>;

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
};

const Field = ({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div>
    <label className="block text-sm font-semibold text-charcoal mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
  </div>
);

const inputClass =
  "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none transition-colors text-charcoal text-sm placeholder:text-gray-400";

export function DetailsStep({ form, updateForm, onNext }: Props) {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(DetailsSchema),
    defaultValues: {
      dedicatedTo: form.dedicatedTo,
      gotra: form.gotra,
      occasion: form.occasion,
      specialInstructions: form.specialInstructions,
      couponCode: form.couponCode,
    },
    mode: "onChange",
  });

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      updateForm({
        userName: session.user.name ?? "",
        userEmail: session.user.email ?? "",
      });
    }
  }, [session, updateForm]);

  const onSubmit = (data: DetailsForm) => {
    updateForm({
      dedicatedTo: data.dedicatedTo ?? "",
      gotra: data.gotra ?? "",
      occasion: data.occasion ?? "",
      specialInstructions: data.specialInstructions ?? "",
      couponCode: data.couponCode ?? "",
    });
    onNext();
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-charcoal mb-2">Seva Details</h2>
      <p className="text-gray-500 text-sm mb-8">
        Personalize your seva. These details will appear on your certificate.
      </p>

      {/* Booker Info (read-only from session) */}
      {session?.user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gold-50 border border-gold-200"
        >
          <p className="text-xs font-semibold text-gold-700 mb-2 uppercase tracking-wide">Booking For</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-white text-sm font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field
          label="Dedicated To (Sankalp)"
          hint="Who is this seva dedicated to? (e.g., 'In memory of Late Ramesh Sharma', 'For family's prosperity')"
        >
          <input
            {...register("dedicatedTo")}
            placeholder="e.g., In memory of Late Ramesh Sharma"
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Gotra"
            hint="Your family gotra (if known)"
          >
            <input
              {...register("gotra")}
              placeholder="e.g., Kashyap, Bharadwaj"
              className={inputClass}
            />
          </Field>

          <Field
            label="Occasion"
            hint="What occasion is this seva for?"
          >
            <input
              {...register("occasion")}
              placeholder="e.g., Birthday, Anniversary, Shradh"
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Special Instructions"
          hint="Any specific requirements or prayers you'd like included"
          error={errors.specialInstructions?.message}
        >
          <textarea
            {...register("specialInstructions")}
            rows={3}
            placeholder="Any special requests or prayers..."
            className={inputClass + " resize-none"}
          />
        </Field>

        <Field
          label="Coupon Code"
          hint="Have a discount code? Enter it here"
        >
          <div className="flex gap-3">
            <input
              {...register("couponCode")}
              placeholder="Enter coupon code"
              className={inputClass + " uppercase"}
            />
          </div>
        </Field>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="btn-gold w-full py-4 mt-2 justify-center text-base"
        >
          Review Booking →
        </motion.button>
      </form>
    </div>
  );
}
