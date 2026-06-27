"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import type { BookingFormData } from "@/types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type Props = {
  bookingId: string;
  form: BookingFormData;
  onSuccess: (bookingNumber: string) => void;
};

export function PaymentStep({ bookingId, form, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rzpLoaded, setRzpLoaded] = useState(false);

  // Dynamically load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync state update here avoids stale callback; Razorpay already loaded
      setRzpLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRzpLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  const handlePayment = async () => {
    if (!rzpLoaded) {
      setError("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        setError(orderData.error ?? "Failed to initiate payment. Please try again.");
        setIsLoading(false);
        return;
      }

      const { orderId, currency, bookingNumber } = orderData.data;

      // Step 2: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: form.packagePrice * 100,
        currency,
        name: "Vrindavan Bhandara",
        description: `${form.serviceName} — ${form.packageName}`,
        order_id: orderId,
        prefill: {
          name: form.userName,
          email: form.userEmail,
          contact: form.userPhone,
        },
        theme: { color: "#D4AF37" },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment
          setIsLoading(true);
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onSuccess(bookingNumber);
            } else {
              setError(verifyData.error ?? "Payment verification failed. Contact support.");
            }
          } catch {
            setError("Verification error. Your payment may have been captured — please contact support.");
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError("Could not start payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-glow-gold animate-pulse-gold">
        <span className="text-3xl">💳</span>
      </div>

      <h2 className="font-heading text-2xl text-charcoal mb-2">Secure Payment</h2>
      <p className="text-gray-500 text-sm mb-8">
        You&apos;re one step away from completing your seva booking.
      </p>

      {/* Amount Card */}
      <div
        className="rounded-2xl p-6 mb-6 text-left"
        style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,119,34,0.05))", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">{form.serviceName}</span>
          <span className="text-xs badge badge-gold">{form.packageName}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-500">Total Amount</span>
          <span className="text-3xl font-bold text-gradient-gold font-heading">
            {formatPrice(form.packagePrice)}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Pay Button */}
      <motion.button
        onClick={handlePayment}
        disabled={isLoading || !rzpLoaded}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-gold w-full py-4 text-base justify-center mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Pay {formatPrice(form.packagePrice)} Securely
          </>
        )}
      </motion.button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
        {["256-bit SSL", "Razorpay Secured", "PCI DSS"].map((t) => (
          <div key={t} className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            {t}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 mt-4">
        You&apos;ll receive a booking confirmation email immediately after payment.
      </p>
    </div>
  );
}
