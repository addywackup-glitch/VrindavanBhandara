// =============================================================================
// Notifications Page — ready for backend integration
// Backend notifications API is marked "future" in docs.
// Shows empty state; will hydrate when GET /api/notifications is available.
// =============================================================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications — Vrindavan Bhandara" };

// When the backend implements GET /api/notifications, replace this stub:
// async function getNotifications(userId: string) { ... }

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/notifications");

  // Future: fetch real notifications here
  const notifications: {
    id: string;
    title: string;
    message: string;
    read: boolean;
    type: "booking" | "payment" | "info" | "media";
    createdAt: string;
  }[] = [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon: Record<string, string> = {
    booking: "📋",
    payment: "💳",
    info:    "ℹ️",
    media:   "📸",
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)", marginBottom: "0.375rem" }}>
            Notifications
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        {/* Mark all read (disabled until real API) */}
        {unreadCount > 0 && (
          <button
            className="db-btn-view"
            disabled
            aria-label="Mark all notifications as read"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="db-tabs" role="tablist" aria-label="Filter notifications">
        {["All", "Unread", "Bookings", "Payments"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === "All"}
            className={`db-tab${t === "All" ? " active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notification list or empty state */}
      {notifications.length === 0 ? (
        <div className="db-empty">
          <div className="db-empty-icon">🔔</div>
          <div className="db-empty-title">No notifications yet</div>
          <div className="db-empty-desc">
            You&rsquo;ll receive updates here when your booking status changes, media is
            uploaded, or payments are processed.
          </div>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          role="list"
          aria-label="Notifications"
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              role="listitem"
              style={{
                background: n.read ? "var(--surface)" : "var(--surface-brand)",
                border: `1.5px solid ${n.read ? "var(--border)" : "oklch(30% 0.12 148 / 0.2)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0, marginTop: "0.125rem" }} aria-hidden="true">
                {typeIcon[n.type] ?? "🔔"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                  <p style={{ fontWeight: 600, color: "var(--fg)", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span
                      style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: 6 }}
                      aria-label="Unread"
                    />
                  )}
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>{n.message}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--subtle)", marginTop: "0.5rem" }}>
                  {new Date(n.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--subtle)", flexShrink: 0, padding: "0.25rem", borderRadius: "var(--radius-sm)", transition: "color 150ms" }}
                aria-label="Dismiss notification"
              >
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 1.5 }} aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Pagination placeholder */}
          {notifications.length >= 20 && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "1rem" }}>
              <button className="db-btn-view">Load more</button>
            </div>
          )}
        </div>
      )}

      {/* Delivery channels */}
      <div style={{
        marginTop: "2rem",
        padding: "1rem 1.25rem",
        background: "var(--n-50)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        fontSize: "0.8125rem",
        color: "var(--muted)",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--fg)" }}>WhatsApp &amp; email updates</strong> — Booking confirmations and seva updates are sent to your registered phone and email.
      </div>
    </>
  );
}
