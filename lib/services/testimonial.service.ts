// =============================================================================
// VRINDAVAN BHANDARA — Testimonial Service (public read + admin moderation)
// =============================================================================

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { testimonialRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { toServiceType } from "@/lib/services/content.service";
import type { Actor } from "@/lib/services/actor";

export const ModerateTestimonialSchema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature"]),
});

export function listPublicTestimonials(query: {
  featured?: boolean;
  limit?: number;
  serviceType?: string | null;
}) {
  return execute(async () => {
    const serviceType = toServiceType(query.serviceType ?? null);
    const where: Prisma.TestimonialWhereInput = {
      isApproved: true,
      ...(query.featured ? { isFeatured: true } : {}),
      ...(serviceType ? { serviceType } : {}),
    };
    const take = Math.min(50, Math.max(1, query.limit ?? 12));
    return testimonialRepository.listPublic({ where, take });
  });
}

export function moderateTestimonial(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const { action } = validate(ModerateTestimonialSchema, input);

    const existing = await testimonialRepository.findById(id);
    if (!existing) throw new NotFoundError("Testimonial");

    const data: Prisma.TestimonialUncheckedUpdateInput = {};
    if (action === "approve") data.isApproved = true;
    if (action === "reject") data.isApproved = false;
    if (action === "feature") {
      data.isApproved = true;
      data.isFeatured = true;
    }
    if (action === "unfeature") data.isFeatured = false;

    const updated = await testimonialRepository.update(id, data);

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Testimonial",
      entityId: id,
      oldData: { isApproved: existing.isApproved, isFeatured: existing.isFeatured },
      newData: { action },
    });

    return updated;
  }, "Testimonial updated");
}

export function deleteTestimonial(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await testimonialRepository.findById(id);
    if (!existing) throw new NotFoundError("Testimonial");

    await testimonialRepository.delete(id);
    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "Testimonial",
      entityId: id,
      metadata: { name: existing.name },
    });

    return { id };
  }, "Testimonial deleted");
}
