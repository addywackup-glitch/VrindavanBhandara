// =============================================================================
// VRINDAVAN BHANDARA — Admin Service
// Admin booking listing + admin role management (admins:manage)
// =============================================================================

import { Prisma, type AdminRole, type BookingStatus } from "@prisma/client";
import { bookingRepository, type BookingAdminListItem } from "@/lib/repositories";
import { prisma } from "@/lib/prisma";
import { execute, validate } from "@/lib/api/service";
import { paginated, parsePagination, type PageQuery } from "@/lib/api/pagination";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";
import type { Actor } from "@/lib/services/actor";
import type { PaginatedResponse } from "@/types";
import type { ServiceResult } from "@/lib/api/result";

const ALL_STATUSES: readonly BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

type ListQuery = PageQuery & { status?: string | null; search?: string | null };

export function adminListBookings(
  query: ListQuery
): Promise<ServiceResult<PaginatedResponse<BookingAdminListItem>>> {
  return execute(async () => {
    const { page, pageSize, skip } = parsePagination(query, {
      defaultPageSize: 20,
      minPageSize: 5,
    });

    const status = ALL_STATUSES.includes(query.status as BookingStatus)
      ? (query.status as BookingStatus)
      : undefined;
    const search = query.search ?? "";

    const where: Prisma.BookingWhereInput = {
      ...(status ? { status } : {}),
      ...(search && {
        OR: [
          { bookingNumber: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      bookingRepository.adminList({ where, skip, take: pageSize }),
      bookingRepository.count(where),
    ]);

    return paginated(items, total, page, pageSize);
  });
}

// =============================================================================
// Admin role management
// =============================================================================

const AdminRoleEnum = z.enum([
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "CONTENT_ADMIN",
  "SUPPORT_ADMIN",
]);

export const PromoteAdminSchema = z.object({
  email: z.string().email(),
  role: AdminRoleEnum.default("OPERATIONS_ADMIN"),
});

export const UpdateAdminSchema = z.object({
  role: AdminRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

async function countActiveSuperAdmins(excludeAdminId?: string) {
  return prisma.admin.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
      ...(excludeAdminId ? { id: { not: excludeAdminId } } : {}),
    },
  });
}

export function listAdmins(actor: Actor) {
  return execute(async () => {
    const items = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    await createAuditLog({
      userId: actor.userId,
      action: "READ",
      entity: "Admin",
    });

    return { items };
  });
}

export function promoteAdmin(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(PromoteAdminSchema, input);
    const email = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true },
    });
    if (!user) throw new NotFoundError("User");
    if (user.admin) {
      throw new ConflictError("This user is already an admin.");
    }

    const [updatedUser, admin] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      }),
      prisma.admin.create({
        data: {
          userId: user.id,
          role: data.role as AdminRole,
          isActive: true,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
    ]);

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "Admin",
      entityId: admin.id,
      newData: { email: updatedUser.email, role: admin.role },
    });

    return admin;
  }, "Admin promoted");
}

export function updateAdmin(actor: Actor, adminId: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateAdminSchema, input);
    if (data.role === undefined && data.isActive === undefined) {
      throw new ValidationError("Provide role and/or isActive to update.");
    }

    const existing = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!existing) throw new NotFoundError("Admin");

    const nextRole = data.role ?? existing.role;
    const nextActive = data.isActive ?? existing.isActive;

    if (
      existing.role === "SUPER_ADMIN" &&
      existing.isActive &&
      (nextRole !== "SUPER_ADMIN" || nextActive === false)
    ) {
      const others = await countActiveSuperAdmins(existing.id);
      if (others < 1) {
        throw new ConflictError("Cannot remove or demote the last Super Admin.");
      }
    }

    if (
      existing.userId === actor.userId &&
      existing.role === "SUPER_ADMIN" &&
      (nextRole !== "SUPER_ADMIN" || nextActive === false)
    ) {
      throw new AuthorizationError(
        "You cannot demote or deactivate your own Super Admin account."
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.update({
        where: { id: adminId },
        data: {
          ...(data.role !== undefined ? { role: data.role } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      if (data.isActive === false) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { role: "CUSTOMER" },
        });
      } else if (data.isActive === true || data.role !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { role: "ADMIN" },
        });
      }

      return admin;
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Admin",
      entityId: adminId,
      oldData: { role: existing.role, isActive: existing.isActive },
      newData: { role: updated.role, isActive: updated.isActive },
    });

    return updated;
  }, "Admin updated");
}
