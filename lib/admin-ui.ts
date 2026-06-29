import type { BookingStatus, PaymentStatus } from "@prisma/client";

export function formatINR(amount: number | { toString(): string }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatAdminDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const BOOKING_BADGE_CLASS: Record<BookingStatus, string> = {
  PENDING: "adm-badge adm-badge-pending",
  CONFIRMED: "adm-badge adm-badge-confirmed",
  IN_PROGRESS: "adm-badge adm-badge-inprogress",
  COMPLETED: "adm-badge adm-badge-completed",
  CANCELLED: "adm-badge adm-badge-cancelled",
  REFUNDED: "adm-badge adm-badge-refunded",
};

export const PAYMENT_BADGE_CLASS: Record<PaymentStatus, string> = {
  PENDING: "adm-badge adm-badge-pending",
  CAPTURED: "adm-badge adm-badge-confirmed",
  FAILED: "adm-badge adm-badge-cancelled",
  REFUNDED: "adm-badge adm-badge-refunded",
  DISPUTED: "adm-badge adm-badge-inprogress",
};

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
