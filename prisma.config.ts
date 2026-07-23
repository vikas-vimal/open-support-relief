import "dotenv/config";

import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * Migration commands connect through DIRECT_URL — the session-mode pooler
 * (port 5432). The pgbouncer transaction pooler in DATABASE_URL cannot run DDL,
 * so pointing migrations at it fails partway and leaves the schema half-applied.
 *
 * The runtime client uses DATABASE_URL via the pg adapter in lib/db/prisma.ts.
 *
 * NOTE: schema migrations are hand-written SQL in db/migrations/, applied with
 * psql — never `prisma migrate`. This config exists only for `prisma generate`
 * and read-only `prisma migrate diff`. The datasource below lets diff resolve a
 * connection; it is never used to APPLY changes.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
