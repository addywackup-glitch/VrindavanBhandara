"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// =============================================================================
// Services Section — 3-column grid, backend-driven
// =============================================================================

type Service = {
  type: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  icon: string;
  price?: string;
};

const FALLBACK_SERVICES: Service[] = [
  {
    type: "BHANDARA",
    name: "Bhandara Seva",
    slug: "bhandara",
    description: "Large-scale community feast for hundreds of devotees in the holy dhams of Vrindavan and Mathura.",
    shortDesc: "Community feast for hundreds of devotees",
    icon: "🍱",
    price: "₹5,000",
  },
  {
    type: "BRAHMIN_BHOJ",
    name: "Brahmin Bhoj Seva",
    slug: "brahmin-bhoj",
    description: "Sacred feast for Brahmin priests with full traditional rituals and Vedic recitation.",
    shortDesc: "Sacred feast for Brahmin priests",
    icon: "🪔",
    price: "₹2,100",
  },
  {
    type: "GAU_SEVA",
    name: "Gau Seva",
    slug: "gau-seva",
    description: "Daily, weekly or monthly care for Lord Krishna's sacred cows — feed, medicine and shelter.",
    shortDesc: "Daily, weekly or monthly cow care",
    icon: "🐄",
    price: "₹501",
  },
  {
    type: "SADHU_BHOJAN",
    name: "Sadhu Bhojan",
    slug: "sadhu-bhojan",
    description: "Provide meals to ascetic saints who have dedicated their lives to devotion in Vrindavan.",
    shortDesc: "Meals for sadhus and saints",
    icon: "🌸",
    price: "₹1,100",
  },
  {
    type: "VIDHWA_SEVA",
    name: "Vidhwa Seva",
    slug: "vidhwa-seva",
    description: "Monthly support and food provision for the widows of Vrindavan — a deeply meritorious act.",
    shortDesc: "Support for widows of Vrindavan",
    icon: "🤲",
    price: "₹1,001",
  },
  {
    type: "ANNADAN_SEVA",
    name: "Annadan Seva",
    slug: "annadan",
    description: "The most meritorious act — donating food (anna) to the needy in the sacred dhams.",
    shortDesc: "Food donation for the needy",
    icon: "🌾",
    price: "₹2,001",
  },
];

// Inline SVG arrow for the card's action circle
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/services/${service.slug}`}
        className="group flex flex-col h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          padding: "1.75rem",
          textDecoration: "none",
          color: "inherit",
          transition: "border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-base) var(--ease-out)",
          borderRadius: "var(--r-lg)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--brand-light)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--sh-md)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Service icon */}
        <div
          className="flex items-center justify-center mb-5 transition-all duration-200 group-hover:scale-[1.06]"
          style={{
            width: "48px",
            height: "48px",
            background: "var(--surface-brand)",
            borderRadius: "var(--r-md)",
            color: "var(--brand)",
            fontSize: "1.375rem",
          }}
          aria-hidden="true"
        >
          {service.icon}
        </div>

        {/* Name */}
        <h3
          className="font-display font-semibold mb-2"
          style={{
            fontSize: "1.25rem",
            letterSpacing: "-0.01em",
            color: "var(--fg)",
          }}
        >
          {service.name}
        </h3>

        {/* Short description */}
        <p
          className="text-sm flex-1 mb-5"
          style={{ color: "var(--muted)", lineHeight: "1.55" }}
        >
          {service.shortDesc}
        </p>

        {/* Footer: price + arrow */}
        <div
          className="flex items-center justify-between pt-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--subtle)" }}>
            Starting from{" "}
            <strong style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--accent-deep)" }}>
              {service.price}
            </strong>
          </span>

          <span
            className="flex items-center justify-center transition-all duration-200 group-hover:rotate-[-45deg] group-hover:scale-110"
            style={{
              width: "32px",
              height: "32px",
              background: "var(--n-100)",
              borderRadius: "50%",
              color: "var(--muted)",
            }}
          >
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

type ServicesSectionProps = { services?: Service[] };

export function ServicesSection({ services }: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <section
      className="section-py"
      style={{ background: "var(--bg)" }}
      aria-label="Our services"
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p
            className="text-eyebrow mb-4"
            style={{ color: "var(--accent-deep)" }}
          >
            Sacred Sevas
          </p>
          <h2
            className="font-display font-semibold"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              color: "var(--fg)",
            }}
          >
            Choose your{" "}
            <em className="not-italic" style={{ color: "var(--brand)" }}>
              Seva
            </em>
          </h2>
          <p
            className="mt-4"
            style={{
              fontSize: "1.0625rem",
              color: "var(--muted)",
              maxWidth: "56ch",
              lineHeight: "1.65",
            }}
          >
            Every seva is performed with full devotion in the holy land of Vrindavan and Mathura.
            Receive transparent proof with photos and videos.
          </p>
        </motion.div>

        {/* Service grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayServices.map((service, i) => (
            <ServiceCard key={service.type} service={service} index={i} />
          ))}
        </div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex justify-start"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
            style={{
              color: "var(--brand)",
              padding: "0.625rem 1.25rem",
              background: "var(--surface-brand)",
              border: "1px solid oklch(30% 0.12 148 / 0.18)",
              borderRadius: "var(--r-sm)",
              transition: "background var(--dur-fast), box-shadow var(--dur-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(93% 0.05 148)";
              e.currentTarget.style.boxShadow = "var(--sh-sm)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-brand)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View all services
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
