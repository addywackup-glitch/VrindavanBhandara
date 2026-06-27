import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "All Seva Services — Vrindavan Bhandara",
  description: "Browse all sacred seva services available in Vrindavan and Mathura — Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, Festival Seva, and Annadan.",
  alternates: { canonical: "https://vrindavanbhandara.com/services" },
};

async function getServices() {
  try {
    return await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
        },
        _count: { select: { packages: true } },
      },
    });
  } catch {
    return [];
  }
}

const FALLBACK = [
  { slug: "bhandara", name: "Bhandara Booking", icon: "🍱", shortDesc: "Large-scale community feast for hundreds of devotees in Vrindavan/Mathura.", minPrice: 5000 },
  { slug: "brahmin-bhoj", name: "Brahmin Bhoj Seva", icon: "🪔", shortDesc: "Sacred feast for Brahmin priests with full traditional rituals.", minPrice: 2100 },
  { slug: "gau-seva", name: "Gau Seva", icon: "🐄", shortDesc: "Daily, weekly or monthly care for Lord Krishna's sacred cows.", minPrice: 501 },
  { slug: "sadhu-bhojan", name: "Sadhu Bhojan Seva", icon: "🌸", shortDesc: "Provide meals to ascetic saints dedicated to devotion.", minPrice: 1100 },
  { slug: "festival-seva", name: "Festival Seva", icon: "🎊", shortDesc: "Sponsor grand celebrations — Janmashtami, Holi, Radhashtami.", minPrice: 1001 },
  { slug: "annadan", name: "Annadan Seva", icon: "🌾", shortDesc: "Food donation for the needy in the holy dhams.", minPrice: 2001 },
];

export default async function ServicesPage() {
  const services = await getServices();

  const displayServices = services.length > 0
    ? services.map((s) => ({
        slug: s.slug,
        name: s.name,
        icon: s.icon ?? "🙏",
        shortDesc: s.shortDesc,
        minPrice: s.packages[0] ? Number(s.packages[0].price) : null,
        bookingsCount: s._count.packages,
      }))
    : FALLBACK.map((s) => ({ ...s, bookingsCount: 0 }));

  const formatPrice = (p: number | null) =>
    p ? `From ₹${new Intl.NumberFormat("en-IN").format(p)}` : null;

  return (
    <>
      {/* Hero */}
      <section
        className="pt-32 pb-16 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F0F1C 0%, #1A1A2E 40%, #2D1B69 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="container relative">
          <span className="section-label text-gold-400">Our Offerings</span>
          <h1 className="font-heading text-white mt-3" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            All Sacred Seva Services
          </h1>
          <p className="text-white/60 mt-4 max-w-xl mx-auto text-base">
            Every seva performed in the holy land of Vrindavan and Mathura with full devotion
            and transparent proof delivery.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-py">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="card-luxury p-7 flex flex-col group relative overflow-hidden"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,119,34,0.1))", border: "1px solid rgba(212,175,55,0.2)" }}
                >
                  {service.icon}
                </div>

                <h2 className="font-heading text-xl font-bold text-charcoal mb-2 group-hover:text-gold-600 transition-colors">
                  {service.name}
                </h2>

                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">
                  {service.shortDesc}
                </p>

                {service.minPrice && (
                  <p className="text-gold-500 font-bold text-sm mb-4">
                    {formatPrice(service.minPrice)}
                  </p>
                )}

                {service.bookingsCount > 0 && (
                  <p className="text-xs text-gray-400 mb-4">
                    {new Intl.NumberFormat("en-IN").format(service.bookingsCount)} sevas completed
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm font-semibold text-gold-600 group-hover:text-saffron-500 transition-colors mt-auto">
                  View & Book
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* Trust Strip */}
          <div
            className="mt-16 p-6 rounded-2xl text-center"
            style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
          >
            <p className="text-sm text-charcoal font-semibold mb-3">
              🔒 Every seva comes with transparent proof delivery
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
              {["Photo proof", "Video highlight", "Digital certificate", "WhatsApp updates", "24/7 support"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
