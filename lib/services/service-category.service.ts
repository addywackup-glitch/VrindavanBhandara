// =============================================================================
// VRINDAVAN BHANDARA — Service Category admin CRUD
// =============================================================================

import { Prisma, type ServiceType } from "@prisma/client";
import { serviceCategoryRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  ServiceTypeEnum,
} from "@/lib/validations";
import type { Actor } from "@/lib/services/actor";

const ALL_SERVICE_TYPES = ServiceTypeEnum.options;

export function listAdminServices(actor: Actor, query: {
  search?: string | null;
  isActive?: string | null;
}) {
  return execute(async () => {
    const search = query.search?.trim() ?? "";
    const where: Prisma.ServiceCategoryWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { shortDesc: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(query.isActive === "true" || query.isActive === "false"
        ? { isActive: query.isActive === "true" }
        : {}),
    };

    const [items, usedTypes] = await Promise.all([
      serviceCategoryRepository.listAdmin({ where }),
      serviceCategoryRepository.listUsedTypes(),
    ]);

    const used = new Set(usedTypes.map((t) => t.type));
    const availableTypes = ALL_SERVICE_TYPES.filter((t) => !used.has(t));

    await createAuditLog({
      userId: actor.userId,
      action: "READ",
      entity: "ServiceCategory",
      metadata: { search },
    });

    return { items, availableTypes };
  });
}

export function getAdminService(id: string) {
  return execute(async () => {
    const service = await serviceCategoryRepository.findById(id);
    if (!service) throw new NotFoundError("Service");
    const usedTypes = await serviceCategoryRepository.listUsedTypes();
    const used = new Set(usedTypes.map((t) => t.type));
    const availableTypes = ALL_SERVICE_TYPES.filter(
      (t) => !used.has(t) || t === service.type
    );
    return { service, availableTypes };
  });
}

export function createService(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreateServiceSchema, input);

    const [byType, bySlug] = await Promise.all([
      serviceCategoryRepository.findByType(data.type),
      serviceCategoryRepository.findBySlug(data.slug),
    ]);
    if (byType) {
      throw new ConflictError(
        `Service type ${data.type} already exists. Each type can only be used once.`
      );
    }
    if (bySlug) throw new ConflictError("Slug already exists. Choose a unique slug.");

    const service = await serviceCategoryRepository.create({
      type: data.type,
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDesc: data.shortDesc,
      icon: data.icon ?? null,
      image: data.image ?? null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      metaTitle: data.metaTitle ?? null,
      metaDesc: data.metaDesc ?? null,
      pageSections: data.pageSections === undefined
        ? undefined
        : data.pageSections === null
          ? Prisma.JsonNull
          : data.pageSections,
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "ServiceCategory",
      entityId: service.id,
      newData: { name: service.name, type: service.type, slug: service.slug },
    });

    return service;
  }, "Service created");
}

export function updateService(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateServiceSchema, input);
    const existing = await serviceCategoryRepository.findById(id);
    if (!existing) throw new NotFoundError("Service");

    if (data.slug && data.slug !== existing.slug) {
      const clash = await serviceCategoryRepository.findBySlug(data.slug);
      if (clash) throw new ConflictError("Slug already exists. Choose a unique slug.");
    }

    if (data.type && data.type !== existing.type) {
      const clash = await serviceCategoryRepository.findByType(data.type as ServiceType);
      if (clash) {
        throw new ConflictError(
          `Service type ${data.type} is already used by another service.`
        );
      }
    }

    if (data.pageSections !== undefined && data.pageSections !== null) {
      // Already validated by schema; keep as-is
    }

    const updated = await serviceCategoryRepository.update(id, {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.shortDesc !== undefined ? { shortDesc: data.shortDesc } : {}),
      ...(data.icon !== undefined ? { icon: data.icon ?? null } : {}),
      ...(data.image !== undefined ? { image: data.image ?? null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle ?? null } : {}),
      ...(data.metaDesc !== undefined ? { metaDesc: data.metaDesc ?? null } : {}),
      ...(data.pageSections !== undefined
        ? {
            pageSections:
              data.pageSections === null ? Prisma.JsonNull : data.pageSections,
          }
        : {}),
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "ServiceCategory",
      entityId: id,
      oldData: { name: existing.name, isActive: existing.isActive, slug: existing.slug },
      newData: data,
    });

    return updated;
  }, "Service updated");
}

export function deleteService(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await serviceCategoryRepository.findById(id);
    if (!existing) throw new NotFoundError("Service");

    const packageCount = existing._count.packages;
    if (packageCount > 0) {
      await serviceCategoryRepository.setActive(id, false);
      await createAuditLog({
        userId: actor.userId,
        action: "DELETE",
        entity: "ServiceCategory",
        entityId: id,
        metadata: { name: existing.name, packageCount, deactivated: true },
      });
      return {
        deactivated: true,
        message: `Service deactivated (${packageCount} package(s) still linked)`,
      };
    }

    try {
      await serviceCategoryRepository.delete(id);
    } catch {
      throw new ValidationError("Could not delete service. Deactivate it instead.");
    }

    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "ServiceCategory",
      entityId: id,
      metadata: { name: existing.name, deactivated: false },
    });

    return { deactivated: false, message: "Service deleted" };
  });
}
