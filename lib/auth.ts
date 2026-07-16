// =============================================================================
// VRINDAVAN BHANDARA — Auth (Supabase)
// Drop-in replacement for the previous NextAuth module.
// Server: `auth()` — Client: import from `@/lib/auth/client`.
// =============================================================================

export { auth } from "@/lib/auth/session";
export type { AppSession as Session } from "@/lib/auth/session";
