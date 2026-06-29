import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatINR, formatAdminDate, PAYMENT_BADGE_CLASS, BOOKING_BADGE_CLASS } from "@/lib/admin-ui";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-transitions";

export const metadata: Metadata = { title: "Refunds" };

type SearchParams = { tab?: string; page?: string };

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const p = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const activeTab = params.tab ?? "processed";

  const [processedPayments, failedPayments, eligibleBookings, processedCount, failedCount, eligibleCount] =
    await Promise.all([
      activeTab === "processed"
        ? prisma.payment.findMany({
            where: { status: "REFUNDED" },
            orderBy: { refundedAt: "desc" },
            skip: (p - 1) * pageSize,
            take: pageSize,
            include: {
              booking: {
                select: {
                  id: true,
                  bookingNumber: true,
                  status: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
          })
        : [],
      activeTab === "failed"
        ? prisma.payment.findMany({
            where: { status: "FAILED" },
            orderBy: { updatedAt: "desc" },
            skip: (p - 1) * pageSize,
            take: pageSize,
            include: {
              booking: {
                select: {
                  id: true,
                  bookingNumber: true,
                  status: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
          })
        : [],
      activeTab === "pending"
        ? prisma.booking.findMany({
            where: {
              status: { in: ["CONFIRMED", "IN_PROGRESS"] },
              payment: { status: "CAPTURED" },
            },
            orderBy: { createdAt: "desc" },
            skip: (p - 1) * pageSize,
            take: pageSize,
            include: {
              user: { select: { name: true, email: true } },
              payment: { select: { amount: true, status: true } },
            },
          })
        : [],
      prisma.payment.count({ where: { status: "REFUNDED" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.booking.count({
        where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] }, payment: { status: "CAPTURED" } },
      }),
    ]);

  const tabs = [
    { key: "processed", label: "Processed Refunds", count: processedCount },
    { key: "pending", label: "Eligible for Refund", count: eligibleCount },
    { key: "failed", label: "Failed Payments", count: failedCount },
  ];

  const total =
    activeTab === "processed" ? processedCount : activeTab === "failed" ? failedCount : eligibleCount;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Refund Management</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Process refunds via booking status transitions; Razorpay webhooks confirm payment refunds.
          </p>
        </div>
      </div>

      <div className="adm-filter-row" style={{ marginBottom: "1.25rem" }}>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/refunds?tab=${t.key}`}
            className={`adm-filter-btn${activeTab === t.key ? " active" : ""}`}
          >
            {t.label} ({t.count})
          </Link>
        ))}
      </div>

      {activeTab === "pending" ? (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                {["Booking", "Customer", "Amount", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eligibleBookings.map((b) => (
                <tr key={b.id}>
                  <td><span className="adm-booking-id">{b.bookingNumber}</span></td>
                  <td>{b.user.name}<br /><span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{b.user.email}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.payment ? formatINR(b.payment.amount) : "—"}</td>
                  <td><span className={BOOKING_BADGE_CLASS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</span></td>
                  <td><Link href={`/admin/bookings/${b.id}`} className="adm-action-btn">Process Refund</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {eligibleBookings.length === 0 && (
            <div className="adm-empty"><div className="adm-empty-title">No eligible bookings</div></div>
          )}
        </div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                {["Booking", "Customer", "Amount", "Status", "Updated", "Actions"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(activeTab === "processed" ? processedPayments : failedPayments).map((pay) => (
                <tr key={pay.id}>
                  <td><span className="adm-booking-id">{pay.booking.bookingNumber}</span></td>
                  <td>{pay.booking.user.name}</td>
                  <td style={{ fontWeight: 600 }}>{formatINR(pay.amount)}</td>
                  <td><span className={PAYMENT_BADGE_CLASS[pay.status]}>{pay.status}</span></td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                    {pay.refundedAt ? formatAdminDate(pay.refundedAt) : formatAdminDate(pay.updatedAt)}
                  </td>
                  <td><Link href={`/admin/bookings/${pay.booking.id}`} className="adm-action-btn">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(activeTab === "processed" ? processedPayments : failedPayments).length === 0 && (
            <div className="adm-empty"><div className="adm-empty-title">No records</div></div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="adm-pagination" style={{ marginTop: "1rem" }}>
          <span className="adm-pagination-info">Page {p} of {totalPages}</span>
        </div>
      )}
    </>
  );
}
