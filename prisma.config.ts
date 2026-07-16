import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { ensureDatabaseEnv } from "./lib/env/database";

// Map Vercel Supabase POSTGRES_* → DATABASE_* before Prisma reads env.
const { databaseUrl } = ensureDatabaseEnv();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Define DATABASE_URL, or connect Supabase on Vercel (POSTGRES_PRISMA_URL / POSTGRES_URL)."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
