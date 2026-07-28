// =============================================================================
// Public site config — SiteConfig key-value → typed branding / About content
// =============================================================================

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SITE_CONFIG_CACHE_TAG = "site-config";

export type PublicSiteConfig = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    twitter: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string;
  };
};

export type AboutPillar = { icon: string; title: string; desc: string };
export type AboutStat = { value: string; label: string };

export type AboutPageContent = {
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  storyLabel: string;
  storyTitle: string;
  storyParagraphs: string[];
  pillars: AboutPillar[];
  stats: AboutStat[];
  ctaText: string;
  ctaButton: string;
  ctaHref: string;
};

export const DEFAULT_SITE_CONFIG: PublicSiteConfig = {
  siteName: "Vrindavan Bhandara",
  tagline: "India's most trusted platform for sacred Seva booking in Vrindavan and Mathura. Established 2012.",
  logoUrl: "",
  faviconUrl: "",
  supportPhone: "+91 98765 43210",
  supportEmail: "seva@vrindavanbhandara.com",
  address: "",
  social: {
    instagram: "https://instagram.com/VrindavanBhandara",
    facebook: "https://facebook.com/VrindavanBhandara",
    youtube: "https://youtube.com/@VrindavanBhandara",
    twitter: "https://twitter.com/VrindavanBhand",
  },
  seo: {
    defaultTitle: "",
    defaultDescription: "",
    ogImage: "",
  },
};

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  heroLabel: "Our Story",
  heroTitle: "Connecting Devotees Worldwide With the Sacred Land of Vrindavan",
  heroSubtitle:
    "Vrindavan Bhandara was founded with a simple mission — to make sacred seva accessible to every devotee, wherever they are in the world, with complete trust and transparency.",
  storyLabel: "Who We Are",
  storyTitle: "Born From Devotion",
  storyParagraphs: [
    "Vrindavan Bhandara was born from a deeply personal desire — to honour the tradition of Bhandara and sacred seva in the holy dhams of Vrindavan and Mathura, and make it accessible to millions of devotees around the world who cannot always be physically present.",
    "The holy land of Vrindavan is where Lord Krishna spent his divine childhood. Mathura is where he was born. These are not just cities — they are living, breathing temples where every step, every breath, every morsel of food offered carries immense spiritual merit.",
    "We have built Vrindavan Bhandara on three pillars: Devotion, Transparency, and Trust. When you book a seva with us, you are not just making a digital transaction — you are participating in a sacred act that has been performed for thousands of years in these holy lands.",
  ],
  pillars: [
    {
      icon: "🙏",
      title: "Devotion First",
      desc: "Every seva is performed with complete devotion and sincerity by our trusted team on the ground in Vrindavan and Mathura.",
    },
    {
      icon: "📸",
      title: "Radical Transparency",
      desc: "We believe in 100% transparency. Every booking comes with photo/video proof so you can trust your seva was completed.",
    },
    {
      icon: "🔒",
      title: "Security & Trust",
      desc: "PCI-DSS compliant payments via Razorpay. Your personal and payment data is always secure with us.",
    },
    {
      icon: "🌍",
      title: "Serving the Global Diaspora",
      desc: "We have served devotees from 50+ countries who cannot visit Vrindavan in person but wish to sponsor sacred sevas.",
    },
  ],
  stats: [
    { value: "2,50,000+", label: "Meals Served" },
    { value: "1,200+", label: "Bhandaras Completed" },
    { value: "52+", label: "Countries Served" },
    { value: "8,500+", label: "Proofs Delivered" },
  ],
  ctaText: "Ready to begin your seva journey?",
  ctaButton: "Book Your First Seva",
  ctaHref: "/book",
};

function pick(map: Record<string, string>, key: string, fallback: string): string {
  const v = map[key]?.trim();
  return v || fallback;
}

function mapToPublicConfig(map: Record<string, string>): PublicSiteConfig {
  return {
    siteName: pick(map, "site.name", DEFAULT_SITE_CONFIG.siteName),
    tagline: pick(map, "site.tagline", DEFAULT_SITE_CONFIG.tagline),
    logoUrl: pick(map, "brand.logoUrl", DEFAULT_SITE_CONFIG.logoUrl),
    faviconUrl: pick(map, "brand.faviconUrl", DEFAULT_SITE_CONFIG.faviconUrl),
    supportPhone: pick(map, "business.phone", DEFAULT_SITE_CONFIG.supportPhone),
    supportEmail: pick(map, "business.email", DEFAULT_SITE_CONFIG.supportEmail),
    address: pick(map, "business.address", DEFAULT_SITE_CONFIG.address),
    social: {
      instagram: pick(map, "social.instagram", DEFAULT_SITE_CONFIG.social.instagram),
      facebook: pick(map, "social.facebook", DEFAULT_SITE_CONFIG.social.facebook),
      youtube: pick(map, "social.youtube", DEFAULT_SITE_CONFIG.social.youtube),
      twitter: pick(map, "social.twitter", DEFAULT_SITE_CONFIG.social.twitter),
    },
    seo: {
      defaultTitle: pick(map, "seo.defaultTitle", DEFAULT_SITE_CONFIG.seo.defaultTitle),
      defaultDescription: pick(map, "seo.defaultDescription", DEFAULT_SITE_CONFIG.seo.defaultDescription),
      ogImage: pick(map, "seo.ogImage", DEFAULT_SITE_CONFIG.seo.ogImage),
    },
  };
}

function parseAboutPage(raw: string | undefined): AboutPageContent {
  if (!raw?.trim()) return DEFAULT_ABOUT_PAGE;
  try {
    const parsed = JSON.parse(raw) as Partial<AboutPageContent>;
    return {
      heroLabel: parsed.heroLabel?.trim() || DEFAULT_ABOUT_PAGE.heroLabel,
      heroTitle: parsed.heroTitle?.trim() || DEFAULT_ABOUT_PAGE.heroTitle,
      heroSubtitle: parsed.heroSubtitle?.trim() || DEFAULT_ABOUT_PAGE.heroSubtitle,
      storyLabel: parsed.storyLabel?.trim() || DEFAULT_ABOUT_PAGE.storyLabel,
      storyTitle: parsed.storyTitle?.trim() || DEFAULT_ABOUT_PAGE.storyTitle,
      storyParagraphs:
        Array.isArray(parsed.storyParagraphs) && parsed.storyParagraphs.length > 0
          ? parsed.storyParagraphs.map((p) => String(p)).filter(Boolean)
          : DEFAULT_ABOUT_PAGE.storyParagraphs,
      pillars:
        Array.isArray(parsed.pillars) && parsed.pillars.length > 0
          ? parsed.pillars.map((p) => ({
              icon: String(p?.icon ?? "🙏"),
              title: String(p?.title ?? ""),
              desc: String(p?.desc ?? ""),
            }))
          : DEFAULT_ABOUT_PAGE.pillars,
      stats:
        Array.isArray(parsed.stats) && parsed.stats.length > 0
          ? parsed.stats.map((s) => ({
              value: String(s?.value ?? ""),
              label: String(s?.label ?? ""),
            }))
          : DEFAULT_ABOUT_PAGE.stats,
      ctaText: parsed.ctaText?.trim() || DEFAULT_ABOUT_PAGE.ctaText,
      ctaButton: parsed.ctaButton?.trim() || DEFAULT_ABOUT_PAGE.ctaButton,
      ctaHref: parsed.ctaHref?.trim() || DEFAULT_ABOUT_PAGE.ctaHref,
    };
  } catch {
    return DEFAULT_ABOUT_PAGE;
  }
}

async function loadSiteConfigMap(): Promise<Record<string, string>> {
  const rows = await prisma.siteConfig.findMany({
    select: { key: true, value: true },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

const getCachedConfigMap = unstable_cache(loadSiteConfigMap, ["public-site-config-map"], {
  tags: [SITE_CONFIG_CACHE_TAG],
  revalidate: 60,
});

/** Request-deduped public branding config (navbar, footer, etc.). */
export const getPublicSiteConfig = cache(async (): Promise<PublicSiteConfig> => {
  const map = await getCachedConfigMap();
  return mapToPublicConfig(map);
});

/** Request-deduped About page content from `about.page` JSON setting. */
export const getAboutPageContent = cache(async (): Promise<AboutPageContent> => {
  const map = await getCachedConfigMap();
  return parseAboutPage(map["about.page"]);
});

/** Digits-only WhatsApp / tel target from a display phone string. */
export function phoneDigits(phone: string, fallback = "919999999999"): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits : fallback;
}
