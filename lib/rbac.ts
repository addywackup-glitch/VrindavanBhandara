// =============================================================================
// VRINDAVAN BHANDARA — RBAC (Role-Based Access Control)
// Source: 09-security-standards.md — "RBAC mandatory"
//
// Permission tables live in lib/permissions.ts (client-safe).
// This module adds server-only session helpers that call auth().
 // =============================================================================

import { auth } from "@/lib/auth";
import type { AdminRole, UserRole } from "@prisma/client";
import {
  hasPermission,
  type Permission,
} from "@/lib/permissions";

export type { Permission };
export {
  hasPermission,
  getPermissions,
  getRolePermissionMatrix,
} from "@/lib/permissions";

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

  if (permission) {
    if (!session.user.adminRole) {
      throw new Error("FORBIDDEN");
    }
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
