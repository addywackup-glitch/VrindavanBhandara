import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { CreateBookingSchema } from "@/lib/validations";
import { generateBookingNumber } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { apiRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, PaginatedResponse, BookingWithPackage } from "@/types";

// =============================================================================
// GET /api/bookings
// Customer: their own bookings
// Admin: all bookings (with filters)
// =============================================================================
export async function GET(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please slow down." },
      { status: 429, headers: { "Retry-After": rl.resetAt.toISOString() } }
    );
  }

  let session: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const status = searchParams.get("status") ?? undefined;
  const skip = (page - 1) * pageSize;

  const isAdmin = session.user.role === "ADMIN";

  const where = {
    ...(isAdmin ? {} : { userId: session.user.id }),
    ...(status ? { status: status as never } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, amount: true, capturedAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  const response: ApiResponse<PaginatedResponse<BookingWithPackage>> = {
    success: true,
    data: {
      data: bookings as unknown as BookingWithPackage[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  return NextResponse.json(response);
}

// =============================================================================
// POST /api/bookings — Create a new booking
// =============================================================================
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded." },
      { status: 429 }
    );
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
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const {
    packageId,
    sevaDate,
    sevaLocation,
    guestCount,
    dedicatedTo,
    gotra,
    occasion,
    specialInstructions,
    couponCode,
  } = parsed.data;

  // Fetch package
  const pkg = await prisma.package.findUnique({
    where: { id: packageId, isActive: true },
    include: { serviceCategory: true },
  });

  if (!pkg) {
    return NextResponse.json(
      { success: false, error: "Package not found or inactive" },
      { status: 404 }
    );
  }

  const baseAmount = pkg.price.toNumber();
  let discountAmount = 0;
  let couponId: string | undefined;

  // Validate coupon if provided
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode, isActive: true },
    });

    if (coupon) {
      const now = new Date();
      const isExpired = coupon.expiresAt && coupon.expiresAt < now;
      const isExhausted = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
      const meetMinOrder =
        !coupon.minOrderValue || baseAmount >= coupon.minOrderValue.toNumber();

      if (!isExpired && !isExhausted && meetMinOrder) {
        couponId = coupon.id;
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (baseAmount * coupon.discountValue.toNumber()) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount.toNumber());
          }
        } else {
          discountAmount = coupon.discountValue.toNumber();
        }
        discountAmount = Math.min(discountAmount, baseAmount);
      }
    }
  }

  const taxRate = 0; // No GST on charitable sevas
  const taxAmount = taxRate * (baseAmount - discountAmount);
  const totalAmount = baseAmount - discountAmount + taxAmount;

  // Create booking in a transaction
  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId: session.user.id,
        packageId,
        sevaDate,
        sevaLocation,
        guestCount,
        dedicatedTo: dedicatedTo ?? null,
        gotra: gotra ?? null,
        occasion: occasion ?? null,
        specialInstructions: specialInstructions ?? null,
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        couponId: couponId ?? null,
        status: "PENDING",
      },
    });

    // Increment coupon usage if applied
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      await tx.couponUsage.create({
        data: {
          couponId,
          userId: session.user.id,
          bookingId: newBooking.id,
        },
      });
    }

    // Add initial timeline event
    await tx.proofTimelineEvent.create({
      data: {
        bookingId: newBooking.id,
        eventType: "BOOKING_RECEIVED",
        title: "Booking Received",
        description: "Your seva booking has been received. Awaiting payment confirmation.",
        createdBy: "system",
      },
    });

    return newBooking;
  });

  // Audit log
  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entity: "Booking",
    entityId: booking.id,
    newData: { bookingNumber: booking.bookingNumber, packageId, totalAmount },
    ip,
  });

  return NextResponse.json(
    { success: true, data: booking, message: "Booking created successfully" },
    { status: 201 }
  );
}
