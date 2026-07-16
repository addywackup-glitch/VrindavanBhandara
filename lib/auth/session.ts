// =============================================================================
// Server session — drop-in replacement for NextAuth `auth()`.
// Returns the same AppSession shape used across pages and API boundaries.
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import {
  getAppSessionFromSupabaseUser,
  type AppSession,
} from "@/lib/auth/sync-user";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export type { AppSession };

export async function auth(): Promise<AppSession | null> {
  if (!hasSupabaseConfig()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return getAppSessionFromSupabaseUser(user);
  } catch (error) {
    console.error("[auth] session resolution failed", error);
    return null;
  }
}
