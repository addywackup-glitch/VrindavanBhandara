import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  migrateLegacyPasswordUser,
  syncPrismaUserFromSupabase,
} from "@/lib/auth/sync-user";
import { authRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api/http";

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please wait.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;
  const supabase = await createClient();

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // One-time bridge: legacy bcrypt user → Supabase Auth
  if (error || !data.user) {
    const migrated = await migrateLegacyPasswordUser({ email, password });
    if (migrated) {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    }
  }

  if (error || !data.user) {
    return NextResponse.json(
      { success: false, error: "Invalid email or password", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const profile = await syncPrismaUserFromSupabase(data.user);
  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { success: false, error: "Account is inactive. Contact support.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { id: profile.id, role: profile.role, name: profile.name },
  });
}

/** Optional: ensure service role is configured (used by health checks). */
export async function GET() {
  try {
    createAdminClient();
    return NextResponse.json({ ok: true, provider: "supabase" });
  } catch {
    return NextResponse.json({ ok: false, provider: "supabase" }, { status: 503 });
  }
}
