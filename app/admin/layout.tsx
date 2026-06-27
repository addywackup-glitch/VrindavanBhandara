import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin Panel — Vrindavan Bhandara", template: "%s | Admin — Vrindavan Bhandara" },
  robots: { index: false, follow: false }, // Never index admin pages
};

// =============================================================================
// Admin Layout — RBAC Guard
// Only ADMIN role users may access /admin/*
// Source: 09-security-standards.md — "Role-based access control"
// =============================================================================
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F5F0" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b"
          style={{ background: "white", borderColor: "rgba(212,175,55,0.1)" }}
        >
          <div />
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #B89947, #8B1E1E)" }}
            >
              {session.user.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-800 leading-tight">{session.user.name}</p>
              <p className="text-[10px] text-gray-400">Super Admin</p>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
