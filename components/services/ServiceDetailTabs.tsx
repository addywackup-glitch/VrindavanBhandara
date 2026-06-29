"use client";

import { useState } from "react";
import Image from "next/image";

// =============================================================================
// Service Detail — tabbed content area
// Tabs: Overview | What's Included | Gallery | FAQs
// =============================================================================

type Benefit = {
  title: string;
  description: string;
};

type PackageItem = {
  id: string;
  description: string;
  quantity: number;
  unit?: string | null;
};

type GalleryImage = {
  id: string;
  url: string;
  thumbnail?: string | null;
  title?: string | null;
  description?: string | null;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type Package = {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
};

export type ServiceTabsProps = {
  description: string;
  benefits: Benefit[];
  packages: Package[];
  gallery: GalleryImage[];
  faqs: FAQ[];
  serviceName: string;
};

const TABS = ["Overview", "What's Included", "Gallery", "FAQs"] as const;

// ── Check icon ─────────────────────────────────────────────────────────────
function CheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ── Benefits ───────────────────────────────────────────────────────────────
function BenefitItem({ benefit }: { benefit: Benefit }) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className="flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          width: "32px",
          height: "32px",
          background: "var(--success-bg, oklch(95.5% 0.045 145))",
          borderRadius: "var(--r-sm)",
        }}
      >
        <CheckCircle />
      </div>
      <div>
        <h4
          className="font-medium text-sm mb-1"
          style={{ color: "var(--fg)" }}
        >
          {benefit.title}
        </h4>
        <p className="text-sm" style={{ color: "var(--muted)", lineHeight: "1.55" }}>
          {benefit.description}
        </p>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab({ description, benefits }: { description: string; benefits: Benefit[] }) {
  // Split description into paragraphs
  const paragraphs = description.split("\n\n").filter(Boolean);

  return (
    <div>
      <h2
        className="font-display font-semibold mb-4"
        style={{ fontSize: "1.5rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
      >
        About this Seva
      </h2>
      {paragraphs.map((para, i) => (
        <p
          key={i}
          style={{
            fontSize: "0.9375rem",
            color: "var(--muted)",
            lineHeight: "1.65",
            marginBottom: "1.5rem",
          }}
        >
          {para}
        </p>
      ))}

      {benefits.length > 0 && (
        <>
          <h2
            className="font-display font-semibold mb-5"
            style={{
              fontSize: "1.5rem",
              letterSpacing: "-0.01em",
              color: "var(--fg)",
              marginTop: "2rem",
            }}
          >
            Benefits
          </h2>
          <div className="flex flex-col gap-4">
            {benefits.map((b, i) => (
              <BenefitItem key={i} benefit={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Includes Tab ────────────────────────────────────────────────────────────
function IncludesTab({
  packages,
  serviceName,
}: {
  packages: Package[];
  serviceName: string;
}) {
  return (
    <div>
      <h2
        className="font-display font-semibold mb-6"
        style={{ fontSize: "1.5rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
      >
        What&rsquo;s included in every {serviceName}
      </h2>

      {packages.map((pkg) => (
        <div key={pkg.id} className="mb-8">
          <h3
            className="font-semibold mb-4"
            style={{ fontSize: "1rem", color: "var(--fg)" }}
          >
            {pkg.name}
          </h3>
          {pkg.items.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {pkg.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "var(--success-bg, oklch(95.5% 0.045 145))",
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <p className="text-sm" style={{ color: "var(--fg)", lineHeight: "1.55" }}>
                      {item.description}
                    </p>
                    {item.quantity > 1 && (
                      <span
                        className="text-xs font-medium flex-shrink-0"
                        style={{ color: "var(--accent-deep)" }}
                      >
                        ×{item.quantity} {item.unit ?? ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {pkg.description}
            </p>
          )}
        </div>
      ))}

      {packages.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Contact us for detailed inclusions.
        </p>
      )}
    </div>
  );
}

// ── Gallery Tab ─────────────────────────────────────────────────────────────
const GALLERY_PLACEHOLDER = Array.from({ length: 6 });

function GalleryTab({ gallery }: { gallery: GalleryImage[] }) {
  const items = gallery.length > 0 ? gallery : GALLERY_PLACEHOLDER;

  return (
    <div>
      <h2
        className="font-display font-semibold mb-6"
        style={{ fontSize: "1.5rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
      >
        Photo &amp; Video Gallery
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const img = item as GalleryImage | undefined;
          return (
            <div
              key={img?.id ?? i}
              className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                aspectRatio: "4/3",
                borderRadius: "var(--r-md)",
                background: "var(--surface-brand)",
              }}
            >
              {img?.url ? (
                <Image
                  src={img.url}
                  alt={img.title ?? `Seva photo ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brand-light)" strokeWidth="1" opacity="0.4" aria-hidden="true">
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
  );
}

// ── FAQ Tab ──────────────────────────────────────────────────────────────────
function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid",
        borderColor: open ? "var(--brand-light)" : "var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        transition: "border-color 150ms",
      }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        style={{
          padding: "1.125rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: "var(--fg)",
        }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {faq.question}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? "var(--brand)" : "var(--muted)"}
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transition: "transform var(--dur-base) var(--ease-out), stroke 150ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: "0 1.25rem 1.25rem",
            borderTop: "1px solid var(--border)",
            paddingTop: "1rem",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--muted)", lineHeight: "1.65" }}
          >
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

function FAQTab({ faqs }: { faqs: FAQ[] }) {
  const DEFAULT_FAQS: FAQ[] = [
    {
      id: "d1",
      question: "How will I receive proof of my Seva?",
      answer:
        "We send 30–50 high-quality photos and a video highlight to your WhatsApp number and email within 24 hours of the Seva being completed. You can also view all proofs in your dashboard.",
    },
    {
      id: "d2",
      question: "Can I dedicate the Seva to a specific person or occasion?",
      answer:
        "Yes. During booking you can specify the name(s) for the sankalp, the occasion (birthday, death anniversary, marriage, etc.) and your gotra. Our Pandits will recite your dedication during the Seva.",
    },
    {
      id: "d3",
      question: "How far in advance do I need to book?",
      answer:
        "We require a minimum of 3 days advance notice to arrange the Seva. For large Bhandaras (500+ people), we recommend 7–10 days.",
    },
    {
      id: "d4",
      question: "What is your cancellation and refund policy?",
      answer:
        "You may cancel up to 48 hours before the Seva date for a full refund. Cancellations within 48 hours are subject to a 25% service charge. If we are unable to perform the Seva for any reason, you receive a 100% refund.",
    },
  ];
  const displayFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <div>
      <h2
        className="font-display font-semibold mb-6"
        style={{ fontSize: "1.5rem", letterSpacing: "-0.01em", color: "var(--fg)" }}
      >
        Frequently Asked Questions
      </h2>
      <div className="flex flex-col gap-3">
        {displayFaqs.map((faq) => (
          <FAQItem key={faq.id} faq={faq} />
        ))}
      </div>
    </div>
  );
}

// ── Main Tabs Component ──────────────────────────────────────────────────────
export function ServiceDetailTabs({
  description,
  benefits,
  packages,
  gallery,
  faqs,
  serviceName,
}: ServiceTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div>
      {/* Tab navigation */}
      <div
        className="flex overflow-x-auto"
        style={{
          borderBottom: "1px solid var(--border)",
          marginBottom: "2.5rem",
          gap: 0,
          scrollbarWidth: "none",
        }}
        role="tablist"
        aria-label="Service detail sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            style={{
              fontSize: "0.9rem",
              fontWeight: 500,
              color: activeTab === tab ? "var(--brand)" : "var(--muted)",
              padding: "0.75rem 1.25rem",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "var(--brand)" : "transparent"}`,
              background: "none",
              cursor: "pointer",
              transition: "color 150ms, border-color 150ms",
              marginBottom: "-1px",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) e.currentTarget.style.color = "var(--muted)";
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <OverviewTab description={description} benefits={benefits} />
      )}
      {activeTab === "What's Included" && (
        <IncludesTab packages={packages} serviceName={serviceName} />
      )}
      {activeTab === "Gallery" && <GalleryTab gallery={gallery} />}
      {activeTab === "FAQs" && <FAQTab faqs={faqs} />}
    </div>
  );
}
