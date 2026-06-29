"use client";

import { motion } from "framer-motion";

// =============================================================================
// Testimonials Section — card-based layout with 5-star SVG
// =============================================================================

type Testimonial = {
  id: string;
  rating: number;
  /** Body text — may come as `content` (UI shape) or `comment` (DB shape) */
  content?: string;
  comment?: string;
  /** Author name — may come as `author` (UI shape) or `name` (DB shape) */
  author?: string;
  name?: string;
  /** Location — may come as `location` (UI shape) or `city`+`country` (DB shape) */
  location?: string;
  city?: string | null;
  country?: string | null;
  /** Service label */
  service?: string;
  serviceType?: string | null;
  avatar?: string;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    rating: 5,
    content:
      "My Bhandara Seva was performed flawlessly. I received 40 photos and a video on WhatsApp the same evening. The Pandit even read out our family names during the sankalp — I was in tears.",
    author: "Anjali Sharma",
    location: "Gurugram, Haryana",
    service: "Bhandara Seva",
    avatar: "AS",
  },
  {
    id: "t2",
    rating: 5,
    content:
      "Booked a Brahmin Bhoj on Pitru Paksha for my late father. The team confirmed within 20 minutes. Everything happened exactly as described and I felt my father's blessings afterward.",
    author: "Rajiv Mehta",
    location: "Ahmedabad, Gujarat",
    service: "Brahmin Bhoj",
    avatar: "RM",
  },
  {
    id: "t3",
    rating: 5,
    content:
      "I sponsor Gau Seva every month now. The photos arrive without fail and the team always adds a personal note. It is the most meaningful thing I do every month.",
    author: "Priya Agarwal",
    location: "Bengaluru, Karnataka",
    service: "Gau Seva",
    avatar: "PA",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? "var(--accent)" : "var(--n-200)"}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 font-medium text-sm select-none"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "var(--surface-brand)",
        color: "var(--brand)",
        fontFamily: "var(--font-body)",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const body = testimonial.content ?? testimonial.comment ?? "";
  const authorName = testimonial.author ?? testimonial.name ?? "Devotee";
  const locationStr =
    testimonial.location ??
    [testimonial.city, testimonial.country].filter(Boolean).join(", ") ??
    "";
  const serviceLabel = testimonial.service ?? testimonial.serviceType ?? "";
  const initials = (testimonial.avatar ?? authorName.slice(0, 2)).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <StarRating rating={testimonial.rating} />

      <blockquote className="flex-1" style={{ margin: 0 }}>
        <p
          className="font-display"
          style={{
            fontStyle: "italic",
            fontSize: "1.0625rem",
            lineHeight: "1.65",
            color: "var(--fg)",
          }}
        >
          &ldquo;{body}&rdquo;
        </p>
      </blockquote>

      <div className="flex items-center gap-3">
        <Avatar initials={initials} />
        <div>
          <p
            className="font-medium text-sm"
            style={{ color: "var(--fg)", lineHeight: "1.3" }}
          >
            {authorName}
          </p>
          {locationStr && (
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              {locationStr}
            </p>
          )}
        </div>
        {serviceLabel && (
          <span
            className="ml-auto text-xs font-medium"
            style={{
              color: "var(--accent-deep)",
              background: "oklch(97% 0.03 58)",
              padding: "0.2rem 0.6rem",
              borderRadius: "var(--r-sm)",
              whiteSpace: "nowrap",
            }}
          >
            {serviceLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}

type TestimonialsSectionProps = { testimonials?: Testimonial[] };

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const displayTestimonials =
    testimonials && testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  return (
    <section
      id="testimonials"
      className="section-py"
      style={{ background: "var(--bg)" }}
      aria-label="Customer testimonials"
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-eyebrow mb-4">Devotees Speak</p>
          <h2
            className="font-display font-semibold"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              color: "var(--fg)",
            }}
          >
            Trusted by{" "}
            <em className="not-italic" style={{ color: "var(--brand)" }}>
              8,000+
            </em>{" "}
            families
          </h2>
          <p
            className="mt-4"
            style={{
              fontSize: "1.0625rem",
              color: "var(--muted)",
              maxWidth: "52ch",
              lineHeight: "1.65",
            }}
          >
            Real experiences from devotees across India who have offered Seva
            through our platform.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayTestimonials.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
