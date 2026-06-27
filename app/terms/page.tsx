import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Vrindavan Bhandara",
  description: "Terms and Conditions for using Vrindavan Bhandara services.",
  alternates: { canonical: "https://vrindavanbhandara.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container max-w-3xl">
        <div className="card-luxury p-8 md:p-12">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-charcoal mb-2">Terms &amp; Conditions</h1>
            <p className="text-gray-400 text-sm">Last updated: January 1, 2025</p>
            <div className="divider-gold mt-3" />
          </div>

          <div className="prose prose-sm max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using Vrindavan Bhandara (vrindavanbhandara.com), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">2. Our Services</h2>
              <p>Vrindavan Bhandara provides an online platform for booking sacred sevas (religious services) to be performed in Vrindavan and Mathura, including Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, Festival Seva, and Annadan Seva.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">3. Booking and Payment</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bookings are confirmed only after successful payment</li>
                <li>All prices are in Indian Rupees (INR) and inclusive of applicable taxes</li>
                <li>You must be at least 18 years old to make a booking</li>
                <li>Bookings must be made at least 2 days before the seva date</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">4. Proof of Seva</h2>
              <p>We commit to providing photo/video proof of your seva as described in your chosen package. Proof will be delivered to your registered email and accessible from your dashboard within 24 hours of seva completion.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">5. Prohibited Uses</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Make fraudulent bookings or use false payment methods</li>
                <li>Abuse, misuse, or exploit our platform in any way</li>
                <li>Attempt to hack, reverse engineer, or compromise our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">6. Limitation of Liability</h2>
              <p>Vrindavan Bhandara shall not be liable for force majeure events including natural disasters, pandemics, government orders, or religious authority decisions that prevent a seva from being performed. In such cases, rescheduling or refund options will be provided.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">7. Governing Law</h2>
              <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mathura, Uttar Pradesh.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal mb-3">8. Contact</h2>
              <p>
                For terms-related queries: <a href="mailto:seva@vrindavanbhandara.com" className="text-gold-600 hover:underline">seva@vrindavanbhandara.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
