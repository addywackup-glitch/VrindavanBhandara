import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Vrindavan Bhandara",
  description: "Privacy Policy for Vrindavan Bhandara. How we collect, use, and protect your personal data.",
  alternates: { canonical: "https://vrindavanbhandara.com/privacy-policy" },
};

const LAST_UPDATED = "January 1, 2025";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container max-w-3xl">
        <div className="card-luxury p-8 md:p-12">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-charcoal mb-2">Privacy Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
            <div className="divider-gold mt-3" />
          </div>

          <div className="prose prose-sm max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">1. Information We Collect</h2>
              <p>When you use Vrindavan Bhandara, we collect the following information:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Name, email address, and phone number (during registration)</li>
                <li>Seva booking details (service type, date, location, dedicated person)</li>
                <li>Payment information (processed securely via Razorpay — we do not store card details)</li>
                <li>Usage data and device information for improving our service</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process and manage your seva bookings</li>
                <li>Send booking confirmations, proof photos, and videos</li>
                <li>Send WhatsApp notifications about your seva status</li>
                <li>Communicate updates about our services</li>
                <li>Improve our platform and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">3. Payment Security</h2>
              <p>
                All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store
                your credit/debit card numbers or UPI details. Razorpay handles all payment encryption and security.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">4. Data Sharing</h2>
              <p>We do not sell your personal data to third parties. We may share data with:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Razorpay — for payment processing</li>
                <li>Our email service provider (Resend) — for sending confirmation emails</li>
                <li>WhatsApp Business API — for notification delivery</li>
                <li>Law enforcement — if required by applicable law</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">5. Data Retention</h2>
              <p>
                We retain your booking and account data for a minimum of 7 years for legal and accounting purposes.
                You may request deletion of your account by contacting us at seva@vrindavanbhandara.com.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account (subject to legal retention requirements)</li>
                <li>Withdraw consent for marketing communications at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">7. Contact Us</h2>
              <p>
                For any privacy-related queries, contact us at:{" "}
                <a href="mailto:seva@vrindavanbhandara.com" className="text-gold-600 hover:underline">
                  seva@vrindavanbhandara.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
