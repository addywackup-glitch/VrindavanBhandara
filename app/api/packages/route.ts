// =============================================================================
// GET /api/packages — public list of active packages. Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listPublicPackages } from "@/lib/services/content.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    const { searchParams } = new URL(request.url);
    return listPublicPackages({
      serviceType: searchParams.get("serviceType"),
      serviceSlug: searchParams.get("serviceSlug"),
    });
  });
}
