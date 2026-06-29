import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Providers } from "./providers";

// =============================================================================
// Fonts — Design System: Sacred Precision
// Display: Cormorant Garamond · Body: DM Sans · Mono: JetBrains Mono
// =============================================================================

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: "variable",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500"],
});

// =============================================================================
// Root Metadata
// =============================================================================

export const metadata: Metadata = {
  metadataBase: new URL("https://vrindavanbhandara.com"),
  title: {
    default: "Vrindavan Bhandara — Book Bhandara, Brahmin Bhoj & Gau Seva Online",
    template: "%s | Vrindavan Bhandara",
  },
  description:
    "India's most trusted platform to book Bhandara, Brahmin Bhoj Seva, Gau Seva, Sadhu Bhojan & Festival Seva in Vrindavan and Mathura. Transparent proof delivery with photos and videos.",
  keywords: [
    "Bhandara booking Vrindavan",
    "online Bhandara booking",
    "Brahmin Bhoj Seva",
    "Annadan Seva Vrindavan",
    "Gau Seva online",
    "Sadhu Bhojan Seva",
    "Festival Seva Mathura",
    "Bhandara booking Mathura",
    "online seva booking India",
    "spiritual seva platform",
  ],
  authors: [{ name: "Vrindavan Bhandara", url: "https://vrindavanbhandara.com" }],
  creator: "Vrindavan Bhandara",
  publisher: "Vrindavan Bhandara",
  category: "Religious & Spiritual Services",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vrindavanbhandara.com",
    siteName: "Vrindavan Bhandara",
    title: "Vrindavan Bhandara — Book Bhandara & Seva Online",
    description:
      "Book Bhandara, Brahmin Bhoj Seva, Gau Seva and Festival Seva in Vrindavan & Mathura. Transparent proof delivery with photos and videos.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vrindavan Bhandara — Spiritual Seva Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@VrindavanBhand",
    creator: "@VrindavanBhand",
    title: "Vrindavan Bhandara — Book Bhandara & Seva Online",
    description:
      "India's most trusted platform to book spiritual seva in Vrindavan and Mathura.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "https://vrindavanbhandara.com",
  },
  verification: {
    google: "GOOGLE_SITE_VERIFICATION_TOKEN",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a4d2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// =============================================================================
// Organization + WebSite JSON-LD
// =============================================================================

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vrindavan Bhandara",
  url: "https://vrindavanbhandara.com",
  logo: "https://vrindavanbhandara.com/logo.png",
  description:
    "India's most trusted online platform for booking spiritual seva — Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, and Festival Seva in Vrindavan and Mathura.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vrindavan",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER ?? "+919999999999",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://www.facebook.com/VrindavanBhandara",
    "https://www.instagram.com/VrindavanBhandara",
    "https://twitter.com/VrindavanBhand",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vrindavan Bhandara",
  url: "https://vrindavanbhandara.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://vrindavanbhandara.com/services?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

// =============================================================================
// Root Layout
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${notoDevanagari.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
