// =============================================================================
// GalleryRepository — pure Prisma access for gallery images
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const galleryRepository = {
  list(
    args: { where: Prisma.GalleryImageWhereInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.galleryImage.findMany({
      where: args.where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: args.skip,
      take: args.take,
    });
  },

  count(where: Prisma.GalleryImageWhereInput = {}, db: DbClient = prisma) {
    return db.galleryImage.count({ where });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.galleryImage.findUnique({ where: { id } });
  },

  create(data: Prisma.GalleryImageUncheckedCreateInput, db: DbClient = prisma) {
    return db.galleryImage.create({ data });
  },

  update(id: string, data: Prisma.GalleryImageUncheckedUpdateInput, db: DbClient = prisma) {
    return db.galleryImage.update({ where: { id }, data });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.galleryImage.delete({ where: { id } });
  },
};
