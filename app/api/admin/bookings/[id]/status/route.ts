// =============================================================================
// PATCH /api/admin/bookings/:id/status
// Migrated to BookingService.updateBookingStatus — the single source of
// transition rules, timeline events, and customer notifications.
// =============================================================================

import { type NextRequest } from "next/server";
import { updateBookingStatus } from "@/lib/services/booking.service";
import { handle, parseJsonBody, requireAdmin } from "@/lib/api/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const body = await parseJsonBody(request);
    if (!body.ok) return body;

    const status =
      typeof body.data === "object" &&
      body.data !== null &&
      "status" in body.data
        ? (body.data as { status?: unknown }).status
        : undefined;

    const actor =
      status === "REFUNDED"
        ? await requireAdmin("payments:refund")
        : await requireAdmin("bookings:write");

    const { id } = await params;
    return updateBookingStatus(actor, id, body.data, {
      ip: request.headers.get("x-forwarded-for") ?? undefined,
    });
  });
}
