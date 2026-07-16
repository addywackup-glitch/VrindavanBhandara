import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ServiceDetailTabs } from "@/components/services/ServiceDetailTabs";
import { PackageSelector } from "@/components/services/PackageSelector";

// =============================================================================
// Types
// =============================================================================
type Params = { params: Promise<{ slug: string }> };

type Benefit = { title: string; description: string };

// =============================================================================
// generateStaticParams — pre-render service pages at build time
// =============================================================================
export async function generateStaticParams() {
  try {
    const services = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return services.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

// =============================================================================
// generateMetadata
// =============================================================================
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const service = await prisma.serviceCategory.findUnique({
      where: { slug },
      select: {
        name: true,
        metaTitle: true,
        metaDesc: true,
        shortDesc: true,
        description: true,
      },
    });
    if (!service) return {};

    const title =
      service.metaTitle ??
      `${service.name} in Vrindavan & Mathura — Online | Vrindavan Bhandara`;
    const description = service.metaDesc ?? service.shortDesc;

    return {
      title,
      description,
      openGraph: { title, description, url: `https://vrindavanbhandara.com/services/${slug}` },
      alternates: { canonical: `https://vrindavanbhandara.com/services/${slug}` },
    };
  } catch {
    return {};
  }
}

// =============================================================================
// Data fetching
// =============================================================================
async function getServiceData(slug: string) {
  try {
    const [service, testimonials, relatedServices] = await Promise.all([
      prisma.serviceCategory.findUnique({
        where: { slug },
        include: {
          packages: {
            where: { isActive: true },
            include: { items: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),

      prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: { id: true, name: true, city: true, rating: true, comment: true },
      }),

      prisma.serviceCategory.findMany({
        where: { isActive: true, slug: { not: slug } },
        orderBy: { sortOrder: "asc" },
        take: 4,
        include: {
          packages: {
            where: { isActive: true },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
      }),
    ]);

    if (!service) return null;

    // Gallery images for this service type
    let gallery: Array<{ id: string; url: string; thumbnail: string | null; title: string | null }> = [];
    try {
      gallery = await prisma.galleryImage.findMany({
        where: { serviceType: service.type, isActive: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        take: 6,
        select: { id: true, url: true, thumbnail: true, title: true },
      });
    } catch {
      gallery = [];
    }

    // FAQs for this service type + general FAQs
    let faqs: Array<{ id: string; question: string; answer: string }> = [];
    try {
      faqs = await prisma.fAQ.findMany({
        where: {
          isActive: true,
          OR: [{ serviceType: service.type }, { serviceType: null }],
        },
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: { id: true, question: true, answer: true },
      });
    } catch {
      faqs = [];
    }

    return { service, testimonials, relatedServices, gallery, faqs };
  } catch {
    return null;
  }
}

// =============================================================================
// Helpers
// =============================================================================
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function extractBenefits(pageSections: unknown): Benefit[] {
  if (!pageSections || typeof pageSections !== "object") return [];
  const ps = pageSections as Record<string, unknown>;
  const benefits = ps["benefits"];
  if (!Array.isArray(benefits)) return [];
  return benefits
    .filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
    .map((b) => ({
      title: String(b["title"] ?? ""),
      description: String(b["description"] ?? ""),
    }))
    .filter((b) => b.title);
}

// =============================================================================
// Page
// =============================================================================
export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  const data = await getServiceData(slug);
  if (!data) notFound();

  const { service, testimonials, relatedServices, gallery, faqs } = data;
  const benefits = extractBenefits(service.pageSections);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const minPrice = service.packages[0] ? Number(service.packages[0].price) : null;

  const tabPackages = service.packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    shortDesc: pkg.shortDesc,
    items: pkg.items,
  }));

  const bookingPackages = service.packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    shortDesc: pkg.shortDesc,
    price: Number(pkg.price),
    originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : null,
    maxGuests: pkg.maxGuests,
    duration: pkg.duration,
    isFeatured: pkg.isFeatured,
    badge: pkg.badge,
  }));

  return (
    <>
      {/* JSON-LD: Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.name,
            description: service.description,
            provider: {
              "@type": "LocalBusiness",
              name: "Vrindavan Bhandara",
              url: "https://vrindavanbhandara.com",
            },
            areaServed: "Vrindavan, Mathura, India",
            url: `https://vrindavanbhandara.com/services/${slug}`,
            offers: service.packages.map((pkg) => ({
              "@type": "Offer",
              name: pkg.name,
              price: pkg.price.toString(),
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
            })),
          }),
        }}
      />

      <div className="container" style={{ paddingTop: "clamp(1.5rem, 3vw, 2.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-8"
          style={{ fontSize: "0.8125rem", color: "var(--muted)" }}
        >
          <Link href="/" className="breadcrumb-link" style={{ color: "var(--muted)", transition: "color 150ms" }}>
            Home
          </Link>
          <Chevron />
          <Link href="/services" className="breadcrumb-link" style={{ color: "var(--muted)", transition: "color 150ms" }}>
            Services
          </Link>
          <Chevron />
          <span aria-current="page" style={{ color: "var(--fg)" }}>{service.name}</span>
        </nav>

        {/* ── Hero: info (left) + booking card (right) ───────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 pb-14"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {/* Left column */}
          <div>
            <p
              className="text-eyebrow mb-4"
              style={{ color: "var(--accent-deep)" }}
            >
              Sacred Seva
            </p>
            <h1
              className="font-display font-semibold mb-5"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                letterSpacing: "-0.022em",
                lineHeight: "1.05",
                color: "var(--fg)",
              }}
            >
              <em style={{ fontStyle: "italic", color: "var(--brand)" }}>{service.name}</em>
              <br />
              in Vrindavan
            </h1>

            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--muted)",
                lineHeight: "1.65",
                marginBottom: "2rem",
                maxWidth: "58ch",
              }}
            >
              {service.description.slice(0, 260)}{service.description.length > 260 ? "…" : ""}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-5 mb-8">
              {service.packages.length > 0 && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span>
                    <strong style={{ color: "var(--fg)" }}>
                      {service.packages[0].maxGuests ?? "Custom"} – {(service.packages[service.packages.length - 1].maxGuests ?? 1000)}+
                    </strong>{" "}
                    People
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span><strong style={{ color: "var(--fg)" }}>Any Date</strong> — Book 3+ days in advance</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>WhatsApp updates within <strong style={{ color: "var(--fg)" }}>24 hours</strong></span>
              </div>
            </div>

            {/* Gallery preview (6 images) */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const img = gallery[i];
                const isVideoSlot = i === 3;
                const isLastSlot = i === 5 && gallery.length > 6;

                return (
                  <div
                    key={img?.id ?? i}
                    className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      aspectRatio: "4/3",
                      borderRadius: "var(--r-md)",
                      background: isVideoSlot && !img ? "var(--brand)" : "var(--surface-brand)",
                    }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.title ?? `Seva photo ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 200px"
                        className="object-cover"
                        priority={i === 0}
                      />
                    ) : isVideoSlot ? (
                      <div className="flex flex-col items-center justify-center h-full gap-1.5">
                        <svg width="28" height="28" viewBox="0 0 24 24" style={{ stroke: "var(--brand-fg)", fill: "none", strokeWidth: "1.5", opacity: 0.9 }} aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
                        </svg>
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--brand-fg)", opacity: 0.85 }}>
                          Watch Proof Video
                        </span>
                      </div>
                    ) : isLastSlot ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.45)", borderRadius: "var(--r-md)" }}
                      >
                        <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 500 }}>
                          +{gallery.length - 5} photos
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-light)" strokeWidth="1" opacity="0.4" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column — sticky booking card (hidden on mobile, uses bottom bar instead) */}
          <div className="hidden lg:block">
            <PackageSelector
              packages={bookingPackages}
              serviceSlug={service.slug}
              serviceName={service.name}
            />
          </div>
        </div>

        {/* ── Content + Sidebar ─────────────────────────────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 pt-10"
          style={{ alignItems: "start" }}
        >
          {/* Main content — tabbed */}
          <ServiceDetailTabs
            description={service.description}
            benefits={benefits}
            packages={tabPackages}
            gallery={gallery}
            faqs={faqs}
            serviceName={service.name}
          />

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: "1.5rem",
                }}
              >
                <h3
                  className="font-display font-semibold mb-5"
                  style={{ fontSize: "1.25rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
                >
                  What devotees say
                </h3>
                <div>
                  {testimonials.map((t, i) => (
                    <div
                      key={t.id}
                      style={{
                        paddingBottom: i < testimonials.length - 1 ? "1.25rem" : 0,
                        marginBottom: i < testimonials.length - 1 ? "1.25rem" : 0,
                        borderBottom: i < testimonials.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div
                        className="flex gap-0.5 mb-2"
                        aria-label={`${t.rating} stars`}
                      >
                        {Array.from({ length: 5 }).map((_, j) => (
                          <svg key={j} width="13" height="13" viewBox="0 0 24 24" fill={j < t.rating ? "var(--accent)" : "var(--n-200)"} aria-hidden="true">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <p
                        className="font-display"
                        style={{ fontStyle: "italic", fontSize: "0.875rem", lineHeight: "1.55", color: "var(--fg)", marginBottom: "0.75rem" }}
                      >
                        &ldquo;{t.comment.slice(0, 140)}{t.comment.length > 140 ? "…" : ""}&rdquo;
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                        — {t.name}{t.city ? `, ${t.city}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related services */}
            {relatedServices.length > 0 && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: "1.5rem",
                }}
              >
                <h3
                  className="font-display font-semibold mb-1"
                  style={{ fontSize: "1.25rem", letterSpacing: "-0.01em", color: "var(--fg)", marginBottom: "1.25rem" }}
                >
                  Other Sevas
                </h3>
                {relatedServices.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    className="related-seva-link flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
                    style={{
                      padding: "0.875rem 0",
                      borderBottom: i < relatedServices.length - 1 ? "1px solid var(--border)" : "none",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 150ms",
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--surface-brand)",
                        borderRadius: "var(--r-md)",
                        fontSize: "1.25rem",
                      }}
                      aria-hidden="true"
                    >
                      {s.icon ?? "🙏"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="related-name text-sm font-medium"
                        style={{ color: "var(--fg)", transition: "color 150ms" }}
                      >
                        {s.name}
                      </p>
                      {s.packages[0] && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          From ₹{formatPrice(Number(s.packages[0].price))}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile: booking CTA bar (visible on small screens only) */}
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "1rem clamp(1.25rem, 5vw, 3rem)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
        }}
        aria-label="Quick booking bar"
      >
        {minPrice && (
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Starting from</p>
            <p
              className="font-semibold"
              style={{ fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--accent-deep)" }}
            >
              ₹{formatPrice(minPrice)}
            </p>
          </div>
        )}
        <Link
          href={`/book?service=${service.slug}`}
          className="inline-flex items-center gap-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
          style={{
            background: "var(--brand)",
            color: "var(--brand-fg)",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--r-md)",
            fontSize: "0.9375rem",
            letterSpacing: "0.01em",
          }}
        >
          Book Now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </>
  );
}
