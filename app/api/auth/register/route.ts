// =============================================================================
// POST /api/auth/register — thin adapter over AuthService.registerUser.
// =============================================================================

import { type NextRequest } from "next/server";
import { registerUser } from "@/lib/services/auth.service";
import { authRateLimit } from "@/lib/rate-limit";
import { getClientIp, handle, parseJsonBody } from "@/lib/api/http";
import { RateLimitError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const ip = getClientIp(request);
      const rl = await authRateLimit(ip);
      if (!rl.success) {
        throw new RateLimitError(
          "Too many registration attempts. Please wait 15 minutes."
        );
      }
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return registerUser(body.data, {
        ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
    },
    { successStatus: 201 }
  );
}
