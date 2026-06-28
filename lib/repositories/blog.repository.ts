// =============================================================================
// BlogRepository — pure Prisma access for blog posts
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const blogRepository = {
  list(
    args: { where: Prisma.BlogWhereInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.blog.findMany({
      where: args.where,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    });
  },

  count(where: Prisma.BlogWhereInput = {}, db: DbClient = prisma) {
    return db.blog.count({ where });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.blog.findUnique({ where: { id } });
  },

  findBySlug(slug: string, db: DbClient = prisma) {
    return db.blog.findUnique({ where: { slug } });
  },

  create(data: Prisma.BlogUncheckedCreateInput, db: DbClient = prisma) {
    return db.blog.create({ data });
  },

  update(id: string, data: Prisma.BlogUncheckedUpdateInput, db: DbClient = prisma) {
    return db.blog.update({ where: { id }, data });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.blog.delete({ where: { id } });
  },
};
