// =============================================================================
// VRINDAVAN BHANDARA — Analytics Service (admin dashboard metrics)
// =============================================================================

import {
  bookingRepository,
  userRepository,
  paymentRepository,
  packageRepository,
} from "@/lib/repositories";
import { execute } from "@/lib/api/service";

export function getDashboardStats() {
  return execute(async () => {
    const startOfMonth = new Date(new Date().setDate(1));

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      totalUsers,
      totalRevenue,
      monthlyRevenue,
      recentBookings,
      topPackages,
    ] = await Promise.all([
      bookingRepository.count(),
      bookingRepository.count({ status: "PENDING" }),
      bookingRepository.count({ status: "CONFIRMED" }),
      bookingRepository.count({ status: "COMPLETED" }),
      bookingRepository.count({ status: "CANCELLED" }),
      userRepository.count({ role: "CUSTOMER" }),
      paymentRepository.aggregateCaptured(),
      paymentRepository.aggregateCaptured({ capturedAt: { gte: startOfMonth } }),
      bookingRepository.adminList({ where: {}, skip: 0, take: 8 }),
      packageRepository.topByBookings(5),
    ]);

    return {
      bookings: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        inProgress: total - pending - confirmed - completed - cancelled,
      },
      users: { total: totalUsers },
      revenue: {
        total: Number(totalRevenue._sum.amount ?? 0),
        monthly: Number(monthlyRevenue._sum.amount ?? 0),
      },
      recentBookings,
      topPackages,
    };
  });
}
