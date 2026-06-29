"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star, CheckCircle, Play } from "lucide-react";

const TRUST_BADGES = [
  { icon: "🔒", text: "100% Secure" },
  { icon: "📸", text: "Photo & Video Proof" },
  { icon: "📸", text: "Photo & Video Proof" },
  { icon: "🏛️", text: "5,000+ Sevas Done" },
];

// Seeded PRNG (mulberry32) — deterministic so SSR and client output identical values.
// Using Math.random() at module level causes hydration mismatch because the
// server and client generate different sequences.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = seededRandom(0xdeadbeef);

const FLOAT_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  size: rng() * 6 + 3,
  x: rng() * 100,
  y: rng() * 100,
  delay: rng() * 5,
  duration: rng() * 8 + 10,
}));

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFFCF8 0%, #F5EEDB 60%, #E8DCC2 100%)" }}
    >
      {/* Parallax radial glow background */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Primary warm glow */}
        <div
          className="absolute w-[900px] h-[900px] rounded-full -top-32 -left-48"
          style={{
            background: "radial-gradient(circle, rgba(184,153,71,0.15) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Crimson glow */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full bottom-0 right-0"
          style={{
            background: "radial-gradient(circle, rgba(139,30,30,0.08) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </motion.div>

      {/* Animated dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{
          backgroundImage: "radial-gradient(circle, #B89947 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FLOAT_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.id % 2 === 0
                ? "rgba(184,153,71,0.4)"
                : "rgba(139,30,30,0.2)",
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Rotating mandala - Darker for light background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none hidden xl:block">
        <motion.svg
          width="720"
          height="720"
          viewBox="0 0 720 720"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          {[280, 240, 200, 160, 120, 80].map((r, i) => (
            <circle key={r} cx="360" cy="360" r={r} stroke="#8B1E1E" strokeWidth={i % 2 === 0 ? 1.5 : 0.5} />
          ))}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={360 + 280 * Math.cos(angle)} y1={360 + 280 * Math.sin(angle)}
                x2={360 + 80 * Math.cos(angle)} y2={360 + 80 * Math.sin(angle)}
                stroke="#8B1E1E" strokeWidth="0.5"
              />
            );
          })}
        </motion.svg>
      </div>

      {/* Main content */}
      <motion.div style={{ opacity }} className="container relative z-10 pt-32 pb-20">
        <div className="max-w-4xl">

          {/* Trust chip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8 border"
            style={{
              background: "rgba(184,153,71,0.1)",
              borderColor: "rgba(184,153,71,0.3)",
            }}
          >
            <Star className="w-3.5 h-3.5 fill-[#B89947] text-[#B89947]" />
            <span className="text-[#8C702E] text-xs font-bold tracking-[0.12em] uppercase">
              Trusted by 10,000+ Devotees Worldwide
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-[#2A2825] mb-6 leading-[1.05]"
            style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
          >
            Book{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8B1E1E 0%, #B89947 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sacred Seva
            </span>
            <br />
            <span className="text-[#2A2825]">in Vrindavan &</span>{" "}
            <span className="text-[#2A2825]">Mathura</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-[#4A453F] text-xl leading-relaxed mb-10 max-w-2xl font-body"
          >
            Sponsor Bhandara, Brahmin Bhoj, Gau Seva & Festival Seva online —
            and receive transparent{" "}
            <strong className="text-[#8B1E1E] font-semibold">
              photo and video proof
            </strong>{" "}
            delivered to you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-14"
          >
            <Link
              href="/services"
              className="group relative inline-flex items-center justify-center gap-2.5 px-9 h-14 rounded-xl font-semibold text-base text-white overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                boxShadow: "0 0 30px rgba(139,30,30,0.25), 0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <span className="relative z-10">Book a Seva Today</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </Link>

            <button
              className="group inline-flex items-center justify-center gap-3 px-7 h-14 rounded-xl font-semibold text-sm text-[#4A453F] hover:text-[#2A2825] transition-all bg-white/50 hover:bg-white/80 flex-shrink-0"
              style={{ border: "1px solid rgba(184,153,71,0.3)" }}
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                <Play className="w-3 h-3 fill-[#B89947] text-[#B89947] ml-0.5" />
              </span>
              Watch How It Works
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-5"
          >
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 text-[#4A453F] text-sm font-body font-medium"
              >
                <CheckCircle className="w-4 h-4 text-[#8B1E1E]" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-14"
          style={{ background: "linear-gradient(to bottom, transparent, #8B1E1E, transparent)" }}
        />
        <span className="text-[#8B1E1E] text-[9px] tracking-[0.3em] uppercase font-bold">Scroll</span>
      </motion.div>
    </section>
  );
}
