// =============================================================================
// PaymentRepository — pure Prisma access for payments
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const paymentRefundInclude = {
  booking: {
    include: {
      user: { select: { name: true, phone: true, email: true } },
      package: { include: { serviceCategory: true } },
    },
  },
} satisfies Prisma.PaymentInclude;

export type PaymentWithRefundContext = Prisma.PaymentGetPayload<{
  include: typeof paymentRefundInclude;
}>;

export const paymentRepository = {
  findByBookingId(bookingId: string, db: DbClient = prisma) {
    return db.payment.findUnique({ where: { bookingId } });
  },

  findByOrderId(razorpayOrderId: string, db: DbClient = prisma) {
    return db.payment.findUnique({ where: { razorpayOrderId } });
  },

  findByOrderIdWithBooking(razorpayOrderId: string, db: DbClient = prisma) {
    return db.payment.findUnique({
      where: { razorpayOrderId },
      include: { booking: true },
    });
  },

  findByOrderIdWithRefundContext(razorpayOrderId: string, db: DbClient = prisma) {
    return db.payment.findUnique({
      where: { razorpayOrderId },
      include: paymentRefundInclude,
    });
  },

  findByPaymentIdWithRefundContext(razorpayPaymentId: string, db: DbClient = prisma) {
    return db.payment.findUnique({
      where: { razorpayPaymentId },
      include: paymentRefundInclude,
    });
  },

  upsertForBooking(
    args: {
      bookingId: string;
      create: Prisma.PaymentUncheckedCreateInput;
      update: Prisma.PaymentUncheckedUpdateInput;
    },
    db: DbClient = prisma
  ) {
    return db.payment.upsert({
      where: { bookingId: args.bookingId },
      create: args.create,
      update: args.update,
    });
  },

  update(id: string, data: Prisma.PaymentUncheckedUpdateInput, db: DbClient = prisma) {
    return db.payment.update({ where: { id }, data });
  },

  updateByOrderId(
    razorpayOrderId: string,
    data: Prisma.PaymentUncheckedUpdateInput,
    db: DbClient = prisma
  ) {
    return db.payment.update({ where: { razorpayOrderId }, data });
  },

  updateByBookingId(
    bookingId: string,
    data: Prisma.PaymentUncheckedUpdateInput,
    db: DbClient = prisma
  ) {
    return db.payment.update({ where: { bookingId }, data });
  },

  aggregateCaptured(
    where: Prisma.PaymentWhereInput = {},
    db: DbClient = prisma
  ) {
    return db.payment.aggregate({
      where: { status: "CAPTURED", ...where },
      _sum: { amount: true },
    });
  },
};
