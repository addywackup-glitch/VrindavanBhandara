"use client";

// =============================================================================
// Client Providers — Supabase Auth session for useSession()
// =============================================================================

import { AuthProvider } from "@/lib/auth/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
