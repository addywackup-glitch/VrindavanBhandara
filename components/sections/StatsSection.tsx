"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Stat = {
  key: string;
  label: string;
  value: number;
  unit: string;
  icon: string;
  suffix?: string;
};

const FALLBACK_STATS: Stat[] = [
  { key: "meals_served", label: "Meals Served", value: 250000, unit: "Meals", icon: "🍱", suffix: "+" },
  { key: "bhandaras_completed", label: "Bhandaras Completed", value: 1200, unit: "", icon: "🪔", suffix: "+" },
  { key: "devotees_served", label: "Devotees Served", value: 10000, unit: "", icon: "🙏", suffix: "+" },
  { key: "countries_reached", label: "Countries Reached", value: 50, unit: "", icon: "🌍", suffix: "+" },
];

function useCountUp(target: number, duration: number = 2000, isActive: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, isActive]);

  return count;
}

function StatCard({ stat, index, isActive }: { stat: Stat; index: number; isActive: boolean }) {
  const count = useCountUp(stat.value, 2000 + index * 300, isActive);
  const formatted = new Intl.NumberFormat("en-IN").format(count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col items-center text-center p-8 rounded-2xl overflow-hidden bg-white"
      style={{
        border: "1px solid rgba(184,153,71,0.2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(184,153,71,0.1) 0%, transparent 70%)" }}
      />

      {/* Icon */}
      <motion.div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 relative z-10"
        style={{
          background: "linear-gradient(135deg, rgba(184,153,71,0.1), rgba(139,30,30,0.05))",
          border: "1px solid rgba(184,153,71,0.2)",
        }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {stat.icon}
      </motion.div>

      {/* Number */}
      <div className="relative z-10 mb-1">
        <span
          className="font-heading text-4xl font-bold"
          style={{
            background: "linear-gradient(135deg, #8B1E1E, #B89947)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {formatted}
        </span>
        {stat.suffix && (
          <span className="font-heading text-2xl font-bold" style={{ color: "#B89947" }}>{stat.suffix}</span>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-bold tracking-wider uppercase relative z-10" style={{ color: "#4A453F" }}>
        {stat.label}
      </p>

      {/* Bottom border on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, #8B1E1E, #B89947)" }}
      />
    </motion.div>
  );
}

export function StatsSection({ stats }: { stats?: Stat[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const displayStats = stats && stats.length > 0 ? stats : FALLBACK_STATS;

  return (
    <section
      ref={sectionRef}
      className="section-py relative overflow-hidden"
      style={{ background: "#F5EEDB" }} // Sandalwood Beige background
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #8B1E1E 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#8B1E1E",
              background: "rgba(139,30,30,0.06)",
              border: "1px solid rgba(139,30,30,0.2)",
            }}
          >
            Live Seva Statistics
          </span>
          <h2
            className="font-heading mb-3"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", color: "#2A2825" }}
          >
            Thousands of Devotees{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trust Us
            </span>
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "#4A453F" }}>
            Every number represents a real seva performed with devotion and transparency.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, i) => (
            <StatCard key={stat.key} stat={stat} index={i} isActive={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
