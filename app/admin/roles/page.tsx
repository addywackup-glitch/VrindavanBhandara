import type { Metadata } from "next";
import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { AdminRole } from "@prisma/client";
import { RolesClient } from "@/components/admin/RolesClient";

export const metadata: Metadata = { title: "Roles & Permissions" };

const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Bookings: ["bookings:read", "bookings:write", "bookings:delete"],
  Users: ["users:read", "users:write"],
  Packages: ["packages:read", "packages:write", "packages:delete"],
  Services: ["services:read", "services:write", "services:delete"],
  Coupons: ["coupons:read", "coupons:write"],
  Payments: ["payments:read", "payments:refund"],
  Content: [
    "blogs:read",
    "blogs:write",
    "blogs:delete",
    "testimonials:approve",
    "campaigns:write",
    "faqs:write",
    "gallery:write",
  ],
  Media: ["proofs:upload", "proofs:delete"],
  Analytics: ["analytics:read"],
  Administration: ["admins:manage", "config:write"],
};

const ADMIN_ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "CONTENT_ADMIN",
  "SUPPORT_ADMIN",
];

const ROLE_LABELS: Record<
  AdminRole,
  { label: string; className: string; description: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className: "adm-badge-completed",
    description: "Full access to all features and settings.",
  },
  OPERATIONS_ADMIN: {
    label: "Operations Admin",
    className: "adm-badge-confirmed",
    description: "Manages bookings, payments, proofs, coupons, and analytics.",
  },
  CONTENT_ADMIN: {
    label: "Content Admin",
    className: "adm-badge-confirmed",
    description: "Manages blog, testimonials, gallery, FAQs, and campaigns.",
  },
  SUPPORT_ADMIN: {
    label: "Support Admin",
    className: "adm-badge-pending",
    description: "Read-only access to bookings, users, payments, and services.",
  },
};

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  if (!session.user.adminRole || !hasPermission(session.user.adminRole, "admins:manage")) {
    redirect("/admin");
  }

  const admins = await prisma.admin.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Roles & Admins</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Assign admin roles and review the permission matrix
          </p>
        </div>
      </div>

      <RolesClient
        currentUserId={session.user.id}
        admins={admins.map((a) => ({
          id: a.id,
          role: a.role,
          isActive: a.isActive,
          user: {
            id: a.user.id,
            name: a.user.name,
            email: a.user.email,
            image: a.user.image,
          },
        }))}
      />

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
                  <td
                    colSpan={5}
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    {group}
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      {perm}
                    </td>
                    {ADMIN_ROLES.map((role) => {
                      const allowed = hasPermission(role, perm);
                      return (
                        <td key={role} style={{ textAlign: "center" }}>
                          <span
                            className={`adm-badge ${allowed ? "adm-badge-confirmed" : "adm-badge-refunded"}`}
                          >
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
          const roleAdmins = admins.filter((a) => a.role === role && a.isActive);
          return (
            <div key={role} className="adm-side-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span className={`adm-badge ${meta.className}`}>{meta.label}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                  {roleAdmins.length} active
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  marginBottom: "1rem",
                  lineHeight: 1.5,
                }}
              >
                {meta.description}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
