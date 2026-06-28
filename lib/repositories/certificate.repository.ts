// =============================================================================
// CertificateRepository — pure Prisma access for seva certificates
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const certificateRepository = {
  findByBookingId(bookingId: string, db: DbClient = prisma) {
    return db.certificate.findUnique({ where: { bookingId } });
  },

  findByVerifyCode(verifyCode: string, db: DbClient = prisma) {
    return db.certificate.findUnique({
      where: { verifyCode },
      include: {
        booking: {
          include: {
            user: { select: { name: true } },
            package: { include: { serviceCategory: true } },
          },
        },
      },
    });
  },

  create(data: Prisma.CertificateUncheckedCreateInput, db: DbClient = prisma) {
    return db.certificate.create({ data });
  },

  incrementDownload(id: string, db: DbClient = prisma) {
    return db.certificate.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  },
};
