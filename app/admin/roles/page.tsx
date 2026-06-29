import type { Metadata } from "next";
import { Fragment } from "react";
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

const ROLE_LABELS: Record<AdminRole, { label: string; className: string; description: string }> = {
  SUPER_ADMIN: { label: "Super Admin", className: "adm-badge-completed", description: "Full access to all features and settings." },
  OPERATIONS_ADMIN: { label: "Operations Admin", className: "adm-badge-confirmed", description: "Manages bookings, payments, proofs, and analytics." },
  CONTENT_ADMIN: { label: "Content Admin", className: "adm-badge-confirmed", description: "Manages blog, testimonials, gallery, and campaigns." },
  SUPPORT_ADMIN: { label: "Support Admin", className: "adm-badge-pending", description: "Read-only access to bookings, users, and payments." },
};

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const admins = await prisma.admin.findMany({
    include: { user: { select: { name: true, email: true, image: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Roles & Admins</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Permission matrix for each admin role
          </p>
        </div>
      </div>

      <div className="adm-table-card" style={{ marginBottom: "1.75rem" }}>
        <div className="adm-detail-card-header">Permission Matrix</div>
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Permission</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role} scope="col" style={{ textAlign: "center" }}>
                  {ROLE_LABELS[role].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
              <Fragment key={group}>
                <tr style={{ background: "var(--n-50)" }}>
                  <td colSpan={5} style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
                    {group}
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{perm}</td>
                    {ADMIN_ROLES.map((role) => {
                      const allowed = hasPermission(role, perm);
                      return (
                        <td key={role} style={{ textAlign: "center" }}>
                          <span className={`adm-badge ${allowed ? "adm-badge-confirmed" : "adm-badge-refunded"}`}>
                            {allowed ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-bottom-grid" style={{ marginBottom: "1.75rem" }}>
        {ADMIN_ROLES.map((role) => {
          const meta = ROLE_LABELS[role];
          const roleAdmins = admins.filter((a) => a.role === role);
          return (
            <div key={role} className="adm-side-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className={`adm-badge ${meta.className}`}>{meta.label}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                  {roleAdmins.length} admin{roleAdmins.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.5 }}>{meta.description}</p>
              {roleAdmins.map((admin) => (
                <div key={admin.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                  <div className="adm-profile-avatar">{admin.user.name.charAt(0).toUpperCase()}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{admin.user.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.user.email}</p>
                  </div>
                  {!admin.isActive && <span className="adm-badge adm-badge-cancelled">Inactive</span>}
                  {!admin.user.isActive && <span className="adm-badge adm-badge-cancelled">Disabled</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="adm-alert adm-alert-success">
        To add or change an admin role, update the admins table in the database. Role assignments use the existing RBAC permission matrix.
      </div>
    </>
  );
}
