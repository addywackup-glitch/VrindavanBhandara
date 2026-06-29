import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatINR } from "@/lib/admin-ui";

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
    monthlyBookings,
    topServices,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "CAPTURED", capturedAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.package.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.groupBy({
      by: ["userId"],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    }),
    prisma.payment.count({ where: { status: "REFUNDED" } }),
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "capturedAt"), 'Mon YY') as month,
             SUM(amount)::float as revenue
      FROM payments
      WHERE status = 'CAPTURED' AND "capturedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "capturedAt")
      ORDER BY DATE_TRUNC('month', "capturedAt") ASC
    `.catch(() => []),
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YY') as month,
             COUNT(*)::int as count
      FROM bookings
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `.catch(() => []),
    prisma.booking.groupBy({
      by: ["packageId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const packageIds = topServices.map((s) => s.packageId);
  const packages = packageIds.length
    ? await prisma.package.findMany({
        where: { id: { in: packageIds } },
        select: { id: true, name: true, serviceCategory: { select: { name: true } } },
      })
    : [];
  const packageMap = Object.fromEntries(packages.map((p) => [p.id, p]));

  const bookingMap = Object.fromEntries(bookingCounts.map((b) => [b.status, b._count.id]));
  const totalBookings = bookingCounts.reduce((sum, b) => sum + b._count.id, 0);
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
    monthlyBookings: monthlyBookings as { month: string; count: number }[],
    topServices: topServices.map((s) => ({
      name: packageMap[s.packageId]?.name ?? "Unknown",
      category: packageMap[s.packageId]?.serviceCategory.name ?? "",
      count: s._count.id,
    })),
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const data = await getAnalyticsData();
  const maxRevenue = Math.max(...data.revenueByMonth.map((r) => r.revenue), 1);
  const maxBookings = Math.max(...data.monthlyBookings.map((b) => b.count), 1);
  const maxServiceCount = Math.max(...data.topServices.map((s) => s.count), 1);

  const kpis = [
    { label: "Total Revenue", value: formatINR(data.totalRevenue), sub: `${formatINR(data.monthRevenue)} this month`, delta: data.revenueGrowth ? `${Number(data.revenueGrowth) >= 0 ? "+" : ""}${data.revenueGrowth}% vs last month` : null, up: Number(data.revenueGrowth) >= 0 },
    { label: "Total Bookings", value: data.totalBookings.toLocaleString(), sub: `${data.bookingMap["PENDING"] ?? 0} pending` },
    { label: "Completed Sevas", value: (data.bookingMap["COMPLETED"] ?? 0).toLocaleString(), sub: `${data.conversionRate}% conversion` },
    { label: "Active Packages", value: data.activePackages.toLocaleString(), sub: "Across all services" },
    { label: "Customers", value: data.totalUsers.toLocaleString(), sub: `${data.repeatCustomerCount} repeat` },
    { label: "Refunds", value: data.refundCount.toLocaleString(), sub: "Total refund events" },
  ];

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Analytics</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Key performance indicators across all operations
          </p>
        </div>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="adm-stat-card">
            <div className="adm-stat-label">{kpi.label}</div>
            <div className="adm-stat-value" style={{ fontSize: "1.5rem" }}>{kpi.value}</div>
            <div className="adm-stat-delta">
              {kpi.delta && <span className={kpi.up ? "adm-delta-up" : "adm-delta-warn"}>{kpi.delta} · </span>}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="adm-bottom-grid" style={{ marginBottom: "1.75rem" }}>
        {data.revenueByMonth.length > 0 && (
          <div className="adm-side-card">
            <div className="adm-side-card-title">Revenue — Last 6 Months</div>
            <div className="adm-mini-chart" style={{ height: 100, marginTop: "1rem" }}>
              {data.revenueByMonth.map((r, i) => {
                const heightPct = Math.max(8, (r.revenue / maxRevenue) * 100);
                const isCurrent = i === data.revenueByMonth.length - 1;
                return (
                  <div key={r.month} className="adm-chart-bar-wrap" style={{ height: "100%", justifyContent: "flex-end" }}>
                    <div className={`adm-chart-bar${isCurrent ? " current" : ""}`} style={{ height: `${heightPct}%` }} title={formatINR(r.revenue)} />
                    <span className="adm-chart-label">{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.monthlyBookings.length > 0 && (
          <div className="adm-side-card">
            <div className="adm-side-card-title">Monthly Bookings</div>
            <div className="adm-mini-chart" style={{ height: 100, marginTop: "1rem" }}>
              {data.monthlyBookings.map((b, i) => {
                const heightPct = Math.max(8, (b.count / maxBookings) * 100);
                const isCurrent = i === data.monthlyBookings.length - 1;
                return (
                  <div key={b.month} className="adm-chart-bar-wrap" style={{ height: "100%", justifyContent: "flex-end" }}>
                    <div className={`adm-chart-bar${isCurrent ? " current" : ""}`} style={{ height: `${heightPct}%` }} title={`${b.count} bookings`} />
                    <span className="adm-chart-label">{b.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="adm-side-card">
          <div className="adm-side-card-title">Popular Services</div>
          {data.topServices.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "1rem" }}>No booking data yet</p>
          ) : (
            data.topServices.map((s) => (
              <div key={s.name} className="adm-service-stat-row">
                <span className="adm-service-stat-name" title={s.name}>{s.name}</span>
                <div className="adm-service-bar-wrap">
                  <div className="adm-service-bar" style={{ width: `${(s.count / maxServiceCount) * 100}%` }} />
                </div>
                <span className="adm-service-stat-count">{s.count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Booking Status Distribution</div>
        <div className="adm-detail-card-body">
          {[
            { status: "CONFIRMED", label: "Confirmed", className: "adm-badge-confirmed" },
            { status: "IN_PROGRESS", label: "In Progress", className: "adm-badge-inprogress" },
            { status: "COMPLETED", label: "Completed", className: "adm-badge-completed" },
            { status: "PENDING", label: "Pending", className: "adm-badge-pending" },
            { status: "CANCELLED", label: "Cancelled", className: "adm-badge-cancelled" },
            { status: "REFUNDED", label: "Refunded", className: "adm-badge-refunded" },
          ].map(({ status, label, className }) => {
            const count = data.bookingMap[status] ?? 0;
            const pct = data.totalBookings > 0 ? (count / data.totalBookings) * 100 : 0;
            return (
              <div key={status} className="adm-service-stat-row">
                <span className={`adm-badge ${className}`} style={{ width: 110, justifyContent: "center" }}>{label}</span>
                <div className="adm-service-bar-wrap">
                  <div className="adm-service-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="adm-service-stat-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
