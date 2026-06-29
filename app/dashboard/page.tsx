// =============================================================================
// Dashboard Home — pixel-matches design_v1/dashboard.html
// Server Component: reads session + Prisma directly (no API round-trip)
// =============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import type { MediaType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard — Vrindavan Bhandara",
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  try {
    const [statGroups, recentBookings, upcomingBookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { userId },
        include: {
          package: { include: { serviceCategory: true } },
          payment: { select: { status: true, capturedAt: true } },
          mediaProofs: {
            select: { id: true, type: true, url: true, caption: true },
            take: 8,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.booking.findMany({
        where: {
          userId,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
          sevaDate: { gte: new Date() },
        },
        include: { package: { include: { serviceCategory: true } } },
        orderBy: { sevaDate: "asc" },
        take: 3,
      }),
    ]);

    const total = statGroups.reduce((s, g) => s + g._count.status, 0);
    const confirmed = statGroups.find((g) => g.status === "CONFIRMED")?._count.status ?? 0;
    const completed = statGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
    const totalInvested = statGroups.reduce((s, g) => s + Number(g._sum.totalAmount ?? 0), 0);

    const bookingWithMedia = recentBookings.find((b) => b.mediaProofs.length > 0) ?? null;

    return { total, confirmed, completed, totalInvested, recentBookings, upcomingBookings, bookingWithMedia };
  } catch {
    return {
      total: 0, confirmed: 0, completed: 0, totalInvested: 0,
      recentBookings: [], upcomingBookings: [], bookingWithMedia: null,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getNextSevaText(upcoming: Array<{ sevaDate: Date; package: { serviceCategory: { name: string } } }>) {
  if (!upcoming.length) return "No upcoming Sevas scheduled.";
  const next = upcoming[0];
  const diff = Math.ceil((next.sevaDate.getTime() - Date.now()) / 86_400_000);
  const dateStr = next.sevaDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `Your next Seva is scheduled for ${dateStr} — ${diff} day${diff !== 1 ? "s" : ""} away.`;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:     "db-badge db-badge-pending",
  CONFIRMED:   "db-badge db-badge-confirmed",
  IN_PROGRESS: "db-badge db-badge-inprogress",
  COMPLETED:   "db-badge db-badge-completed",
  CANCELLED:   "db-badge db-badge-cancelled",
  REFUNDED:    "db-badge db-badge-refunded",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:     "Pending",
  CONFIRMED:   "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED:   "Completed",
  CANCELLED:   "Cancelled",
  REFUNDED:    "Refunded",
};

// ── Stat card value style lookup ──────────────────────────────────────────────

type StatCard = {
  label: string;
  value: string;
  sub: string;
  color?: string;
  fontSize?: string;
};

function StatValue({ value, color, fontSize }: { value: string; color?: string; fontSize?: string }) {
  const style: React.CSSProperties = {};
  if (color) style.color = color;
  if (fontSize) style.fontSize = fontSize;
  return (
    <div className="db-stat-value" style={Object.keys(style).length ? style : undefined}>
      {value}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const {
    total, confirmed, completed, totalInvested,
    recentBookings, upcomingBookings, bookingWithMedia,
  } = await getDashboardData(session.user.id);

  const firstName = session.user.name?.split(" ")[0] ?? "Devotee";
  const nextSevaText = getNextSevaText(upcomingBookings);

  const stats: StatCard[] = [
    { label: "Total Sevas Sponsored", value: String(total),          sub: "Your journey", color: "var(--brand)" },
    { label: "Confirmed Bookings",    value: String(confirmed),       sub: "Upcoming & scheduled" },
    { label: "Total Invested",        value: formatINR(totalInvested), sub: "In sacred service", color: "var(--accent-deep)", fontSize: "1.5rem" },
    { label: "Completed Sevas",       value: String(completed),       sub: "Successfully performed" },
  ];

  return (
    <>
      {/* Greeting */}
      <div className="db-greeting">
        <h1>Welcome back, <em>{firstName}</em></h1>
        <p>{nextSevaText}</p>
      </div>

      {/* Stats */}
      <div className="db-stats-grid" aria-label="Account statistics">
        {stats.map((s) => (
          <div key={s.label} className="db-stat-card">
            <div className="db-stat-label">{s.label}</div>
            <StatValue value={s.value} color={s.color} fontSize={s.fontSize} />
            <div className="db-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="db-section-header">
        <div className="db-section-title">Recent Bookings</div>
        <Link href="/dashboard/bookings" className="db-link">View all →</Link>
      </div>

      {recentBookings.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-icon">🙏</div>
          <div className="db-empty-title">No bookings yet</div>
          <div className="db-empty-desc">
            Begin your spiritual journey by booking your first Seva in Vrindavan or Mathura.
          </div>
          <Link href="/book" className="auth-btn-submit" style={{ width: "auto", padding: "0.75rem 2rem" }}>
            Book Your First Seva
          </Link>
        </div>
      ) : (
        <div className="db-booking-list" role="list" aria-label="Recent bookings">
          {recentBookings.map((booking) => {
            const badgeCls = STATUS_BADGE[booking.status] ?? "db-badge";
            const badgeLabel = STATUS_LABEL[booking.status] ?? booking.status;
            const iconBg: React.CSSProperties = booking.status === "COMPLETED"
              ? { background: "var(--success-bg)", color: "var(--success)" }
              : { background: "var(--surface-brand)", color: "var(--brand)" };

            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="db-booking-card"
                role="listitem"
                aria-label={`${booking.package.serviceCategory.name} — ${badgeLabel}`}
              >
                <div className="db-booking-icon" style={{ ...iconBg, fontSize: "1.25rem" }} aria-hidden="true">
                  {booking.package.serviceCategory.icon ?? "🙏"}
                </div>
                <div className="db-booking-info">
                  <div className="db-booking-name">
                    {booking.package.serviceCategory.name} — {booking.package.name}
                  </div>
                  <div className="db-booking-meta">
                    <span className="db-booking-meta-item">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {new Date(booking.sevaDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="db-booking-meta-item">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {booking.sevaLocation}
                    </span>
                    <span className="db-booking-meta-item">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
                      {booking.bookingNumber}
                    </span>
                  </div>
                </div>
                <div className="db-booking-right">
                  <div className="db-booking-amount">
                    {formatINR(Number(booking.totalAmount))}
                  </div>
                  <span className={badgeCls}>
                    <span className="db-badge-dot" aria-hidden="true" />
                    {badgeLabel}
                  </span>
                  <span className="db-btn-view">View</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Two-col: Media + Sidebar */}
      {(bookingWithMedia || upcomingBookings.length > 0) && (
        <div className="db-two-col">
          {/* Media showcase */}
          {bookingWithMedia ? (
            <div className="db-media-card">
              <div className="db-media-card-header">
                <div className="db-section-title" style={{ fontSize: "1rem" }}>Seva Media</div>
                <Link href={`/dashboard/bookings/${bookingWithMedia.id}`} className="db-link">View all</Link>
              </div>
              <div style={{ padding: "0.625rem 1.5rem", borderBottom: "1px solid var(--border)", fontSize: "0.8125rem", color: "var(--muted)" }}>
                From{" "}
                <strong style={{ color: "var(--fg)" }}>{bookingWithMedia.package.serviceCategory.name}</strong>
                {" "}·{" "}
                {new Date(bookingWithMedia.sevaDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" "}·{" "}
                {bookingWithMedia.mediaProofs.length} item{bookingWithMedia.mediaProofs.length !== 1 ? "s" : ""}
              </div>
              <div className="db-media-grid">
                {bookingWithMedia.mediaProofs.slice(0, 7).map((proof) => {
                  const isPhoto = (proof.type as MediaType) === "PHOTO";
                  return isPhoto ? (
                    <div key={proof.id} className="db-media-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proof.url} alt={proof.caption ?? "Seva media"} loading="lazy" />
                    </div>
                  ) : (
                    <div key={proof.id} className="db-media-thumb db-media-thumb-video">
                      <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="1.5" />
                        <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                  );
                })}
                {bookingWithMedia.mediaProofs.length > 7 && (
                  <div className="db-media-thumb db-media-thumb-more" style={{ display: "flex" }}>
                    <span className="db-media-thumb-more-num">+{bookingWithMedia.mediaProofs.length - 7}</span>
                    <span className="db-media-thumb-more-label">more</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="db-media-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <div style={{ textAlign: "center", color: "var(--subtle)", padding: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
                <p style={{ fontSize: "0.875rem" }}>Media proof appears here after Seva completion</p>
              </div>
            </div>
          )}

          {/* Right sidebar */}
          <div>
            {upcomingBookings.length > 0 && (
              <div className="db-side-card">
                <div className="db-side-card-title">Upcoming Sevas</div>
                {upcomingBookings.map((b) => {
                  const d = new Date(b.sevaDate);
                  return (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings/${b.id}`}
                      className="db-upcoming-item"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="db-upcoming-date-box">
                        <div className="db-upcoming-day">
                          {String(d.getDate()).padStart(2, "0")}
                        </div>
                        <div className="db-upcoming-month">
                          {d.toLocaleDateString("en-IN", { month: "short" })}
                        </div>
                      </div>
                      <div>
                        <div className="db-upcoming-seva">{b.package.serviceCategory.name}</div>
                        <div className="db-upcoming-pkg">{b.package.name} · {b.sevaLocation}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="db-side-card">
              <div className="db-side-card-title">Account</div>
              <div className="db-profile-info">
                <div className="db-profile-row">
                  <span className="db-profile-row-label">Name</span>
                  <span className="db-profile-row-value">{session.user.name ?? "—"}</span>
                </div>
                <div className="db-profile-row">
                  <span className="db-profile-row-label">Email</span>
                  <span className="db-profile-row-value" style={{ maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {session.user.email ?? "—"}
                  </span>
                </div>
              </div>
              <Link href="/dashboard/profile" className="db-link" style={{ display: "block", marginTop: "1rem", fontSize: "0.875rem" }}>
                Edit Profile →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
