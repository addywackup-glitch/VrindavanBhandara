"use server";

// =============================================================================
// Server Actions — Auth
// Same business logic as /api/auth/* but callable directly from Server/Client
// Components via the React Actions API. Backend only — no JSX, no UI state.
// =============================================================================

import { headers } from "next/headers";
import { registerUser, type RegisteredUser } from "@/lib/services/auth.service";
import { authRateLimit } from "@/lib/rate-limit";
import { ipFromHeaders } from "@/lib/api/http";
import { fail, type ServiceResult } from "@/lib/api/result";

export async function registerAction(
  input: unknown
): Promise<ServiceResult<RegisteredUser>> {
  try {
    const h = await headers();
    const ip = ipFromHeaders(h);

    const rl = await authRateLimit(ip);
    if (!rl.success) {
      return fail(
        "RATE_LIMITED",
        "Too many registration attempts. Please wait 15 minutes."
      );
    }

    return await registerUser(input, {
      ip,
      userAgent: h.get("user-agent") ?? undefined,
    });
  } catch (error) {
    console.error("[registerAction]", error);
    return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
  }
}
