"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// =============================================================================
// Stats bar — deep Forest Green background, white numbers
// Mirrors design: 4 stats centered with animated counters
// =============================================================================

type Stat = {
  key: string;
  label: string;
  value: number;
  unit: string;
  icon: string;
};

const FALLBACK_STATS: Stat[] = [
  { key: "sevas_completed", label: "Sevas Completed",     value: 5200,  unit: "+",      icon: "🙏" },
  { key: "families_served", label: "Families Served",     value: 8000,  unit: "+",      icon: "👨‍👩‍👧‍👦" },
  { key: "years_serving",   label: "Years of Seva",       value: 12,    unit: " Yrs",   icon: "📅" },
  { key: "avg_rating",      label: "Average Rating",      value: 49,    unit: "/5",     icon: "⭐" },
];

function useCountUp(target: number, isActive: boolean, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(target);
      return;
    }

    let frame: number;
    const start = Date.now();
    const eased = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.round(target * eased(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isActive, duration]);

  return count;
}

function StatItem({ stat, index, isActive }: { stat: Stat; index: number; isActive: boolean }) {
  const raw = useCountUp(stat.value, isActive, 1600 + index * 200);

  // Format: 49 → "4.9", 8000 → "8,000", 5200 → "5,200", 12 → "12"
  const formatted =
    stat.key === "avg_rating"
      ? (raw / 10).toFixed(1)
      : new Intl.NumberFormat("en-IN").format(raw);

  return (
    <div className="stat-item text-center" aria-label={`${formatted}${stat.unit} ${stat.label}`}>
      <div
        className="font-display font-semibold mb-2 leading-none"
        style={{
          fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
          letterSpacing: "-0.02em",
          color: "var(--brand-fg)",
        }}
        aria-live="polite"
      >
        {formatted}
        <span style={{ fontSize: "0.65em", opacity: 0.8 }}>{stat.unit}</span>
      </div>
      <div
        className="text-sm font-medium"
        style={{ color: "oklch(98% 0.004 148 / 0.70)" }}
      >
        {stat.label}
      </div>
    </div>
  );
}

export function StatsSection({ stats }: { stats?: Stat[] }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const displayStats = stats && stats.length > 0 ? stats : FALLBACK_STATS;

  return (
    <section
      ref={ref}
      aria-label="Seva statistics"
      style={{
        background: "var(--brand)",
        padding: "3rem clamp(1.25rem, 6vw, 6rem)",
      }}
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-8"
        style={{ maxWidth: "var(--width-content)", margin: "0 auto" }}
      >
        {displayStats.map((stat, i) => (
          <StatItem key={stat.key} stat={stat} index={i} isActive={isInView} />
        ))}
      </div>
    </section>
  );
}
