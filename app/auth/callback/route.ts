import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncPrismaUserFromSupabase } from "@/lib/auth/sync-user";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

/**
 * OAuth / magic-link callback.
 * Exchange code for session, sync Prisma profile, redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeCallbackUrl(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const profile = await syncPrismaUserFromSupabase(data.user);
      if (profile?.role === "ADMIN" && next === "/dashboard") {
        return NextResponse.redirect(`${origin}/admin`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuthCallback`);
}
