"use client";

import { useState } from "react";
import Link from "next/link";

// =============================================================================
// Sticky booking card with package selection
// =============================================================================

type Package = {
  id: string;
  name: string;
  description: string;
  shortDesc: string;
  price: number;
  originalPrice?: number | null;
  maxGuests?: number | null;
  duration?: string | null;
  isFeatured: boolean;
  badge?: string | null;
};

type PackageSelectorProps = {
  packages: Package[];
  serviceSlug: string;
  serviceName: string;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

const TRUST_ITEMS = ["Secure payment", "Photo proof", "Refund policy"] as const;

export function PackageSelector({ packages, serviceSlug, serviceName }: PackageSelectorProps) {
  const defaultPkg = packages.find((p) => p.isFeatured) ?? packages[0];
  const [selectedId, setSelectedId] = useState<string>(defaultPkg?.id ?? "");

  const selectedPkg = packages.find((p) => p.id === selectedId) ?? packages[0];

  if (!packages.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "1.75rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
          Custom packages available — contact us for pricing.
        </p>
        <Link
          href={`/book?service=${serviceSlug}`}
          className="w-full flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
            fontWeight: 500,
            background: "var(--brand)",
            color: "var(--brand-fg)",
            padding: "0.875rem 1.5rem",
            borderRadius: "var(--r-md)",
            letterSpacing: "0.01em",
          }}
        >
          Book {serviceName}
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--r-xl)",
        padding: "1.75rem",
        position: "sticky",
        top: "80px",
        boxShadow: "var(--sh-md)",
      }}
    >
      {/* Title + price */}
      <p
        className="font-display font-semibold mb-1"
        style={{ fontSize: "1.375rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
      >
        Select a Package
      </p>

      {selectedPkg && (
        <>
          <div
            className="font-semibold mb-1"
            style={{
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              color: "var(--accent-deep)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <sup style={{ fontSize: "1.125rem", verticalAlign: "super", fontWeight: 500 }}>₹</sup>
            {formatPrice(selectedPkg.price)}
            {selectedPkg.originalPrice && (
              <span
                className="ml-2 text-base line-through"
                style={{ color: "var(--subtle)", fontWeight: 400 }}
              >
                ₹{formatPrice(selectedPkg.originalPrice)}
              </span>
            )}
          </div>
          <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
            per {serviceName.toLowerCase()} · prices vary by package
          </p>
        </>
      )}

      {/* Package options */}
      <div className="flex flex-col gap-2.5 mb-6" role="radiogroup" aria-label="Select package">
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedId;
          return (
            <button
              key={pkg.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedId(pkg.id)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-left"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem 1rem",
                borderRadius: "var(--r-md)",
                border: "1.5px solid",
                borderColor: isSelected ? "var(--brand)" : "var(--border)",
                background: isSelected ? "var(--surface-brand)" : "transparent",
                cursor: "pointer",
                gap: "0.75rem",
                transition: "border-color var(--dur-base), background var(--dur-base)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Radio indicator */}
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "1.5px solid",
                    borderColor: isSelected ? "var(--brand)" : "var(--border-strong)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    transition: "border-color var(--dur-base)",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "var(--brand)",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                    {pkg.name}
                  </p>
                  {pkg.maxGuests && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Up to {pkg.maxGuests} devotees
                    </p>
                  )}
                </div>
              </div>
              <span
                className="text-sm font-semibold flex-shrink-0"
                style={{ color: "var(--accent-deep)", fontVariantNumeric: "tabular-nums" }}
              >
                ₹{formatPrice(pkg.price)}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <Link
        href={`/book?service=${serviceSlug}&package=${selectedId}`}
        className="w-full flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "1rem",
          fontWeight: 500,
          background: "var(--brand)",
          color: "var(--brand-fg)",
          padding: "0.875rem 1.5rem",
          borderRadius: "var(--r-md)",
          textDecoration: "none",
          letterSpacing: "0.01em",
          transition: "background var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base)",
          marginBottom: "0.875rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--brand-mid)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-brand)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--brand)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Book {serviceName}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Trust row */}
      <div className="flex items-center justify-center flex-wrap gap-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item}
            className="flex items-center gap-1.5"
            style={{ fontSize: "0.75rem", color: "var(--muted)" }}
          >
            <ShieldIcon />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
