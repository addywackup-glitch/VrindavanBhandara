// =============================================================================
// TestimonialRepository — pure Prisma access for testimonials
// =============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export const testimonialPublicSelect = {
  id: true,
  name: true,
  city: true,
  country: true,
  rating: true,
  comment: true,
  serviceType: true,
  isFeatured: true,
  createdAt: true,
} satisfies Prisma.TestimonialSelect;

export const testimonialRepository = {
  listPublic(
    args: { where: Prisma.TestimonialWhereInput; take: number },
    db: DbClient = prisma
  ) {
    return db.testimonial.findMany({
      where: args.where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: args.take,
      select: testimonialPublicSelect,
    });
  },

  findById(id: string, db: DbClient = prisma) {
    return db.testimonial.findUnique({ where: { id } });
  },

  create(data: Prisma.TestimonialUncheckedCreateInput, db: DbClient = prisma) {
    return db.testimonial.create({ data });
  },

  update(id: string, data: Prisma.TestimonialUncheckedUpdateInput, db: DbClient = prisma) {
    return db.testimonial.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } } },
    });
  },

  delete(id: string, db: DbClient = prisma) {
    return db.testimonial.delete({ where: { id } });
  },
};
