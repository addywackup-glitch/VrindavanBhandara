// =============================================================================
// Prisma Client Singleton with pg adapter
// Source: 02-system-architecture.md — Supabase PostgreSQL
//
// Connection strategy:
// - Build (SSG): prefer pooled DATABASE_URL so we don't hit Supabase
//   session-mode EMAXCONNSESSION while prerendering.
// - Runtime: prefer DATABASE_URL_UNPOOLED (direct) so interactive $transaction
//   (bookings, payments, registration) keeps working.
// - Cap the pg.Pool at max:1 per isolate. connection_limit in the URL is a
//   Prisma-engine convention and is IGNORED by @prisma/adapter-pg — without
//   an explicit Pool({ max: 1 }) each isolate opens up to 10 sessions and
//   burns the Supabase pool (pool_size: 15).
// - Always cache the client + pool on globalThis (including production).
// =============================================================================

import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ensureDatabaseEnv } from "@/lib/env/database";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** Supabase transaction pooler (port 6543 / pgbouncer=true) — best for serverless. */
function isTransactionPooler(url: string): boolean {
  return /[?&]pgbouncer=true\b/i.test(url) || /:6543(?:\/|\?|$)/.test(url);
}

function pickConnectionString(
  databaseUrl: string | undefined,
  directUrl: string | undefined
): string | undefined {
  if (isProductionBuild()) {
    return databaseUrl || directUrl;
  }
  // Prefer transaction pooler so many Vercel isolates share PgBouncer instead of
  // each burning a session/direct slot (EMAXCONNSESSION pool_size: 15).
  if (databaseUrl && isTransactionPooler(databaseUrl)) {
    return databaseUrl;
  }
  return directUrl || databaseUrl;
}

function createPrismaClient(): PrismaClient {
  const { databaseUrl, directUrl } = ensureDatabaseEnv();
  const connectionString =
    pickConnectionString(databaseUrl, directUrl) ||
    "postgresql://localhost/placeholder";

  // Reuse one pool across hot reloads / warm isolates.
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      allowExitOnIdle: true,
    });

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
