"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// Client-side service list with filter tabs
// =============================================================================

type ServiceCard = {
  slug: string;
  name: string;
  shortDesc: string;
  icon: string;
  minPrice: number | null;
  badge?: string | null;
  tags?: string[];
  category: "feast" | "care" | "donation" | "general";
};

type FilterTab = {
  id: string;
  label: string;
  categories: ServiceCard["category"][];
};

const FILTER_TABS: FilterTab[] = [
  { id: "all",      label: "All Sevas",         categories: ["feast", "care", "donation", "general"] },
  { id: "feast",    label: "Community Feasts",   categories: ["feast"] },
  { id: "care",     label: "Care Seva",          categories: ["care"] },
  { id: "donation", label: "Donation Seva",      categories: ["donation"] },
];

function ServiceCardItem({ service, index }: { service: ServiceCard; index: number }) {
  const priceStr = service.minPrice
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(service.minPrice)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/services/${service.slug}`}
        className="group flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          textDecoration: "none",
          color: "inherit",
          transition: "border-color var(--dur-base), box-shadow var(--dur-base), transform var(--dur-base) var(--ease-out)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--brand-light)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Image area */}
        <div
          className="flex items-center justify-center relative overflow-hidden"
          style={{
            height: "160px",
            background: "var(--surface-brand)",
          }}
        >
          <span className="text-5xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
            {service.icon}
          </span>
          {service.badge && (
            <span
              className="absolute top-3.5 left-3.5 text-[0.6875rem] font-medium tracking-wider"
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "var(--r-full)",
                background: service.badge.toLowerCase().includes("popular") || service.badge.toLowerCase().includes("booked")
                  ? "var(--accent)"
                  : "var(--surface-brand)",
                color: service.badge.toLowerCase().includes("popular") || service.badge.toLowerCase().includes("booked")
                  ? "var(--accent-fg)"
                  : "var(--brand)",
                border: service.badge.toLowerCase().includes("popular") || service.badge.toLowerCase().includes("booked")
                  ? "none"
                  : "1px solid oklch(30% 0.12 148 / 0.2)",
              }}
            >
              {service.badge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 gap-2" style={{ padding: "1.5rem" }}>
          <h2
            className="font-display font-semibold"
            style={{ fontSize: "1.25rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
          >
            {service.name}
          </h2>
          <p
            className="text-sm flex-1"
            style={{ color: "var(--muted)", lineHeight: "1.55" }}
          >
            {service.shortDesc}
          </p>
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium"
                  style={{
                    color: "var(--subtle)",
                    background: "var(--n-100)",
                    padding: "0.1875rem 0.625rem",
                    borderRadius: "var(--r-full)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "1rem 1.5rem 1.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>Starting from</p>
            {priceStr && (
              <p
                className="font-semibold text-base"
                style={{ color: "var(--accent-deep)", fontVariantNumeric: "tabular-nums" }}
              >
                ₹{priceStr}
              </p>
            )}
          </div>
          <Link
            href={`/book?service=${service.slug}`}
            className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
            style={{
              color: "var(--brand-fg)",
              background: "var(--brand)",
              padding: "0.5rem 1.125rem",
              borderRadius: "var(--r-sm)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "background var(--dur-base) var(--ease-out)",
              whiteSpace: "nowrap",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-mid)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand)"; }}
          >
            Book Now
          </Link>
        </div>
      </Link>
    </motion.div>
  );
}

export function ServiceListClient({ services }: { services: ServiceCard[] }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? services
    : services.filter((s) => {
        const tab = FILTER_TABS.find((t) => t.id === activeFilter);
        return tab ? tab.categories.includes(s.category) : true;
      });

  return (
    <>
      {/* Filter bar */}
      <div
        className="mb-8 flex flex-wrap items-center gap-2"
        style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}
        role="tablist"
        aria-label="Filter services by category"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeFilter === tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className="text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-all"
            style={{
              padding: "0.4375rem 1rem",
              borderRadius: "var(--r-full)",
              border: "1.5px solid",
              cursor: "pointer",
              background: activeFilter === tab.id ? "var(--brand)" : "transparent",
              color: activeFilter === tab.id ? "var(--brand-fg)" : "var(--muted)",
              borderColor: activeFilter === tab.id ? "var(--brand)" : "var(--border)",
              transition: "all 150ms",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== tab.id) {
                e.currentTarget.style.borderColor = "var(--brand-light)";
                e.currentTarget.style.color = "var(--brand)";
                e.currentTarget.style.background = "var(--surface-brand)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== tab.id) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((service, i) => (
            <ServiceCardItem key={service.slug} service={service} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div
          className="text-center py-16"
          style={{ color: "var(--muted)" }}
        >
          <p className="text-lg">No services found in this category.</p>
        </div>
      )}
    </>
  );
}

// Re-export the type so the page can use it
export type { ServiceCard };
