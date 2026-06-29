import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServiceListClient } from "@/components/services/ServiceListClient";
import type { ServiceCard } from "@/components/services/ServiceListClient";

// =============================================================================
// Metadata
// =============================================================================
export const metadata: Metadata = {
  title: "All Seva Services — Vrindavan Bhandara",
  description:
    "Browse all sacred seva services available in Vrindavan and Mathura — Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, Festival Seva, and Annadan.",
  openGraph: {
    title: "All Sacred Seva Services — Vrindavan Bhandara",
    description:
      "Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, and more — performed in Vrindavan and Mathura with full proof.",
    url: "https://vrindavanbhandara.com/services",
  },
  alternates: { canonical: "https://vrindavanbhandara.com/services" },
};

// =============================================================================
// Service type → UI category mapping
// =============================================================================
type ServiceCategory = "feast" | "care" | "donation" | "general";

const TYPE_CATEGORY: Record<string, ServiceCategory> = {
  BHANDARA:      "feast",
  BRAHMIN_BHOJ:  "feast",
  SADHU_BHOJAN:  "feast",
  GAU_SEVA:      "care",
  VIDHWA_SEVA:   "care",
  ANNADAN_SEVA:  "donation",
  FESTIVAL_SEVA: "general",
};

const TYPE_BADGE: Record<string, string | undefined> = {
  BHANDARA:     "Most Booked",
  BRAHMIN_BHOJ: "Family Favourite",
  GAU_SEVA:     "Monthly Recurring",
};

const TYPE_TAGS: Record<string, string[]> = {
  BHANDARA:      ["100–1,000+ People", "1–3 Day Booking", "Photo + Video Proof"],
  BRAHMIN_BHOJ:  ["11 / 21 / 51 Brahmins", "Name Sankalp", "Same-Day Confirmation"],
  GAU_SEVA:      ["Daily / Monthly", "Sacred Cows", "Photo Proof"],
  SADHU_BHOJAN:  ["10 – 100 Sadhus", "Vrindavan", "Photo Proof"],
  ANNADAN_SEVA:  ["Needy & Poor", "Holy Dham", "Photo + Video"],
  VIDHWA_SEVA:   ["Vrindavan Widows", "Monthly Support", "Photo Proof"],
  FESTIVAL_SEVA: ["Special Occasion", "Vrindavan", "Video Highlight"],
};

const FALLBACK_SERVICES: ServiceCard[] = [
  {
    slug: "bhandara", name: "Bhandara Seva", icon: "🍱",
    shortDesc: "Large-scale community feast for 100–1,000+ devotees in Vrindavan or Mathura.",
    minPrice: 5000, badge: "Most Booked",
    tags: ["100–1,000+ People", "1–3 Day Booking", "Photo + Video Proof"],
    category: "feast",
  },
  {
    slug: "brahmin-bhoj", name: "Brahmin Bhoj Seva", icon: "🪔",
    shortDesc: "Sacred feast for 11, 21, or 51 Brahmin pandits with full Vedic recitation.",
    minPrice: 2100, badge: "Family Favourite",
    tags: ["11 / 21 / 51 Brahmins", "Name Sankalp", "Same-Day Confirmation"],
    category: "feast",
  },
  {
    slug: "gau-seva", name: "Gau Seva", icon: "🐄",
    shortDesc: "Daily, weekly or monthly care for Lord Krishna's sacred cows.",
    minPrice: 501, badge: "Monthly Recurring",
    tags: ["Daily / Monthly", "Sacred Cows", "Photo Proof"],
    category: "care",
  },
  {
    slug: "sadhu-bhojan", name: "Sadhu Bhojan", icon: "🌸",
    shortDesc: "Provide meals to ascetic saints dedicated to devotion in Vrindavan.",
    minPrice: 1100,
    tags: ["10 – 100 Sadhus", "Vrindavan", "Photo Proof"],
    category: "feast",
  },
  {
    slug: "annadan", name: "Annadan Seva", icon: "🌾",
    shortDesc: "The most meritorious act — donating food (anna) to the needy in holy dhams.",
    minPrice: 2001,
    tags: ["Needy & Poor", "Holy Dham", "Photo + Video"],
    category: "donation",
  },
  {
    slug: "vidhwa-seva", name: "Vidhwa Seva", icon: "🤲",
    shortDesc: "Monthly support and food provision for the widows of Vrindavan.",
    minPrice: 1001,
    tags: ["Vrindavan Widows", "Monthly Support", "Photo Proof"],
    category: "care",
  },
];

// =============================================================================
// Data fetching
// =============================================================================
async function getServices(): Promise<ServiceCard[]> {
  try {
    const services = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    });

    return services.map((s) => ({
      slug: s.slug,
      name: s.name,
      shortDesc: s.shortDesc,
      icon: s.icon ?? "🙏",
      minPrice: s.packages[0] ? Number(s.packages[0].price) : null,
      badge: TYPE_BADGE[s.type] ?? null,
      tags: TYPE_TAGS[s.type] ?? [],
      category: TYPE_CATEGORY[s.type] ?? "general",
    }));
  } catch {
    return [];
  }
}

// =============================================================================
// Breadcrumb chevron
// =============================================================================
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// =============================================================================
// Page
// =============================================================================
export default async function ServicesPage() {
  const dbServices = await getServices();
  const services = dbServices.length > 0 ? dbServices : FALLBACK_SERVICES;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Vrindavan Bhandara Seva Services",
            itemListElement: services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://vrindavanbhandara.com/services/${s.slug}`,
              name: s.name,
            })),
          }),
        }}
      />

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div
        className="container"
        style={{ paddingTop: "clamp(3rem, 6vw, 5rem)" }}
      >
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-6 text-[0.8125rem]"
          style={{ color: "var(--muted)" }}
        >
          <Link href="/" className="breadcrumb-link">Home</Link>
          <Chevron />
          <span aria-current="page" style={{ color: "var(--fg)" }}>Services</span>
        </nav>

        {/* Title */}
        <h1
          className="font-display font-semibold"
          style={{
            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
            letterSpacing: "-0.02em",
            lineHeight: "1.05",
            color: "var(--fg)",
            marginBottom: "1rem",
          }}
        >
          Every <em style={{ fontStyle: "italic", color: "var(--brand)" }}>Sacred Seva</em>,<br />
          in one place
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--muted)",
            maxWidth: "52ch",
            lineHeight: "1.65",
            marginBottom: "2.5rem",
          }}
        >
          From intimate Brahmin feasts to large community Bhandaras — choose the Seva
          that speaks to your heart. All performed in Vrindavan and Mathura by
          experienced Brahmin pandits.
        </p>
      </div>

      {/* ── Service list (filter + grid — client component) ─────────────── */}
      <div
        className="container"
        style={{ paddingBottom: "clamp(4rem, 8vw, 7rem)" }}
      >
        <ServiceListClient services={services} />

        {/* Featured CTA */}
        <div
          className="relative overflow-hidden mt-12 rounded-xl grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-center"
          style={{
            background: "var(--brand)",
            padding: "clamp(1.75rem, 4vw, 2.5rem)",
          }}
          aria-label="Custom booking enquiry"
        >
          {/* Radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at 90% 50%, oklch(42% 0.14 148 / 0.5), transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <h2
              className="font-display font-semibold mb-2"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.015em",
                color: "var(--brand-fg)",
                lineHeight: "1.2",
              }}
            >
              Need a <em>custom Seva</em>?
            </h2>
            <p style={{ fontSize: "0.9rem", color: "oklch(98% 0.004 148 / 0.72)", lineHeight: "1.55", maxWidth: "44ch" }}>
              We organize large-scale Bhandaras, temple events, and anniversary sevas.
              Speak to our team for a custom quote.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <Link href="/book" className="btn-amber-cta">
              Book a Seva
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
