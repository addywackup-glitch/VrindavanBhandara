// =============================================================================
// CouponRepository — pure Prisma access for coupons & redemptions
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const couponRepository = {
  findByCode(code: string, db: DbClient = prisma) {
    return db.coupon.findUnique({ where: { code } });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.coupon.findUnique({ where: { id } });
  },

  listAdmin(
    args: {
      where?: Prisma.CouponWhereInput;
      skip?: number;
      take?: number;
    } = {},
    db: DbClient = prisma
  ) {
    return db.coupon.findMany({
      where: args.where,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  },

  create(data: Prisma.CouponUncheckedCreateInput, db: DbClient = prisma) {
    return db.coupon.create({ data });
  },

  update(
    id: string,
    data: Prisma.CouponUncheckedUpdateInput,
    db: DbClient = prisma
  ) {
    return db.coupon.update({ where: { id }, data });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.coupon.delete({ where: { id } });
  },

  /** Atomically increment usage when under maxUses (or unlimited). */
  async tryIncrementUsage(id: string, maxUses: number | null, db: DbClient = prisma) {
    const result = await db.coupon.updateMany({
      where: {
        id,
        ...(maxUses === null ? {} : { usedCount: { lt: maxUses } }),
      },
      data: { usedCount: { increment: 1 } },
    });
    return result.count === 1;
  },

  incrementUsage(id: string, db: DbClient = prisma) {
    return db.coupon.update({ where: { id }, data: { usedCount: { increment: 1 } } });
  },

  recordUsage(data: Prisma.CouponUsageUncheckedCreateInput, db: DbClient = prisma) {
    return db.couponUsage.create({ data });
  },
};
