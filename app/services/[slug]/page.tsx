import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Check, ArrowRight } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

const SERVICE_META: Record<string, { title: string; desc: string; schema: string }> = {
  bhandara: {
    title: "Bhandara Booking in Vrindavan & Mathura — Online | Vrindavan Bhandara",
    desc: "Book Bhandara online in Vrindavan or Mathura. Feed 100 to 5,000+ devotees with photo proof, video, and digital certificate. Starting ₹5,000.",
    schema: "Bhandara",
  },
  "brahmin-bhoj": {
    title: "Brahmin Bhoj Seva Online — Vrindavan & Mathura | Vrindavan Bhandara",
    desc: "Perform Brahmin Bhoj for 5 to 51+ Brahmins online. Book in Vrindavan or Mathura with full rituals, photo proof, and digital certificate.",
    schema: "Brahmin Bhoj",
  },
  "gau-seva": {
    title: "Gau Seva Online Booking — Vrindavan | Vrindavan Bhandara",
    desc: "Book Gau Seva online in Vrindavan. Sponsor sacred cow care — daily, weekly, or monthly. Photo proof included.",
    schema: "Gau Seva",
  },
  "sadhu-bhojan": {
    title: "Sadhu Bhojan Seva — Book Online in Vrindavan | Vrindavan Bhandara",
    desc: "Sponsor Sadhu Bhojan Seva in Vrindavan. Provide meals to ascetic saints. Photo proof and digital certificate provided.",
    schema: "Sadhu Bhojan",
  },
  "festival-seva": {
    title: "Festival Seva Vrindavan — Janmashtami, Holi, Radhashtami | Vrindavan Bhandara",
    desc: "Book Festival Seva for Janmashtami, Holi, Radhashtami in Vrindavan & Mathura. Special event sponsorship with photo/video proof.",
    schema: "Festival Seva",
  },
  annadan: {
    title: "Annadan Seva Online Booking — Vrindavan & Mathura | Vrindavan Bhandara",
    desc: "Book Annadan Seva online — donate food to the needy in Vrindavan or Mathura. Photo proof provided.",
    schema: "Annadan",
  },
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const meta = SERVICE_META[slug];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.desc,
    alternates: { canonical: `https://vrindavanbhandara.com/services/${slug}` },
  };
}

async function getService(slug: string) {
  try {
    return await prisma.serviceCategory.findUnique({
      where: { slug },
      include: {
        packages: {
          where: { isActive: true },
          include: { items: { orderBy: { sortOrder: "asc" } } },
          orderBy: { price: "asc" },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const formatPrice = (p: unknown) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(p));

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
        <div className="container relative max-w-4xl">
          <Link href="/services" className="inline-flex items-center gap-2 text-white/40 hover:text-gold-400 text-xs transition-colors mb-6">
            ← All Services
          </Link>
          <div className="flex items-center gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,119,34,0.15))", border: "1px solid rgba(212,175,55,0.3)" }}
            >
              {service.icon ?? "🙏"}
            </div>
            <div>
              <h1 className="font-heading text-white" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
                {service.name}
              </h1>
              <p className="text-white/50 text-sm mt-1">{service.shortDesc}</p>
            </div>
          </div>
          <p className="text-white/70 text-base leading-relaxed max-w-2xl">
            {service.description}
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className="section-py bg-ivory-100">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <span className="section-label">Choose a Package</span>
            <h2 className="font-heading text-3xl text-charcoal mt-2">Select Your Seva Package</h2>
            <div className="divider-gold mx-auto mt-3" />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {service.packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`card-luxury p-7 relative ${pkg.isFeatured ? "ring-2 ring-gold-400 ring-offset-2" : ""}`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-5">
                    <span className="badge badge-gold text-xs px-3 py-1.5">
                      {pkg.badge === "Most Popular" ? "⭐ " : ""}
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <h3 className="font-heading text-xl font-bold text-charcoal mb-1">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">{pkg.description}</p>

                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-3xl font-bold text-gradient-gold font-heading">
                    {formatPrice(pkg.price)}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(pkg.originalPrice)}
                    </span>
                  )}
                </div>

                {pkg.items.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {pkg.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                        {item.description}
                        {item.quantity > 1 && (
                          <span className="text-gold-500 font-medium ml-auto text-xs">
                            ×{item.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={`/book?service=${service.slug}&package=${pkg.id}`}
                  className={`w-full justify-center py-3 text-sm rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    pkg.isFeatured
                      ? "btn-gold"
                      : "border-2 border-gold-300 text-gold-600 hover:bg-gold-50 hover:border-gold-400"
                  }`}
                >
                  Book This Package
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Trust Guarantee */}
          <div
            className="mt-12 p-6 rounded-2xl flex flex-wrap gap-6 justify-center items-center"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}
          >
            {[
              { icon: "📸", text: "Photo proof of your seva" },
              { icon: "🎥", text: "Video highlight (select packages)" },
              { icon: "📜", text: "Digital completion certificate" },
              { icon: "💬", text: "WhatsApp progress updates" },
              { icon: "🔒", text: "100% secure Razorpay payments" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600">
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
