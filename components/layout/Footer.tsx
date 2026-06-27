"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SERVICES = [
  { label: "Bhandara Booking", href: "/services/bhandara" },
  { label: "Brahmin Bhoj Seva", href: "/services/brahmin-bhoj" },
  { label: "Gau Seva", href: "/services/gau-seva" },
  { label: "Sadhu Bhojan Seva", href: "/services/sadhu-bhojan" },
  { label: "Festival Seva", href: "/services/festival-seva" },
];

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blogs" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const LOCATIONS = [
  { label: "Bhandara in Vrindavan", href: "/vrindavan" },
  { label: "Bhandara in Mathura", href: "/mathura" },
];

const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: "https://facebook.com/VrindavanBhandara", label: "Facebook" },
  { Icon: InstagramIcon, href: "https://instagram.com/VrindavanBhandara", label: "Instagram" },
  { Icon: YoutubeIcon, href: "https://youtube.com/@VrindavanBhandara", label: "YouTube" },
  { Icon: XIcon, href: "https://twitter.com/VrindavanBhand", label: "X (Twitter)" },
];

// Sacred Sandalwood colors
const crimson = "#8B1E1E";
const antGold = "#B89947";
const bgFooter = "#2A1A0E"; // Deep warm brown — like aged sandalwood

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${bgFooter} 0%, #1E1208 60%, ${bgFooter} 100%)` }}
    >
      {/* Top accent border — crimson-to-gold */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${crimson}, ${antGold}, ${crimson})` }}
      />

      {/* Decorative background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${antGold} 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${crimson} 0%, transparent 70%)` }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, ${antGold} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative section-py">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-6 w-fit">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${antGold}, ${crimson})`, boxShadow: `0 0 24px rgba(139,30,30,0.3)` }}
              >
                <span className="text-2xl">🪔</span>
              </div>
              <div>
                <span className="block font-heading font-bold text-xl leading-tight" style={{ color: "#FFFCF8" }}>
                  Vrindavan Bhandara
                </span>
                <span className="block text-[10px] tracking-[0.15em] uppercase font-body font-bold" style={{ color: antGold }}>
                  Spiritual Seva Platform
                </span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: "rgba(255,252,248,0.55)" }}>
              India&apos;s most trusted platform to book Bhandara, Brahmin Bhoj, Gau Seva
              &amp; Festival Seva in Vrindavan and Mathura. Transparent proof delivery with
              photos, videos &amp; certificates.
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm transition-colors"
                style={{ color: "rgba(255,252,248,0.55)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.55)"; }}
              >
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: antGold }} />
                +91 99999 99999
              </a>
              <a
                href="mailto:seva@vrindavanbhandara.com"
                className="flex items-center gap-3 text-sm transition-colors"
                style={{ color: "rgba(255,252,248,0.55)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.55)"; }}
              >
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: antGold }} />
                seva@vrindavanbhandara.com
              </a>
              <div className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,252,248,0.55)" }}>
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: antGold }} />
                Vrindavan, Uttar Pradesh — 281121
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    border: "1px solid rgba(184,153,71,0.2)",
                    color: "rgba(255,252,248,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = antGold;
                    e.currentTarget.style.borderColor = `rgba(184,153,71,0.5)`;
                    e.currentTarget.style.background = "rgba(184,153,71,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255,252,248,0.4)";
                    e.currentTarget.style.borderColor = "rgba(184,153,71,0.2)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-bold mb-5 text-base" style={{ color: "#FFFCF8" }}>
              Our Services
            </h3>
            <ul className="space-y-3">
              {SERVICES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors flex items-center gap-2 group"
                    style={{ color: "rgba(255,252,248,0.5)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.5)"; }}
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: antGold }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links + Locations */}
          <div>
            <h3 className="font-heading font-bold mb-5 text-base" style={{ color: "#FFFCF8" }}>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors flex items-center gap-2"
                    style={{ color: "rgba(255,252,248,0.5)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.5)"; }}
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: antGold }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-heading font-bold mb-5 mt-8 text-base" style={{ color: "#FFFCF8" }}>
              Locations
            </h3>
            <ul className="space-y-3">
              {LOCATIONS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors flex items-center gap-2"
                    style={{ color: "rgba(255,252,248,0.5)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.5)"; }}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: antGold }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="font-heading font-bold mb-5 text-base" style={{ color: "#FFFCF8" }}>
              Trust &amp; Safety
            </h3>
            <ul className="space-y-3 mb-8">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors flex items-center gap-2"
                    style={{ color: "rgba(255,252,248,0.5)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = antGold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,252,248,0.5)"; }}
                  >
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: antGold }} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="space-y-3">
              {[
                { icon: "🔒", text: "SSL Secured Platform" },
                { icon: "✅", text: "Razorpay Secured Payments" },
                { icon: "📸", text: "Proof Guaranteed" },
                { icon: "📜", text: "Digital Certificates Issued" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,252,248,0.4)" }}>
                  <span className="text-base">{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(184,153,71,0.15)" }}
        >
          <p className="text-xs text-center sm:text-left" style={{ color: "rgba(255,252,248,0.3)" }}>
            © {currentYear} Vrindavan Bhandara. All rights reserved. Made with 🙏 in India.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,252,248,0.3)" }}>
            Serving devotees across 50+ countries worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
