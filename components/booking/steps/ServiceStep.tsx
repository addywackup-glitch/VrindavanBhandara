"use client";

// =============================================================================
// Step 1 — Choose Your Seva
// Fetches active services from /api/services and renders a selection grid
// =============================================================================

import { useEffect, useState } from "react";
import type { BookingFormData } from "@/types";

type ServiceCard = {
  id: string;
  type: string;
  name: string;
  slug: string;
  shortDesc: string;
  icon: string | null;
  minPrice?: number | null;
};

const FALLBACK_SERVICES: ServiceCard[] = [
  { id: "bhandara", type: "BHANDARA", name: "Bhandara Seva", slug: "bhandara", shortDesc: "Large-scale community feast for hundreds of devotees", icon: "🍱", minPrice: 5000 },
  { id: "brahmin-bhoj", type: "BRAHMIN_BHOJ", name: "Brahmin Bhoj Seva", slug: "brahmin-bhoj", shortDesc: "Sacred feast for Brahmin priests", icon: "🪔", minPrice: 2100 },
  { id: "gau-seva", type: "GAU_SEVA", name: "Gau Seva", slug: "gau-seva", shortDesc: "Daily, weekly or monthly care for sacred cows", icon: "🐄", minPrice: 501 },
  { id: "sadhu-bhojan", type: "SADHU_BHOJAN", name: "Sadhu Bhojan Seva", slug: "sadhu-bhojan", shortDesc: "Meals for saints and ascetics", icon: "🌸", minPrice: 1100 },
  { id: "annadan", type: "ANNADAN_SEVA", name: "Annadan Seva", slug: "annadan", shortDesc: "Food donation for the needy in the holy dhams", icon: "🌾", minPrice: 2001 },
  { id: "vidhwa-seva", type: "VIDHWA_SEVA", name: "Vidhwa Seva", slug: "vidhwa-seva", shortDesc: "Serving widows of Vrindavan with food & care", icon: "🕊️", minPrice: 1100 },
];

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function ServiceSkeleton() {
  return (
    <div className="service-selector" aria-busy="true" aria-label="Loading services">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="service-opt"
          style={{
            background: "var(--n-50)",
            borderColor: "var(--border)",
            cursor: "default",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", background: "var(--n-100)" }} />
          <div style={{ height: 14, width: "70%", borderRadius: 4, background: "var(--n-200)" }} />
          <div style={{ height: 12, width: "50%", borderRadius: 4, background: "var(--n-100)" }} />
        </div>
      ))}
    </div>
  );
}

export function ServiceStep({ form, updateForm, onNext }: Props) {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => r.json())
      .then((d: { success: boolean; data?: ServiceCard[] }) => {
        if (cancelled) return;
        if (d.success && d.data && d.data.length > 0) {
          setServices(d.data);
        } else {
          setServices(FALLBACK_SERVICES);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setServices(FALLBACK_SERVICES);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (service: ServiceCard) => {
    updateForm({
      serviceCategoryId: service.id,
      serviceSlug: service.slug,
      serviceType: service.type,
      serviceName: service.name,
      packageId: "",
      packageName: "",
      packagePrice: 0,
      packageOriginalPrice: null,
      packageMaxGuests: null,
      packageBadge: null,
    });
  };

  const canContinue = !!form.serviceCategoryId;

  return (
    <div>
      <div className="step-heading">Choose your Seva</div>
      <div className="step-sub">
        Select the sacred service you&apos;d like to sponsor in Vrindavan or Mathura.
      </div>

      {fetchError && (
        <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
          Using default services — could not connect to server.
        </p>
      )}

      {loading ? (
        <ServiceSkeleton />
      ) : (
        <div className="service-selector" role="listbox" aria-label="Choose a seva">
          {services.map((service) => {
            const isSelected = form.serviceCategoryId === service.id;
            return (
              <button
                key={service.id}
                role="option"
                aria-selected={isSelected}
                className={`service-opt${isSelected ? " selected" : ""}`}
                onClick={() => handleSelect(service)}
                type="button"
              >
                <div className="service-opt-icon" aria-hidden="true">
                  {service.icon ?? "🙏"}
                </div>
                <div className="service-opt-name">{service.name}</div>
                {service.minPrice != null && (
                  <div className="service-opt-price">From {formatINR(service.minPrice)}</div>
                )}
                <div className="service-opt-check" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      <div className="step-nav">
        <div />
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
