"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutDashboard, BookOpen, Award, User,
  LogOut, Bell, Menu, X, ChevronRight, Flame,
} from "lucide-react";

// Must match the Navbar heights in Navbar.tsx
const NAV_H_LG = "4.5rem";
const NAV_H_SM = "4rem";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "My Bookings", icon: BookOpen },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardSidebar({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Responsive CSS for Navbar height ─────────────────── */}
      <style>{`
        .db-wrapper        { padding-top: ${NAV_H_SM}; }
        .db-sidebar        { top: ${NAV_H_SM}; height: calc(100vh - ${NAV_H_SM}); }
        .db-overlay        { top: ${NAV_H_SM}; }
        .db-main-content   { margin-left: 0; }
        @media (min-width: 1024px) {
          .db-wrapper       { padding-top: ${NAV_H_LG}; }
          .db-sidebar       { top: ${NAV_H_LG}; height: calc(100vh - ${NAV_H_LG}); }
          .db-main-content  { margin-left: 16rem; /* 256px = w-64 */ }
        }
      `}</style>

      {/* ── Outer shell ─────────────────────────────────────── */}
      <div className="db-wrapper min-h-screen flex" style={{ background: "#FDFAF5" }}>
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="db-overlay fixed inset-x-0 bottom-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside
          className={`db-sidebar fixed left-0 w-64 z-40 flex flex-col transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
          style={{
            background: "linear-gradient(180deg, #1C0A0A 0%, #2A1A1A 60%, #180F00 100%)",
            borderRight: "1px solid rgba(184,153,71,0.12)",
          }}
        >
          {/* User card */}
          {session?.user && (
            <div
              className="px-4 py-4"
              style={{ borderBottom: "1px solid rgba(184,153,71,0.1)" }}
            >
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #B89947, #8B1E1E)" }}
                >
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{session.user.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(184,153,71,0.6)" }}>
                    {session.user.email}
                  </p>
                </div>
                <button
                  className="lg:hidden"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(184,153,71,0.22), rgba(139,30,30,0.18))"
                      : "transparent",
                    color: active ? "#D4AF37" : "rgba(255,255,255,0.55)",
                    border: active
                      ? "1px solid rgba(184,153,71,0.22)"
                      : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <ChevronRight
                      className="w-3.5 h-3.5"
                      style={{ color: "rgba(212,175,55,0.45)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Book New Seva CTA */}
          <div className="px-4 pb-4">
            <Link
              href="/services"
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                boxShadow: "0 4px 15px rgba(139,30,30,0.28)",
              }}
            >
              <Flame className="w-3.5 h-3.5 flex-shrink-0" />
              Book New Seva
            </Link>
          </div>

          {/* Sign Out */}
          <div
            className="px-3 pb-6 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm w-full transition-all"
              style={{ color: "rgba(255,255,255,0.38)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f87171";
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.38)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content area ────────────────────────────── */}
        <div className="db-main-content flex-1 flex flex-col min-w-0">
          {/* Mobile top bar — only visible on small screens */}
          <header
            className="lg:hidden flex items-center justify-between px-4 h-12 sticky top-0 z-20"
            style={{
              background: "rgba(253,250,245,0.96)",
              borderBottom: "1px solid rgba(184,153,71,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg"
              style={{ color: "#2A2825" }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span
              className="font-heading font-bold text-sm"
              style={{ color: "#2A2825" }}
            >
              My Dashboard
            </span>
            <button className="p-2 rounded-lg" style={{ color: "#2A2825" }}>
              <Bell className="w-5 h-5" />
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 p-5 lg:p-8" style={{ background: "#FDFAF5" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
