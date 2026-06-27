"use client";

import { motion } from "framer-motion";
import { MapPin, CalendarDays, Package, Tag, CheckCircle } from "lucide-react";
import type { BookingFormData } from "@/types";

type Props = { form: BookingFormData };

const Row = ({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) => (
  <div className="flex items-start justify-between py-3.5 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      {Icon && <Icon className="w-4 h-4 text-gold-400" />}
      {label}
    </div>
    <span className="text-charcoal text-sm font-semibold text-right max-w-[60%]">{value}</span>
  </div>
);

export function ReviewStep({ form }: Props) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  const formattedDate = form.sevaDate
    ? new Date(form.sevaDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div>
      <h2 className="font-heading text-2xl text-charcoal mb-2">Review Your Booking</h2>
      <p className="text-gray-500 text-sm mb-8">
        Please verify all details before proceeding to payment.
      </p>

      <div className="space-y-6">
        {/* Seva Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-gray-100"
        >
          <div className="px-5 py-3 bg-gradient-to-r from-gold-50 to-cream-100 border-b border-gold-100">
            <h3 className="font-heading text-sm font-bold text-gold-700 uppercase tracking-widest">
              Seva Summary
            </h3>
          </div>
          <div className="px-5 bg-white">
            <Row label="Service" value={form.serviceName} icon={CheckCircle} />
            <Row label="Package" value={form.packageName} icon={Package} />
            <Row label="Location" value={form.sevaLocation === "VRINDAVAN" ? "Vrindavan, Uttar Pradesh" : "Mathura, Uttar Pradesh"} icon={MapPin} />
            <Row label="Seva Date" value={formattedDate} icon={CalendarDays} />
            {form.dedicatedTo && <Row label="Dedicated To" value={form.dedicatedTo} />}
            {form.gotra && <Row label="Gotra" value={form.gotra} />}
            {form.occasion && <Row label="Occasion" value={form.occasion} />}
            {form.specialInstructions && (
              <Row label="Special Instructions" value={form.specialInstructions} />
            )}
          </div>
        </motion.div>

        {/* Pricing Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-5 py-3 bg-gradient-to-r from-gold-50 to-cream-100 border-b border-gold-100">
            <h3 className="font-heading text-sm font-bold text-gold-700 uppercase tracking-widest">
              Price Summary
            </h3>
          </div>
          <div className="px-5 bg-white">
            <Row label="Package Price" value={formatPrice(form.packagePrice)} />
            {form.couponCode && (
              <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Tag className="w-4 h-4" />
                  Coupon: <span className="font-bold uppercase">{form.couponCode}</span>
                </div>
                <span className="text-green-600 text-sm font-semibold">Applied ✓</span>
              </div>
            )}
            <div className="flex items-center justify-between py-4">
              <span className="font-heading font-bold text-base text-charcoal">Total</span>
              <span className="text-xl font-bold text-gradient-gold">
                {formatPrice(form.packagePrice)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Trust Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl text-center"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <p className="text-xs text-gray-500">
            🔒 Payment is 100% secured by <strong>Razorpay</strong>. You will receive photo/video proof
            and a digital certificate after your seva is completed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
