// =============================================================================
// VRINDAVAN BHANDARA — Audit Logging
// Source: 09-security-standards.md — "Audit Logs mandatory"
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

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

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Audit log failures must never break the main flow
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
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
