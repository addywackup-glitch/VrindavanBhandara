// =============================================================================
// GET /api/seva-stats — public live seva statistics. Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listSevaStats } from "@/lib/services/content.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    return listSevaStats();
  });
}
