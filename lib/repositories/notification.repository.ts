// =============================================================================
// NotificationRepository — pure Prisma access for in-app notifications
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const notificationRepository = {
  create(data: Prisma.NotificationUncheckedCreateInput, db: DbClient = prisma) {
    return db.notification.create({ data });
  },

  listForUser(userId: string, db: DbClient = prisma) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  markRead(id: string, db: DbClient = prisma) {
    return db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  countUnread(userId: string, db: DbClient = prisma) {
    return db.notification.count({ where: { userId, isRead: false } });
  },
};
