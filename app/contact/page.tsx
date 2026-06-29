import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Vrindavan Bhandara",
  description: "Contact Vrindavan Bhandara for seva bookings, custom packages, and inquiries. Available on WhatsApp, email, and phone 7 days a week.",
  alternates: { canonical: "https://vrindavanbhandara.com/contact" },
};

const CONTACT_INFO = [
  {
    icon: Phone,
    label: "WhatsApp / Phone",
    value: "+91 99999 99999",
    href: "https://wa.me/919999999999",
    desc: "Available 9 AM – 9 PM IST",
  },
  {
    icon: Mail,
    label: "Email",
    value: "seva@vrindavanbhandara.com",
    href: "mailto:seva@vrindavanbhandara.com",
    desc: "Response within 4 hours",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Vrindavan, Uttar Pradesh",
    href: "https://maps.google.com/?q=Vrindavan,Uttar+Pradesh",
    desc: "Serving all major mandirs",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "7 Days a Week",
    href: null,
    desc: "9:00 AM – 9:00 PM IST",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-16 text-center relative"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 50%, #2D1B69 100%)" }}
      >
        <div className="container">
          <span className="section-label text-gold-400">Get in Touch</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-white/60 mt-3 max-w-lg mx-auto text-sm">
            For custom seva packages, corporate bookings, or any questions — our team is ready to help.
          </p>
        </div>
      </section>

      <section className="section-py" style={{ background: "#FFFCF8" }}>
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Cards */}
            <div>
              <h2 className="font-heading text-xl font-bold text-charcoal mb-6">
                Contact Information
              </h2>
              <div className="space-y-4">
                {CONTACT_INFO.map(({ icon: Icon, label, value, href, desc }) => (
                  <div
                    key={label}
                    className="card-luxury p-5 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-100 to-cream-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-charcoal font-semibold text-sm hover:text-gold-600 transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-charcoal font-semibold text-sm">{value}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/919999999999?text=Jai+Shri+Krishna%21+I+would+like+to+book+a+seva."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full justify-center py-4 mt-6 text-base"
              >
                💬 Chat on WhatsApp — Instant Response
              </a>
            </div>

            {/* Enquiry Form */}
            <div className="card-luxury p-7">
              <h2 className="font-heading text-xl font-bold text-charcoal mb-6">
                Send Us a Message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
