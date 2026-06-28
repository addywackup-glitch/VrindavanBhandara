// =============================================================================
// VRINDAVAN BHANDARA — Repository shared types
// Source: Phase 2 §3 — "Repositories should contain only Prisma access"
//
// DbClient lets every repository method run either on the base client or inside
// an interactive transaction (Prisma.TransactionClient), so services compose
// multiple repository calls atomically.
// =============================================================================

import type { PrismaClient, Prisma } from "@prisma/client";

export type DbClient = PrismaClient | Prisma.TransactionClient;
