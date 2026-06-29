import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AdminBookingActions } from "@/components/admin/AdminBookingActions";
import { getAllowedTransitions, BOOKING_STATUS_LABELS } from "@/lib/booking-transitions";
import { BOOKING_BADGE_CLASS, PAYMENT_BADGE_CLASS, formatINR, formatAdminDate, formatAdminDateTime } from "@/lib/admin-ui";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Manage Booking" };

async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      package: { include: { serviceCategory: true, items: true } },
      payment: true,
      mediaProofs: { orderBy: { createdAt: "desc" } },
      proofTimeline: { orderBy: { occurredAt: "asc" } },
    },
  });
}

export default async function AdminBookingDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const allowedTransitions = getAllowedTransitions(booking.status);

  return (
    <>
      <Link href="/admin/bookings" className="adm-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.25rem" }}>
        ← Back to Bookings
      </Link>

      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">{booking.package.serviceCategory.name}</div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {booking.bookingNumber}
          </p>
        </div>
        <span className={BOOKING_BADGE_CLASS[booking.status]}>
          <span className="adm-badge-dot" aria-hidden="true" />
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem" }} className="adm-detail-layout">
        <div>
          {/* Customer */}
          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Customer</div>
            <div className="adm-detail-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                {[
                  { label: "Name", value: booking.user.name },
                  { label: "Email", value: booking.user.email },
                  { label: "Phone", value: booking.user.phone ?? "—" },
                  { label: "City", value: booking.user.city ?? "—" },
                ].map((r) => (
                  <div key={r.label}>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.label}</div>
                    <div style={{ fontWeight: 500 }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <Link href={`/admin/users/${booking.user.id}`} className="adm-link" style={{ display: "inline-block", marginTop: "1rem", fontSize: "0.875rem" }}>
                View customer profile →
              </Link>
            </div>
          </div>

          {/* Seva / Sankalp */}
          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Seva & Sankalp Details</div>
            <div className="adm-detail-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                {[
                  { label: "Service", value: booking.package.serviceCategory.name },
                  { label: "Package", value: booking.package.name },
                  { label: "Location", value: booking.sevaLocation },
                  { label: "Seva Date", value: formatAdminDate(booking.sevaDate) },
                  { label: "Guests", value: String(booking.guestCount) },
                  ...(booking.dedicatedTo ? [{ label: "Dedicated To", value: booking.dedicatedTo }] : []),
                  ...(booking.gotra ? [{ label: "Gotra", value: booking.gotra }] : []),
                  ...(booking.occasion ? [{ label: "Occasion", value: booking.occasion }] : []),
                ].map((r) => (
                  <div key={r.label}>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.label}</div>
                    <div style={{ fontWeight: 500 }}>{r.value}</div>
                  </div>
                ))}
              </div>
              {booking.specialInstructions && (
                <div style={{ marginTop: "1rem", padding: "0.875rem", background: "var(--n-50)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>Special Instructions</div>
                  <div style={{ fontSize: "0.875rem" }}>{booking.specialInstructions}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Timeline</div>
            <div className="adm-detail-card-body">
              {booking.proofTimeline.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No timeline events yet.</p>
              ) : (
                booking.proofTimeline.map((event) => (
                  <div key={event.id} className="adm-activity-item">
                    <div className="adm-activity-dot" style={{ background: "var(--brand)" }} aria-hidden="true" />
                    <div className="adm-activity-text">
                      <strong>{event.title}</strong>
                      {event.description && <><br />{event.description}</>}
                    </div>
                    <div className="adm-activity-time">{formatAdminDateTime(event.occurredAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Media */}
          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Media Proof ({booking.mediaProofs.length})</div>
            <div className="adm-detail-card-body">
              {booking.mediaProofs.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No proof media uploaded yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.625rem" }}>
                  {booking.mediaProofs.map((proof) => (
                    <a key={proof.id} href={proof.url} target="_blank" rel="noopener noreferrer" style={{ aspectRatio: "1", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--n-100)" }}>
                      {proof.type === "PHOTO" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proof.url} alt={proof.caption ?? "Proof"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "var(--brand)", color: "var(--brand-fg)" }}>▶</div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit */}
          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Audit Information</div>
            <div className="adm-detail-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", fontSize: "0.875rem" }}>
                <div><span style={{ color: "var(--muted)" }}>Created</span><br /><strong>{formatAdminDateTime(booking.createdAt)}</strong></div>
                <div><span style={{ color: "var(--muted)" }}>Updated</span><br /><strong>{formatAdminDateTime(booking.updatedAt)}</strong></div>
                {booking.completedAt && <div><span style={{ color: "var(--muted)" }}>Completed</span><br /><strong>{formatAdminDateTime(booking.completedAt)}</strong></div>}
              </div>
              {booking.adminNotes && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>Admin Notes</div>
                  <div style={{ fontSize: "0.875rem" }}>{booking.adminNotes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <AdminBookingActions
            bookingId={booking.id}
            currentStatus={booking.status}
            allowedTransitions={allowedTransitions}
          />

          <div className="adm-detail-card">
            <div className="adm-detail-card-header">Payment</div>
            <div className="adm-detail-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Base</span><span>{formatINR(booking.baseAmount)}</span></div>
                {Number(booking.discountAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                    <span>Discount</span><span>−{formatINR(booking.discountAmount)}</span>
                  </div>
                )}
                {Number(booking.taxAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Tax</span><span>{formatINR(booking.taxAmount)}</span></div>
                )}
                <div style={{ height: 1, background: "var(--border)", margin: "0.25rem 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span><span style={{ color: "var(--brand)" }}>{formatINR(booking.totalAmount)}</span>
                </div>
              </div>
              {booking.payment && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.8125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--muted)" }}>Status</span>
                    <span className={PAYMENT_BADGE_CLASS[booking.payment.status]}>{booking.payment.status}</span>
                  </div>
                  {booking.payment.razorpayPaymentId && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--subtle)", wordBreak: "break-all" }}>
                      {booking.payment.razorpayPaymentId}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .adm-detail-layout { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
