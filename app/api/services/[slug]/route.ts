// =============================================================================
// GET /api/services/:slug — aggregate content payload for a single service page
// (service + packages + service-scoped FAQs + gallery + testimonials + related).
// Thin adapter: rate-limit -> service -> uniform envelope.
// =============================================================================

import { type NextRequest } from "next/server";
import { getServicePage } from "@/lib/services/content.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    const { slug } = await params;
    return getServicePage(slug);
  });
}
