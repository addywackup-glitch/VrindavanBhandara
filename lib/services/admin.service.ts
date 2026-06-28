// =============================================================================
// VRINDAVAN BHANDARA — Admin Service (admin-wide booking listing)
// =============================================================================

import { Prisma, type BookingStatus } from "@prisma/client";
import { bookingRepository, type BookingAdminListItem } from "@/lib/repositories";
import { execute } from "@/lib/api/service";
import { paginated, parsePagination, type PageQuery } from "@/lib/api/pagination";
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
