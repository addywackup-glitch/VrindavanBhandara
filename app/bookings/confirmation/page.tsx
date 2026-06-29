"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Home } from "lucide-react";

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "—";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-28 h-28 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-8 shadow-glow-gold"
        >
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-3">
            🙏 Seva Confirmed!
          </h1>
          <p className="text-gray-500 text-base mb-6 leading-relaxed">
            Your sacred seva has been booked and your payment has been received.
            Our team in Vrindavan will perform the seva on your selected date.
          </p>

          {/* Booking ref */}
          <div
            className="inline-block px-6 py-3 rounded-xl mb-8"
            style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
          >
            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-widest">
              Booking Reference
            </p>
            <p className="text-2xl font-bold text-gradient-gold font-heading tracking-wider">
              {ref}
            </p>
          </div>

          {/* What happens next */}
          <div className="card-luxury p-6 text-left mb-8">
            <h3 className="font-heading text-base font-bold text-charcoal mb-4">
              What Happens Next
            </h3>
            <div className="space-y-3">
              {[
                { icon: "📧", text: "Booking confirmation email sent to your inbox" },
                { icon: "📸", text: "We'll send photos & video proof on seva day" },
                { icon: "📸", text: "Photo & video proof shared after seva completion" },
                { icon: "💬", text: "WhatsApp updates on your seva progress" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/bookings" className="btn-gold px-6 py-3 justify-center">
              View My Bookings
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/" className="btn-ghost px-6 py-3 justify-center">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold-200 border-t-gold-500 animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
