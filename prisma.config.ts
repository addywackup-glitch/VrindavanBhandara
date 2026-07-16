import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { ensureDatabaseEnv } from "./lib/env/database";

// Map Vercel Supabase POSTGRES_* → DATABASE_* when present.
const { databaseUrl } = ensureDatabaseEnv();

// `prisma generate` (postinstall) does not need a live DB — only a syntactically
// valid URL. Runtime / migrate / db push still require real credentials.
const PLACEHOLDER =
  "postgresql://postgres:postgres@127.0.0.1:5432/prisma_generate_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl ?? PLACEHOLDER,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
