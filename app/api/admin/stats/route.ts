import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/admin/stats
// Admin analytics dashboard stats
// Requires: ADMIN role
// =============================================================================
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalUsers,
    totalRevenue,
    monthlyRevenue,
    recentBookings,
    topPackages,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "CAPTURED",
        capturedAt: { gte: new Date(new Date().setDate(1)) }, // start of month
      },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
        package: { include: { serviceCategory: true } },
      },
    }),
    prisma.package.findMany({
      include: {
        _count: { select: { bookings: true } },
        serviceCategory: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        inProgress: totalBookings - pendingBookings - confirmedBookings - completedBookings - cancelledBookings,
      },
      users: { total: totalUsers },
      revenue: {
        total: Number(totalRevenue._sum.amount ?? 0),
        monthly: Number(monthlyRevenue._sum.amount ?? 0),
      },
      recentBookings,
      topPackages,
    },
  });
}
