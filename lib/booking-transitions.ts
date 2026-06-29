// UI-only mirror of booking.service VALID_TRANSITIONS — backend remains source of truth.
import type { BookingStatus } from "@prisma/client";

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "REFUNDED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function getAllowedTransitions(from: BookingStatus): BookingStatus[] {
  return BOOKING_STATUS_TRANSITIONS[from] ?? [];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const DESTRUCTIVE_STATUSES: BookingStatus[] = ["CANCELLED", "REFUNDED"];
