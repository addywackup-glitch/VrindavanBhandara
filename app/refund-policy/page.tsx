import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Vrindavan Bhandara",
  description: "Refund and cancellation policy for Vrindavan Bhandara seva bookings.",
  alternates: { canonical: "https://vrindavanbhandara.com/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container max-w-3xl">
        <div className="card-luxury p-8 md:p-12">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-charcoal mb-2">Refund & Cancellation Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: January 1, 2025</p>
            <div className="divider-gold mt-3" />
          </div>

          <div className="prose prose-sm max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">1. Cancellation by Customer</h2>
              <div
                className="p-4 rounded-xl mb-4"
                style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}
              >
                <p className="text-sm font-semibold text-charcoal mb-2">Cancellation Window</p>
                <ul className="text-sm space-y-1">
                  <li>✅ <strong>More than 48 hours before seva date:</strong> 100% refund</li>
                  <li>⚠️ <strong>24–48 hours before seva date:</strong> 50% refund</li>
                  <li>❌ <strong>Less than 24 hours before seva date:</strong> No refund (seva preparations already underway)</li>
                </ul>
              </div>
              <p>To cancel a booking, contact us at seva@vrindavanbhandara.com or WhatsApp +91 99999 99999 with your booking reference number.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">2. Cancellation by Vrindavan Bhandara</h2>
              <p>In rare circumstances (natural disasters, curfew, temple closures, force majeure), we may need to cancel or reschedule your seva. In such cases:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>We will notify you immediately via email and WhatsApp</li>
                <li>You will receive the option to reschedule to any future date at no extra charge</li>
                <li>If you prefer a refund, 100% of your payment will be returned within 5-7 working days</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">3. Refund Processing</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Refunds are processed to the original payment method (card, UPI, netbanking)</li>
                <li>Processing time: 5–7 working days (depending on your bank)</li>
                <li>We do not charge any cancellation or processing fees</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">4. Non-Refundable Items</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sevas that have already been completed and proof delivered</li>
                <li>Festival seva bookings cancelled less than 7 days before the festival date</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">5. Contact for Refunds</h2>
              <p>
                Email: <a href="mailto:seva@vrindavanbhandara.com" className="text-gold-600 hover:underline">seva@vrindavanbhandara.com</a>
                <br />
                WhatsApp: <a href="https://wa.me/919999999999" className="text-gold-600 hover:underline">+91 99999 99999</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
