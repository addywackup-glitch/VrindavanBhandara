"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Package,
  FileText,
  Image,
  Award,
  MessageSquare,
  Star,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", icon: BookOpen, label: "Bookings" },
      { href: "/admin/proofs", icon: Image, label: "Proof Management" },
      { href: "/admin/certificates", icon: Award, label: "Certificates" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/packages", icon: Package, label: "Packages" },
      { href: "/admin/testimonials", icon: Star, label: "Testimonials" },
      { href: "/admin/blog", icon: FileText, label: "Blog" },
      { href: "/admin/gallery", icon: Image, label: "Gallery" },
    ],
  },
  {
    label: "Support & Users",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/messages", icon: MessageSquare, label: "Messages" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/roles", icon: ShieldCheck, label: "Roles & Admins" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #0F0F1C 0%, #1A1A2E 100%)", borderRight: "1px solid rgba(212,175,55,0.1)" }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}
          >
            🪔
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Vrindavan</p>
            <p className="text-xs" style={{ color: "#D4AF37" }}>Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-bold tracking-widest uppercase px-3 mb-2" style={{ color: "rgba(212,175,55,0.5)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                      background: active ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,119,34,0.1))" : "transparent",
                      color: active ? "#D4AF37" : "rgba(255,255,255,0.6)",
                      border: active ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#D4AF37" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          View Site
        </Link>
      </div>
    </aside>
  );
}
