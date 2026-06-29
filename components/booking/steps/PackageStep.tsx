"use client";

// =============================================================================
// Step 2 — Select a Package
// Fetches packages for the selected service and renders radio-style cards
// =============================================================================

import { useEffect, useState } from "react";
import type { BookingFormData } from "@/types";

type PackageItem = {
  id: string;
  name: string;
};

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  originalPrice: number | string | null;
  maxGuests: number | null;
  badge: string | null;
  isFeatured: boolean;
  isActive: boolean;
  items?: PackageItem[];
};

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

function toNum(v: number | string | null): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) : v;
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function PackageSkeleton() {
  return (
    <div className="pkg-cards" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="pkg-card"
          style={{ cursor: "default", animationDelay: `${i * 0.1}s` }}
        >
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--n-200)", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: "55%", borderRadius: 4, background: "var(--n-200)", marginBottom: 8 }} />
            <div style={{ height: 12, width: "80%", borderRadius: 4, background: "var(--n-100)" }} />
          </div>
          <div style={{ width: 64 }}>
            <div style={{ height: 18, width: "100%", borderRadius: 4, background: "var(--n-200)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PackageStep({ form, updateForm, onNext, onBack }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!form.serviceSlug && !form.serviceType) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setFetchError(null);

    const qs = form.serviceSlug
      ? `serviceSlug=${encodeURIComponent(form.serviceSlug)}`
      : `serviceType=${encodeURIComponent(form.serviceType)}`;

    fetch(`/api/packages?${qs}`)
      .then((r) => r.json())
      .then((d: { success: boolean; data?: Package[] | { data: Package[] } }) => {
        if (d.success) {
          const raw = Array.isArray(d.data) ? d.data : (d.data as { data: Package[] })?.data ?? [];
          const active = raw.filter((p) => p.isActive !== false);
          setPackages(active);
          // Auto-select featured or first
          if (active.length > 0 && !form.packageId) {
            const def = active.find((p) => p.isFeatured) ?? active[0];
            updateForm({
              packageId: def.id,
              packageName: def.name,
              packagePrice: toNum(def.price),
              packageOriginalPrice: def.originalPrice != null ? toNum(def.originalPrice) : null,
              packageMaxGuests: def.maxGuests,
              packageBadge: def.badge,
            });
          }
        } else {
          setFetchError("Could not load packages. Please try again.");
        }
      })
      .catch(() => setFetchError("Network error loading packages."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceSlug, form.serviceType]);

  const handleSelect = (pkg: Package) => {
    updateForm({
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: toNum(pkg.price),
      packageOriginalPrice: pkg.originalPrice != null ? toNum(pkg.originalPrice) : null,
      packageMaxGuests: pkg.maxGuests,
      packageBadge: pkg.badge,
    });
  };

  const canContinue = !!form.packageId;

  return (
    <div>
      <div className="step-heading">Select a package</div>
      <div className="step-sub">
        Choose the size that matches your intention. All packages include full documentation.
      </div>

      {fetchError && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            background: "oklch(96.5% 0.045 25)",
            border: "1.5px solid oklch(55% 0.19 25 / 0.25)",
            borderRadius: "var(--r-md)",
            color: "var(--danger)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {fetchError}
        </div>
      )}

      {loading ? (
        <PackageSkeleton />
      ) : packages.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          No packages found for this service. Please go back and choose a different service.
        </p>
      ) : (
        <div className="pkg-cards" role="listbox" aria-label="Select a package">
          {packages.map((pkg) => {
            const isSelected = form.packageId === pkg.id;
            const price = toNum(pkg.price);
            const originalPrice = pkg.originalPrice != null ? toNum(pkg.originalPrice) : null;
            const hasDiscount = originalPrice != null && originalPrice > price;

            return (
              <button
                key={pkg.id}
                role="option"
                aria-selected={isSelected}
                className={`pkg-card${isSelected ? " selected" : ""}`}
                onClick={() => handleSelect(pkg)}
                type="button"
              >
                <div className="pkg-radio" aria-hidden="true" />
                <div className="pkg-info">
                  <div className="pkg-name">
                    {pkg.name}
                    {pkg.maxGuests ? ` — up to ${pkg.maxGuests.toLocaleString()} people` : ""}
                  </div>
                  {pkg.description && (
                    <div className="pkg-detail">{pkg.description}</div>
                  )}
                  {pkg.items && pkg.items.length > 0 && (
                    <div className="pkg-detail" style={{ marginTop: "0.25rem" }}>
                      {pkg.items.map((item) => item.name).join(" · ")}
                    </div>
                  )}
                  {pkg.badge && (
                    <span className="pkg-tag">{pkg.badge}</span>
                  )}
                  {pkg.isFeatured && !pkg.badge && (
                    <span className="pkg-tag">Most Popular</span>
                  )}
                </div>
                <div className="pkg-price-col">
                  <div className="pkg-price">{formatINR(price)}</div>
                  {hasDiscount && originalPrice != null && (
                    <div className="pkg-original-price">{formatINR(originalPrice)}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="step-nav">
        <button className="btn-back" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          className="btn-next"
          onClick={onNext}
          disabled={!canContinue || loading}
          aria-disabled={!canContinue || loading}
          type="button"
        >
          Continue
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
