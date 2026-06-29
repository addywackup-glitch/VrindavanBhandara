"use client";

import Link from "next/link";

// =============================================================================
// Footer — design spec: dark brand bg, 4-column grid, bottom bar
// =============================================================================

const SERVICES = [
  { label: "Bhandara Seva",     href: "/services/bhandara" },
  { label: "Brahmin Bhoj Seva", href: "/services/brahmin-bhoj" },
  { label: "Gau Seva",          href: "/services/gau-seva" },
  { label: "Vidhwa Seva",       href: "/services/vidhwa-seva" },
  { label: "Annadan Seva",      href: "/services/annadan" },
  { label: "Sadhu Bhojan",      href: "/services/sadhu-bhojan" },
];

const COMPANY = [
  { label: "About Us",      href: "/about" },
  { label: "Gallery",       href: "/gallery" },
  { label: "Testimonials",  href: "/#testimonials" },
  { label: "FAQ",           href: "/faq" },
  { label: "Contact",       href: "/contact" },
];

const ACCOUNT = [
  { label: "Sign In",       href: "/login" },
  { label: "Register",      href: "/register" },
  { label: "My Dashboard",  href: "/dashboard" },
  { label: "My Bookings",   href: "/dashboard/bookings" },
];

const LEGAL = [
  { label: "Privacy Policy",   href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy",    href: "/refund-policy" },
];

// Brand mark — same as navbar
function FooterBrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3C8 3 5 6 5 9c0 2 1.5 3.5 3.5 4M12 3c4 0 7 3 7 6 0 2-1.5 3.5-3.5 4M12 3v14" />
      <path d="M8.5 13C6 14 4 16 4 18h16c0-2-2-4-4.5-5" />
    </svg>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm leading-none transition-colors duration-150 hover:text-brand-fg focus-visible:outline-none focus-visible:underline"
        style={{ color: "oklch(98% 0.004 148 / 0.50)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.9)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.50)"; }}
      >
        {children}
      </Link>
    </li>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-display font-semibold text-base mb-5"
      style={{ color: "var(--brand-fg)" }}
    >
      {children}
    </h3>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER ?? "919999999999";

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "oklch(18% 0.06 148)" }}
      aria-label="Site footer"
    >
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="h-px"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(42% 0.14 148), transparent)",
        }}
      />

      {/* Subtle dot-grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(98% 0.004 148) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative" style={{ paddingTop: "4rem", paddingBottom: "3rem" }}>
        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fg rounded-lg"
              aria-label="Vrindavan Bhandara — Home"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(42% 0.14 148)", color: "var(--brand-fg)" }}
              >
                <FooterBrandMark />
              </div>
              <span
                className="font-display font-semibold text-xl leading-none"
                style={{ color: "var(--brand-fg)", letterSpacing: "-0.01em" }}
              >
                Vrindavan Bhandara
              </span>
            </Link>

            <p
              className="text-sm leading-relaxed mb-6 max-w-xs"
              style={{ color: "oklch(98% 0.004 148 / 0.50)" }}
            >
              India&apos;s most trusted platform for sacred Seva booking in Vrindavan
              and Mathura. Established 2012.
            </p>

            {/* Contact */}
            <address className="not-italic flex flex-col gap-3 mb-6 text-sm">
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 transition-colors duration-150"
                style={{ color: "oklch(98% 0.004 148 / 0.50)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.9)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.50)"; }}
              >
                <PhoneIcon />
                +91 98765 43210
              </a>
              <a
                href="mailto:seva@vrindavanbhandara.com"
                className="flex items-center gap-2.5 transition-colors duration-150"
                style={{ color: "oklch(98% 0.004 148 / 0.50)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.9)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.50)"; }}
              >
                <MailIcon />
                seva@vrindavanbhandara.com
              </a>
            </address>

            {/* Social links */}
            <div className="flex items-center gap-2" aria-label="Social media links">
              <SocialLink href="https://facebook.com/VrindavanBhandara" label="Facebook">
                <FacebookIcon />
              </SocialLink>
              <SocialLink href="https://instagram.com/VrindavanBhandara" label="Instagram">
                <InstagramIcon />
              </SocialLink>
              <SocialLink href="https://youtube.com/@VrindavanBhandara" label="YouTube">
                <YoutubeIcon />
              </SocialLink>
              <SocialLink href="https://twitter.com/VrindavanBhand" label="X (Twitter)">
                <XIcon />
              </SocialLink>
            </div>
          </div>

          {/* Services */}
          <div>
            <FooterColTitle>Services</FooterColTitle>
            <ul className="flex flex-col gap-3.5" role="list">
              {SERVICES.map(({ label, href }) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <FooterColTitle>Company</FooterColTitle>
            <ul className="flex flex-col gap-3.5" role="list">
              {COMPANY.map(({ label, href }) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <FooterColTitle>Account</FooterColTitle>
            <ul className="flex flex-col gap-3.5" role="list">
              {ACCOUNT.map(({ label, href }) => (
                <FooterLink key={href} href={href}>{label}</FooterLink>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div
          className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap"
          style={{ borderTop: "1px solid oklch(42% 0.14 148 / 0.3)" }}
        >
          <p
            className="text-xs text-center sm:text-left"
            style={{ color: "oklch(98% 0.004 148 / 0.35)" }}
          >
            © {year} Vrindavan Bhandara. All rights reserved. Made with 🙏 in India.
          </p>
          <nav aria-label="Legal links" className="flex items-center gap-5">
            {LEGAL.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-colors duration-150 focus-visible:underline focus-visible:outline-none"
                style={{ color: "oklch(98% 0.004 148 / 0.35)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.7)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.35)"; }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Icon helpers
// =============================================================================

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fg"
      style={{
        border: "1px solid oklch(42% 0.14 148 / 0.5)",
        color: "oklch(98% 0.004 148 / 0.4)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.9)";
        e.currentTarget.style.borderColor = "oklch(42% 0.14 148 / 0.9)";
        e.currentTarget.style.background = "oklch(42% 0.14 148 / 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "oklch(98% 0.004 148 / 0.4)";
        e.currentTarget.style.borderColor = "oklch(42% 0.14 148 / 0.5)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </a>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: "oklch(58% 0.13 148)" }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.99 2 2 2 0 013 .04h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: "oklch(58% 0.13 148)" }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
