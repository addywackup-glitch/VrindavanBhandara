// =============================================================================
// PackageRepository — pure Prisma access for packages & service categories
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const packageAdminInclude = {
  serviceCategory: { select: { id: true, name: true, type: true } },
  items: { orderBy: { sortOrder: "asc" } },
  _count: { select: { bookings: true } },
} satisfies Prisma.PackageInclude;

export const packageDetailInclude = {
  serviceCategory: true,
  items: { orderBy: { sortOrder: "asc" } },
  _count: { select: { bookings: true } },
} satisfies Prisma.PackageInclude;

export const packageRepository = {
  findActiveWithCategory(id: string, db: DbClient = prisma) {
    return db.package.findFirst({
      where: { id, isActive: true },
      include: { serviceCategory: true },
    });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.package.findUnique({ where: { id } });
  },

  findDetail(id: string, db: DbClient = prisma) {
    return db.package.findUnique({ where: { id }, include: packageDetailInclude });
  },

  findBySlug(slug: string, db: DbClient = prisma) {
    return db.package.findUnique({ where: { slug } });
  },

  findByIdWithBookingCount(id: string, db: DbClient = prisma) {
    return db.package.findUnique({
      where: { id },
      select: { name: true, _count: { select: { bookings: true } } },
    });
  },

  list(
    args: { where: Prisma.PackageWhereInput; orderBy: Prisma.PackageOrderByWithRelationInput; skip: number; take: number },
    db: DbClient = prisma
  ) {
    return db.package.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: packageAdminInclude,
    });
  },

  listPublic(where: Prisma.PackageWhereInput, db: DbClient = prisma) {
    return db.package.findMany({
      where: { isActive: true, ...where },
      include: {
        serviceCategory: { select: { id: true, name: true, slug: true, type: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
  },

  count(where: Prisma.PackageWhereInput = {}, db: DbClient = prisma) {
    return db.package.count({ where });
  },

  create(data: Prisma.PackageUncheckedCreateInput, db: DbClient = prisma) {
    return db.package.create({ data, include: { serviceCategory: true, items: true } });
  },

  update(id: string, data: Prisma.PackageUncheckedUpdateInput, db: DbClient = prisma) {
    return db.package.update({
      where: { id },
      data,
      include: { serviceCategory: true, items: { orderBy: { sortOrder: "asc" } } },
    });
  },

  setActive(id: string, isActive: boolean, db: DbClient = prisma) {
    return db.package.update({ where: { id }, data: { isActive } });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.package.delete({ where: { id } });
  },

  replaceItems(packageId: string, items: Prisma.PackageItemCreateManyInput[], db: DbClient = prisma) {
    return db.packageItem
      .deleteMany({ where: { packageId } })
      .then(() => (items.length ? db.packageItem.createMany({ data: items }) : null));
  },

  topByBookings(take: number, db: DbClient = prisma) {
    return db.package.findMany({
      include: {
        _count: { select: { bookings: true } },
        serviceCategory: { select: { name: true } },
      },
      take,
    });
  },
};

export const serviceCategoryRepository = {
  listAll(db: DbClient = prisma) {
    return db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
  },

  listActivePublic(db: DbClient = prisma) {
    return db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        shortDesc: true,
        icon: true,
        metaTitle: true,
        metaDesc: true,
      },
    });
  },
};
