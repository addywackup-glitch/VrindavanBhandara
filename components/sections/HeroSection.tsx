"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Trust indicators shown below CTAs
const TRUST_ITEMS = [
  "Photo & Video Proof",
  "8,000+ Families Served",
  "Since 2012",
] as const;

// Fade-up animation helper
function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-svh flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        paddingTop: "120px",
        paddingBottom: "80px",
        paddingLeft: "clamp(1.25rem, 6vw, 6rem)",
        paddingRight: "clamp(1.25rem, 6vw, 6rem)",
      }}
      aria-label="Hero"
    >
      {/* Dot-grid background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(30% 0.12 148 / 0.06) 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10" style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Eyebrow pill */}
        <FadeUp delay={0.1}>
          <div className="inline-flex items-center gap-2 mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-[0.07em] uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--surface-brand)",
                color: "var(--brand)",
                border: "1px solid oklch(30% 0.12 148 / 0.18)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ background: "var(--success)" }}
                aria-hidden="true"
              />
              Serving devotees since 2012
            </span>
          </div>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={0.2}>
          <h1
            className="font-display font-semibold mb-6"
            style={{
              fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
              letterSpacing: "-0.025em",
              lineHeight: "1.02",
              color: "var(--fg)",
            }}
          >
            Sacred Seva,{" "}
            <em className="not-italic" style={{ color: "var(--brand)" }}>
              from Anywhere
            </em>
          </h1>
        </FadeUp>

        {/* Subheadline */}
        <FadeUp delay={0.32}>
          <p
            className="mb-10 mx-auto"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "var(--muted)",
              maxWidth: "52ch",
              lineHeight: "1.65",
            }}
          >
            Sponsor Bhandara, Brahmin Bhoj, Gau Seva &amp; Festival Seva in
            Vrindavan and Mathura — and receive transparent{" "}
            <strong style={{ color: "var(--fg)", fontWeight: 600 }}>
              photo and video proof
            </strong>{" "}
            delivered to you.
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={0.44}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                letterSpacing: "0.01em",
                background: "var(--brand)",
                color: "var(--brand-fg)",
                padding: "0.875rem 2rem",
                borderRadius: "var(--r-md)",
                transition: "background var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--brand-mid)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--sh-brand)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--brand)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Book a Seva
              <ArrowRight />
            </Link>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                letterSpacing: "0.01em",
                background: "transparent",
                color: "var(--fg)",
                padding: "0.875rem 2rem",
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--border-strong)",
                transition: "border-color var(--dur-base), background var(--dur-base), transform var(--dur-base) var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-light)";
                e.currentTarget.style.background = "var(--surface-brand)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Explore Services
            </Link>
          </div>
        </FadeUp>

        {/* Trust items */}
        <FadeUp delay={0.56}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {TRUST_ITEMS.map((item) => (
              <span
                key={item}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--muted)" }}
              >
                <CheckIcon />
                {item}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <motion.span
          className="block w-px h-14"
          style={{ background: "linear-gradient(to bottom, transparent, var(--brand-light), transparent)" }}
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span
          className="text-[9px] tracking-[0.3em] uppercase font-medium"
          style={{ fontFamily: "var(--font-mono)", color: "var(--subtle)" }}
        >
          Scroll
        </span>
      </motion.div>
    </section>
  );
}

// Inline icon helpers — avoids Lucide dependency in this file
function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
