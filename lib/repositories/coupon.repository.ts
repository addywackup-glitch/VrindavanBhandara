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

  incrementUsage(id: string, db: DbClient = prisma) {
    return db.coupon.update({ where: { id }, data: { usedCount: { increment: 1 } } });
  },

  recordUsage(data: Prisma.CouponUsageUncheckedCreateInput, db: DbClient = prisma) {
    return db.couponUsage.create({ data });
  },
};
