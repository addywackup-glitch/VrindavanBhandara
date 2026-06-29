// =============================================================================
// BookingRepository + ProofTimelineRepository — pure Prisma access for bookings
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

// --- Canonical query shapes (single source of truth for booking includes) ----

export const bookingListInclude = {
  package: { include: { serviceCategory: true } },
  payment: true,
} satisfies Prisma.BookingInclude;

export const bookingDetailInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  package: { include: { serviceCategory: true, items: true } },
  payment: true,
  mediaProofs: { orderBy: { createdAt: "desc" } },
  proofTimeline: { orderBy: { occurredAt: "asc" } },
} satisfies Prisma.BookingInclude;

export const bookingNotifyInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  package: { include: { serviceCategory: true, items: true } },
  payment: true,
  mediaProofs: true,
  proofTimeline: true,
} satisfies Prisma.BookingInclude;

export const bookingAdminListInclude = {
  user: { select: { name: true, email: true, phone: true } },
  package: { include: { serviceCategory: true } },
  payment: { select: { status: true, amount: true } },
} satisfies Prisma.BookingInclude;

export type BookingListItem = Prisma.BookingGetPayload<{ include: typeof bookingListInclude }>;
export type BookingDetail = Prisma.BookingGetPayload<{ include: typeof bookingDetailInclude }>;
export type BookingForNotification = Prisma.BookingGetPayload<{ include: typeof bookingNotifyInclude }>;
export type BookingAdminListItem = Prisma.BookingGetPayload<{ include: typeof bookingAdminListInclude }>;

export const bookingRepository = {
  create(data: Prisma.BookingUncheckedCreateInput, db: DbClient = prisma) {
    return db.booking.create({ data });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.booking.findUnique({ where: { id } });
  },

  findWithPayment(id: string, db: DbClient = prisma) {
    return db.booking.findUnique({ where: { id }, include: { payment: true } });
  },

  findDetail(id: string, db: DbClient = prisma) {
    return db.booking.findUnique({ where: { id }, include: bookingDetailInclude });
  },

  findForNotification(id: string, db: DbClient = prisma) {
    return db.booking.findUnique({ where: { id }, include: bookingNotifyInclude });
  },

  list(
    args: { where: Prisma.BookingWhereInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.booking.findMany({
      where: args.where,
      include: bookingListInclude,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  },

  adminList(
    args: { where: Prisma.BookingWhereInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.booking.findMany({
      where: args.where,
      include: bookingAdminListInclude,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  },

  count(where: Prisma.BookingWhereInput = {}, db: DbClient = prisma) {
    return db.booking.count({ where });
  },

  update(id: string, data: Prisma.BookingUncheckedUpdateInput, db: DbClient = prisma) {
    return db.booking.update({ where: { id }, data });
  },
};

export const proofTimelineRepository = {
  create(data: Prisma.ProofTimelineEventUncheckedCreateInput, db: DbClient = prisma) {
    return db.proofTimelineEvent.create({ data });
  },

  listForBooking(bookingId: string, db: DbClient = prisma) {
    return db.proofTimelineEvent.findMany({
      where: { bookingId },
      orderBy: { occurredAt: "asc" },
    });
  },
};
