import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/admin/bookings
// List all bookings with filtering & pagination
// Requires: ADMIN role
// =============================================================================
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") ?? 20)));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { bookingNumber: { contains: search, mode: "insensitive" as never } },
        { user: { name: { contains: search, mode: "insensitive" as never } } },
        { user: { email: { contains: search, mode: "insensitive" as never } } },
      ],
    }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: bookings,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
