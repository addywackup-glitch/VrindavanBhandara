"use client";

import { motion } from "framer-motion";

// =============================================================================
// How It Works — 4-step process on surface-2 background
// Design: circles with italic display numbers, connector line on desktop
// =============================================================================

const STEPS = [
  {
    number: "1",
    title: "Choose Your Seva",
    description:
      "Browse Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, or Festival Seva. Select the one that resonates with your intention.",
  },
  {
    number: "2",
    title: "Pick a Package & Date",
    description:
      "Choose your package and an auspicious date. Our team confirms your booking within minutes.",
  },
  {
    number: "3",
    title: "We Perform the Seva",
    description:
      "Experienced priests perform your Seva at the exact time, with full Vedic rituals reciting your sankalp.",
  },
  {
    number: "4",
    title: "Receive Proof",
    description:
      "30–50 photos and a video of your Seva are delivered to your WhatsApp and dashboard within 24 hours.",
  },
] as const;

function StepItem({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center gap-4 relative z-10"
    >
      {/* Step circle */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "52px",
          height: "52px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "50%",
        }}
        aria-hidden="true"
      >
        <span
          className="font-display font-semibold"
          style={{
            fontStyle: "italic",
            fontSize: "1.625rem",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "var(--brand)",
          }}
        >
          {step.number}
        </span>
      </div>

      {/* Title */}
      <h3
        className="font-display font-semibold"
        style={{
          fontSize: "1.125rem",
          letterSpacing: "-0.01em",
          color: "var(--fg)",
          lineHeight: "1.2",
        }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p
        className="text-sm"
        style={{
          color: "var(--muted)",
          lineHeight: "1.55",
          maxWidth: "22ch",
          margin: "0 auto",
        }}
      >
        {step.description}
      </p>
    </motion.div>
  );
}

const TRUST_GUARANTEES = [
  "No hidden charges",
  "Seva on exact date",
  "Photos & video proof",
  "24/7 support",
] as const;

export function HowItWorksSection() {
  return (
    <section
      className="section-py"
      style={{ background: "var(--surface-2)" }}
      aria-label="How it works"
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-eyebrow mb-4">Simple Process</p>
          <h2
            className="font-display font-semibold"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              color: "var(--fg)",
            }}
          >
            Book in 4 simple steps
          </h2>
          <p
            className="mt-4 mx-auto"
            style={{
              fontSize: "1.0625rem",
              color: "var(--muted)",
              maxWidth: "52ch",
              lineHeight: "1.65",
            }}
          >
            From selection to proof delivery — the entire seva journey is
            transparent, simple, and fully managed for you.
          </p>
        </motion.div>

        {/* Steps grid — connector line on desktop */}
        <div
          className="relative grid grid-cols-2 md:grid-cols-4 gap-8"
          aria-label="Process steps"
        >
          {/* Horizontal connector (desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute"
            style={{
              top: "calc(26px)",
              left: "calc(12.5% + 1.5rem)",
              right: "calc(12.5% + 1.5rem)",
              height: "1.5px",
              background: "var(--border)",
              zIndex: 0,
            }}
          />

          {STEPS.map((step, i) => (
            <StepItem key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Trust guarantee row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14 rounded-lg flex flex-wrap justify-center gap-x-8 gap-y-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "1.25rem 2rem",
          }}
        >
          {TRUST_GUARANTEES.map((item) => (
            <span
              key={item}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--muted)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
