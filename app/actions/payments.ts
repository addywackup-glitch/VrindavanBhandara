"use server";

// =============================================================================
// Server Actions — Payments
// Thin wrappers around payment.service. Returns are already serializable
// (plain objects). Backend only — no JSX, no UI state.
// =============================================================================

import { headers } from "next/headers";
import {
  createPaymentOrder,
  verifyPayment,
  type CreateOrderResult,
} from "@/lib/services/payment.service";
import { paymentRateLimit } from "@/lib/rate-limit";
import { getActor, ipFromHeaders } from "@/lib/api/http";
import { fail, type ServiceResult } from "@/lib/api/result";

export async function createPaymentOrderAction(
  input: unknown
): Promise<ServiceResult<CreateOrderResult>> {
  try {
    const h = await headers();
    const ip = ipFromHeaders(h);

    const rl = await paymentRateLimit(ip);
    if (!rl.success) {
      return fail("RATE_LIMITED", "Too many payment attempts. Please wait a minute.");
    }

    const actor = await getActor();
    if (!actor) return fail("UNAUTHORIZED", "Authentication required.");

    return await createPaymentOrder(actor, input, {
      ip,
      userAgent: h.get("user-agent") ?? undefined,
    });
  } catch (error) {
    console.error("[createPaymentOrderAction]", error);
    return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
  }
}

export async function verifyPaymentAction(
  input: unknown
): Promise<ServiceResult<{ bookingId: string; bookingNumber: string }>> {
  try {
    const h = await headers();
    const ip = ipFromHeaders(h);

    const rl = await paymentRateLimit(ip);
    if (!rl.success) return fail("RATE_LIMITED", "Rate limit exceeded.");

    const actor = await getActor();
    if (!actor) return fail("UNAUTHORIZED", "Authentication required.");

    return await verifyPayment(actor, input, {
      ip,
      userAgent: h.get("user-agent") ?? undefined,
    });
  } catch (error) {
    console.error("[verifyPaymentAction]", error);
    return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
  }
}
