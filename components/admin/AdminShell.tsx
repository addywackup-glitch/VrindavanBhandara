"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "@/lib/auth";
import { ADMIN_NAV, getAdminPageMeta } from "@/components/admin/admin-nav";

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3L3 9v12h6v-7h6v7h6V9L12 3z" />
    </svg>
  );
}

export function AdminShell({
  children,
  session,
  pendingBookings = 0,
}: {
  children: React.ReactNode;
  session: Session;
  pendingBookings?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  const { title, breadcrumb } = getAdminPageMeta(pathname);
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/admin/bookings?search=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  };

  const adminRole = session.user.adminRole?.replace(/_/g, " ") ?? "ADMIN";
  const initials = session.user.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "AD";

  return (
    <div className="adm-shell">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="adm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="adm-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`adm-sidebar${mobileOpen ? " open" : ""}`} aria-label="Admin navigation">
        <div className="adm-sidebar-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
          <Link href="/admin" className="adm-sidebar-logo" onClick={() => setMobileOpen(false)}>
            <div className="adm-sidebar-logo-mark"><BrandMark /></div>
            <div>
              <div className="adm-sidebar-logo-text">VB Admin</div>
              <div className="adm-sidebar-logo-sub">CONTROL PANEL</div>
            </div>
          </Link>
          <button
            type="button"
            className="adm-menu-toggle"
            style={{ display: mobileOpen ? "flex" : undefined }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="adm-sidebar-nav">
          {ADMIN_NAV.map((group) => (
            <div key={group.label}>
              <div className="adm-nav-section">{group.label}</div>
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const badge =
                  item.badgeKey === "pendingBookings" && pendingBookings > 0
                    ? pendingBookings
                    : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`adm-nav-item${active ? " active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon}
                    <span className="adm-nav-label">{item.label}</span>
                    {badge !== undefined && (
                      <span className={`adm-nav-badge${item.badgeKey === "pendingBookings" ? " warning" : ""}`}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-user">
            <div className="adm-admin-avatar" aria-hidden="true">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="adm-admin-name">{session.user.name}</div>
              <div className="adm-admin-role">{adminRole}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main" style={{ position: "relative" }}>
        <a href="#admin-main-content" className="auth-skip-link">
          Skip to main content
        </a>
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <button
              type="button"
              className="adm-menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
            <div className="adm-topbar-title">{title}</div>
            {breadcrumb && <div className="adm-topbar-breadcrumb">{breadcrumb}</div>}
          </div>

          <div className="adm-topbar-right">
            <form className="adm-search-wrap" onSubmit={handleSearch} role="search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="adm-search-input"
                type="search"
                placeholder="Search bookings, customers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search admin panel"
              />
            </form>

            <Link href="/admin/bookings?status=PENDING" className="adm-notif-btn" aria-label="Pending bookings">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </Link>

            <Link href="/admin/bookings" className="adm-topbar-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              New Booking
            </Link>

            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="adm-profile-btn"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Admin profile menu"
              >
                <span className="adm-profile-avatar" aria-hidden="true">{initials}</span>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "var(--muted)", fill: "none", strokeWidth: 2 }} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="adm-profile-menu"
                    role="menu"
                  >
                    <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border)", marginBottom: "0.25rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg)" }}>{session.user.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{session.user.email}</div>
                    </div>
                    <Link href="/dashboard" className="adm-profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                      Customer Dashboard
                    </Link>
                    <Link href="/" className="adm-profile-menu-item" role="menuitem" target="_blank" onClick={() => setProfileOpen(false)}>
                      View Site
                    </Link>
                    <Link href="/admin/settings" className="adm-profile-menu-item" role="menuitem" onClick={() => setProfileOpen(false)}>
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="adm-profile-menu-item danger"
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="adm-content" id="admin-main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
