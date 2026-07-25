// =============================================================================
// Permission helpers — safe for client + server (no next/headers, no auth()).
// =============================================================================

import type { AdminRole } from "@prisma/client";

export type Permission =
  | "bookings:read"
  | "bookings:write"
  | "bookings:delete"
  | "users:read"
  | "users:write"
  | "packages:read"
  | "packages:write"
  | "packages:delete"
  | "services:read"
  | "services:write"
  | "services:delete"
  | "faqs:write"
  | "coupons:read"
  | "coupons:write"
  | "payments:read"
  | "payments:refund"
  | "blogs:read"
  | "blogs:write"
  | "blogs:delete"
  | "proofs:upload"
  | "proofs:delete"
  | "testimonials:approve"
  | "campaigns:write"
  | "gallery:write"
  | "analytics:read"
  | "admins:manage"
  | "config:write";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "bookings:read",
    "bookings:write",
    "bookings:delete",
    "users:read",
    "users:write",
    "packages:read",
    "packages:write",
    "packages:delete",
    "services:read",
    "services:write",
    "services:delete",
    "faqs:write",
    "coupons:read",
    "coupons:write",
    "payments:read",
    "payments:refund",
    "blogs:read",
    "blogs:write",
    "blogs:delete",
    "proofs:upload",
    "proofs:delete",
    "testimonials:approve",
    "campaigns:write",
    "gallery:write",
    "analytics:read",
    "admins:manage",
    "config:write",
  ],
  OPERATIONS_ADMIN: [
    "bookings:read",
    "bookings:write",
    "users:read",
    "packages:read",
    "packages:write",
    "services:read",
    "services:write",
    "faqs:write",
    "coupons:read",
    "coupons:write",
    "payments:read",
    "payments:refund",
    "proofs:upload",
    "campaigns:write",
    "gallery:write",
    "analytics:read",
  ],
  CONTENT_ADMIN: [
    "services:read",
    "services:write",
    "faqs:write",
    "blogs:read",
    "blogs:write",
    "blogs:delete",
    "testimonials:approve",
    "gallery:write",
    "campaigns:write",
  ],
  SUPPORT_ADMIN: [
    "bookings:read",
    "users:read",
    "payments:read",
    "services:read",
  ],
};

export function hasPermission(
  adminRole: AdminRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
}

export function getPermissions(adminRole: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[adminRole] ?? [];
}

export function getRolePermissionMatrix(): Record<AdminRole, Permission[]> {
  return ROLE_PERMISSIONS;
}
