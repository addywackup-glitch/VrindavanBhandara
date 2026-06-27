import type { MetadataRoute } from "next";

// =============================================================================
// Web App Manifest — /manifest.json
// Next.js App Router serves this file automatically at /manifest.json
// when you create app/manifest.ts
// =============================================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vrindavan Bhandara",
    short_name: "VB Seva",
    description:
      "Book Bhandara, Brahmin Bhoj, Gau Seva & Festival Seva in Vrindavan and Mathura. Transparent proof delivery with photos, videos & certificates.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: "#8B1E1E",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en-IN",
    categories: ["religion", "lifestyle", "travel"],
    icons: [
      {
        src: "/icon-16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Book a Seva",
        short_name: "Book Seva",
        description: "Browse and book a seva in Vrindavan or Mathura",
        url: "/services",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My Bookings",
        short_name: "Bookings",
        description: "View your seva bookings and proof delivery",
        url: "/dashboard/bookings",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
