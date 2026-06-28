"use server";

// =============================================================================
// Server Actions — Bookings
// Returns serializable BookingDto values (never raw Prisma objects) so results
// cross the Server Action boundary safely. Backend only — no JSX, no UI state.
// =============================================================================

import { headers } from "next/headers";
import {
  createBooking,
  updateBookingStatus,
  toBookingDto,
  type BookingDto,
} from "@/lib/services/booking.service";
import { apiRateLimit } from "@/lib/rate-limit";
import { getActor, ipFromHeaders } from "@/lib/api/http";
import { fail, ok, type ServiceResult } from "@/lib/api/result";

export async function createBookingAction(
  input: unknown
): Promise<ServiceResult<BookingDto>> {
  try {
    const h = await headers();
    const ip = ipFromHeaders(h);

    const rl = await apiRateLimit(ip);
    if (!rl.success) return fail("RATE_LIMITED", "Rate limit exceeded.");

    const actor = await getActor();
    if (!actor) return fail("UNAUTHORIZED", "Authentication required.");

    const result = await createBooking(actor, input, {
      ip,
      userAgent: h.get("user-agent") ?? undefined,
    });

    return result.ok ? ok(toBookingDto(result.data), result.message) : result;
  } catch (error) {
    console.error("[createBookingAction]", error);
    return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
  }
}

export async function updateBookingStatusAction(
  id: string,
  input: unknown
): Promise<ServiceResult<BookingDto>> {
  try {
    const h = await headers();
    const ip = ipFromHeaders(h);

    const actor = await getActor();
    if (!actor) return fail("UNAUTHORIZED", "Authentication required.");

    const result = await updateBookingStatus(actor, id, input, {
      ip,
      userAgent: h.get("user-agent") ?? undefined,
    });

    return result.ok ? ok(toBookingDto(result.data), result.message) : result;
  } catch (error) {
    console.error("[updateBookingStatusAction]", error);
    return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
  }
}
