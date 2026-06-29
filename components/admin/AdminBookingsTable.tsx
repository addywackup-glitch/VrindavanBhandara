"use client";

import { useState } from "react";
import Link from "next/link";
import { BOOKING_BADGE_CLASS, formatINR, formatAdminDate } from "@/lib/admin-ui";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-transitions";
import type { BookingStatus } from "@prisma/client";

type BookingRow = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  sevaDate: string;
  user: { name: string; email: string; phone: string | null };
  package: { name: string; serviceCategory: { name: string } };
  payment: { status: string; amount: number } | null;
  createdAt: string;
};

export function AdminBookingsTable({
  bookings,
  page,
  totalPages,
  activeStatus,
  search,
}: {
  bookings: BookingRow[];
  page: number;
  totalPages: number;
  activeStatus: string;
  search?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selected.size === bookings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bookings.map((b) => b.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (activeStatus !== "ALL") params.set("status", activeStatus);
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  if (bookings.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-title">No bookings found</div>
        <div className="adm-empty-desc">Try adjusting your filters or search term.</div>
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="adm-alert" style={{ background: "var(--surface-brand)", border: "1px solid oklch(30% 0.12 148 / 0.2)", color: "var(--brand)" }}>
          {selected.size} booking{selected.size !== 1 ? "s" : ""} selected — open individually to manage status.
        </div>
      )}

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={selected.size === bookings.length && bookings.length > 0}
                  onChange={toggleAll}
                  aria-label="Select all bookings on this page"
                />
              </th>
              {["Booking ID", "Customer", "Service", "Package", "Seva Date", "Amount", "Payment", "Status", "Created", "Actions"].map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => toggleOne(b.id)}
                    aria-label={`Select booking ${b.bookingNumber}`}
                  />
                </td>
                <td><span className="adm-booking-id">{b.bookingNumber}</span></td>
                <td>
                  {b.user.name}
                  <br /><span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{b.user.email}</span>
                </td>
                <td>{b.package.serviceCategory.name}</td>
                <td>{b.package.name}</td>
                <td>{formatAdminDate(b.sevaDate)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {b.payment ? formatINR(b.payment.amount) : "—"}
                </td>
                <td>
                  {b.payment ? (
                    <span className={`adm-badge adm-badge-${b.payment.status === "CAPTURED" ? "confirmed" : b.payment.status === "REFUNDED" ? "refunded" : "pending"}`}>
                      {b.payment.status}
                    </span>
                  ) : "—"}
                </td>
                <td>
                  <span className={BOOKING_BADGE_CLASS[b.status]}>
                    <span className="adm-badge-dot" aria-hidden="true" />
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </td>
                <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{formatAdminDate(b.createdAt)}</td>
                <td>
                  <Link href={`/admin/bookings/${b.id}`} className="adm-action-btn">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="adm-pagination">
            <span className="adm-pagination-info">Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {page > 1 && <Link href={`/admin/bookings${qs(page - 1)}`} className="adm-filter-btn">Previous</Link>}
              {page < totalPages && <Link href={`/admin/bookings${qs(page + 1)}`} className="adm-filter-btn active">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
