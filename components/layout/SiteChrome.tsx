"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";

const MINIMAL_CHROME_PREFIXES = ["/dashboard", "/admin", "/book"];

function usesMinimalChrome(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/bookings/confirmation")) return true;
  return MINIMAL_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal = usesMinimalChrome(pathname);

  if (minimal) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div id="site-content">{children}</div>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
