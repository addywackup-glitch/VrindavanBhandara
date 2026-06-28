// =============================================================================
// VRINDAVAN BHANDARA — Actor (authenticated principal)
// Source: 09-security-standards.md — "RBAC mandatory"
//
// Pure type module (no Next.js imports) so the service layer stays
// framework-agnostic. The transport boundary resolves the session and passes
// a fully-typed Actor into services — services never call `auth()` themselves.
// =============================================================================

import type { AdminRole, UserRole } from "@prisma/client";

export type Actor = {
  userId: string;
  role: UserRole;
  adminRole?: AdminRole | null;
  name?: string;
};

export function isAdmin(actor: Actor): boolean {
  return actor.role === "ADMIN";
}
