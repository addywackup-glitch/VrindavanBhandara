"use client";

// =============================================================================
// Dashboard Sidebar — pixel-matches design_v1/dashboard.html
// White sidebar, fixed left, collapses to off-canvas on mobile
// Accounts for the global Navbar height via CSS custom property
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "next-auth";

// Nav items matching design_v1/dashboard.html
const ACCOUNT_LINKS = [
  {
    href: "/dashboard",
    label: "Overview",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/bookings",
    label: "My Bookings",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
] as const;

const ACTION_LINKS = [
  {
    href: "/book",
    label: "Book a New Seva",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/services",
    label: "Explore Services",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
] as const;

// Brand mark
function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3L3 9v12h6v-7h6v7h6V9L12 3z" />
    </svg>
  );
}

// User initials avatar
function UserInitials({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";
  return (
    <div className="db-user-avatar" aria-hidden="true">
      {initials}
    </div>
  );
}

// Single nav item
function NavItem({
  href,
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`db-nav-item${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span className="db-nav-icon">{icon}</span>
      <span className="db-nav-label">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="db-nav-badge" aria-label={`${badge} unread`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardSidebar({
  children,
  session,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  session: Session | null;
  unreadCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Lock body scroll when mobile drawer is open (DOM side-effect only — no setState)
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const user = session?.user;

  return (
      <div className="db-shell" style={{ position: "relative" }}>
        <a href="#main-content" className="auth-skip-link">
          Skip to main content
        </a>
      {/* ── Mobile overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="db-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="db-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`db-sidebar${mobileOpen ? " open" : ""}`}
        aria-label="Dashboard navigation"
        role="navigation"
      >
        {/* Logo */}
        <div className="db-sidebar-header">
          <Link href="/" className="db-sidebar-logo" aria-label="Vrindavan Bhandara — Home">
            <div className="db-sidebar-logo-mark">
              <BrandMark />
            </div>
            <div>
              <div className="db-sidebar-logo-name">Vrindavan<br />Bhandara</div>
            </div>
          </Link>
          {/* Mobile close */}
          <button
            className="db-close-btn lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="db-sidebar-nav" aria-label="My account">
          <div className="db-nav-section-title">My Account</div>
          {ACCOUNT_LINKS.map(({ href, label, icon, exact }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(href, exact)}
              badge={label === "Notifications" ? unreadCount : undefined}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          <div className="db-nav-section-title" style={{ marginTop: "1.25rem" }}>
            Quick Actions
          </div>
          {ACTION_LINKS.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={false}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* User block + Sign out */}
        <div className="db-sidebar-footer">
          <div className="db-user-block">
            <UserInitials name={user?.name} />
            <div className="db-user-info">
              <div className="db-user-name">{user?.name ?? "Account"}</div>
              <div className="db-user-email">{user?.email ?? ""}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="db-signout-btn"
            aria-label="Sign out of your account"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="db-main">
        {/* Topbar */}
        <header className="db-topbar">
          <div className="db-topbar-left">
            {/* Mobile hamburger */}
            <button
              className="db-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <span className="db-topbar-title">
              {pathname === "/dashboard"
                ? "Dashboard"
                : pathname.includes("/bookings/")
                ? "Booking Detail"
                : pathname.endsWith("/bookings")
                ? "My Bookings"
                : pathname.endsWith("/notifications")
                ? "Notifications"
                : pathname.endsWith("/profile")
                ? "Profile"
                : "Dashboard"}
            </span>
          </div>

          <div className="db-topbar-right">
            {/* Notification bell */}
            <Link
              href="/dashboard/notifications"
              className="db-notif-btn"
              aria-label={
                unreadCount > 0
                  ? `Notifications — ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="db-notif-dot" aria-hidden="true" />
              )}
            </Link>
            {/* Book Seva CTA */}
            <Link href="/book" className="db-btn-book">
              + Book Seva
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="db-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
