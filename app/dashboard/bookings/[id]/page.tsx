// =============================================================================
// Booking Detail Page — full details, timeline, media gallery, invoice
// Server Component — reads from Prisma directly; enforces ownership check
// =============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Decimal } from "@prisma/client/runtime/library";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Booking ${id.slice(0, 8).toUpperCase()} — Vrindavan Bhandara` };
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function getBooking(id: string, userId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        package: {
          include: {
            serviceCategory: true,
            items: true,
          },
        },
        payment: true,
        mediaProofs: { orderBy: { createdAt: "desc" } },
        proofTimeline: { orderBy: { occurredAt: "asc" } },
      },
    });
    if (!booking || booking.userId !== userId) return null;
    return booking;
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: Decimal | number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

const STATUS_INFO: Record<string, { label: string; badgeCls: string; description: string }> = {
  PENDING:     { label: "Pending Payment",   badgeCls: "db-badge db-badge-pending",    description: "Payment is required to confirm this booking." },
  CONFIRMED:   { label: "Confirmed",         badgeCls: "db-badge db-badge-confirmed",  description: "Payment received. Your Seva is scheduled." },
  IN_PROGRESS: { label: "In Progress",       badgeCls: "db-badge db-badge-inprogress", description: "Your Seva is currently being performed." },
  COMPLETED:   { label: "Completed",         badgeCls: "db-badge db-badge-completed",  description: "Seva has been performed successfully." },
  CANCELLED:   { label: "Cancelled",         badgeCls: "db-badge db-badge-cancelled",  description: "This booking has been cancelled." },
  REFUNDED:    { label: "Refunded",          badgeCls: "db-badge db-badge-refunded",   description: "Payment has been refunded to your account." },
};

// Timeline steps derived from booking status (fallback when no proofTimeline)
function getDefaultTimeline(status: string) {
  const steps = [
    { key: "BOOKING_CREATED",   title: "Booking Created",  icon: "📋" },
    { key: "PAYMENT_RECEIVED",  title: "Payment Received", icon: "💳" },
    { key: "SEVA_SCHEDULED",    title: "Seva Scheduled",   icon: "📅" },
    { key: "SEVA_IN_PROGRESS",  title: "Seva in Progress", icon: "🙏" },
    { key: "COMPLETED",         title: "Seva Completed",   icon: "✅" },
  ];
  const doneMap: Record<string, string[]> = {
    PENDING:     ["BOOKING_CREATED"],
    CONFIRMED:   ["BOOKING_CREATED", "PAYMENT_RECEIVED", "SEVA_SCHEDULED"],
    IN_PROGRESS: ["BOOKING_CREATED", "PAYMENT_RECEIVED", "SEVA_SCHEDULED", "SEVA_IN_PROGRESS"],
    COMPLETED:   steps.map((s) => s.key),
  };
  const done = new Set(doneMap[status] ?? []);
  return steps.map((s) => ({ ...s, done: done.has(s.key) }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BookingDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const booking = await getBooking(id, session.user.id);
  if (!booking) notFound();

  const statusInfo = STATUS_INFO[booking.status] ?? {
    label: booking.status,
    badgeCls: "db-badge",
    description: "",
  };

  const defaultTimeline = getDefaultTimeline(booking.status);
  const photos = booking.mediaProofs.filter((p) => p.type === "PHOTO");
  const videos = booking.mediaProofs.filter((p) => p.type === "VIDEO");

  return (
    <>
      {/* Back */}
      <Link
        href="/dashboard/bookings"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--muted)",
          textDecoration: "none",
          marginBottom: "1.5rem",
          transition: "color 150ms",
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.5 }} aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to My Bookings
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)", marginBottom: "0.375rem" }}>
            {booking.package.serviceCategory.name}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            {booking.bookingNumber}
          </p>
        </div>
        <span className={statusInfo.badgeCls} style={{ fontSize: "0.875rem", padding: "0.375rem 0.875rem" }}>
          <span className="db-badge-dot" aria-hidden="true" />
          {statusInfo.label}
        </span>
      </div>

      {/* Pending payment banner */}
      {booking.status === "PENDING" && (
        <div style={{
          background: "var(--warning-bg)",
          border: "1.5px solid oklch(68% 0.15 68 / 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontWeight: 600, color: "var(--fg)", marginBottom: "0.25rem" }}>Payment Required</p>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Complete payment to confirm your Seva booking.</p>
          </div>
          <Link href={`/book?resume=${booking.id}`} className="db-btn-book">
            Complete Payment →
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }} className="db-detail-layout">
        {/* ── Left column ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
          {/* Seva Details */}
          <div className="db-detail-card">
            <div className="db-detail-card-header">Seva Details</div>
            <div className="db-detail-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
                {[
                  { label: "Service", value: booking.package.serviceCategory.name },
                  { label: "Package", value: booking.package.name },
                  { label: "Location", value: booking.sevaLocation },
                  {
                    label: "Seva Date",
                    value: new Date(booking.sevaDate).toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    }),
                  },
                  ...(booking.guestCount ? [{ label: "Guest Count", value: String(booking.guestCount) }] : []),
                  ...(booking.dedicatedTo ? [{ label: "Dedicated To", value: booking.dedicatedTo }] : []),
                  ...(booking.gotra ? [{ label: "Gotra", value: booking.gotra }] : []),
                  ...(booking.occasion ? [{ label: "Occasion", value: booking.occasion }] : []),
                  ...(booking.specialInstructions ? [{ label: "Special Instructions", value: booking.specialInstructions }] : []),
                ].map((row) => (
                  <div key={row.label}>
                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.25rem" }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--fg)" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Package Contents */}
          {booking.package.items.length > 0 && (
            <div className="db-detail-card">
              <div className="db-detail-card-header">What&rsquo;s Included</div>
              <div className="db-detail-card-body">
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {booking.package.items.map((item) => (
                    <li key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: "var(--fg)" }}>
                      <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "var(--success)", fill: "none", strokeWidth: 2.5, flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span>
                        {item.description}
                        {item.quantity > 1 && (
                          <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}> × {item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="db-detail-card">
            <div className="db-detail-card-header">Seva Progress</div>
            <div className="db-detail-card-body">
              {booking.proofTimeline.length > 0 ? (
                <div className="db-timeline" role="list" aria-label="Seva progress timeline">
                  {booking.proofTimeline.map((event, i) => (
                    <div key={event.id} className="db-timeline-item" role="listitem">
                      {i < booking.proofTimeline.length - 1 && (
                        <div className="db-timeline-line" aria-hidden="true" />
                      )}
                      <div className="db-timeline-dot db-timeline-dot-done" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      <div className="db-timeline-content">
                        <div className="db-timeline-title">{event.title}</div>
                        {event.description && (
                          <div className="db-timeline-desc">{event.description}</div>
                        )}
                        <div className="db-timeline-time">
                          {new Date(event.occurredAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="db-timeline" role="list" aria-label="Estimated progress steps">
                  {defaultTimeline.map((step, i) => (
                    <div key={step.key} className="db-timeline-item" role="listitem">
                      {i < defaultTimeline.length - 1 && (
                        <div className="db-timeline-line" aria-hidden="true" />
                      )}
                      <div
                        className={`db-timeline-dot ${step.done ? "db-timeline-dot-done" : "db-timeline-dot-future"}`}
                        aria-hidden="true"
                      >
                        {step.done ? (
                          <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>
                        )}
                      </div>
                      <div className="db-timeline-content">
                        <div className="db-timeline-title" style={{ color: step.done ? "var(--fg)" : "var(--subtle)" }}>
                          {step.icon} {step.title}
                        </div>
                        {!step.done && (
                          <div className="db-timeline-desc" style={{ color: "var(--subtle)" }}>Pending</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Media Gallery */}
          {booking.mediaProofs.length > 0 && (
            <div className="db-detail-card">
              <div className="db-detail-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Seva Media</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: 400 }}>
                  {photos.length} photo{photos.length !== 1 ? "s" : ""}
                  {videos.length > 0 ? `, ${videos.length} video${videos.length !== 1 ? "s" : ""}` : ""}
                </span>
              </div>
              <div className="db-detail-card-body" style={{ paddingTop: 0 }}>
                {/* Videos */}
                {videos.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Videos
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      {videos.map((v) => (
                        <a
                          key={v.id}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={v.caption ?? "Seva video"}
                          style={{ width: 120, height: 90, background: "var(--brand)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                        >
                          <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, color: "var(--brand-fg)" }} aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="1.5" />
                            <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {/* Photos grid */}
                {photos.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.625rem" }}>
                    {photos.map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={img.caption ?? "Seva photo"}
                        style={{ display: "block", aspectRatio: "1", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--n-100)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.caption ?? "Seva photo"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Payment Summary */}
          <div className="db-detail-card">
            <div className="db-detail-card-header">Payment Summary</div>
            <div className="db-detail-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--muted)" }}>Base Amount</span>
                  <span>{formatINR(booking.baseAmount)}</span>
                </div>
                {Number(booking.discountAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--muted)" }}>Discount</span>
                    <span style={{ color: "var(--success)" }}>−{formatINR(booking.discountAmount)}</span>
                  </div>
                )}
                {booking.couponId && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                    <span style={{ color: "var(--muted)" }}>Coupon applied</span>
                    <span style={{ color: "var(--success)" }}>✓</span>
                  </div>
                )}
                {Number(booking.taxAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--muted)" }}>Tax</span>
                    <span>{formatINR(booking.taxAmount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: "var(--border)", margin: "0.25rem 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700 }}>
                  <span style={{ color: "var(--fg)" }}>Total</span>
                  <span style={{ color: "var(--brand)" }}>{formatINR(booking.totalAmount)}</span>
                </div>
              </div>

              {booking.payment && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--muted)" }}>Payment Status</span>
                    <span style={{
                      fontWeight: 600,
                      color: booking.payment.status === "CAPTURED" ? "var(--success)"
                           : booking.payment.status === "REFUNDED"  ? "var(--muted)"
                           : "oklch(55% 0.14 68)",
                    }}>
                      {booking.payment.status}
                    </span>
                  </div>
                  {booking.payment.razorpayPaymentId && (
                    <div style={{ fontSize: "0.75rem", color: "var(--subtle)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                      {booking.payment.razorpayPaymentId}
                    </div>
                  )}
                  {booking.payment.capturedAt && (
                    <div style={{ fontSize: "0.75rem", color: "var(--subtle)", marginTop: "0.25rem" }}>
                      Paid:{" "}
                      {new Date(booking.payment.capturedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="db-detail-card">
            <div className="db-detail-card-header">Seva Location</div>
            <div className="db-detail-card-body">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, stroke: "var(--brand)", fill: "none", strokeWidth: 1.5, flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--fg)", marginBottom: "0.25rem" }}>{booking.sevaLocation}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>
                    Seva performed at the holy dham of{" "}
                    {booking.sevaLocation === "Vrindavan"
                      ? "Vrindavan, Mathura, Uttar Pradesh"
                      : "Mathura, Uttar Pradesh"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status notes */}
          <div className="db-detail-card">
            <div className="db-detail-card-body">
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {statusInfo.description}
              </p>
              {booking.status === "COMPLETED" && (
                <div style={{ marginTop: "0.875rem" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                    📸 Seva proof has been uploaded to your account.
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                    📱 WhatsApp confirmation was sent to your registered number.
                  </p>
                </div>
              )}
              {booking.adminNotes && (
                <div style={{ marginTop: "0.875rem", padding: "0.75rem", background: "var(--n-50)", borderRadius: "var(--radius-sm)" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.25rem" }}>Admin Note</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--fg)" }}>{booking.adminNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link href="/book" className="db-btn-book" style={{ justifyContent: "center" }}>
              + Book Another Seva
            </Link>
            <Link href="/services" className="db-btn-view" style={{ textAlign: "center", justifyContent: "center" }}>
              Explore Services
            </Link>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .db-detail-layout { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
