// =============================================================================
// GET /api/gallery — public active gallery images, optionally scoped to a
// service via ?serviceType=. Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listGallery } from "@/lib/services/content.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    return listGallery({
      serviceType: searchParams.get("serviceType"),
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    });
  });
}
