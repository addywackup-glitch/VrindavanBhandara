// =============================================================================
// Transaction helper — lets services run atomic multi-repository writes without
// importing the Prisma client directly (keeps Prisma confined to this layer).
// Source: Phase 2 §5 & §8
// =============================================================================

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function runTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}
