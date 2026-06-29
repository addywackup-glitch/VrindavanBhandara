// =============================================================================
// SettingsRepository + MessageRepository + Content repositories — pure Prisma
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const settingsRepository = {
  listAll(db: DbClient = prisma) {
    return db.siteConfig.findMany({ orderBy: { group: "asc" } });
  },

  findByKey(key: string, db: DbClient = prisma) {
    return db.siteConfig.findUnique({ where: { key } });
  },

  upsert(
    args: {
      key: string;
      create: Prisma.SiteConfigUncheckedCreateInput;
      update: Prisma.SiteConfigUncheckedUpdateInput;
    },
    db: DbClient = prisma
  ) {
    return db.siteConfig.upsert({
      where: { key: args.key },
      create: args.create,
      update: args.update,
    });
  },
};

export const messageRepository = {
  findById(id: string, db: DbClient = prisma) {
    return db.contactMessage.findUnique({ where: { id } });
  },

  create(data: Prisma.ContactMessageUncheckedCreateInput, db: DbClient = prisma) {
    return db.contactMessage.create({ data });
  },

  update(id: string, data: Prisma.ContactMessageUncheckedUpdateInput, db: DbClient = prisma) {
    return db.contactMessage.update({ where: { id }, data });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.contactMessage.delete({ where: { id } });
  },
};

export const faqRepository = {
  // serviceType filter returns service-scoped FAQs PLUS global ones (null type).
  listActivePublic(
    filter: { serviceType?: ServiceType } = {},
    db: DbClient = prisma
  ) {
    return db.fAQ.findMany({
      where: {
        isActive: true,
        ...(filter.serviceType
          ? { OR: [{ serviceType: filter.serviceType }, { serviceType: null }] }
          : {}),
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        serviceType: true,
        sortOrder: true,
      },
    });
  },
};

export const sevaStatRepository = {
  listVisiblePublic(db: DbClient = prisma) {
    return db.sevaStatistic.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { key: true, label: true, value: true, unit: true, icon: true, sortOrder: true },
    });
  },
};
