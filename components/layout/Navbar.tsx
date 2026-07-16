"use client";

// =============================================================================
// Navbar — session-aware navigation
// - Authenticated: avatar + user name + dropdown menu
// - Guest: Sign In link + Book a Seva CTA
// - Hidden on auth pages (/login, /register)
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home",     href: "/" },
  { label: "Services", href: "/services" },
  { label: "Gallery",  href: "/gallery" },
  { label: "About",    href: "/about" },
  { label: "Contact",  href: "/contact" },
] as const;

// Auth routes where the Navbar should not render (auth pages are full-screen overlays)
const AUTH_ROUTES = ["/login", "/register"];

// ── Brand mark ────────────────────────────────────────────────────────────────

function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

// ── User avatar ───────────────────────────────────────────────────────────────

function UserAvatar({ name, image, size = 32 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "User"}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--brand)",
        color: "var(--brand-fg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size < 28 ? "0.6rem" : "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserDropdown({ name, image, role }: { name?: string | null; image?: string | null; role?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ callbackUrl: "/" });
    router.refresh();
  };

  const isAdmin = role === "ADMIN";

  const menuItems = [
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: "⚙️" }] : []),
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "My Bookings", href: "/dashboard/bookings", icon: "📿" },
    { label: "Profile", href: "/dashboard/profile", icon: "👤" },
  ];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account menu for ${name ?? "user"}`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.25rem 0.5rem 0.25rem 0.25rem",
          borderRadius: "9999px",
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
          cursor: "pointer",
          transition: "border-color 150ms, background 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <UserAvatar name={name} image={image} size={28} />
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--fg)",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name?.split(" ")[0] ?? "Account"}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            color: "var(--subtle)",
            transition: "transform 200ms",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            role="menu"
            aria-label="Account menu"
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              minWidth: "200px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--sh-lg)",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            {/* User info header */}
            <div
              style={{
                padding: "0.875rem 1rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg)" }}>
                {name ?? "Account"}
              </p>
              {isAdmin && (
                <p style={{ fontSize: "0.75rem", color: "var(--brand)", fontWeight: 500, marginTop: "0.125rem" }}>
                  Admin
                </p>
              )}
            </div>

            {/* Menu items */}
            <ul role="none" style={{ listStyle: "none", padding: "0.375rem", margin: 0 }}>
              {menuItems.map((item) => (
                <li key={item.href} role="none">
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.875rem",
                      color: "var(--fg)",
                      textDecoration: "none",
                      fontWeight: 400,
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--n-50)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Sign out */}
            <div style={{ padding: "0.375rem", borderTop: "1px solid var(--border)" }}>
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.875rem",
                  color: "var(--danger)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--danger-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Navbar skeleton (shown while session is loading) ──────────────────────────

function NavbarSkeleton() {
  return (
    <div
      style={{
        width: "120px",
        height: "32px",
        borderRadius: "9999px",
        background: "var(--n-100)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
      aria-hidden="true"
    />
  );
}

// ── Main Navbar (inner) ───────────────────────────────────────────────────────
// All hooks live here so rules-of-hooks is satisfied.

function NavbarInner() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !mobileOpen;
  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  return (
    <>
      {/* ── Main bar ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role="banner"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 flex items-center",
          "transition-all duration-300"
        )}
        style={{
          background: transparent ? "transparent" : "oklch(100% 0 0 / 0.94)",
          backdropFilter: transparent ? "none" : "blur(12px)",
          WebkitBackdropFilter: transparent ? "none" : "blur(12px)",
          borderBottom: transparent ? "1px solid transparent" : "1px solid var(--border)",
          boxShadow: transparent ? "none" : "0 1px 0 var(--border)",
        }}
      >
        <div className="container flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
            aria-label="Vrindavan Bhandara — Home"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-fg transition-transform duration-200 hover:scale-105"
              style={{ background: "var(--brand)" }}
              aria-hidden="true"
            >
              <BrandMark size={18} />
            </div>
            <span
              className="font-display font-semibold text-lg leading-none tracking-tight"
              style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}
            >
              Vrindavan Bhandara
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-0.5">
            <ul className="flex items-center gap-0.5 list-none m-0 p-0" role="list">
              {NAV_LINKS.map(({ label, href }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "relative block px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      )}
                      style={{ color: active ? "var(--brand)" : "var(--muted)" }}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--fg)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--muted)"; }}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active-pill"
                          className="absolute inset-0 rounded-md pointer-events-none"
                          style={{ background: "var(--surface-brand)" }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <NavbarSkeleton />
            ) : isAuthenticated ? (
              <UserDropdown
                name={user?.name}
                image={user?.image}
                role={(user as { role?: string })?.role}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
                >
                  Sign in
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-brand-fg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  style={{ background: "var(--brand)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--brand-mid)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--sh-brand)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--brand)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Book a Seva
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md flex flex-col gap-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{ color: "var(--fg)" }}
          >
            <span className="block w-5 h-[1.5px] bg-current transition-all duration-300 origin-center" style={{ transform: mobileOpen ? "translateY(6.5px) rotate(45deg)" : "none" }} />
            <span className="block w-5 h-[1.5px] bg-current transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span className="block w-5 h-[1.5px] bg-current transition-all duration-300 origin-center" style={{ transform: mobileOpen ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </motion.header>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "oklch(14% 0.016 250 / 0.2)" }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            <motion.nav
              key="drawer"
              id="mobile-menu"
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-16 left-0 right-0 z-50 overflow-hidden"
              style={{
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                boxShadow: "var(--sh-lg)",
              }}
              aria-label="Mobile navigation"
            >
              <div className="container py-5 flex flex-col gap-1">
                {NAV_LINKS.map(({ label, href }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between px-4 py-3.5 rounded-lg text-[0.9375rem] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      style={{
                        color: active ? "var(--brand)" : "var(--fg)",
                        background: active ? "var(--surface-brand)" : "transparent",
                      }}
                      aria-current={active ? "page" : undefined}
                    >
                      {label}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  );
                })}

                <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                  {isAuthenticated ? (
                    <>
                      {/* Authenticated mobile section */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-lg)",
                          background: "var(--surface-brand)",
                        }}
                      >
                        <UserAvatar name={user?.name} image={user?.image} size={36} />
                        <div>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg)" }}>
                            {user?.name ?? "Account"}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                            {user?.email ?? ""}
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard" className="flex items-center justify-between px-4 py-3.5 rounded-lg text-[0.9375rem] font-medium" style={{ color: "var(--fg)" }}>
                        Dashboard
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <Link href="/dashboard/bookings" className="flex items-center justify-between px-4 py-3.5 rounded-lg text-[0.9375rem] font-medium" style={{ color: "var(--fg)" }}>
                        My Bookings
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2 px-4 py-3.5 rounded-lg text-[0.9375rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block w-full text-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        style={{ color: "var(--brand)", border: "1.5px solid var(--brand-light)" }}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/book"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
                      >
                        Book a Seva
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <MobileBottomNav pathname={pathname} isAuthenticated={isAuthenticated} />
    </>
  );
}

// ── Exported Navbar wrapper ───────────────────────────────────────────────────
// Thin wrapper: reads pathname to hide on auth routes, then renders NavbarInner.
// The inner component owns all hooks so rules-of-hooks is satisfied.

export function Navbar() {
  const pathname = usePathname();
  if (AUTH_ROUTES.includes(pathname)) return null;
  return <NavbarInner />;
}

// ── Mobile bottom navigation ──────────────────────────────────────────────────

const BOTTOM_NAV_GUEST = [
  {
    label: "Home",
    href: "/",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Sevas",
    href: "/services",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
    ),
  },
  {
    label: "Book",
    href: "/book",
    exact: false,
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Sign In",
    href: "/login",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Gallery",
    href: "/gallery",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
] as const;

const BOTTOM_NAV_AUTH = [
  {
    label: "Home",
    href: "/",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Sevas",
    href: "/services",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
      </svg>
    ),
  },
  {
    label: "Book",
    href: "/book",
    exact: false,
    primary: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "My Sevas",
    href: "/dashboard",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Gallery",
    href: "/gallery",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
] as const;

function MobileBottomNav({ pathname, isAuthenticated }: { pathname: string; isAuthenticated: boolean }) {
  const navItems = isAuthenticated ? BOTTOM_NAV_AUTH : BOTTOM_NAV_GUEST;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation" role="navigation">
      {navItems.map(({ label, href, exact, icon, ...rest }) => {
        const primary = "primary" in rest ? rest.primary : false;
        const active = exact
          ? pathname === href
          : pathname.startsWith(href as string) && (href as string) !== "/";
        const isHomeActive = exact && (href as string) === "/" && pathname === "/";

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[64px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
              "transition-colors duration-150"
            )}
            aria-label={label}
            aria-current={(active || isHomeActive) ? "page" : undefined}
          >
            {primary ? (
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center -mt-6 mb-0.5"
                style={{
                  background: "var(--brand)",
                  boxShadow: "var(--sh-brand)",
                  color: "var(--brand-fg)",
                }}
              >
                <span className="w-5 h-5">{icon}</span>
              </span>
            ) : (
              <span
                className="w-6 h-6"
                style={{ color: (active || isHomeActive) ? "var(--brand)" : "var(--subtle)" }}
              >
                {icon}
              </span>
            )}
            <span
              className="text-[10px] font-medium leading-none"
              style={{
                color: primary
                  ? "var(--brand)"
                  : (active || isHomeActive) ? "var(--brand)" : "var(--subtle)",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
