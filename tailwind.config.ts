import type { Config } from "tailwindcss";

// =============================================================================
// VRINDAVAN BHANDARA — Tailwind Configuration
// Design Direction: Sacred Precision · Forest Green + Sacred Amber
// Note: Primary tokens are defined via @theme in globals.css (Tailwind v4).
// This file handles plugin registration and legacy compatibility.
// =============================================================================

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Font families — mirror @theme in globals.css for Tailwind class usage
      fontFamily: {
        display:    ["var(--font-display)", "Georgia", "serif"],
        body:       ["var(--font-body)", "system-ui", "sans-serif"],
        sans:       ["var(--font-body)", "system-ui", "sans-serif"],
        serif:      ["var(--font-display)", "Georgia", "serif"],
        mono:       ["var(--font-mono)", "ui-monospace", "monospace"],
        devanagari: ["var(--font-devanagari)", "sans-serif"],
      },

      // Breakpoints — matches design responsive viewport matrix
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
        "3xl": "1920px",
      },

      // Max widths
      maxWidth: {
        content: "1200px",
        "content-wide": "1440px",
      },

      // Animations — supplement @keyframes in CSS
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.75)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-sm": "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in":    "fade-in 0.4s ease-out both",
        "scale-in":   "scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
        "shimmer":    "shimmer 1.6s infinite",
        "pulse-dot":  "pulse-dot 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
