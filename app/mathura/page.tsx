import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Bhandara Booking in Mathura — Online Seva Booking | Vrindavan Bhandara",
  description:
    "Book Bhandara, Brahmin Bhoj Seva, Gau Seva & Festival Seva in Mathura — the birthplace of Lord Krishna. Transparent proof with photos and videos.",
  keywords: [
    "Bhandara Booking Mathura",
    "Mathura Bhandara",
    "Brahmin Bhoj Mathura",
    "Gau Seva Mathura",
    "Annadan Seva Mathura",
    "online seva booking Mathura",
    "Janmashtami Bhandara Mathura",
    "Mathura Vrindavan Seva",
    "Krishna Janmabhoomi Seva",
  ],
  openGraph: {
    title: "Bhandara Booking in Mathura — Online Seva Platform",
    description:
      "Book Bhandara, Brahmin Bhoj, Gau Seva & Festival Seva in the birthplace of Lord Krishna — Mathura.",
    url: "https://vrindavanbhandara.com/mathura",
  },
  alternates: { canonical: "https://vrindavanbhandara.com/mathura" },
};

const mathuraSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Vrindavan Bhandara — Mathura Services",
  description: "Book Bhandara, Brahmin Bhoj Seva, Gau Seva & Festival Seva in Mathura.",
  url: "https://vrindavanbhandara.com/mathura",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mathura",
    addressRegion: "Uttar Pradesh",
    postalCode: "281001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "27.4924",
    longitude: "77.6737",
  },
  areaServed: { "@type": "City", name: "Mathura" },
};

const MATHURA_HIGHLIGHTS = [
  { title: "Krishna Janmabhoomi", desc: "The exact birthplace of Lord Krishna — the most sacred spot in Mathura" },
  { title: "Dwarkadhish Temple", desc: "Majestic temple dedicated to Lord Krishna as Dwarkadhish" },
  { title: "Vishram Ghat", desc: "The most sacred ghat in Mathura on the holy Yamuna river" },
  { title: "Gita Mandir", desc: "Temple with the complete Bhagavad Gita engraved on its walls" },
  { title: "Govardhan Hill", desc: "Sacred hill lifted by Lord Krishna — 23km from Mathura" },
  { title: "Keshi Ghat", desc: "Historic ghat where Lord Krishna defeated the demon Keshi" },
];

const MATHURA_SERVICES = [
  { name: "Bhandara Booking", href: "/services/bhandara", icon: "🍱", desc: "Community feast at Mathura" },
  { name: "Brahmin Bhoj Seva", href: "/services/brahmin-bhoj", icon: "🪔", desc: "Sacred feast for Mathura priests" },
  { name: "Gau Seva", href: "/services/gau-seva", icon: "🐄", desc: "Care for Mathura's sacred cows" },
  { name: "Festival Seva", href: "/services/festival-seva", icon: "🎊", desc: "Janmashtami at birthplace" },
];

export default function MathuraPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mathuraSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How can I book a Bhandara in Mathura online?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Book a Bhandara in Mathura by selecting the Bhandara service, choosing Mathura as your location, picking a package and date, and paying securely online. You receive photo and video proof after completion.",
                },
              },
              {
                "@type": "Question",
                name: "Can I book Janmashtami Seva in Mathura?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes! We offer special Janmashtami Festival Seva packages in Mathura at the birthplace of Lord Krishna. Book early as slots fill up fast.",
                },
              },
            ],
          }),
        }}
      />

      {/* Hero */}
      <section
        className="pt-28 pb-20 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 40%, #2D1B69 100%)" }}
      >
        <div className="container relative">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gold-400">Mathura</span>
          </div>
          <h1 className="font-heading text-white mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Bhandara Booking in{" "}
            <span className="text-gradient-gold">Mathura</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8 leading-relaxed">
            Book Bhandara, Brahmin Bhoj Seva, Gau Seva & Janmashtami Festival Seva
            in Mathura — the divine birthplace of Lord Krishna. Transparent proof delivery guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/services/bhandara" className="btn-gold px-8 py-4">
              Book Bhandara in Mathura <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 mt-10">
            {["Birthplace of Lord Krishna", "Transparent Proof", "Photo & Video Proof", "Secure Payment"].map((t) => (
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
            <span className="section-label">Our Mathura Services</span>
            <h2 className="section-title mt-3">Seva Services Available in Mathura</h2>
            <div className="divider-gold mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MATHURA_SERVICES.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="card-luxury p-6 group text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))" }}
                >
                  {s.icon}
                </div>
                <h3 className="font-heading text-charcoal font-bold group-hover:text-gold-600 transition-colors text-sm">{s.name}</h3>
                <p className="text-gray-500 text-xs mt-2">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Mathura */}
      <section className="section-py" style={{ background: "var(--color-cream)" }}>
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">About Mathura</span>
              <h2 className="section-title mt-3">Birthplace of Lord Krishna</h2>
              <div className="divider-gold" />
              <div className="space-y-4 mt-6 text-gray-600 leading-relaxed">
                <p>
                  Mathura is one of the seven sacred cities (Sapta Puri) of Hinduism and
                  the birthplace of Lord Sri Krishna. Located on the banks of the sacred
                  Yamuna river, Mathura is a major pilgrimage destination for devotees
                  worldwide.
                </p>
                <p>
                  Performing seva in Mathura — especially Bhandara, Brahmin Bhoj, and
                  Janmashtami Festival Seva — is considered one of the greatest spiritual
                  acts. The merit earned is believed to be multiplied manifold in this
                  holy land.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <MapPin className="w-5 h-5 text-gold-500" />
                <span className="text-charcoal font-semibold">Mathura, Uttar Pradesh — 281001</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {MATHURA_HIGHLIGHTS.map((h) => (
                <div key={h.title} className="card-luxury p-5">
                  <h4 className="font-heading text-charcoal font-bold text-sm mb-2">{h.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-py text-center" style={{ background: "linear-gradient(135deg, #1A1A2E, #2D1B69)" }}>
        <div className="container max-w-2xl">
          <h2 className="font-heading text-white text-3xl md:text-4xl mb-4">
            Book Seva in Mathura Today
          </h2>
          <p className="text-white/60 mb-8">
            Sponsor a sacred seva in the birthplace of Lord Krishna. Transparent. Trustworthy. Divine.
          </p>
          <Link href="/services" className="btn-gold px-10 py-4 text-base">
            Explore All Sevas <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
