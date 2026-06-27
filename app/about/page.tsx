import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us — Vrindavan Bhandara",
  description: "Learn about Vrindavan Bhandara — India's most trusted platform for booking sacred sevas in Vrindavan and Mathura. Our mission, vision, and values.",
  alternates: { canonical: "https://vrindavanbhandara.com/about" },
};

const TEAM_PILLARS = [
  {
    icon: "🙏",
    title: "Devotion First",
    desc: "Every seva is performed with complete devotion and sincerity by our trusted team on the ground in Vrindavan and Mathura.",
  },
  {
    icon: "📸",
    title: "Radical Transparency",
    desc: "We believe in 100% transparency. Every booking comes with photo/video proof and a digital certificate so you can trust your seva was completed.",
  },
  {
    icon: "🔒",
    title: "Security & Trust",
    desc: "PCI-DSS compliant payments via Razorpay. Your personal and payment data is always secure with us.",
  },
  {
    icon: "🌍",
    title: "Serving the Global Diaspora",
    desc: "We have served devotees from 50+ countries who cannot visit Vrindavan in person but wish to sponsor sacred sevas.",
  },
];

const STATS = [
  { value: "2,50,000+", label: "Meals Served" },
  { value: "1,200+", label: "Bhandaras Completed" },
  { value: "52+", label: "Countries Served" },
  { value: "8,500+", label: "Certificates Issued" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 50%, #2D1B69 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="container max-w-3xl text-center relative">
          <span className="section-label text-gold-400">Our Story</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Connecting Devotees Worldwide With the Sacred Land of Vrindavan
          </h1>
          <p className="text-white/60 mt-5 text-base leading-relaxed">
            Vrindavan Bhandara was founded with a simple mission — to make sacred seva accessible
            to every devotee, wherever they are in the world, with complete trust and transparency.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-heading text-3xl font-bold text-gradient-gold">{value}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-py">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <span className="section-label">Who We Are</span>
            <h2 className="font-heading text-3xl text-charcoal mt-2">
              Born From Devotion
            </h2>
            <div className="divider-gold mx-auto mt-3" />
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4">
            <p>
              Vrindavan Bhandara was born from a deeply personal desire — to honour the tradition of
              Bhandara and sacred seva in the holy dhams of Vrindavan and Mathura, and make it accessible
              to millions of devotees around the world who cannot always be physically present.
            </p>
            <p>
              The holy land of Vrindavan is where Lord Krishna spent his divine childhood. Mathura is
              where he was born. These are not just cities — they are living, breathing temples where every
              step, every breath, every morsel of food offered carries immense spiritual merit.
            </p>
            <p>
              We have built Vrindavan Bhandara on three pillars: <strong>Devotion, Transparency, and Trust</strong>.
              When you book a seva with us, you are not just making a digital transaction — you are
              participating in a sacred act that has been performed for thousands of years in these holy lands.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid sm:grid-cols-2 gap-5 mt-12">
            {TEAM_PILLARS.map(({ icon, title, desc }) => (
              <div key={title} className="card-luxury p-6">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-heading text-base font-bold text-charcoal mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Ready to begin your seva journey?
            </p>
            <Link href="/book" className="btn-gold px-8 py-4 text-base">
              🙏 Book Your First Seva
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
