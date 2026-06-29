import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatINR, formatAdminDate, formatAdminDateTime, BOOKING_BADGE_CLASS, startOfToday } from "@/lib/admin-ui";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-transitions";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [
    todayBookings,
    pendingBookings,
    completedToday,
    refundCount,
    monthRevenue,
    lastMonthRevenue,
    upcomingSevas,
    recentBookings,
    recentPayments,
    topServices,
    statusCounts,
  ] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "COMPLETED", completedAt: { gte: today } } }),
    prisma.payment.count({ where: { status: "REFUNDED" } }),
    prisma.payment.aggregate({
      where: { status: "CAPTURED", capturedAt: { gte: new Date(new Date().setDate(1)) } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "CAPTURED",
        capturedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        sevaDate: { gte: today, lte: weekAhead },
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, phone: true } },
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "CAPTURED" },
      orderBy: { capturedAt: "desc" },
      take: 5,
      include: {
        booking: {
          select: {
            bookingNumber: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.booking.groupBy({
      by: ["packageId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const packageIds = topServices.map((s) => s.packageId);
  const packages = packageIds.length
    ? await prisma.package.findMany({
        where: { id: { in: packageIds } },
        include: { serviceCategory: { select: { name: true } } },
      })
    : [];
  const pkgMap = Object.fromEntries(packages.map((p) => [p.id, p]));
  const maxBookings = topServices[0]?._count.id ?? 1;

  const monthRev = Number(monthRevenue._sum.amount ?? 0);
  const lastRev = Number(lastMonthRevenue._sum.amount ?? 0);
  const revenueGrowth = lastRev > 0 ? Math.round(((monthRev - lastRev) / lastRev) * 100) : null;

  return {
    stats: {
      todayBookings,
      pendingBookings,
      completedToday,
      refundCount,
      monthRevenue: monthRev,
      revenueGrowth,
      upcomingSevas,
    },
    recentBookings,
    recentPayments,
    topServices: topServices.map((s) => ({
      name: pkgMap[s.packageId]?.serviceCategory.name ?? "Unknown",
      count: s._count.id,
      pct: Math.round((s._count.id / maxBookings) * 100),
    })),
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id])),
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const { stats, recentBookings, recentPayments, topServices } = await getDashboardData();

  const statCards = [
    {
      label: "Today's Bookings",
      value: String(stats.todayBookings),
      delta: "Created today",
      deltaClass: "adm-delta-up",
      color: "var(--brand)",
    },
    {
      label: "Revenue (MTD)",
      value: formatINR(stats.monthRevenue),
      delta: stats.revenueGrowth !== null ? `${stats.revenueGrowth >= 0 ? "↑" : "↓"} ${Math.abs(stats.revenueGrowth)}% vs last month` : "First month",
      deltaClass: stats.revenueGrowth !== null && stats.revenueGrowth >= 0 ? "adm-delta-up" : "adm-delta-warn",
      color: "var(--accent-deep)",
    },
    {
      label: "Pending Review",
      value: String(stats.pendingBookings),
      delta: "Requires attention",
      deltaClass: "adm-delta-warn",
      color: "oklch(55% 0.14 68)",
    },
    {
      label: "Completed Today",
      value: String(stats.completedToday),
      delta: "Sevas finished today",
      deltaClass: "adm-delta-up",
    },
    {
      label: "Upcoming Sevas",
      value: String(stats.upcomingSevas),
      delta: "Next 7 days",
      deltaClass: "",
    },
  ];

  return (
    <>
      {/* Stats */}
      <div className="adm-stats-row" aria-label="Dashboard statistics">
        {statCards.map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={s.color ? { color: s.color } : undefined}>{s.value}</div>
            <div className={`adm-stat-delta ${s.deltaClass}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="adm-section-header">
        <div className="adm-section-title">Recent Bookings</div>
        <div className="adm-filter-row">
          <Link href="/admin/bookings" className="adm-filter-btn active">All</Link>
          <Link href="/admin/bookings?status=PENDING" className="adm-filter-btn">
            Pending ({stats.pendingBookings})
          </Link>
          <Link href="/admin/bookings?status=CONFIRMED" className="adm-filter-btn">Confirmed</Link>
          <Link href="/admin/bookings?status=COMPLETED" className="adm-filter-btn">Completed</Link>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              {["Booking ID", "Customer", "Service", "Package", "Seva Date", "Amount", "Status", "Actions"].map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((b) => (
              <tr key={b.id}>
                <td><span className="adm-booking-id">{b.bookingNumber}</span></td>
                <td>
                  {b.user.name}
                  {b.user.phone && (
                    <><br /><span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{b.user.phone}</span></>
                  )}
                </td>
                <td>{b.package.serviceCategory.name}</td>
                <td>{b.package.name}</td>
                <td>{formatAdminDate(b.sevaDate)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {b.payment ? formatINR(b.payment.amount) : "—"}
                </td>
                <td>
                  <span className={BOOKING_BADGE_CLASS[b.status] ?? "adm-badge"}>
                    <span className="adm-badge-dot" aria-hidden="true" />
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/bookings/${b.id}`} className="adm-action-btn">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentBookings.length === 0 && (
          <div className="adm-empty"><div className="adm-empty-title">No bookings yet</div></div>
        )}
      </div>

      {/* Bottom grid */}
      <div className="adm-bottom-grid">
        {/* Recent payments */}
        <div className="adm-side-card">
          <div className="adm-side-card-title">
            Recent Payments
            <Link href="/admin/bookings" className="adm-link">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>No payments captured yet.</p>
          ) : (
            recentPayments.map((p) => (
              <div key={p.id} className="adm-activity-item">
                <div className="adm-activity-dot" style={{ background: "var(--success)" }} aria-hidden="true" />
                <div className="adm-activity-text">
                  <strong>{formatINR(p.amount)}</strong>
                  {" — "}
                  {p.booking.user.name}
                  <br />
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{p.booking.bookingNumber}</span>
                </div>
                <div className="adm-activity-time">
                  {p.capturedAt ? formatAdminDateTime(p.capturedAt) : "—"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popular services */}
        <div className="adm-side-card">
          <div className="adm-side-card-title">Popular Services</div>
          {topServices.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>No booking data yet.</p>
          ) : (
            topServices.map((s) => (
              <div key={s.name} className="adm-service-stat-row">
                <div className="adm-service-stat-name">{s.name}</div>
                <div className="adm-service-bar-wrap" aria-hidden="true">
                  <div className="adm-service-bar" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="adm-service-stat-count">{s.count}</div>
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div className="adm-side-card">
          <div className="adm-side-card-title">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { href: "/admin/bookings?status=PENDING", label: "Review pending bookings" },
              { href: "/admin/proofs", label: "Upload seva proof" },
              { href: "/admin/packages", label: "Manage packages" },
              { href: "/admin/analytics", label: "View analytics" },
              { href: "/admin/refunds", label: "Review refunds" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="adm-action-btn" style={{ justifyContent: "center" }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
