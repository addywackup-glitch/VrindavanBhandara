import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BOOKING_BADGE_CLASS, formatINR, formatAdminDate } from "@/lib/admin-ui";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-transitions";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Customer Detail" };
}

export default async function AdminUserDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          package: { include: { serviceCategory: true } },
          payment: { select: { status: true, amount: true } },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!user || user.role !== "CUSTOMER") notFound();

  const totalSpend = await prisma.payment.aggregate({
    where: { booking: { userId: id }, status: "CAPTURED" },
    _sum: { amount: true },
  });

  const activeBookings = user.bookings.filter((b) =>
    ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
  ).length;

  return (
    <>
      <Link href="/admin/users" className="adm-link" style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Back to Customers
      </Link>

      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">{user.name}</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>{user.email}</p>
        </div>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Total Bookings", value: String(user._count.bookings) },
          { label: "Active Bookings", value: String(activeBookings) },
          { label: "Total Spend", value: formatINR(totalSpend._sum.amount ?? 0) },
          { label: "Member Since", value: formatAdminDate(user.createdAt) },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={{ fontSize: "1.5rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Contact Information</div>
        <div className="adm-detail-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Phone", value: user.phone ?? "—" },
              { label: "City", value: user.city ?? "—" },
              { label: "User ID", value: user.id },
            ].map((r) => (
              <div key={r.label}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{r.label}</div>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-section-header" style={{ marginTop: "1.5rem" }}>
        <div className="adm-section-title">Recent Bookings</div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              {["Booking", "Service", "Date", "Amount", "Status", ""].map((h) => (
                <th key={h || "action"} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.bookings.map((b) => (
              <tr key={b.id}>
                <td><span className="adm-booking-id">{b.bookingNumber}</span></td>
                <td>{b.package.serviceCategory.name}</td>
                <td>{formatAdminDate(b.sevaDate)}</td>
                <td style={{ fontWeight: 600 }}>{b.payment ? formatINR(b.payment.amount) : "—"}</td>
                <td>
                  <span className={BOOKING_BADGE_CLASS[b.status]}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </td>
                <td><Link href={`/admin/bookings/${b.id}`} className="adm-action-btn">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {user.bookings.length === 0 && (
          <div className="adm-empty"><div className="adm-empty-title">No bookings</div></div>
        )}
      </div>
    </>
  );
}
