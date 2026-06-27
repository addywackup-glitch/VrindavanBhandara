import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { VerifyPaymentSchema } from "@/lib/validations";
import { verifyRazorpaySignature } from "@/features/payments/razorpay";
import { sendBookingConfirmationEmail, sendPaymentReceivedEmail } from "@/features/notifications/email";
import { sendWhatsAppBookingConfirmation } from "@/features/notifications/whatsapp";
import { createAuditLog } from "@/lib/audit";
import { paymentRateLimit } from "@/lib/rate-limit";
import { formatDate } from "@/lib/utils";

// =============================================================================
// POST /api/payment/verify
// Client-side payment verification (after Razorpay checkout completes)
// =============================================================================
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  const rl = await paymentRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  let session: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = VerifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
  }

  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = parsed.data;

  // Fetch booking with payment
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      package: { include: { serviceCategory: true, items: true } },
      payment: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (booking.payment?.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ success: false, error: "Order ID mismatch" }, { status: 400 });
  }

  // Already verified — idempotent
  if (booking.payment?.status === "CAPTURED" && booking.status === "CONFIRMED") {
    return NextResponse.json({
      success: true,
      data: { bookingNumber: booking.bookingNumber },
      message: "Payment already verified",
    });
  }

  // Verify HMAC signature
  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await createAuditLog({
      userId: session.user.id,
      action: "PAYMENT",
      entity: "Payment",
      entityId: bookingId,
      metadata: { error: "INVALID_SIGNATURE", razorpay_payment_id },
      ip,
    });

    return NextResponse.json(
      { success: false, error: "Invalid payment signature. Contact support." },
      { status: 400 }
    );
  }

  // Update payment and booking in a transaction
  await prisma.$transaction(async (tx) => {
    // Update payment
    await tx.payment.update({
      where: { bookingId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "CAPTURED",
        capturedAt: new Date(),
      },
    });

    // Confirm booking
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    // Add timeline event
    await tx.proofTimelineEvent.create({
      data: {
        bookingId,
        eventType: "PAYMENT_CONFIRMED",
        title: "Payment Confirmed",
        description: `Payment of ₹${booking.totalAmount} received. Your seva is now confirmed.`,
        createdBy: "system",
      },
    });

    // In-app notification
    await tx.notification.create({
      data: {
        userId: booking.userId,
        bookingId,
        type: "PAYMENT_RECEIVED",
        channel: "IN_APP",
        title: "Payment Confirmed",
        message: `Your booking ${booking.bookingNumber} has been confirmed. Seva will be performed on ${formatDate(booking.sevaDate)}.`,
      },
    });
  });

  // Send emails and WhatsApp (non-blocking — don't let notification failure kill the flow)
  try {
    const fullBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: { include: { serviceCategory: true, items: true } },
        payment: true,
        certificate: true,
        mediaProofs: true,
        proofTimeline: true,
      },
    });

    if (fullBooking) {
      await Promise.allSettled([
        sendBookingConfirmationEmail(fullBooking as never),
        sendPaymentReceivedEmail(fullBooking as never),
        fullBooking.user.phone
          ? sendWhatsAppBookingConfirmation({
              phone: fullBooking.user.phone,
              name: fullBooking.user.name,
              bookingNumber: fullBooking.bookingNumber,
              serviceName: fullBooking.package.serviceCategory.name,
              sevaDate: formatDate(fullBooking.sevaDate),
              amount: String(fullBooking.totalAmount),
            })
          : Promise.resolve(),
      ]);
    }
  } catch (err) {
    console.error("[PAYMENT_VERIFY] Notification error (non-critical):", err);
  }

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entity: "Payment",
    entityId: bookingId,
    newData: { razorpayPaymentId: razorpay_payment_id, status: "CAPTURED" },
    ip,
  });

  return NextResponse.json({
    success: true,
    data: { bookingNumber: booking.bookingNumber, bookingId },
    message: "Payment verified successfully. Your seva is confirmed!",
  });
}
