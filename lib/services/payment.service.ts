// =============================================================================
// VRINDAVAN BHANDARA — Payment Service (Razorpay)
// Source: Phase 2 §4/§8/§9 — order creation, signature-verified capture, and
// the webhook lifecycle (captured / failed). Refund handling lives in
// RefundService. All money mutations are transactional + idempotent.
// =============================================================================

import {
  bookingRepository,
  paymentRepository,
  proofTimelineRepository,
  notificationRepository,
  runTransaction,
  type BookingForNotification,
} from "@/lib/repositories";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "@/features/payments/razorpay";
import { createAuditLog } from "@/lib/audit";
import { execute, validate } from "@/lib/api/service";
import { type ServiceResult } from "@/lib/api/result";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  PaymentError,
  ValidationError,
} from "@/lib/errors";
import { type Actor } from "@/lib/services/actor";
import {
  CreatePaymentOrderSchema,
  VerifyPaymentSchema,
} from "@/lib/validations";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  sendBookingConfirmationEmail,
  sendPaymentReceivedEmail,
} from "@/features/notifications/email";
import {
  sendWhatsAppBookingConfirmation,
  sendWhatsAppPaymentReceived,
} from "@/features/notifications/whatsapp";
import { toJsonValue } from "@/lib/services/json";
import { processRefundWebhook } from "@/lib/services/refund.service";
import type { RazorpayWebhookPayload } from "@/types";

type Ctx = { ip?: string; userAgent?: string };

export type CreateOrderResult = {
  orderId: string;
  amount: number;
  currency: string;
  bookingNumber: string;
  keyId: string;
};

// =============================================================================
// CREATE ORDER — POST /api/payment/create-order
// =============================================================================

export function createPaymentOrder(
  actor: Actor,
  input: unknown,
  ctx?: Ctx
): Promise<ServiceResult<CreateOrderResult>> {
  return execute(async () => {
    const { bookingId } = validate(CreatePaymentOrderSchema, input);
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

    const booking = await bookingRepository.findWithPayment(bookingId);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== actor.userId) {
      throw new AuthorizationError("You do not have access to this booking.");
    }
    if (booking.status !== "PENDING") {
      throw new ConflictError(
        `This booking cannot be paid (current status: ${booking.status}).`
      );
    }

    // Idempotent: reuse an existing open order.
    if (booking.payment?.razorpayOrderId) {
      return {
        orderId: booking.payment.razorpayOrderId,
        amount: booking.totalAmount.toNumber(),
        currency: booking.currency,
        bookingNumber: booking.bookingNumber,
        keyId,
      };
    }

    const order = await createRazorpayOrder({
      amount: booking.totalAmount.toNumber(),
      currency: booking.currency,
      receipt: booking.bookingNumber,
      notes: { bookingId: booking.id, userId: actor.userId },
    });

    await paymentRepository.upsertForBooking({
      bookingId: booking.id,
      create: {
        bookingId: booking.id,
        razorpayOrderId: order.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "PENDING",
        gateway: "RAZORPAY",
      },
      update: { razorpayOrderId: order.id, status: "PENDING" },
    });

    await createAuditLog({
      userId: actor.userId,
      action: "PAYMENT",
      entity: "Payment",
      entityId: booking.id,
      newData: { razorpayOrderId: order.id, amount: booking.totalAmount.toNumber() },
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    });

    return {
      orderId: order.id,
      amount: booking.totalAmount.toNumber(),
      currency: booking.currency,
      bookingNumber: booking.bookingNumber,
      keyId,
    };
  });
}

// =============================================================================
// VERIFY — POST /api/payment/verify  (client checkout callback)
// =============================================================================

export function verifyPayment(
  actor: Actor,
  input: unknown,
  ctx?: Ctx
): Promise<ServiceResult<{ bookingId: string; bookingNumber: string }>> {
  return execute(async () => {
    const data = validate(VerifyPaymentSchema, input);

    const booking = await bookingRepository.findForNotification(data.bookingId);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== actor.userId) {
      throw new AuthorizationError("You do not have access to this booking.");
    }

    const payment = booking.payment;
    if (!payment || payment.razorpayOrderId !== data.razorpay_order_id) {
      throw new ValidationError("Payment order mismatch.");
    }

    // Idempotent — already verified.
    if (payment.status === "CAPTURED" && booking.status === "CONFIRMED") {
      return { bookingId: data.bookingId, bookingNumber: booking.bookingNumber };
    }

    const valid = verifyRazorpaySignature({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    });

    if (!valid) {
      await createAuditLog({
        userId: actor.userId,
        action: "PAYMENT",
        entity: "Payment",
        entityId: data.bookingId,
        metadata: { error: "INVALID_SIGNATURE", razorpay_payment_id: data.razorpay_payment_id },
        ip: ctx?.ip,
        userAgent: ctx?.userAgent,
      });
      throw new PaymentError("Invalid payment signature. Please contact support.");
    }

    await runTransaction(async (tx) => {
      await paymentRepository.updateByBookingId(
        data.bookingId,
        {
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          status: "CAPTURED",
          capturedAt: new Date(),
        },
        tx
      );
      await bookingRepository.update(data.bookingId, { status: "CONFIRMED" }, tx);
      await proofTimelineRepository.create(
        {
          bookingId: data.bookingId,
          eventType: "PAYMENT_CONFIRMED",
          title: "Payment Confirmed",
          description: `Payment of ${formatCurrency(
            booking.totalAmount
          )} received. Your seva is now confirmed.`,
          createdBy: "system",
        },
        tx
      );
      await notificationRepository.create(
        {
          userId: booking.userId,
          bookingId: data.bookingId,
          type: "PAYMENT_RECEIVED",
          channel: "IN_APP",
          title: "Payment Confirmed",
          message: `Your booking ${booking.bookingNumber} is confirmed. Seva on ${formatDate(
            booking.sevaDate
          )}.`,
        },
        tx
      );
    });

    await dispatchConfirmationNotifications(booking);

    await createAuditLog({
      userId: actor.userId,
      action: "PAYMENT",
      entity: "Payment",
      entityId: data.bookingId,
      newData: { razorpayPaymentId: data.razorpay_payment_id, status: "CAPTURED" },
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    });

    return { bookingId: data.bookingId, bookingNumber: booking.bookingNumber };
  }, "Payment verified successfully. Your seva is confirmed!");
}

// =============================================================================
// WEBHOOK — POST /api/payment/webhook (signature verified at the route edge)
// =============================================================================

export async function processWebhookEvent(
  payload: RazorpayWebhookPayload
): Promise<void> {
  await createAuditLog({
    action: "PAYMENT",
    entity: "Webhook",
    metadata: { event: payload.event, accountId: payload.account_id },
  });

  switch (payload.event) {
    case "payment.captured":
      await handlePaymentCaptured(payload);
      break;
    case "payment.failed":
      await handlePaymentFailed(payload);
      break;
    case "refund.processed":
    case "refund.created":
      await processRefundWebhook(payload);
      break;
    default:
      console.warn(`[WEBHOOK] Unhandled event: ${payload.event}`);
  }
}

async function handlePaymentCaptured(
  payload: RazorpayWebhookPayload
): Promise<void> {
  const entity = payload.payload.payment?.entity;
  if (!entity) return;

  const payment = await paymentRepository.findByOrderIdWithBooking(entity.order_id);
  if (!payment) {
    console.warn(`[WEBHOOK] No payment for order ${entity.order_id}`);
    return;
  }
  if (payment.status === "CAPTURED" && payment.webhookVerified) return;

  const bookingFull = await bookingRepository.findForNotification(payment.bookingId);

  await runTransaction(async (tx) => {
    await paymentRepository.updateByOrderId(
      entity.order_id,
      {
        razorpayPaymentId: entity.id,
        status: "CAPTURED",
        capturedAt: new Date(),
        webhookVerified: true,
        webhookReceivedAt: new Date(),
        webhookPayload: toJsonValue(payload),
        gatewayResponse: toJsonValue(entity),
      },
      tx
    );

    if (payment.booking.status === "PENDING") {
      await bookingRepository.update(payment.bookingId, { status: "CONFIRMED" }, tx);
      await proofTimelineRepository.create(
        {
          bookingId: payment.bookingId,
          eventType: "PAYMENT_CONFIRMED",
          title: "Payment Confirmed",
          description: "Payment confirmed via Razorpay webhook.",
          createdBy: "system",
        },
        tx
      );
    }
  });

  if (bookingFull) {
    const amount = formatCurrency(bookingFull.totalAmount);
    await Promise.allSettled([
      sendBookingConfirmationEmail(bookingFull),
      sendPaymentReceivedEmail(bookingFull),
      sendWhatsAppPaymentReceived({
        phone: bookingFull.user.phone,
        name: bookingFull.user.name,
        amount,
        bookingNumber: bookingFull.bookingNumber,
      }),
    ]);
  }
}

async function handlePaymentFailed(
  payload: RazorpayWebhookPayload
): Promise<void> {
  const entity = payload.payload.payment?.entity;
  if (!entity) return;

  const payment = await paymentRepository.findByOrderId(entity.order_id);
  if (!payment || payment.status === "CAPTURED") return;

  await paymentRepository.updateByOrderId(entity.order_id, {
    status: "FAILED",
    webhookVerified: true,
    webhookReceivedAt: new Date(),
    webhookPayload: toJsonValue(payload),
    failureReason:
      entity.error_description ?? entity.error_code ?? "Payment failed",
  });
}

// =============================================================================
// Helpers
// =============================================================================

async function dispatchConfirmationNotifications(
  booking: BookingForNotification
): Promise<void> {
  await Promise.allSettled([
    sendBookingConfirmationEmail(booking),
    sendPaymentReceivedEmail(booking),
    booking.user.phone
      ? sendWhatsAppBookingConfirmation({
          phone: booking.user.phone,
          name: booking.user.name,
          bookingNumber: booking.bookingNumber,
          serviceName: booking.package.serviceCategory.name,
          sevaDate: formatDate(booking.sevaDate),
          amount: formatCurrency(booking.totalAmount),
        })
      : Promise.resolve(),
  ]);
}
