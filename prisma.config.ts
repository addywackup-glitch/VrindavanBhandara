import "dotenv/config";
import { defineConfig } from "@prisma/config";

// Prisma's config no longer auto-loads `.env`, so DATABASE_URL may be undefined
// at this point. Assert it explicitly (instead of `!` or `as string`) so the
// type narrows to `string` without weakening type safety, and CLI commands fail
// fast with a clear message when the variable is missing.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Define it in your environment (e.g. .env) before running Prisma commands."
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
