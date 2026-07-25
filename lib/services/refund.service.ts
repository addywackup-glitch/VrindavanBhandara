// =============================================================================
// VRINDAVAN BHANDARA — Refund Service
// Source: Phase 2 §4/§8 — refund webhook + admin-initiated Razorpay refunds
//
// Admin "Process Refund" calls Razorpay via initiateRefund, then marks payment
// + booking REFUNDED in one transaction. Webhook remains the idempotent safety
// net for dashboard-initiated refunds and retries.
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
import {
  initiateRefund,
  RazorpayApiError,
} from "@/features/payments/razorpay";
import { hasPermission } from "@/lib/rbac";
import {
  AuthorizationError,
  BookingConflictError,
  NotFoundError,
  RefundError,
} from "@/lib/errors";
import { execute, validate } from "@/lib/api/service";
import { UpdateBookingStatusSchema } from "@/lib/validations";
import { getAllowedTransitions } from "@/lib/booking-transitions";
import { isAdmin, type Actor } from "@/lib/services/actor";
import type { Booking } from "@prisma/client";
import type { ServiceResult } from "@/lib/api/result";
import type { RazorpayWebhookPayload } from "@/types";

type Ctx = { ip?: string; userAgent?: string };

async function notifyRefundProcessed(params: {
  phone: string | null | undefined;
  name: string;
  email: string;
  bookingNumber: string;
  amount: string;
  serviceName: string;
}): Promise<void> {
  await Promise.allSettled([
    sendWhatsAppRefundProcessed({
      phone: params.phone,
      name: params.name,
      bookingNumber: params.bookingNumber,
      amount: params.amount,
    }),
    sendRefundConfirmationEmail({
      name: params.name,
      email: params.email,
      bookingNumber: params.bookingNumber,
      amount: params.amount,
      serviceName: params.serviceName,
    }),
  ]);
}

async function applyRefundToDb(params: {
  payment: PaymentWithRefundContext;
  refundId: string | null;
  refundAmount: number;
  gatewayResponse: unknown;
  webhookPayload?: unknown;
  adminNotes?: string | null;
  actorUserId?: string;
}): Promise<void> {
  const {
    payment,
    refundId,
    refundAmount,
    gatewayResponse,
    webhookPayload,
    adminNotes,
    actorUserId,
  } = params;

  await runTransaction(async (tx) => {
    await paymentRepository.update(
      payment.id,
      {
        status: "REFUNDED",
        refundId,
        refundAmount,
        refundedAt: new Date(),
        ...(webhookPayload !== undefined
          ? { webhookPayload: toJsonValue(webhookPayload) }
          : {}),
        gatewayResponse: toJsonValue(gatewayResponse),
      },
      tx
    );
    await bookingRepository.update(
      payment.bookingId,
      {
        status: "REFUNDED",
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      tx
    );
    await proofTimelineRepository.create(
      {
        bookingId: payment.bookingId,
        eventType: "REFUND_PROCESSED",
        title: "Refund Processed",
        description: `A refund of ${formatCurrency(
          refundAmount
        )} has been processed. It will reflect in 5-7 business days.`,
        createdBy: actorUserId ?? "system",
      },
      tx
    );
  });
}

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
  if (payment.status === "REFUNDED") return; // idempotent (also covers admin-initiated path)

  const refundAmount = refund ? refund.amount / 100 : payment.amount.toNumber();

  await applyRefundToDb({
    payment,
    refundId: refund?.id ?? null,
    refundAmount,
    gatewayResponse: refund ?? paymentEntity ?? {},
    webhookPayload: payload,
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
  await notifyRefundProcessed({
    phone: booking.user.phone,
    name: booking.user.name,
    email: booking.user.email,
    bookingNumber: booking.bookingNumber,
    amount: formatCurrency(refundAmount),
    serviceName: booking.package.serviceCategory.name,
  });
}

/**
 * Admin-initiated full refund: Razorpay → payment + booking REFUNDED + notify.
 */
export function processAdminRefund(
  actor: Actor,
  bookingId: string,
  input: unknown,
  ctx?: Ctx
): Promise<ServiceResult<Booking>> {
  return execute(async () => {
    if (!isAdmin(actor)) {
      throw new AuthorizationError("Only administrators can process refunds.");
    }
    if (!actor.adminRole || !hasPermission(actor.adminRole, "payments:refund")) {
      throw new AuthorizationError("You do not have permission to process refunds.");
    }

    const { adminNotes } = validate(UpdateBookingStatusSchema, {
      ...(typeof input === "object" && input ? input : {}),
      status: "REFUNDED",
    });

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking");

    if (!getAllowedTransitions(booking.status).includes("REFUNDED")) {
      throw new BookingConflictError(
        `Cannot transition booking from ${booking.status} to REFUNDED.`
      );
    }

    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new RefundError("No payment found for this booking.");
    }
    if (payment.status !== "CAPTURED") {
      throw new RefundError(
        `Payment must be CAPTURED to refund (current: ${payment.status}).`
      );
    }
    if (!payment.razorpayPaymentId) {
      throw new RefundError("Missing Razorpay payment id — cannot initiate refund.");
    }

    let razorpayRefund: { id?: string; amount?: number };
    try {
      razorpayRefund = (await initiateRefund({
        paymentId: payment.razorpayPaymentId,
        notes: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          adminUserId: actor.userId,
        },
      })) as { id?: string; amount?: number };
    } catch (err) {
      if (err instanceof RazorpayApiError) {
        throw new RefundError(err.message);
      }
      throw new RefundError("Razorpay refund failed.");
    }

    const refundAmount =
      typeof razorpayRefund.amount === "number"
        ? razorpayRefund.amount / 100
        : payment.amount.toNumber();

    // Reload with notification context for applyRefundToDb + notify
    const paymentCtx = await paymentRepository.findByPaymentIdWithRefundContext(
      payment.razorpayPaymentId
    );
    if (!paymentCtx) throw new RefundError("Payment context missing after refund.");

    await applyRefundToDb({
      payment: paymentCtx,
      refundId: razorpayRefund.id ?? null,
      refundAmount,
      gatewayResponse: razorpayRefund,
      adminNotes: adminNotes ?? booking.adminNotes,
      actorUserId: actor.userId,
    });

    await createAuditLog({
      userId: actor.userId,
      action: "PAYMENT",
      entity: "Payment",
      entityId: payment.id,
      oldData: { status: payment.status, bookingStatus: booking.status },
      newData: {
        status: "REFUNDED",
        refundId: razorpayRefund.id,
        refundAmount,
        bookingStatus: "REFUNDED",
      },
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
      metadata: { bookingId, source: "admin" },
    });

    await notifyRefundProcessed({
      phone: paymentCtx.booking.user.phone,
      name: paymentCtx.booking.user.name,
      email: paymentCtx.booking.user.email,
      bookingNumber: paymentCtx.booking.bookingNumber,
      amount: formatCurrency(refundAmount),
      serviceName: paymentCtx.booking.package.serviceCategory.name,
    });

    const updated = await bookingRepository.findById(bookingId);
    if (!updated) throw new NotFoundError("Booking");
    return updated;
  }, "Refund processed via Razorpay");
}
