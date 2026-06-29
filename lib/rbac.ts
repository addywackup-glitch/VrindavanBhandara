// =============================================================================
// VRINDAVAN BHANDARA — RBAC (Role-Based Access Control)
// Source: 09-security-standards.md — "RBAC mandatory"
// =============================================================================

import { auth } from "@/lib/auth";
import type { AdminRole, UserRole } from "@prisma/client";

export type Permission =
  | "bookings:read"
  | "bookings:write"
  | "bookings:delete"
  | "users:read"
  | "users:write"
  | "packages:read"
  | "packages:write"
  | "packages:delete"
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
    "payments:read",
    "proofs:upload",
    "campaigns:write",
    "gallery:write",
    "analytics:read",
  ],
  CONTENT_ADMIN: [
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
  ],
};

export function hasPermission(
  adminRole: AdminRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
}

// =============================================================================
// Server-side auth helpers
// =============================================================================

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin(permission?: Permission) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  if (permission && session.user.adminRole) {
    const allowed = hasPermission(session.user.adminRole as AdminRole, permission);
    if (!allowed) {
      throw new Error("FORBIDDEN");
    }
  }

  return session;
}

export async function requireCustomer() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

// =============================================================================
// Check if user owns a resource
// =============================================================================
export function assertOwner(resourceUserId: string, sessionUserId: string, role: UserRole) {
  if (role === "ADMIN") return; // Admins can access any resource
  if (resourceUserId !== sessionUserId) {
    throw new Error("FORBIDDEN");
  }
}
