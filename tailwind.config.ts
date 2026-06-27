import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // =========================================================================
      // Color Palette
      // Source: 05-ui-design-system.md, 13-brand-guidelines.md
      // =========================================================================
      colors: {
        // Primary Spiritual Palette
        ivory: {
          DEFAULT: "#FFFFF0",
          50: "#FFFFF5",
          100: "#FFFFF0",
          200: "#FFFDE8",
          300: "#FFFBD4",
          400: "#FFF8C0",
        },
        cream: {
          DEFAULT: "#FFF8DC",
          50: "#FFFDF5",
          100: "#FFF8DC",
          200: "#FFF3C4",
          300: "#FFECAA",
          400: "#FFE48F",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FDF9E8",
          100: "#F9F0C0",
          200: "#F2E08A",
          300: "#ECCF55",
          400: "#E4BF2A",
          500: "#D4AF37",
          600: "#B8962E",
          700: "#9A7D25",
          800: "#7C641C",
          900: "#5E4B13",
        },
        saffron: {
          DEFAULT: "#FF7722",
          50: "#FFF4EC",
          100: "#FFE4CC",
          200: "#FFC99A",
          300: "#FFA566",
          400: "#FF8833",
          500: "#FF7722",
          600: "#E06300",
          700: "#BF5500",
          800: "#9C4400",
          900: "#7A3500",
        },
        // Dark backgrounds
        charcoal: {
          DEFAULT: "#1A1A2E",
          50: "#F0F0F8",
          100: "#DCDCF0",
          200: "#B8B8E0",
          300: "#9494D0",
          400: "#7070C0",
          500: "#4C4CA0",
          600: "#383880",
          700: "#252560",
          800: "#1A1A2E",
          900: "#0F0F1C",
        },
        // Semantic
        success: "#16A34A",
        warning: "#CA8A04",
        error: "#DC2626",
        info: "#2563EB",
      },

      // =========================================================================
      // Typography
      // Source: 05-ui-design-system.md — Playfair Display + Inter
      // =========================================================================
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },

      // =========================================================================
      // Spacing & Layout
      // Source: 05-ui-design-system.md — "Large whitespace"
      // =========================================================================
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "38": "9.5rem",
        "42": "10.5rem",
        "46": "11.5rem",
        "50": "12.5rem",
        "section": "6rem",
        "section-sm": "4rem",
      },

      // =========================================================================
      // Gradients (via background utilities)
      // =========================================================================
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #D4AF37, #FF7722)",
        "gradient-gold-soft": "linear-gradient(135deg, #F2E08A, #FFD4A3)",
        "gradient-dark": "linear-gradient(135deg, #1A1A2E, #2D1B69)",
        "gradient-cream": "linear-gradient(180deg, #FFFFF0 0%, #FFF8DC 100%)",
        "gradient-hero": "linear-gradient(160deg, #1A1A2E 0%, #2D1B69 50%, #3D1F5C 100%)",
        "gradient-radial-gold": "radial-gradient(ellipse at center, #D4AF37 0%, #9A7D25 100%)",
      },

      // =========================================================================
      // Box Shadows (luxury cards)
      // =========================================================================
      boxShadow: {
        "luxury": "0 4px 24px rgba(212, 175, 55, 0.15), 0 1px 4px rgba(0,0,0,0.08)",
        "luxury-hover": "0 8px 40px rgba(212, 175, 55, 0.25), 0 2px 8px rgba(0,0,0,0.12)",
        "card": "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.4)",
        "glow-saffron": "0 0 20px rgba(255, 119, 34, 0.4)",
        "inner-gold": "inset 0 2px 8px rgba(212, 175, 55, 0.15)",
      },

      // =========================================================================
      // Border Radius
      // =========================================================================
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // =========================================================================
      // Animation & Keyframes
      // =========================================================================
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(212, 175, 55, 0)" },
        },
        "counter": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in-up-slow": "fade-in-up 0.9s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
      },

      // =========================================================================
      // Screens (mobile-first)
      // =========================================================================
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "3xl": "1920px",
      },
    },
  },
  plugins: [],
};

export default config;
