// =============================================================================
// VRINDAVAN BHANDARA — Refund Service
// Source: Phase 2 §4/§8 — refund webhook processing (transactional, idempotent)
//
// FIX (carried from Phase 1): the Razorpay refund entity carries `payment_id`
// (a PAYMENT id), NOT an order id. We look up by payment id first, then fall
// back to the order id when the payment entity is present.
// =============================================================================

import {
  bookingRepository,
  paymentRepository,
  proofTimelineRepository,
  runTransaction,
  type PaymentWithRefundContext,
} from "@/lib/repositories";
import { createAuditLog } from "@/lib/audit";
import { formatCurrency } from "@/lib/utils";
import { toJsonValue } from "@/lib/services/json";
import { sendWhatsAppRefundProcessed } from "@/features/notifications/whatsapp";
import { sendRefundConfirmationEmail } from "@/features/notifications/email";
import type { RazorpayWebhookPayload } from "@/types";

export async function processRefundWebhook(
  payload: RazorpayWebhookPayload
): Promise<void> {
  const refund = payload.payload.refund?.entity;
  const paymentEntity = payload.payload.payment?.entity;

  const payment: PaymentWithRefundContext | null = refund?.payment_id
    ? await paymentRepository.findByPaymentIdWithRefundContext(refund.payment_id)
    : paymentEntity?.order_id
      ? await paymentRepository.findByOrderIdWithRefundContext(paymentEntity.order_id)
      : null;

  if (!payment) {
    console.warn("[WEBHOOK] Refund: no matching payment found");
    return;
  }
  if (payment.status === "REFUNDED") return; // idempotent

  const refundAmount = refund ? refund.amount / 100 : payment.amount.toNumber();

  await runTransaction(async (tx) => {
    await paymentRepository.update(
      payment.id,
      {
        status: "REFUNDED",
        refundId: refund?.id ?? null,
        refundAmount,
        refundedAt: new Date(),
        webhookPayload: toJsonValue(payload),
        gatewayResponse: toJsonValue(refund ?? paymentEntity ?? {}),
      },
      tx
    );
    await bookingRepository.update(payment.bookingId, { status: "REFUNDED" }, tx);
    await proofTimelineRepository.create(
      {
        bookingId: payment.bookingId,
        eventType: "REFUND_PROCESSED",
        title: "Refund Processed",
        description: `A refund of ${formatCurrency(
          refundAmount
        )} has been processed. It will reflect in 5-7 business days.`,
        createdBy: "system",
      },
      tx
    );
  });

  await createAuditLog({
    action: "PAYMENT",
    entity: "Payment",
    entityId: payment.id,
    oldData: { status: payment.status },
    newData: { status: "REFUNDED", refundId: refund?.id, refundAmount },
    metadata: { bookingId: payment.bookingId, event: payload.event },
  });

  const booking = payment.booking;
  const amount = formatCurrency(refundAmount);
  await Promise.allSettled([
    sendWhatsAppRefundProcessed({
      phone: booking.user.phone,
      name: booking.user.name,
      bookingNumber: booking.bookingNumber,
      amount,
    }),
    sendRefundConfirmationEmail({
      name: booking.user.name,
      email: booking.user.email,
      bookingNumber: booking.bookingNumber,
      amount,
      serviceName: booking.package.serviceCategory.name,
    }),
  ]);
}
