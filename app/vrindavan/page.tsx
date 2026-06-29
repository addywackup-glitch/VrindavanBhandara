import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, CheckCircle, ArrowRight } from "lucide-react";

// =============================================================================
// SEO Location Page: Vrindavan
// Source: 08-seo-strategy.md — Location pages for keyword targeting
// Primary keyword: "Bhandara Booking Vrindavan"
// =============================================================================

export const metadata: Metadata = {
  title: "Bhandara Booking in Vrindavan — Online Seva Booking | Vrindavan Bhandara",
  description:
    "Book Bhandara, Brahmin Bhoj Seva, Gau Seva & Festival Seva in Vrindavan online. Transparent proof with photos and videos. Trusted by 10,000+ devotees.",
  keywords: [
    "Bhandara Booking Vrindavan",
    "Vrindavan Bhandara",
    "Brahmin Bhoj Vrindavan",
    "Gau Seva Vrindavan",
    "Annadan Seva Vrindavan",
    "online seva booking Vrindavan",
    "Sadhu Bhojan Vrindavan",
    "Festival Seva Vrindavan",
    "Janmashtami Bhandara Vrindavan",
    "Radhashtami Seva Vrindavan",
  ],
  openGraph: {
    title: "Bhandara Booking in Vrindavan — Online Seva Platform",
    description:
      "Book Bhandara, Brahmin Bhoj, Gau Seva & Festival Seva in the holy dham of Vrindavan. Transparent proof delivery guaranteed.",
    url: "https://vrindavanbhandara.com/vrindavan",
    images: [{ url: "/og-vrindavan.jpg", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://vrindavanbhandara.com/vrindavan" },
};

const vrindavanSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Vrindavan Bhandara — Vrindavan Services",
  description:
    "Book Bhandara, Brahmin Bhoj Seva, Gau Seva, Sadhu Bhojan & Festival Seva in Vrindavan.",
  url: "https://vrindavanbhandara.com/vrindavan",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vrindavan",
    addressRegion: "Uttar Pradesh",
    postalCode: "281121",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "27.5736",
    longitude: "77.6880",
  },
  areaServed: {
    "@type": "City",
    name: "Vrindavan",
  },
};

const VRINDAVAN_SERVICES = [
  { name: "Bhandara Booking", href: "/services/bhandara", icon: "🍱", desc: "Large-scale community feast" },
  { name: "Brahmin Bhoj Seva", href: "/services/brahmin-bhoj", icon: "🪔", desc: "Sacred feast for priests" },
  { name: "Gau Seva", href: "/services/gau-seva", icon: "🐄", desc: "Daily care for sacred cows" },
  { name: "Sadhu Bhojan", href: "/services/sadhu-bhojan", icon: "🌸", desc: "Meals for saints" },
  { name: "Festival Seva", href: "/services/festival-seva", icon: "🎊", desc: "Janmashtami, Radhashtami & more" },
];

const VRINDAVAN_HIGHLIGHTS = [
  { title: "Banke Bihari Temple", desc: "Situated in the heart of Vrindavan, home to Lord Banke Bihari" },
  { title: "Prem Mandir", desc: "Magnificent marble temple dedicated to Radha-Krishna" },
  { title: "ISKCON Vrindavan", desc: "International Society for Krishna Consciousness temple" },
  { title: "Raas Leela Grounds", desc: "Sacred ground where Lord Krishna performed the divine Raas Leela" },
  { title: "Govind Dev Ji Temple", desc: "One of the oldest and most revered temples in Vrindavan" },
  { title: "Yamuna Ghat", desc: "Sacred bathing ghats on the holy river Yamuna" },
];

export default function VrindavanPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vrindavanSchema) }}
      />

      {/* Hero */}
      <section
        className="pt-28 pb-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 40%, #2D1B69 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
        />
        <div className="container relative">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gold-400">Vrindavan</span>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-gold-300 tracking-widest uppercase mb-4"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)" }}>
            📍 Holy Dham
          </span>
          <h1 className="font-heading text-white mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Bhandara Booking in{" "}
            <span className="text-gradient-gold">Vrindavan</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8 leading-relaxed">
            Book Bhandara, Brahmin Bhoj Seva, Gau Seva & Festival Seva in the sacred land of
            Vrindavan — the divine home of Lord Krishna. Every seva performed with full
            devotion and transparent proof delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/services/bhandara" className="btn-gold px-8 py-4">
              Book Bhandara in Vrindavan <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
            <a
              href="https://wa.me/919999999999"
              className="btn-ghost px-8 py-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              📱 WhatsApp Us
            </a>
          </div>
          {/* Trust */}
          <div className="flex flex-wrap gap-6 mt-10">
            {["10,000+ Sevas Done", "Photo & Video Proof", "Transparent Service", "Secure Payment"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-white/60 text-sm">
                <CheckCircle className="w-4 h-4 text-gold-400" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-py bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <span className="section-label">Our Vrindavan Services</span>
            <h2 className="section-title mt-3">Seva Services Available in Vrindavan</h2>
            <div className="divider-gold mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VRINDAVAN_SERVICES.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="card-luxury p-6 group flex items-start gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))" }}
                >
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-heading text-charcoal font-bold group-hover:text-gold-600 transition-colors">{s.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
                  <span className="inline-flex items-center gap-1 text-gold-500 text-xs font-semibold mt-2">
                    Book Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Vrindavan */}
      <section className="section-py" style={{ background: "var(--color-cream)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">About Vrindavan</span>
              <h2 className="section-title mt-3">
                The Sacred Dham of Lord Krishna
              </h2>
              <div className="divider-gold" />
              <div className="space-y-4 mt-6 text-gray-600 leading-relaxed">
                <p>
                  Vrindavan (also known as Vrindaban) is one of the holiest cities in
                  Hinduism, situated along the Yamuna river in the Mathura district of
                  Uttar Pradesh. It is the sacred land where Lord Krishna spent his
                  childhood performing divine Leelas.
                </p>
                <p>
                  Performing seva in Vrindavan is considered an act of immense spiritual
                  merit. Sponsoring a Bhandara (community feast), Brahmin Bhoj, or Gau Seva
                  here earns special divine blessings according to Hindu scripture.
                </p>
                <p>
                  Our platform enables devotees from India and across the world to sponsor
                  these sacred sevas remotely, with full transparency through photos and videos as proof.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <span className="text-charcoal font-semibold">Vrindavan, Mathura, UP — 281121</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {VRINDAVAN_HIGHLIGHTS.map((h) => (
                <div key={h.title} className="card-luxury p-5">
                  <h4 className="font-heading text-charcoal font-bold text-sm mb-2">{h.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Schema for Vrindavan */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How can I book a Bhandara in Vrindavan online?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can book a Bhandara in Vrindavan online through our platform. Simply choose the Bhandara service, select a package, pick your date, fill in the details, and pay securely. You will receive photo and video proof after the seva.",
                },
              },
              {
                "@type": "Question",
                name: "What types of seva can I book in Vrindavan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can book Bhandara, Brahmin Bhoj Seva, Gau Seva, Sadhu Bhojan Seva, and Festival Seva in Vrindavan through our platform.",
                },
              },
              {
                "@type": "Question",
                name: "Do I receive proof that the seva was performed in Vrindavan?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. After every seva, you receive photos and videos as proof. Transparency is our guarantee.",
                },
              },
            ],
          }),
        }}
      />

      {/* CTA */}
      <section
        className="section-py text-center"
        style={{ background: "linear-gradient(135deg, #1A1A2E, #2D1B69)" }}
      >
        <div className="container max-w-2xl">
          <h2 className="font-heading text-white text-3xl md:text-4xl mb-4">
            Book Your Vrindavan Seva Today
          </h2>
          <p className="text-white/60 mb-8">
            Join thousands of devotees who sponsor seva in Vrindavan through our platform.
            Transparent. Trustworthy. Divine.
          </p>
          <Link href="/services" className="btn-gold px-10 py-4 text-base">
            Explore All Sevas <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
