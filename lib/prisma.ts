// =============================================================================
// Prisma Client Singleton with pg adapter
// Source: 02-system-architecture.md — Supabase PostgreSQL
//
// Connection strategy:
// - Build (SSG): prefer pooled DATABASE_URL + pg.Pool max=1 so we don't hit
//   Supabase session-mode EMAXCONNSESSION (pool_size ~15) while prerendering.
// - Runtime: prefer DATABASE_URL_UNPOOLED (direct) so interactive $transaction
//   (bookings, payments, registration) keeps working.
// - Always cache client + pool on globalThis (including production).
// =============================================================================

import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ensureDatabaseEnv } from "@/lib/env/database";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function pickConnectionString(
  databaseUrl: string | undefined,
  directUrl: string | undefined
): string | undefined {
  if (isProductionBuild()) {
    // Pooled URL spreads load; fall back to direct if only one is set.
    return databaseUrl || directUrl;
  }
  // Runtime: direct first so $transaction works reliably on Supabase.
  return directUrl || databaseUrl;
}

function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    // Default pg.Pool max is 10 — too high for Supabase session limits when
    // Next prerenders many pages or many serverless isolates warm up.
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: true,
  });
}

function createPrismaClient(): PrismaClient {
  const { databaseUrl, directUrl } = ensureDatabaseEnv();
  const connectionString = pickConnectionString(databaseUrl, directUrl);

  if (!connectionString) {
    const adapter = new PrismaPg({
      connectionString: "postgresql://localhost/placeholder",
    });
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  const pool = globalForPrisma.pgPool ?? createPool(connectionString);
  globalForPrisma.pgPool = pool;

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
