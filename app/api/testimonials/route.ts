// =============================================================================
// GET /api/testimonials — public approved/featured testimonials. Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listPublicTestimonials } from "@/lib/services/testimonial.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    const { searchParams } = new URL(request.url);
    return listPublicTestimonials({
      featured: searchParams.get("featured") === "true",
      limit: parseInt(searchParams.get("limit") ?? "12", 10),
    });
  });
}
