// =============================================================================
// Site config — server loaders (Prisma). Do not import from client components.
// =============================================================================

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  SITE_CONFIG_CACHE_TAG,
  DEFAULT_ABOUT_PAGE,
  DEFAULT_SITE_CONFIG,
  mapToPublicConfig,
  parseAboutPage,
  type AboutPageContent,
  type PublicSiteConfig,
} from "@/lib/site-config";

async function loadSiteConfigMap(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteConfig.findMany({
      select: { key: true, value: true },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    // Soft-fail: branding must not take down every page when the pool is busy.
    console.error("[site-config] failed to load SiteConfig; using defaults", err);
    return {};
  }
}

const getCachedConfigMap = unstable_cache(loadSiteConfigMap, ["public-site-config-map"], {
  tags: [SITE_CONFIG_CACHE_TAG],
  revalidate: 60,
});

/** Request-deduped public branding config (navbar, footer, etc.). */
export const getPublicSiteConfig = cache(async (): Promise<PublicSiteConfig> => {
  const map = await getCachedConfigMap();
  if (Object.keys(map).length === 0) return DEFAULT_SITE_CONFIG;
  return mapToPublicConfig(map);
});

/** Request-deduped About page content from `about.page` JSON setting. */
export const getAboutPageContent = cache(async (): Promise<AboutPageContent> => {
  const map = await getCachedConfigMap();
  if (Object.keys(map).length === 0) return DEFAULT_ABOUT_PAGE;
  return parseAboutPage(map["about.page"]);
});
