import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { prisma } from "@/lib/prisma";

// =============================================================================
// Page Metadata
// Source: 08-seo-strategy.md
// =============================================================================
export const metadata: Metadata = {
  title: "Vrindavan Bhandara — Book Bhandara, Brahmin Bhoj & Gau Seva Online",
  description:
    "India's most trusted platform to book Bhandara, Brahmin Bhoj Seva, Gau Seva, Sadhu Bhojan & Festival Seva in Vrindavan and Mathura. Transparent proof with photos, videos & certificates.",
  openGraph: {
    title: "Vrindavan Bhandara — Book Sacred Seva Online",
    description:
      "Sponsor Bhandara, Brahmin Bhoj, Gau Seva & Festival Seva in Vrindavan & Mathura. Receive photo, video proof and digital certificate.",
    url: "https://vrindavanbhandara.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vrindavan Bhandara — Spiritual Seva Platform",
      },
    ],
  },
  alternates: {
    canonical: "https://vrindavanbhandara.com",
  },
};

// =============================================================================
// Homepage — Server Component (data fetched server-side)
// =============================================================================

async function getHomePageData() {
  try {
    const [services, stats, testimonials] = await Promise.all([
      // Active service categories with packages
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          packages: {
            where: { isActive: true, isFeatured: true },
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
        },
      }),

      // Live seva statistics
      prisma.sevaStatistic.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      }),

      // Featured testimonials
      prisma.testimonial.findMany({
        where: { isApproved: true, isFeatured: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          rating: true,
          comment: true,
          serviceType: true,
        },
      }),
    ]);

    return { services, stats, testimonials };
  } catch {
    // DB not yet connected — return empty arrays and let components use fallback data
    return { services: [], stats: [], testimonials: [] };
  }
}

export default async function HomePage() {
  const { services, stats, testimonials } = await getHomePageData();

  // Transform stats for StatsSection
  const formattedStats =
    stats.length > 0
      ? stats.map((s) => ({
          key: s.key,
          label: s.label,
          value: Number(s.value),
          unit: s.unit ?? "",
          icon: s.icon ?? "🙏",
        }))
      : [];

  // Transform services for ServicesSection
  const formattedServices =
    services.length > 0
      ? services.map((s) => ({
          type: s.type,
          name: s.name,
          slug: s.slug,
          description: s.description,
          shortDesc: s.shortDesc,
          icon: s.icon ?? "🙏",
          price: s.packages[0]
            ? `From ₹${s.packages[0].price.toString()}`
            : undefined,
        }))
      : [];

  return (
    <>
      {/* JSON-LD: Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Vrindavan Bhandara",
            description:
              "India's most trusted online platform for booking Bhandara, Brahmin Bhoj, Gau Seva and Festival Seva in Vrindavan and Mathura.",
            url: "https://vrindavanbhandara.com",
            telephone: "+919999999999",
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
            openingHoursSpecification: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "09:00",
              closes: "21:00",
            },
            priceRange: "₹₹",
            servesCuisine: "Indian vegetarian",
          }),
        }}
      />

      <HeroSection />
      <StatsSection stats={formattedStats} />
      <ServicesSection services={formattedServices} />
      <HowItWorksSection />
      <TestimonialsSection
        testimonials={testimonials.map((t) => ({
          ...t,
          serviceType: t.serviceType ?? null,
        }))}
      />
    </>
  );
}
