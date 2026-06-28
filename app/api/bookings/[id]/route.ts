// =============================================================================
// /api/bookings/:id — detail (GET) and status update (PUT, admin). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { getBooking, updateBookingStatus } from "@/lib/services/booking.service";
import { apiRateLimit } from "@/lib/rate-limit";
import { getClientIp, handle, parseJsonBody, requireActor } from "@/lib/api/http";
import { RateLimitError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError();

    const actor = await requireActor();
    const { id } = await params;
    return getBooking(actor, id);
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requireActor();
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body.ok) return body;
    return updateBookingStatus(actor, id, body.data, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  });
}
