// =============================================================================
// Prisma Client Singleton with pg adapter
// Source: 02-system-architecture.md — Supabase PostgreSQL
//
// Connection strategy:
// - Build (SSG): prefer pooled DATABASE_URL so we don't hit Supabase
//   session-mode EMAXCONNSESSION while prerendering.
// - Runtime: prefer DATABASE_URL_UNPOOLED (direct) so interactive $transaction
//   (bookings, payments, registration) keeps working.
// - Cap connections via `connection_limit=1` on the URL (do NOT import `pg`
//   Pool at module top-level — Turbopack then tries to bundle Node builtins).
// - Always cache the client on globalThis (including production).
// =============================================================================

import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ensureDatabaseEnv } from "@/lib/env/database";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function pickConnectionString(
  databaseUrl: string | undefined,
  directUrl: string | undefined
): string | undefined {
  if (isProductionBuild()) {
    return databaseUrl || directUrl;
  }
  return directUrl || databaseUrl;
}

/** Ensure each isolate opens at most one DB connection (Supabase pool caps). */
function withConnectionLimit(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    const sep = connectionString.includes("?") ? "&" : "?";
    return connectionString.includes("connection_limit=")
      ? connectionString
      : `${connectionString}${sep}connection_limit=1`;
  }
}

function createPrismaClient(): PrismaClient {
  const { databaseUrl, directUrl } = ensureDatabaseEnv();
  const raw = pickConnectionString(databaseUrl, directUrl);
  const connectionString = raw
    ? withConnectionLimit(raw)
    : "postgresql://localhost/placeholder?connection_limit=1";

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
