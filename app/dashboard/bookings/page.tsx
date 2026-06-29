// =============================================================================
// My Bookings — Server Component with client tab/search via URL search params
// Reads from Prisma directly; uses searchParams for tab + search filtering
// =============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BookingStatusTabs } from "@/components/dashboard/BookingStatusTabs";

export const metadata: Metadata = { title: "My Bookings — Vrindavan Bhandara" };

type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REFUNDED";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING:     "db-badge db-badge-pending",
  CONFIRMED:   "db-badge db-badge-confirmed",
  IN_PROGRESS: "db-badge db-badge-inprogress",
  COMPLETED:   "db-badge db-badge-completed",
  CANCELLED:   "db-badge db-badge-cancelled",
  REFUNDED:    "db-badge db-badge-refunded",
};

function formatINR(amount: { toString(): string } | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

async function getBookings(userId: string, status?: string, search?: string) {
  try {
    const where = {
      userId,
      ...(status && status !== "ALL" ? { status: status as BookingStatus } : {}),
      ...(search
        ? {
            OR: [
              { bookingNumber: { contains: search, mode: "insensitive" as const } },
              { package: { serviceCategory: { name: { contains: search, mode: "insensitive" as const } } } },
              { package: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [bookings, counts] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          package: { include: { serviceCategory: true } },
          payment: { select: { status: true, capturedAt: true } },
          mediaProofs: { select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      }),
    ]);

    const tabCounts: Record<string, number> = { ALL: 0 };
    counts.forEach((c) => {
      tabCounts[c.status] = c._count.status;
      tabCounts.ALL += c._count.status;
    });

    return { bookings, tabCounts };
  } catch {
    return { bookings: [], tabCounts: {} };
  }
}

type SearchParams = { status?: string; q?: string };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/bookings");

  const { status, q } = await searchParams;
  const activeTab = (status ?? "ALL").toUpperCase();
  const searchQuery = q ?? "";

  const { bookings, tabCounts } = await getBookings(session.user.id, activeTab, searchQuery);

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "PENDING", label: "Pending" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)", marginBottom: "0.375rem" }}>
            My Bookings
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            {tabCounts.ALL ?? 0} seva{(tabCounts.ALL ?? 0) !== 1 ? "s" : ""} booked
          </p>
        </div>
        <Link href="/book" className="db-btn-book" style={{ flexShrink: 0 }}>
          + Book New Seva
        </Link>
      </div>

      {/* Client-side tabs + search (interactive, needs client component) */}
      <BookingStatusTabs
        tabs={tabs}
        tabCounts={tabCounts}
        activeTab={activeTab}
        defaultSearch={searchQuery}
      />

      {/* Booking list */}
      {bookings.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-icon">🙏</div>
          <div className="db-empty-title">
            {searchQuery ? "No results found" : "No bookings yet"}
          </div>
          <div className="db-empty-desc">
            {searchQuery
              ? `No bookings match "${searchQuery}". Try a different search term.`
              : "Begin your spiritual journey by booking your first Seva in Vrindavan or Mathura."}
          </div>
          {!searchQuery && (
            <Link href="/book" className="auth-btn-submit" style={{ width: "auto", padding: "0.75rem 2rem" }}>
              Book Your First Seva
            </Link>
          )}
        </div>
      ) : (
        <div className="db-booking-list" role="list" aria-label="Bookings">
          {bookings.map((booking) => {
            const bStatus = booking.status as BookingStatus;
            const badgeCls = STATUS_BADGE[bStatus] ?? "db-badge";
            const badgeLabel = STATUS_LABEL[bStatus] ?? booking.status;
            const hasMedia = booking.mediaProofs.length > 0;

            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="db-booking-card"
                role="listitem"
                aria-label={`${booking.package.serviceCategory.name} — ${badgeLabel}`}
              >
                {/* Service icon */}
                <div
                  className="db-booking-icon"
                  style={{
                    background: bStatus === "COMPLETED" ? "var(--success-bg)" : "var(--surface-brand)",
                    color: bStatus === "COMPLETED" ? "var(--success)" : "var(--brand)",
                    fontSize: "1.25rem",
                  }}
                  aria-hidden="true"
                >
                  {booking.package.serviceCategory.icon ?? "🙏"}
                </div>

                {/* Info */}
                <div className="db-booking-info">
                  <div className="db-booking-name">
                    {booking.package.serviceCategory.name} — {booking.package.name}
                  </div>
                  <div className="db-booking-meta">
                    <span className="db-booking-meta-item">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {new Date(booking.sevaDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="db-booking-meta-item">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {booking.sevaLocation}
                    </span>
                    {hasMedia && (
                      <span className="db-booking-meta-item" style={{ color: "var(--brand)" }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                        Media available
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: amount + badge + CTA */}
                <div className="db-booking-right">
                  <div className="db-booking-amount">{formatINR(booking.totalAmount)}</div>
                  <span className={badgeCls}>
                    <span className="db-badge-dot" aria-hidden="true" />
                    {badgeLabel}
                  </span>
                  <span className="db-btn-view">
                    {bStatus === "COMPLETED" && hasMedia
                      ? "View Proof"
                      : bStatus === "PENDING"
                      ? "Pay Now"
                      : "View"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
