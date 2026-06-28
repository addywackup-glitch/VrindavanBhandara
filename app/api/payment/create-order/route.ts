// =============================================================================
// POST /api/payment/create-order — thin adapter over PaymentService.
// =============================================================================

import { type NextRequest } from "next/server";
import { createPaymentOrder } from "@/lib/services/payment.service";
import { paymentRateLimit } from "@/lib/rate-limit";
import { getClientIp, handle, parseJsonBody, requireActor } from "@/lib/api/http";
import { RateLimitError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const ip = getClientIp(request);
    const rl = await paymentRateLimit(ip);
    if (!rl.success) {
      throw new RateLimitError("Too many payment attempts. Please wait a minute.");
    }

    const actor = await requireActor();
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return createPaymentOrder(actor, body.data, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  });
}
