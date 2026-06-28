// =============================================================================
// VRINDAVAN BHANDARA — Booking Service (the booking engine)
// Source: Phase 2 §2/§4/§8/§9 — Repository -> Service, transactions, typed errors
//
// Framework-agnostic. All booking business logic lives here. Persistence goes
// through repositories; atomic writes use runTransaction; failures throw typed
// domain errors that `execute` maps to a uniform ServiceResult.
// =============================================================================

import type {
  Booking,
  BookingStatus,
  ProofTimelineEventType,
  ServiceType,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  bookingRepository,
  packageRepository,
  couponRepository,
  proofTimelineRepository,
  runTransaction,
  type BookingListItem,
  type BookingDetail,
} from "@/lib/repositories";
import { generateBookingNumber, formatDate } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { execute, validate } from "@/lib/api/service";
import { type ServiceResult } from "@/lib/api/result";
import {
  AuthorizationError,
  BookingConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { isAdmin, type Actor } from "@/lib/services/actor";
import {
  CreateBookingSchema,
  UpdateBookingStatusSchema,
} from "@/lib/validations";
import {
  sendWhatsAppSevaInProgress,
  sendWhatsAppSevaCompleted,
} from "@/features/notifications/whatsapp";
import type { PaginatedResponse } from "@/types";

export type { BookingListItem, BookingDetail } from "@/lib/repositories";

type Ctx = { ip?: string; userAgent?: string };

// =============================================================================
// Status lifecycle — single source of truth (used by all callers, incl. admin)
// =============================================================================

const ALL_STATUSES: readonly BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "REFUNDED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const TIMELINE_BY_STATUS: Record<BookingStatus, ProofTimelineEventType> = {
  PENDING: "BOOKING_RECEIVED",
  CONFIRMED: "PAYMENT_CONFIRMED",
  IN_PROGRESS: "SEVA_IN_PROGRESS",
  COMPLETED: "SEVA_COMPLETED",
  CANCELLED: "BOOKING_CANCELLED",
  REFUNDED: "REFUND_PROCESSED",
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from].includes(to);
}

function toBookingStatus(value: string | null): BookingStatus | undefined {
  if (!value) return undefined;
  return ALL_STATUSES.includes(value as BookingStatus)
    ? (value as BookingStatus)
    : undefined;
}

// =============================================================================
// Serializable DTO — safe across the Server Action / RSC boundary
// =============================================================================

export type BookingDto = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  sevaDate: string;
  sevaLocation: string;
  guestCount: number;
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
};

export function toBookingDto(booking: Booking): BookingDto {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    sevaDate: booking.sevaDate.toISOString(),
    sevaLocation: booking.sevaLocation,
    guestCount: booking.guestCount,
    baseAmount: booking.baseAmount.toNumber(),
    discountAmount: booking.discountAmount.toNumber(),
    taxAmount: booking.taxAmount.toNumber(),
    totalAmount: booking.totalAmount.toNumber(),
    currency: booking.currency,
    createdAt: booking.createdAt.toISOString(),
  };
}

// =============================================================================
// CREATE — POST /api/bookings
// =============================================================================

export function createBooking(
  actor: Actor,
  input: unknown,
  ctx?: Ctx
): Promise<ServiceResult<Booking>> {
  return execute(async () => {
    const data = validate(CreateBookingSchema, input);

    const pkg = await packageRepository.findActiveWithCategory(data.packageId);
    if (!pkg) throw new NotFoundError("Package");

    const baseAmount = pkg.price.toNumber();
    const { discountAmount, couponId } = await evaluateCoupon(
      data.couponCode,
      baseAmount,
      pkg.serviceCategory.type,
      pkg.id
    );

    const taxAmount = 0; // Charitable seva — no GST applied
    const totalAmount = baseAmount - discountAmount + taxAmount;

    const booking = await runTransaction(async (tx) => {
      const created = await bookingRepository.create(
        {
          bookingNumber: generateBookingNumber(),
          userId: actor.userId,
          packageId: pkg.id,
          sevaDate: data.sevaDate,
          sevaLocation: data.sevaLocation,
          guestCount: data.guestCount,
          dedicatedTo: data.dedicatedTo ?? null,
          gotra: data.gotra ?? null,
          occasion: data.occasion ?? null,
          specialInstructions: data.specialInstructions ?? null,
          baseAmount,
          discountAmount,
          taxAmount,
          totalAmount,
          couponId,
          status: "PENDING",
        },
        tx
      );

      if (couponId) {
        await couponRepository.incrementUsage(couponId, tx);
        await couponRepository.recordUsage(
          { couponId, userId: actor.userId, bookingId: created.id },
          tx
        );
      }

      await proofTimelineRepository.create(
        {
          bookingId: created.id,
          eventType: "BOOKING_RECEIVED",
          title: "Booking Received",
          description:
            "Your seva booking has been received. Awaiting payment confirmation.",
          createdBy: "system",
        },
        tx
      );

      return created;
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "Booking",
      entityId: booking.id,
      newData: { bookingNumber: booking.bookingNumber, packageId: pkg.id, totalAmount },
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    });

    return booking;
  }, "Booking created successfully");
}

/** Validate + price a coupon. Throws ValidationError when not applicable. */
async function evaluateCoupon(
  code: string | undefined,
  baseAmount: number,
  serviceType: ServiceType,
  packageId: string
): Promise<{ discountAmount: number; couponId: string | null }> {
  if (!code) return { discountAmount: 0, couponId: null };

  const coupon = await couponRepository.findByCode(code);
  const now = new Date();
  const usable =
    coupon &&
    coupon.isActive &&
    (!coupon.expiresAt || coupon.expiresAt > now) &&
    (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
    (!coupon.minOrderValue || baseAmount >= coupon.minOrderValue.toNumber()) &&
    (coupon.applicableServices.length === 0 ||
      coupon.applicableServices.includes(serviceType)) &&
    (coupon.applicablePackages.length === 0 ||
      coupon.applicablePackages.includes(packageId));

  if (!coupon || !usable) {
    throw new ValidationError(
      "This coupon is invalid, expired, or not applicable to the selected package."
    );
  }

  let discountAmount: number;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (baseAmount * coupon.discountValue.toNumber()) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount.toNumber());
    }
  } else {
    discountAmount = coupon.discountValue.toNumber();
  }
  discountAmount = Math.min(discountAmount, baseAmount);

  return { discountAmount, couponId: coupon.id };
}

// =============================================================================
// LIST — GET /api/bookings
// =============================================================================

export function listBookings(
  actor: Actor,
  query: { page?: string | null; pageSize?: string | null; status?: string | null }
): Promise<ServiceResult<PaginatedResponse<BookingListItem>>> {
  return execute(async () => {
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(query.pageSize ?? "10", 10) || 10)
    );
    const status = toBookingStatus(query.status ?? null);
    const skip = (page - 1) * pageSize;

    const where: Prisma.BookingWhereInput = {
      ...(isAdmin(actor) ? {} : { userId: actor.userId }),
      ...(status ? { status } : {}),
    };

    const [bookings, total] = await Promise.all([
      bookingRepository.list({ where, skip, take: pageSize }),
      bookingRepository.count(where),
    ]);

    return {
      data: bookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
}

// =============================================================================
// GET ONE — GET /api/bookings/:id
// =============================================================================

export function getBooking(
  actor: Actor,
  id: string
): Promise<ServiceResult<BookingDetail>> {
  return execute(async () => {
    const booking = await bookingRepository.findDetail(id);
    if (!booking) throw new NotFoundError("Booking");
    if (!isAdmin(actor) && booking.userId !== actor.userId) {
      throw new AuthorizationError("You do not have access to this booking.");
    }
    return booking;
  });
}

// =============================================================================
// UPDATE STATUS — PUT /api/bookings/:id and admin status route
// =============================================================================

export function updateBookingStatus(
  actor: Actor,
  id: string,
  input: unknown,
  ctx?: Ctx
): Promise<ServiceResult<Booking>> {
  return execute(async () => {
    if (!isAdmin(actor)) {
      throw new AuthorizationError("Only administrators can update booking status.");
    }

    const { status, adminNotes, completionNotes } = validate(
      UpdateBookingStatusSchema,
      input
    );

    const existing = await bookingRepository.findById(id);
    if (!existing) throw new NotFoundError("Booking");

    if (!canTransition(existing.status, status)) {
      throw new BookingConflictError(
        `Cannot transition booking from ${existing.status} to ${status}.`
      );
    }

    const changed = existing.status !== status;

    const updated = await runTransaction(async (tx) => {
      const next = await bookingRepository.update(
        id,
        {
          status,
          adminNotes: adminNotes ?? existing.adminNotes,
          completionNotes: completionNotes ?? existing.completionNotes,
          ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
        },
        tx
      );

      if (changed) {
        await proofTimelineRepository.create(
          {
            bookingId: id,
            eventType: TIMELINE_BY_STATUS[status],
            title: `Status updated to ${status}`,
            description: completionNotes ?? adminNotes ?? null,
            createdBy: actor.userId,
          },
          tx
        );
      }

      return next;
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Booking",
      entityId: id,
      oldData: { status: existing.status },
      newData: { status },
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
    });

    if (changed) await dispatchStatusNotifications(id, status);

    return updated;
  }, "Booking status updated");
}

/** Fire-and-forget customer notifications for relevant status changes. */
async function dispatchStatusNotifications(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  if (status !== "IN_PROGRESS" && status !== "COMPLETED") return;

  const booking = await bookingRepository.findForNotification(bookingId);
  if (!booking) return;

  const serviceName = booking.package.serviceCategory.name;
  if (status === "IN_PROGRESS") {
    void sendWhatsAppSevaInProgress({
      phone: booking.user.phone,
      name: booking.user.name,
      serviceName,
      sevaDate: formatDate(booking.sevaDate),
    }).catch(() => {});
  } else {
    void sendWhatsAppSevaCompleted({
      phone: booking.user.phone,
      name: booking.user.name,
      serviceName,
      bookingId,
    }).catch(() => {});
  }
}
