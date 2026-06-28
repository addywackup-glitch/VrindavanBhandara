// =============================================================================
// VRINDAVAN BHANDARA — Package Service (admin CRUD + public listing)
// =============================================================================

import { Prisma } from "@prisma/client";
import {
  packageRepository,
  serviceCategoryRepository,
  runTransaction,
} from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { paginated, parsePagination, type PageQuery } from "@/lib/api/pagination";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { CreatePackageSchema, UpdatePackageSchema } from "@/lib/validations";
import type { Actor } from "@/lib/services/actor";

type ListQuery = PageQuery & {
  search?: string | null;
  categoryId?: string | null;
  isActive?: string | null;
  sortBy?: string | null;
  sortDir?: string | null;
};

const SORT_FIELDS = ["sortOrder", "name", "price", "createdAt"] as const;
type SortField = (typeof SORT_FIELDS)[number];

export function listPackages(actor: Actor, query: ListQuery) {
  return execute(async () => {
    const { page, pageSize, skip } = parsePagination(query);
    const search = query.search ?? "";
    const sortDir = query.sortDir === "desc" ? "desc" : "asc";
    const sortBy: SortField = SORT_FIELDS.includes(query.sortBy as SortField)
      ? (query.sortBy as SortField)
      : "sortOrder";

    const where: Prisma.PackageWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(query.categoryId ? { serviceCategoryId: query.categoryId } : {}),
      ...(query.isActive === "true" || query.isActive === "false"
        ? { isActive: query.isActive === "true" }
        : {}),
    };

    const orderBy: Prisma.PackageOrderByWithRelationInput = { [sortBy]: sortDir };

    const [items, total, categories] = await Promise.all([
      packageRepository.list({ where, orderBy, skip, take: pageSize }),
      packageRepository.count(where),
      serviceCategoryRepository.listAll(),
    ]);

    await createAuditLog({
      userId: actor.userId,
      action: "READ",
      entity: "Package",
      metadata: { page, search },
    });

    return { ...paginated(items, total, page, pageSize), categories };
  });
}

export function getPackage(id: string) {
  return execute(async () => {
    const pkg = await packageRepository.findDetail(id);
    if (!pkg) throw new NotFoundError("Package");
    return pkg;
  });
}

export function createPackage(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreatePackageSchema, input);

    const existing = await packageRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError("Slug already exists. Choose a unique slug.");

    const { items, ...rest } = data;
    const pkg = await packageRepository.create({
      ...rest,
      items: items?.length
        ? {
            create: items.map((item, i) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit ?? null,
              sortOrder: item.sortOrder ?? i,
            })),
          }
        : undefined,
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "Package",
      entityId: pkg.id,
      newData: { name: pkg.name, price: pkg.price.toNumber() },
    });

    return pkg;
  }, "Package created");
}

export function updatePackage(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdatePackageSchema, input);

    const existing = await packageRepository.findById(id);
    if (!existing) throw new NotFoundError("Package");

    const { items, ...rest } = data;

    const updated = await runTransaction(async (tx) => {
      if (items !== undefined) {
        await packageRepository.replaceItems(
          id,
          items.map((item, i) => ({
            packageId: id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? null,
            sortOrder: item.sortOrder ?? i,
          })),
          tx
        );
      }
      return packageRepository.update(id, rest, tx);
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Package",
      entityId: id,
      oldData: { name: existing.name, isActive: existing.isActive },
      newData: rest,
    });

    return updated;
  }, "Package updated");
}

export function deletePackage(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await packageRepository.findByIdWithBookingCount(id);
    if (!existing) throw new NotFoundError("Package");

    const hasBookings = existing._count.bookings > 0;
    if (hasBookings) {
      await packageRepository.setActive(id, false);
    } else {
      await packageRepository.delete(id);
    }

    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "Package",
      entityId: id,
      metadata: { name: existing.name, bookingCount: existing._count.bookings },
    });

    return {
      deactivated: hasBookings,
      message: hasBookings
        ? "Package deactivated (has existing bookings)"
        : "Package deleted",
    };
  });
}
