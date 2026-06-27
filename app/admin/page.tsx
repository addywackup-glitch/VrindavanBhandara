import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  IndianRupee,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getAdminStats() {
  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    totalUsers,
    totalRevenue,
    monthlyRevenue,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "IN_PROGRESS" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: new Date(new Date().setDate(1)) } },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
  ]);

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    totalUsers,
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    recentBookings,
    actionRequired: pendingBookings + inProgressBookings,
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50" },
  IN_PROGRESS: { label: "In Progress", color: "text-orange-700", bg: "bg-orange-50" },
  COMPLETED: { label: "Completed", color: "text-green-700", bg: "bg-green-50" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50" },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const stats = await getAdminStats();
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const STAT_CARDS = [
    {
      label: "Total Revenue",
      value: fmt(stats.totalRevenue),
      sub: `${fmt(stats.monthlyRevenue)} this month`,
      icon: IndianRupee,
      gradient: "linear-gradient(135deg, #D4AF37, #FF7722)",
      iconBg: "rgba(212,175,55,0.15)",
    },
    {
      label: "Total Bookings",
      value: stats.totalBookings.toLocaleString("en-IN"),
      sub: `${stats.completedBookings} completed`,
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #3B82F6, #6366F1)",
      iconBg: "rgba(59,130,246,0.12)",
    },
    {
      label: "Active Users",
      value: stats.totalUsers.toLocaleString("en-IN"),
      sub: "Registered customers",
      icon: Users,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      iconBg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Action Required",
      value: stats.actionRequired.toLocaleString("en-IN"),
      sub: `${stats.pendingBookings} pending · ${stats.inProgressBookings} in progress`,
      icon: stats.actionRequired > 0 ? AlertCircle : CheckCircle,
      gradient: stats.actionRequired > 0 ? "linear-gradient(135deg, #F59E0B, #EF4444)" : "linear-gradient(135deg, #10B981, #059669)",
      iconBg: stats.actionRequired > 0 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold" style={{ color: "#2A2825" }}>
          Admin Dashboard
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back, {session.user.name}. Here&apos;s your overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl p-5"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(212,175,55,0.08)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.gradient.includes("D4AF37") ? "#D4AF37" : "#3B82F6" }} />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-200" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-0.5">{card.value}</p>
              <p className="text-[11px] text-gray-400">{card.label}</p>
              <p className="text-[10px] text-gray-300 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Booking Status Summary */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pending", count: stats.pendingBookings, color: "#F59E0B" },
          { label: "Confirmed", count: stats.confirmedBookings, color: "#3B82F6" },
          { label: "In Progress", count: stats.inProgressBookings, color: "#FF7722" },
          { label: "Completed", count: stats.completedBookings, color: "#10B981" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-xl p-4"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: s.color }}>
              {s.count}
            </div>
            <div>
              <p className="font-semibold text-gray-700 text-sm">{s.label} Bookings</p>
              <Link href={`/admin/bookings?status=${s.label.toUpperCase().replace(" ", "_")}`} className="text-xs text-gray-400 hover:text-yellow-600 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="font-heading font-bold text-gray-800">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-yellow-600 hover:text-orange-500 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Booking #", "Customer", "Service", "Date", "Amount", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((booking) => {
                const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["PENDING"];
                return (
                  <tr
                    key={booking.id}
                    className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{booking.bookingNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800 text-xs">{booking.user.name}</p>
                      <p className="text-[10px] text-gray-400">{booking.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{booking.package.serviceCategory.name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(booking.sevaDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                      {booking.payment ? fmt(Number(booking.payment.amount)) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-[10px] font-semibold text-yellow-600 hover:text-orange-500"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {stats.recentBookings.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">No bookings yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
