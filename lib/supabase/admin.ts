// =============================================================================
// Service-role Supabase client — server only. Bypasses RLS.
// Used for: admin user creation, storage uploads, auth admin ops.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

let _admin: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (!_admin) {
    _admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _admin;
}
