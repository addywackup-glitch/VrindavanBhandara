// =============================================================================
// MediaRepository — pure Prisma access for media proofs
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const mediaRepository = {
  create(data: Prisma.MediaProofUncheckedCreateInput, db: DbClient = prisma) {
    return db.mediaProof.create({ data });
  },

  countForBooking(bookingId: string, db: DbClient = prisma) {
    return db.mediaProof.count({ where: { bookingId } });
  },

  listForBooking(bookingId: string, db: DbClient = prisma) {
    return db.mediaProof.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.mediaProof.delete({ where: { id } });
  },
};
