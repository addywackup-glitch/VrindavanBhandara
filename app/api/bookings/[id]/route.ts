import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer, assertOwner } from "@/lib/rbac";
import { UpdateBookingStatusSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { apiRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

// =============================================================================
// GET /api/bookings/:id — Get booking detail
// =============================================================================
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  let session: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      package: { include: { serviceCategory: true, items: true } },
      payment: true,
      certificate: true,
      mediaProofs: { orderBy: { createdAt: "desc" } },
      proofTimeline: { orderBy: { occurredAt: "asc" } },
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  // RBAC: customer can only see their own booking
  try {
    assertOwner(booking.userId, session.user.id, session.user.role as "CUSTOMER" | "ADMIN");
  } catch {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: booking });
}

// =============================================================================
// PUT /api/bookings/:id — Update booking status (Admin only)
// =============================================================================
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  let session: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    session = await requireCustomer();
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateBookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: parsed.data.status as never,
      adminNotes: parsed.data.adminNotes ?? existing.adminNotes,
      completionNotes: parsed.data.completionNotes ?? existing.completionNotes,
      ...(parsed.data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Booking",
    entityId: id,
    oldData: { status: existing.status },
    newData: { status: parsed.data.status },
    ip,
  });

  return NextResponse.json({ success: true, data: updated });
}
