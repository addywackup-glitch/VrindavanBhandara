// =============================================================================
// VRINDAVAN BHANDARA — Audit Logging
// Source: 09-security-standards.md — "Audit Logs mandatory"
//
// Thin domain helper over AuditRepository. Prisma access lives in the repo;
// this module owns the serialization + fire-and-forget contract (audit failures
// must never break the main flow).
// =============================================================================

import type { AuditAction, Prisma } from "@prisma/client";
import { auditRepository } from "@/lib/repositories";

export type AuditLogParams = {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

/** Coerce an arbitrary object into a Prisma-safe JSON value. */
function toJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await auditRepository.create({
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      oldData: toJson(params.oldData),
      newData: toJson(params.newData),
      metadata: toJson(params.metadata),
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}

export async function getAuditLogs(params: {
  userId?: string;
  entity?: string;
  entityId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(params.userId && { userId: params.userId }),
    ...(params.entity && { entity: params.entity }),
    ...(params.entityId && { entityId: params.entityId }),
  };

  const [logs, total] = await Promise.all([
    auditRepository.list({ where, skip, take: pageSize }),
    auditRepository.count(where),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
