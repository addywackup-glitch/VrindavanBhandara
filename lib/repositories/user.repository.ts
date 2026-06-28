// =============================================================================
// UserRepository — pure Prisma access for users
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const userRepository = {
  findById(id: string, db: DbClient = prisma) {
    return db.user.findUnique({ where: { id } });
  },

  findByEmail(email: string, db: DbClient = prisma) {
    return db.user.findUnique({ where: { email } });
  },

  findByEmailWithAdmin(email: string, db: DbClient = prisma) {
    return db.user.findUnique({
      where: { email },
      include: { admin: { select: { role: true, isActive: true } } },
    });
  },

  existsByEmail(email: string, db: DbClient = prisma) {
    return db.user.findUnique({ where: { email }, select: { id: true } });
  },

  create(data: Prisma.UserUncheckedCreateInput, db: DbClient = prisma) {
    return db.user.create({ data });
  },

  update(id: string, data: Prisma.UserUncheckedUpdateInput, db: DbClient = prisma) {
    return db.user.update({ where: { id }, data });
  },

  touchLastLogin(id: string, db: DbClient = prisma) {
    return db.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },

  count(where: Prisma.UserWhereInput = {}, db: DbClient = prisma) {
    return db.user.count({ where });
  },
};
