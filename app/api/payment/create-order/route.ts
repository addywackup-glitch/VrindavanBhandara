import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { CreatePaymentOrderSchema } from "@/lib/validations";
import { createRazorpayOrder } from "@/features/payments/razorpay";
import { createAuditLog } from "@/lib/audit";
import { paymentRateLimit } from "@/lib/rate-limit";

// =============================================================================
// POST /api/payment/create-order
// Creates a Razorpay order for an existing PENDING booking
// =============================================================================
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit payments aggressively
  const rl = await paymentRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Too many payment attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  // Auth
  let session: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatePaymentOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed: bookingId is required" },
      { status: 422 }
    );
  }

  const { bookingId } = parsed.data;

  // Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  // RBAC: user must own the booking
  if (booking.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Can only create order for PENDING bookings
  if (booking.status !== "PENDING") {
    return NextResponse.json(
      { success: false, error: "This booking cannot be paid. Status: " + booking.status },
      { status: 409 }
    );
  }

  // If a payment already exists (unverified), return existing order
  if (booking.payment?.razorpayOrderId) {
    return NextResponse.json({
      success: true,
      data: {
        orderId: booking.payment.razorpayOrderId,
        amount: booking.totalAmount.toNumber(),
        currency: booking.currency,
        bookingNumber: booking.bookingNumber,
      },
    });
  }

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder({
    amount: booking.totalAmount.toNumber(),
    currency: booking.currency,
    receipt: booking.bookingNumber,
    notes: {
      bookingId: booking.id,
      userId: session.user.id,
      service: booking.bookingNumber,
    },
  });

  // Save payment record
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: "PENDING",
      gateway: "RAZORPAY",
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "PAYMENT",
    entity: "Payment",
    entityId: booking.id,
    newData: { razorpayOrderId: razorpayOrder.id, amount: booking.totalAmount },
    ip,
  });

  return NextResponse.json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: booking.totalAmount.toNumber(),
      currency: booking.currency,
      bookingNumber: booking.bookingNumber,
    },
  });
}
