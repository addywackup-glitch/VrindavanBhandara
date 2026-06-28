// =============================================================================
// /api/bookings — list (GET) and create (POST). Thin adapter.
// =============================================================================

import { type NextRequest } from "next/server";
import { createBooking, listBookings } from "@/lib/services/booking.service";
import { apiRateLimit } from "@/lib/rate-limit";
import { getClientIp, handle, parseJsonBody, requireActor } from "@/lib/api/http";
import { RateLimitError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const rl = await apiRateLimit(getClientIp(request));
    if (!rl.success) throw new RateLimitError("Rate limit exceeded. Please slow down.");

    const actor = await requireActor();
    const { searchParams } = new URL(request.url);
    return listBookings(actor, {
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      status: searchParams.get("status"),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(
    async () => {
      const ip = getClientIp(request);
      const rl = await apiRateLimit(ip);
      if (!rl.success) throw new RateLimitError();

      const actor = await requireActor();
      const body = await parseJsonBody(request);
      if (!body.ok) return body;
      return createBooking(actor, body.data, {
        ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
    },
    { successStatus: 201 }
  );
}
