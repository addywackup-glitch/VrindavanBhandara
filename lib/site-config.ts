// =============================================================================
// Site config — client-safe types, defaults, helpers (no Prisma / Node deps)
// =============================================================================

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

export function pickSetting(map: Record<string, string>, key: string, fallback: string): string {
  const v = map[key]?.trim();
  return v || fallback;
}

export function mapToPublicConfig(map: Record<string, string>): PublicSiteConfig {
  return {
    siteName: pickSetting(map, "site.name", DEFAULT_SITE_CONFIG.siteName),
    tagline: pickSetting(map, "site.tagline", DEFAULT_SITE_CONFIG.tagline),
    logoUrl: pickSetting(map, "brand.logoUrl", DEFAULT_SITE_CONFIG.logoUrl),
    faviconUrl: pickSetting(map, "brand.faviconUrl", DEFAULT_SITE_CONFIG.faviconUrl),
    supportPhone: pickSetting(map, "business.phone", DEFAULT_SITE_CONFIG.supportPhone),
    supportEmail: pickSetting(map, "business.email", DEFAULT_SITE_CONFIG.supportEmail),
    address: pickSetting(map, "business.address", DEFAULT_SITE_CONFIG.address),
    social: {
      instagram: pickSetting(map, "social.instagram", DEFAULT_SITE_CONFIG.social.instagram),
      facebook: pickSetting(map, "social.facebook", DEFAULT_SITE_CONFIG.social.facebook),
      youtube: pickSetting(map, "social.youtube", DEFAULT_SITE_CONFIG.social.youtube),
      twitter: pickSetting(map, "social.twitter", DEFAULT_SITE_CONFIG.social.twitter),
    },
    seo: {
      defaultTitle: pickSetting(map, "seo.defaultTitle", DEFAULT_SITE_CONFIG.seo.defaultTitle),
      defaultDescription: pickSetting(
        map,
        "seo.defaultDescription",
        DEFAULT_SITE_CONFIG.seo.defaultDescription
      ),
      ogImage: pickSetting(map, "seo.ogImage", DEFAULT_SITE_CONFIG.seo.ogImage),
    },
  };
}

export function parseAboutPage(raw: string | undefined): AboutPageContent {
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

/** Digits-only WhatsApp / tel target from a display phone string. */
export function phoneDigits(phone: string, fallback = "919999999999"): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits : fallback;
}
