import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // =============================================================================
  // Security Headers
  // Source: 09-security-standards.md — CSP, HSTS mandatory
  // =============================================================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS — force HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Clickjacking protection
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // XSS protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://app.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.cloudflare.com https://*.r2.dev https://media.vrindavanbhandara.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://app.posthog.com https://o0.ingest.sentry.io",
              "frame-src https://api.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // =============================================================================
  // Domain Redirects
  // vrindavanbhandara.in → vrindavanbhandara.com
  // =============================================================================
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "vrindavanbhandara.in" }],
        destination: "https://vrindavanbhandara.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vrindavanbhandara.in" }],
        destination: "https://vrindavanbhandara.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vrindavanbhandara.com" }],
        destination: "https://vrindavanbhandara.com/:path*",
        permanent: true,
      },
    ];
  },

  // =============================================================================
  // Image Optimization
  // =============================================================================
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.vrindavanbhandara.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // =============================================================================
  // TypeScript & ESLint — Handled by tsconfig.json and .eslintrc.js
  // =============================================================================

  // =============================================================================
  // Environment Variables exposed to client
  // =============================================================================
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://vrindavanbhandara.com",
    NEXT_PUBLIC_APP_NAME: "Vrindavan Bhandara",
  },
};

export default nextConfig;
