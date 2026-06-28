// =============================================================================
// GET /api/faqs — public active FAQs. Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { listFaqs } from "@/lib/services/content.service";
import { getClientIp, handle } from "@/lib/api/http";
import { apiRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();
    return listFaqs();
  });
}
