// =============================================================================
// AuditRepository — pure Prisma access for audit logs
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const auditRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput, db: DbClient = prisma) {
    return db.auditLog.create({ data });
  },

  list(
    args: { where: Prisma.AuditLogWhereInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.auditLog.findMany({
      where: args.where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  },

  count(where: Prisma.AuditLogWhereInput = {}, db: DbClient = prisma) {
    return db.auditLog.count({ where });
  },
};
