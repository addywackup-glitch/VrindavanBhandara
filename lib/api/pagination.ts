// =============================================================================
// Pagination helpers — uniform page/pageSize parsing + PaginatedResponse build
// Source: Phase 2 §7 (API consistency)
// =============================================================================

import type { PaginatedResponse } from "@/types";

export type PageQuery = { page?: string | null; pageSize?: string | null };

export function parsePagination(
  query: PageQuery,
  opts?: { defaultPageSize?: number; maxPageSize?: number; minPageSize?: number }
): { page: number; pageSize: number; skip: number } {
  const defaultSize = opts?.defaultPageSize ?? 20;
  const maxSize = opts?.maxPageSize ?? 50;
  const minSize = opts?.minPageSize ?? 1;

  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(
    maxSize,
    Math.max(minSize, Number(query.pageSize ?? defaultSize) || defaultSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
