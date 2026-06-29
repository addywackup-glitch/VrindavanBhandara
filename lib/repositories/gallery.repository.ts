// =============================================================================
// GalleryRepository — pure Prisma access for gallery images
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const galleryPublicSelect = {
  id: true,
  url: true,
  thumbnail: true,
  title: true,
  description: true,
  category: true,
  serviceType: true,
  width: true,
  height: true,
} satisfies Prisma.GalleryImageSelect;

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

  // Public, active-only listing. Optionally scoped to a service type.
  listPublic(
    filter: { serviceType?: ServiceType; limit?: number } = {},
    db: DbClient = prisma
  ) {
    return db.galleryImage.findMany({
      where: {
        isActive: true,
        ...(filter.serviceType ? { serviceType: filter.serviceType } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: Math.min(60, Math.max(1, filter.limit ?? 24)),
      select: galleryPublicSelect,
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
