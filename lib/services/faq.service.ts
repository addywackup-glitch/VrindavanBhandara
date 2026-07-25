// =============================================================================
// VRINDAVAN BHANDARA — FAQ admin CRUD
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import { faqRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { CreateFaqSchema, UpdateFaqSchema } from "@/lib/validations";
import type { Actor } from "@/lib/services/actor";

export function listAdminFaqs(actor: Actor, query: {
  search?: string | null;
  serviceType?: string | null;
  isActive?: string | null;
}) {
  return execute(async () => {
    const search = query.search?.trim() ?? "";
    const where: Prisma.FAQWhereInput = {
      ...(search && {
        OR: [
          { question: { contains: search, mode: "insensitive" } },
          { answer: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(query.serviceType && query.serviceType !== "ALL"
        ? query.serviceType === "GLOBAL"
          ? { serviceType: null }
          : { serviceType: query.serviceType as ServiceType }
        : {}),
      ...(query.isActive === "true" || query.isActive === "false"
        ? { isActive: query.isActive === "true" }
        : {}),
    };

    const items = await faqRepository.listAdmin({ where });

    await createAuditLog({
      userId: actor.userId,
      action: "READ",
      entity: "FAQ",
      metadata: { search },
    });

    return { items };
  });
}

export function createFaq(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreateFaqSchema, input);
    const faq = await faqRepository.create({
      question: data.question,
      answer: data.answer,
      category: data.category,
      serviceType: data.serviceType ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      location: data.location ?? null,
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "FAQ",
      entityId: faq.id,
      newData: { question: faq.question, category: faq.category },
    });

    return faq;
  }, "FAQ created");
}

export function updateFaq(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateFaqSchema, input);
    const existing = await faqRepository.findById(id);
    if (!existing) throw new NotFoundError("FAQ");

    const updated = await faqRepository.update(id, {
      ...(data.question !== undefined ? { question: data.question } : {}),
      ...(data.answer !== undefined ? { answer: data.answer } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.serviceType !== undefined ? { serviceType: data.serviceType } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "FAQ",
      entityId: id,
      oldData: { question: existing.question, isActive: existing.isActive },
      newData: data,
    });

    return updated;
  }, "FAQ updated");
}

export function deleteFaq(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await faqRepository.findById(id);
    if (!existing) throw new NotFoundError("FAQ");

    await faqRepository.delete(id);

    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "FAQ",
      entityId: id,
      metadata: { question: existing.question },
    });

    return { message: "FAQ deleted" };
  });
}
