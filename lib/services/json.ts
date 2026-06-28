// =============================================================================
// JSON coercion helper — turn an arbitrary value into a Prisma-safe JSON value
// (used when persisting gateway/webhook payloads to Json columns).
// =============================================================================

import type { Prisma } from "@prisma/client";

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
