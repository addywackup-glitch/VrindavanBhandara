// =============================================================================
// POST /api/payment/webhook
// Razorpay server-to-server webhook. Signature verification happens here at the
// transport edge (needs the raw body); all event handling is delegated to
// payment.service.processWebhookEvent.
// Source: PROJECT_RULES.md — "Every payment flow must support webhook verification"
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpayWebhook,
  parseWebhookPayload,
} from "@/features/payments/razorpay";
import { processWebhookEvent } from "@/lib/services/payment.service";
import type { RazorpayWebhookPayload } from "@/types";

// IMPORTANT: must read the RAW body (not request.json()) for HMAC verification.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    console.error("[WEBHOOK] Invalid Razorpay signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = parseWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await processWebhookEvent(payload);
  } catch (error) {
    // Return 200 so Razorpay does not enter a retry storm; the error is logged
    // (and captured by Sentry) for investigation.
    console.error(`[WEBHOOK] Error handling event ${payload.event}:`, error);
    return NextResponse.json({ received: true, error: "Handler error" });
  }

  return NextResponse.json({ received: true });
}
