import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, IndianRupee, BookOpen, CheckCircle, XCircle, Package, Users, RefreshCcw } from "lucide-react";

export const metadata: Metadata = { title: "Analytics" };

async function getAnalyticsData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    bookingCounts,
    activePackages,
    totalUsers,
    repeatCustomers,
    refundCount,
    revenueByMonth,
    bookingsByService,
  ] = await Promise.all([
    // Total captured revenue
    prisma.payment.aggregate({
      where: { status: "CAPTURED" },
      _sum: { amount: true },
    }),
    // This month revenue
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Last month revenue
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    // Booking counts by status
    prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Active packages count
    prisma.package.count({ where: { isActive: true } }),
    // Total users
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    // Repeat customers
    prisma.booking.groupBy({
      by: ["userId"],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    }),
    // Refund count
    prisma.payment.count({ where: { status: "REFUNDED" } }),
    // Revenue last 6 months
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "capturedAt"), 'Mon YY') as month,
             SUM(amount)::float as revenue
      FROM payments
      WHERE status = 'CAPTURED' AND "capturedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "capturedAt")
      ORDER BY DATE_TRUNC('month', "capturedAt") ASC
    `.catch(() => []),
    // Bookings by service category
    prisma.booking.groupBy({
      by: ["packageId"],
      _count: { id: true },
      where: { status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] } },
    }),
  ]);

  const bookingMap = Object.fromEntries(bookingCounts.map((b: any) => [b.status, b._count.id]));
  const totalBookings = bookingCounts.reduce((sum: number, b: any) => sum + b._count.id, 0);
  const completedCount = bookingMap["COMPLETED"] ?? 0;
  const conversionRate = totalBookings > 0 ? ((completedCount / totalBookings) * 100).toFixed(1) : "0";

  const thisMonth = Number(monthRevenue._sum.amount ?? 0);
  const lastMonth = Number(lastMonthRevenue._sum.amount ?? 0);
  const revenueGrowth = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : null;

  return {
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    monthRevenue: thisMonth,
    revenueGrowth,
    bookingMap,
    totalBookings,
    activePackages,
    totalUsers,
    repeatCustomerCount: repeatCustomers.length,
    refundCount,
    conversionRate,
    revenueByMonth: revenueByMonth as { month: string; revenue: number }[],
  };
}

const KPI_CARD_STYLE = `
  bg-white rounded-2xl p-5 border flex flex-col gap-3
`;

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const data = await getAnalyticsData();
  const maxRevenue = Math.max(...data.revenueByMonth.map((r) => r.revenue), 1);

  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      icon: IndianRupee,
      color: "#B89947",
      bg: "#FFF9EC",
      sub: `${formatCurrency(data.monthRevenue)} this month`,
      badge: data.revenueGrowth ? `${Number(data.revenueGrowth) >= 0 ? "+" : ""}${data.revenueGrowth}% vs last month` : null,
      badgePositive: Number(data.revenueGrowth) >= 0,
    },
    {
      label: "Total Bookings",
      value: data.totalBookings.toLocaleString(),
      icon: BookOpen,
      color: "#8B1E1E",
      bg: "#FDF2F2",
      sub: `${data.bookingMap["PENDING"] ?? 0} pending`,
    },
    {
      label: "Completed Sevas",
      value: (data.bookingMap["COMPLETED"] ?? 0).toLocaleString(),
      icon: CheckCircle,
      color: "#15803d",
      bg: "#F0FDF4",
      sub: `${data.conversionRate}% conversion rate`,
    },
    {
      label: "Active Packages",
      value: data.activePackages.toLocaleString(),
      icon: Package,
      color: "#1d4ed8",
      bg: "#EFF6FF",
      sub: "Across all services",
    },
    {
      label: "Total Customers",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      color: "#7c3aed",
      bg: "#F5F3FF",
      sub: `${data.repeatCustomerCount} repeat customers`,
    },
    {
      label: "Refunds Issued",
      value: data.refundCount.toLocaleString(),
      icon: RefreshCcw,
      color: "#b45309",
      bg: "#FFFBEB",
      sub: "Total refund events",
    },
    {
      label: "In Progress",
      value: (data.bookingMap["IN_PROGRESS"] ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: "#0369a1",
      bg: "#F0F9FF",
      sub: "Active sevas right now",
    },
    {
      label: "Cancelled",
      value: (data.bookingMap["CANCELLED"] ?? 0).toLocaleString(),
      icon: XCircle,
      color: "#6b7280",
      bg: "#F9FAFB",
      sub: "Total cancellations",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Key performance indicators across all operations.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={KPI_CARD_STYLE} style={{ borderColor: "rgba(212,175,55,0.1)" }}>
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: kpi.bg }}
              >
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              {kpi.badge && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: kpi.badgePositive ? "#dcfce7" : "#fee2e2",
                    color: kpi.badgePositive ? "#15803d" : "#b91c1c",
                  }}
                >
                  {kpi.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5 leading-none">{kpi.value}</p>
              {kpi.sub && <p className="text-[11px] text-gray-400 mt-1">{kpi.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {data.revenueByMonth.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border mb-8" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <h2 className="text-sm font-semibold text-gray-700 mb-6">Revenue — Last 6 Months</h2>
          <div className="flex items-end gap-3 h-40">
            {data.revenueByMonth.map((r) => {
              const heightPct = Math.max(4, (r.revenue / maxRevenue) * 100);
              return (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative group w-full" style={{ height: "120px", display: "flex", alignItems: "flex-end" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        background: "linear-gradient(to top, #8B1E1E, #B89947)",
                        opacity: 0.85,
                      }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(r.revenue)}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{r.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Status Breakdown */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Booking Status Breakdown</h2>
        <div className="space-y-3">
          {[
            { status: "CONFIRMED", label: "Confirmed", color: "#1d4ed8" },
            { status: "IN_PROGRESS", label: "In Progress", color: "#b45309" },
            { status: "COMPLETED", label: "Completed", color: "#15803d" },
            { status: "PENDING", label: "Pending", color: "#ca8a04" },
            { status: "CANCELLED", label: "Cancelled", color: "#6b7280" },
            { status: "REFUNDED", label: "Refunded", color: "#7c3aed" },
          ].map(({ status, label, color }) => {
            const count = data.bookingMap[status] ?? 0;
            const pct = data.totalBookings > 0 ? (count / data.totalBookings) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-24 text-xs text-gray-500 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
