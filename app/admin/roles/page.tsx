import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { AdminRole } from "@prisma/client";

export const metadata: Metadata = { title: "Roles & Permissions" };

const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Bookings: ["bookings:read", "bookings:write", "bookings:delete"],
  Users: ["users:read", "users:write"],
  Packages: ["packages:read", "packages:write", "packages:delete"],
  Payments: ["payments:read", "payments:refund"],
  Content: ["blogs:read", "blogs:write", "blogs:delete", "testimonials:approve", "campaigns:write"],
  Media: ["proofs:upload", "proofs:delete", "gallery:write"],
  Analytics: ["analytics:read"],
  Administration: ["admins:manage", "config:write"],
};

const ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

const ROLE_LABELS: Record<AdminRole, { label: string; color: string; bg: string; description: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "#7c3aed", bg: "#f5f3ff", description: "Full access to all features and settings." },
  OPERATIONS_ADMIN: { label: "Operations Admin", color: "#1d4ed8", bg: "#eff6ff", description: "Manages bookings, payments, proofs, and analytics." },
  CONTENT_ADMIN: { label: "Content Admin", color: "#15803d", bg: "#f0fdf4", description: "Manages blog, testimonials, gallery, and campaigns." },
  SUPPORT_ADMIN: { label: "Support Admin", color: "#b45309", bg: "#fffbeb", description: "Read-only access to bookings, users, and payments." },
};

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const admins = await prisma.admin.findMany({
    include: { user: { select: { name: true, email: true, image: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Permission matrix for each admin role. Role assignments are managed in the database.
        </p>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-2xl border mb-8 overflow-x-auto" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(212,175,55,0.08)", background: "#FDFAF5" }}>
          <h2 className="font-bold text-gray-700 text-sm">Permission Matrix</h2>
        </div>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
              <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Permission</th>
              {ADMIN_ROLES.map((role) => {
                const meta = ROLE_LABELS[role];
                return (
                  <th key={role} className="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: meta.color }}>
                    {meta.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
              <>
                <tr key={group + "-header"} style={{ background: "#FDFAF5" }}>
                  <td colSpan={5} className="px-6 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {group}
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm} className="border-t hover:bg-amber-50/20 transition-colors" style={{ borderColor: "rgba(212,175,55,0.06)" }}>
                    <td className="px-6 py-3 text-sm font-mono text-gray-600">{perm}</td>
                    {ADMIN_ROLES.map((role) => {
                      const allowed = hasPermission(role, perm);
                      return (
                        <td key={role} className="text-center py-3">
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                            style={{
                              background: allowed ? "#dcfce7" : "#f9fafb",
                              color: allowed ? "#15803d" : "#d1d5db",
                            }}
                          >
                            {allowed ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {ADMIN_ROLES.map((role) => {
          const meta = ROLE_LABELS[role];
          const roleAdmins = admins.filter((a) => a.role === role);
          return (
            <div
              key={role}
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: "rgba(212,175,55,0.1)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
                <span className="text-xs text-gray-400">{roleAdmins.length} admin{roleAdmins.length !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{meta.description}</p>

              {roleAdmins.length > 0 && (
                <div className="space-y-2">
                  {roleAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #B89947, #8B1E1E)" }}
                      >
                        {admin.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{admin.user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{admin.user.email}</p>
                      </div>
                      {!admin.isActive && (
                        <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full ml-auto shrink-0">Inactive</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        <strong>Assigning Roles:</strong> To add or change an admin role, update the <code>admins</code> table in the database (or use Prisma Studio).
        A Role Management UI with invite-by-email is planned for Phase 2.
      </div>
    </div>
  );
}
