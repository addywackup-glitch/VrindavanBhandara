// =============================================================================
// GET /api/bookings/:id/invoice — PDF download (owner or admin)
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActor, statusForCode } from "@/lib/api/http";
import { buildBookingInvoicePdf } from "@/lib/invoices/booking-invoice";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors";
import { ServiceError } from "@/lib/api/result";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const actor = await requireActor();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        package: { include: { serviceCategory: true } },
        payment: true,
        coupon: { select: { code: true } },
      },
    });

    if (!booking) throw new NotFoundError("Booking");
    if (actor.role !== "ADMIN" && booking.userId !== actor.userId) {
      throw new AuthorizationError("You do not have access to this invoice.");
    }

    const pdf = await buildBookingInvoicePdf(booking);
    const filename = `invoice-${booking.bookingNumber}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthenticationError || err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: statusForCode(err.code) }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to generate invoice";
    console.error("[invoice]", err);
    return NextResponse.json(
      { success: false, error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
