"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import type { PublicSiteConfig } from "@/lib/site-config";

const MINIMAL_CHROME_PREFIXES = ["/dashboard", "/admin", "/book"];

function usesMinimalChrome(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/bookings/confirmation")) return true;
  return MINIMAL_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SiteChrome({
  children,
  siteConfig,
}: {
  children: React.ReactNode;
  siteConfig: PublicSiteConfig;
}) {
  const pathname = usePathname();
  const minimal = usesMinimalChrome(pathname);

  if (minimal) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar siteConfig={siteConfig} />
      <div id="site-content">{children}</div>
      <Footer siteConfig={siteConfig} />
      <WhatsAppFloat phone={siteConfig.supportPhone} />
    </>
  );
}
