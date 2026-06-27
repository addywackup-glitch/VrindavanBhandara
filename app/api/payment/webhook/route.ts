import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhook, parseWebhookPayload } from "@/features/payments/razorpay";
import { createAuditLog } from "@/lib/audit";
import { sendBookingConfirmationEmail, sendPaymentReceivedEmail } from "@/features/notifications/email";
import { sendWhatsAppPaymentReceived } from "@/features/notifications/whatsapp";
import { formatCurrency } from "@/lib/utils";
import { sendWhatsAppRefundProcessed } from "@/features/notifications/whatsapp";
import { sendRefundConfirmationEmail } from "@/features/notifications/email";
import type { RazorpayWebhookPayload, BookingWithDetails } from "@/types";

// =============================================================================
// POST /api/payment/webhook
// Razorpay webhook — server-side payment event listener
// Source: PROJECT_RULES.md — "Every payment flow must support webhook verification"
// =============================================================================

// IMPORTANT: Must read raw body (not JSON.parse) for HMAC verification
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // =========================================================================
  // Step 1: Verify HMAC-SHA256 Signature
  // =========================================================================
  const isValid = verifyRazorpayWebhook(rawBody, signature);

  if (!isValid) {
    console.error("[WEBHOOK] Invalid Razorpay signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // =========================================================================
  // Step 2: Parse payload
  // =========================================================================
  let payload: RazorpayWebhookPayload;
  try {
    payload = parseWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;

  // Log all webhooks for audit
  await createAuditLog({
    action: "PAYMENT",
    entity: "Webhook",
    metadata: { event, accountId: payload.account_id },
  });

  // =========================================================================
  // Step 3: Handle events
  // =========================================================================
  try {
    switch (event) {
      case "payment.captured": {
        await handlePaymentCaptured(payload);
        break;
      }
      case "payment.failed": {
        await handlePaymentFailed(payload);
        break;
      }
      case "refund.processed": {
        await handleRefundProcessed(payload);
        break;
      }
      default:
        // Unknown events — log and return 200 (Razorpay will not retry)
        console.log(`[WEBHOOK] Unhandled event: ${event}`);
    }
  } catch (error) {
    console.error(`[WEBHOOK] Error handling event ${event}:`, error);
    // Return 200 to prevent Razorpay retry storms — log error for Sentry
    return NextResponse.json({ received: true, error: "Handler error" });
  }

  return NextResponse.json({ received: true });
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handlePaymentCaptured(payload: RazorpayWebhookPayload): Promise<void> {
  const paymentEntity = payload.payload.payment?.entity;
  if (!paymentEntity) return;

  const { id: paymentId, order_id: orderId } = paymentEntity;

  // Find payment record by Razorpay order ID
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    include: { booking: true },
  });

  if (!payment) {
    console.warn(`[WEBHOOK] Payment not found for order: ${orderId}`);
    return;
  }

  // Idempotent — skip if already captured
  if (payment.status === "CAPTURED" && payment.webhookVerified) {
    return;
  }

  // Fetch full booking details needed for notifications
  const bookingFull = await prisma.booking.findUnique({
    where: { id: payment.bookingId },
    include: {
      user: true,
      package: { include: { serviceCategory: true, items: true } },
      payment: true,
      certificate: true,
      mediaProofs: true,
      proofTimeline: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    // Update payment
    await tx.payment.update({
      where: { razorpayOrderId: orderId },
      data: {
        razorpayPaymentId: paymentId,
        status: "CAPTURED",
        capturedAt: new Date(),
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        webhookPayload: payload as never,
        gatewayResponse: paymentEntity as never,
      },
    });

    // Confirm booking if still pending (webhook arrived before verify endpoint)
    if (payment.booking.status === "PENDING") {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });

      await tx.proofTimelineEvent.create({
        data: {
          bookingId: payment.bookingId,
          eventType: "PAYMENT_CONFIRMED",
          title: "Payment Confirmed (Webhook)",
          description: "Payment confirmed via Razorpay webhook.",
          createdBy: "system",
        },
      });
    }
  });

  // Fire notifications asynchronously — never await to keep webhook fast
  if (bookingFull) {
    const amountStr = formatCurrency(bookingFull.totalAmount);
    Promise.allSettled([
      sendBookingConfirmationEmail(bookingFull as BookingWithDetails),
      sendPaymentReceivedEmail(bookingFull as BookingWithDetails),
      sendWhatsAppPaymentReceived({
        phone: bookingFull.user.phone,
        name: bookingFull.user.name,
        amount: amountStr,
        bookingNumber: bookingFull.bookingNumber,
      }),
    ]).catch((e) => console.error("[WEBHOOK] Notification error:", e));
  }
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload): Promise<void> {
  const paymentEntity = payload.payload.payment?.entity;
  if (!paymentEntity) return;

  const { order_id: orderId } = paymentEntity;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!payment) return;

  await prisma.payment.update({
    where: { razorpayOrderId: orderId },
    data: {
      status: "FAILED",
      webhookVerified: true,
      webhookReceivedAt: new Date(),
      webhookPayload: payload as never,
      failureReason: "Payment failed",
    },
  });
}

async function handleRefundProcessed(payload: RazorpayWebhookPayload): Promise<void> {
  // Razorpay sends refund entity inside payload.payload.refund.entity
  // Fallback to payment entity for order_id lookup
  const refundEntity = (payload.payload as Record<string, { entity?: Record<string, unknown> }>).refund?.entity;
  const paymentEntity = payload.payload.payment?.entity;

  const orderId = (refundEntity?.payment_id as string | undefined)
    ?? (paymentEntity?.order_id as string | undefined);
  const refundId = (refundEntity?.id as string | undefined) ?? undefined;
  const refundAmount = refundEntity?.amount
    ? Number(refundEntity.amount) / 100  // Razorpay amounts in paise
    : undefined;

  if (!orderId) {
    console.warn("[WEBHOOK] Refund processed: no order_id found in payload");
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    include: {
      booking: {
        include: {
          user: { select: { name: true, phone: true, email: true } },
          package: { include: { serviceCategory: true } },
        },
      },
    },
  });

  if (!payment) {
    console.warn(`[WEBHOOK] Refund: payment not found for order: ${orderId}`);
    return;
  }

  // Idempotent — skip if already refunded
  if (payment.status === "REFUNDED") return;

  await prisma.$transaction(async (tx) => {
    // Update payment record
    await tx.payment.update({
      where: { razorpayOrderId: orderId },
      data: {
        status: "REFUNDED",
        refundId: refundId ?? null,
        refundAmount: refundAmount ?? payment.amount,
        refundedAt: new Date(),
        webhookPayload: payload as never,
        gatewayResponse: refundEntity as never ?? paymentEntity as never,
      },
    });

    // Update booking status
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: "REFUNDED" },
    });

    // Add refund milestone to proof timeline
    await tx.proofTimelineEvent.create({
      data: {
        bookingId: payment.bookingId,
        eventType: "BOOKING_RECEIVED", // closest available enum; refund is out-of-scope of ProofTimelineEventType
        title: "Refund Processed",
        description: refundAmount
          ? `A refund of ${formatCurrency(refundAmount)} has been processed. It will reflect in your account within 5-7 business days.`
          : "Your refund has been processed. It will reflect in your account within 5-7 business days.",
        createdBy: "system",
        isVisible: true,
      },
    });
  });

  // Audit log
  await createAuditLog({
    action: "PAYMENT",
    entity: "Payment",
    entityId: payment.id,
    oldData: { status: payment.status },
    newData: { status: "REFUNDED", refundId, refundAmount },
    metadata: { orderId, bookingId: payment.bookingId, event: payload.event },
  });

  // Async notifications — never block webhook response
  const booking = payment.booking;
  if (booking) {
    const amountStr = formatCurrency(refundAmount ?? Number(payment.amount));
    Promise.allSettled([
      sendWhatsAppRefundProcessed({
        phone: booking.user.phone,
        name: booking.user.name,
        bookingNumber: booking.bookingNumber,
        amount: amountStr,
      }),
      sendRefundConfirmationEmail({
        name: booking.user.name,
        email: booking.user.email,
        bookingNumber: booking.bookingNumber,
        amount: amountStr,
        serviceName: booking.package.serviceCategory.name,
      }),
    ]).catch((e) => console.error("[WEBHOOK] Refund notification error:", e));
  }
}
