import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { sendWhatsAppSevaInProgress, sendWhatsAppSevaCompleted } from "@/features/notifications/whatsapp";

type Params = { params: Promise<{ id: string }> };

// =============================================================================
// PATCH /api/admin/bookings/[id]/status
// Update booking status — transitions booking through lifecycle
// Requires: ADMIN role
// =============================================================================

const StatusSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { status, note } = parsed.data;

  // Fetch booking with user data for notifications
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, phone: true } },
      package: { include: { serviceCategory: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Status transition validation
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  const allowedNext = VALID_TRANSITIONS[booking.status] ?? [];
  if (!allowedNext.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${booking.status} to ${status}` },
      { status: 422 }
    );
  }

  // Map booking status to ProofTimelineEventType enum values
  const TIMELINE_EVENT_TYPE: Record<string, string> = {
    CONFIRMED: "PAYMENT_CONFIRMED",
    IN_PROGRESS: "SEVA_IN_PROGRESS",
    COMPLETED: "SEVA_COMPLETED",
    CANCELLED: "BOOKING_RECEIVED",
  };

  // Timeline event title map
  const TIMELINE_TITLES: Record<string, { title: string; description: string }> = {
    CONFIRMED: { title: "Booking Confirmed", description: "Your seva booking has been confirmed by our team." },
    IN_PROGRESS: { title: "Seva Has Begun", description: "Our ground team has begun performing your seva." },
    COMPLETED: { title: "Seva Completed", description: "Your seva has been completed. Proof will be shared shortly." },
    CANCELLED: { title: "Booking Cancelled", description: note ?? "Your booking has been cancelled." },
  };

  const { title, description } = TIMELINE_TITLES[status] ?? { title: status, description: note ?? "" };
  const eventType = TIMELINE_EVENT_TYPE[status] ?? "BOOKING_RECEIVED";

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status } });
    await tx.proofTimelineEvent.create({
      data: {
        bookingId: id,
        eventType: eventType as never,
        title,
        description,
        createdBy: session.user.id ?? "admin",
        isVisible: true,
      },
    });
  });

  // Audit log
  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Booking",
    entityId: id,
    oldData: { status: booking.status },
    newData: { status },
    metadata: { note },
  });

  // WhatsApp notifications (async, non-blocking)
  const serviceName = booking.package.serviceCategory.name;
  const sevaDate = booking.sevaDate.toLocaleDateString("en-IN");

  if (status === "IN_PROGRESS") {
    sendWhatsAppSevaInProgress({
      phone: booking.user.phone,
      name: booking.user.name,
      serviceName,
      sevaDate,
    }).catch(() => {});
  } else if (status === "COMPLETED") {
    sendWhatsAppSevaCompleted({
      phone: booking.user.phone,
      name: booking.user.name,
      serviceName,
      bookingId: id,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, data: { status } });
}
