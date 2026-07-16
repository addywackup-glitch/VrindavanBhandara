// =============================================================================
// Database URL normalization — Vercel ↔ Supabase integration aliases
//
// Vercel "Connect Supabase" injects POSTGRES_* names. This app / Prisma schema
// use DATABASE_URL + DATABASE_URL_UNPOOLED. Call ensureDatabaseEnv() early so
// both naming schemes work with zero manual remapping.
// =============================================================================

/**
 * Prefer explicit DATABASE_* vars; fall back to Vercel Supabase Postgres vars.
 * Mutates process.env so Prisma schema `env("DATABASE_URL")` also works.
 */
export function ensureDatabaseEnv(): {
  databaseUrl: string | undefined;
  directUrl: string | undefined;
} {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    undefined;

  const directUrl =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined;

  if (databaseUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }
  if (directUrl && !process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL_UNPOOLED = directUrl;
  }

  return { databaseUrl, directUrl };
}
